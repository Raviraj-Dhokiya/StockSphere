const fetch = require('node-fetch');

const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const getKey = () => process.env.FINNHUB_API_KEY;

// ─────────────────────────────────────────────────────────────
// In-Memory Cache  (prevents 429 rate-limit on Finnhub free tier)
//  - quote   → cached for 60 s  (prices don't change every second)
//  - profile → cached for 1 hr  (company info is static)
//  - search  → cached for 5 min
// ─────────────────────────────────────────────────────────────
const cache = new Map();

const cacheGet = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data;
};

const cacheSet = (key, data, ttlMs) => {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
};

// ─────────────────────────────────────────────────────────────
// Queue: serialize Finnhub calls so we never burst the limit
// Finnhub free = 30 req/min → max 1 request every 2 seconds
// ─────────────────────────────────────────────────────────────
let finnhubQueue = Promise.resolve();
const FINNHUB_DELAY_MS = 300; // small delay between queued calls

const finnhubFetch = (path) => {
  // Check cache first
  const cached = cacheGet(`finnhub:${path}`);
  if (cached) return Promise.resolve(cached);

  // Queue the actual fetch
  finnhubQueue = finnhubQueue.then(async () => {
    await new Promise((r) => setTimeout(r, FINNHUB_DELAY_MS));
  });

  return finnhubQueue.then(async () => {
    const url = `${FINNHUB_BASE}${path}&token=${getKey()}`;
    const res = await fetch(url);
    if (res.status === 429) throw new Error('Finnhub API error: 429 (rate limit - please wait a moment)');
    if (!res.ok) throw new Error(`Finnhub API error: ${res.status}`);
    const data = await res.json();
    return data;
  });
};

// Convenience: cached finnhub call
const finnhubCached = async (path, ttlMs = 60_000) => {
  const cached = cacheGet(`finnhub:${path}`);
  if (cached) return cached;
  const data = await finnhubFetch(path);
  cacheSet(`finnhub:${path}`, data, ttlMs);
  return data;
};

// ─────────────────────────────────────────────────────────────
// @desc    Search stocks
// @route   GET /api/stocks/search?q=AAPL
// @access  Private
// ─────────────────────────────────────────────────────────────
const searchStocks = async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 1) {
    return res.status(400).json({ success: false, message: 'Query parameter q is required.' });
  }

  try {
    // Search results cached for 5 min
    const data = await finnhubCached(`/search?q=${encodeURIComponent(q.trim())}`, 5 * 60_000);
    const results = (data.result || [])
      .filter((item) => item.type === 'Common Stock' && item.symbol && !item.symbol.includes('.'))
      .slice(0, 10)
      .map((item) => ({
        symbol: item.symbol,
        description: item.description,
        type: item.type,
      }));

    res.json({ success: true, results });
  } catch (error) {
    console.error('Stock search error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to search stocks.' });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get stock quote + profile
// @route   GET /api/stocks/quote/:symbol
// @access  Private
// ─────────────────────────────────────────────────────────────
const getStockQuote = async (req, res) => {
  const { symbol } = req.params;
  const sym = symbol.toUpperCase();

  try {
    // Run sequentially (not parallel) to avoid bursting rate limit
    const quote = await finnhubCached(`/quote?symbol=${sym}`, 60_000);           // 60s cache
    const profile = await finnhubCached(`/stock/profile2?symbol=${sym}`, 3_600_000); // 1hr cache

    if (!quote || !quote.c || quote.c === 0) {
      return res.status(404).json({ success: false, message: 'Stock not found or no data available.' });
    }

    res.json({
      success: true,
      data: {
        symbol: sym,
        companyName: profile?.name || sym,
        logo: profile?.logo || '',
        exchange: profile?.exchange || '',
        industry: profile?.finnhubIndustry || '',
        marketCap: profile?.marketCapitalization || 0,
        currentPrice: quote.c,
        openPrice: quote.o,
        highPrice: quote.h,
        lowPrice: quote.l,
        previousClose: quote.pc,
        change: quote.d,
        changePercent: quote.dp,
        timestamp: quote.t,
        currency: profile?.currency || 'USD',
      },
    });
  } catch (error) {
    console.error('Get stock quote error:', error.message);
    if (error.message.includes('429')) {
      return res.status(429).json({ success: false, message: 'Rate limit reached. Please wait a moment and try again.' });
    }
    res.status(500).json({ success: false, message: 'Failed to fetch stock data.' });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get stock candles (historical data via Yahoo Finance)
// @route   GET /api/stocks/candles/:symbol
// @access  Private
// ─────────────────────────────────────────────────────────────
const getStockCandles = async (req, res) => {
  const { symbol } = req.params;
  const { resolution = 'D', from, to } = req.query;
  const sym = symbol.toUpperCase();

  const now = Math.floor(Date.now() / 1000);
  const toTime = to ? parseInt(to) : now;
  const fromTime = from ? parseInt(from) : now - 30 * 24 * 60 * 60;

  // Map resolution to Yahoo Finance interval
  let interval = '1d';
  if (['1', '5', '15', '30', '60'].includes(resolution)) {
    interval = `${resolution}m`;
  } else if (resolution === 'W') {
    interval = '1wk';
  } else if (resolution === 'M') {
    interval = '1mo';
  }

  const cacheKey = `yahoo:${sym}:${interval}:${fromTime}`;
  const cached = cacheGet(cacheKey);
  if (cached) return res.json(cached);

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?period1=${fromTime}&period2=${toTime}&interval=${interval}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!response.ok) throw new Error(`Yahoo API error: ${response.status}`);
    const data = await response.json();

    const result = data.chart?.result?.[0];
    if (!result || !result.timestamp) {
      return res.status(404).json({ success: false, message: 'No historical data available.' });
    }

    const quote = result.indicators.quote[0];
    const candles = [];
    for (let i = 0; i < result.timestamp.length; i++) {
      if (quote.open[i] !== null && quote.close[i] !== null) {
        candles.push({
          time: result.timestamp[i],
          open: parseFloat(quote.open[i]?.toFixed(4)) || 0,
          high: parseFloat(quote.high[i]?.toFixed(4)) || 0,
          low: parseFloat(quote.low[i]?.toFixed(4)) || 0,
          close: parseFloat(quote.close[i]?.toFixed(4)) || 0,
          volume: quote.volume[i] || 0,
        });
      }
    }

    const payload = { success: true, symbol: sym, resolution, candles };
    // Cache candles for 10 min (daily data doesn't change frequently)
    cacheSet(cacheKey, payload, 10 * 60_000);
    res.json(payload);
  } catch (error) {
    console.error('Get candles error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch historical data.' });
  }
};

// ─────────────────────────────────────────────────────────────
// @desc    Get market status
// @route   GET /api/stocks/market-status
// @access  Private
// ─────────────────────────────────────────────────────────────
const getMarketStatus = async (req, res) => {
  try {
    // Market status cached for 5 min
    const data = await finnhubCached('/stock/market-status?exchange=US', 5 * 60_000);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Market status error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch market status.' });
  }
};

module.exports = { searchStocks, getStockQuote, getStockCandles, getMarketStatus };
