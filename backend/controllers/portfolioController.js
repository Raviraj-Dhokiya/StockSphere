const Portfolio = require('../models/Portfolio');
const Trade = require('../models/Trade');
const User = require('../models/User');
const mongoose = require('mongoose');
const fetch = require('node-fetch');

// ─── Shared in-memory cache (same pattern as stockController) ───
const priceCache = new Map();

const getCachedPrice = (symbol) => {
  const entry = priceCache.get(symbol);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { priceCache.delete(symbol); return null; }
  return entry.price;
};

const setCachedPrice = (symbol, price) => {
  priceCache.set(symbol, { price, expiresAt: Date.now() + 60_000 }); // 60s TTL
};

// Get current stock price via Finnhub (quote endpoint - works on free tier)
const getCurrentPrice = async (symbol) => {
  const sym = symbol.toUpperCase();
  const cached = getCachedPrice(sym);
  if (cached !== null) return cached;

  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${sym}&token=${process.env.FINNHUB_API_KEY}`;
    const res = await fetch(url);
    if (res.status === 429) {
      console.warn(`Rate limited for ${sym}, using last known price`);
      return null; // Don't crash - let the trade proceed with requested price
    }
    if (!res.ok) throw new Error(`Finnhub error: ${res.status}`);
    const quote = await res.json();
    if (quote && quote.c && quote.c > 0) {
      setCachedPrice(sym, quote.c);
      return quote.c;
    }
    return null;
  } catch (error) {
    console.error(`getCurrentPrice error for ${sym}:`, error.message);
    return null;
  }
};

// @desc    Get user portfolio
// @route   GET /api/portfolio
// @access  Private
const getPortfolio = async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ user: req.user._id });
    if (!portfolio) {
      portfolio = await Portfolio.create({ user: req.user._id, holdings: [] });
    }

    // Refresh current prices for all holdings
    let needsSave = false;
    for (let holding of portfolio.holdings) {
      const price = await getCurrentPrice(holding.symbol);
      if (price !== null && price > 0 && price !== holding.currentPrice) {
        holding.currentPrice = price;
        needsSave = true;
      }
    }

    // Recalculate totals
    portfolio.totalInvested = portfolio.holdings.reduce((sum, h) => sum + h.totalInvested, 0);
    portfolio.totalCurrentValue = portfolio.holdings.reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0);
    portfolio.totalPnL = portfolio.totalCurrentValue - portfolio.totalInvested;
    portfolio.pnlPercent = portfolio.totalInvested > 0
      ? (portfolio.totalPnL / portfolio.totalInvested) * 100
      : 0;

    if (needsSave) {
      portfolio.lastUpdated = Date.now();
      await portfolio.save();
    }

    res.json({ success: true, portfolio, balance: req.user.portfolioBalance });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch portfolio.' });
  }
};

// @desc    Buy stock
// @route   POST /api/portfolio/buy
// @access  Private
const buyStock = async (req, res) => {
  const { symbol, companyName, quantity, pricePerShare } = req.body;

  if (!symbol || !quantity || quantity <= 0 || !pricePerShare || pricePerShare <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid trade parameters.' });
  }

  const qty = parseInt(quantity);
  const totalAmount = qty * pricePerShare;

  // ✅ FIX: Wrap everything in a MongoDB transaction
  // Old code: user.save() then portfolio.save() were separate calls.
  // If portfolio.save() failed, balance was already deducted — money lost!
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findById(req.user._id).session(session);

    if (user.portfolioBalance < totalAmount) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Need $${totalAmount.toFixed(2)}, have $${user.portfolioBalance.toFixed(2)}.`,
      });
    }

    // Get current market price for portfolio tracking
    // If rate-limited (429), fall back to frontend-submitted price gracefully
    const currentPrice = (await getCurrentPrice(symbol)) || pricePerShare;

    // Deduct balance
    const balanceBefore = user.portfolioBalance;
    user.portfolioBalance -= totalAmount;
    user.portfolioBalance = parseFloat(user.portfolioBalance.toFixed(6));
    await user.save({ session });

    // Find or create portfolio
    let portfolio = await Portfolio.findOne({ user: user._id }).session(session);
    if (!portfolio) {
      portfolio = new Portfolio({ user: user._id, holdings: [] });
    }

    // Update holdings
    const existingIdx = portfolio.holdings.findIndex((h) => h.symbol === symbol.toUpperCase());

    if (existingIdx >= 0) {
      const holding = portfolio.holdings[existingIdx];
      const newTotalInvested = holding.totalInvested + totalAmount;
      const newQuantity = holding.quantity + qty;

      holding.quantity = newQuantity;
      holding.totalInvested = newTotalInvested;
      holding.averageBuyPrice = newTotalInvested / newQuantity;
      holding.currentPrice = currentPrice || pricePerShare;
      holding.lastUpdated = Date.now();
    } else {
      portfolio.holdings.push({
        symbol: symbol.toUpperCase(),
        companyName: companyName || symbol.toUpperCase(),
        quantity: qty,
        averageBuyPrice: pricePerShare,
        totalInvested: totalAmount,
        currentPrice: currentPrice || pricePerShare,
        lastUpdated: Date.now(),
      });
    }

    // Recalculate totals
    portfolio.totalInvested = portfolio.holdings.reduce((sum, h) => sum + h.totalInvested, 0);
    portfolio.totalCurrentValue = portfolio.holdings.reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0);
    portfolio.totalPnL = portfolio.totalCurrentValue - portfolio.totalInvested;
    portfolio.pnlPercent = portfolio.totalInvested > 0
      ? (portfolio.totalPnL / portfolio.totalInvested) * 100
      : 0;

    await portfolio.save({ session });

    // Record trade
    const trade = await Trade.create([{
      user: user._id,
      symbol: symbol.toUpperCase(),
      companyName: companyName || symbol.toUpperCase(),
      type: 'BUY',
      quantity: qty,
      pricePerShare,
      totalAmount,
      balanceBefore,
      balanceAfter: user.portfolioBalance,
    }], { session });

    // All good — commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: `Successfully bought ${qty} shares of ${symbol.toUpperCase()}`,
      balance: user.portfolioBalance,
      trade: trade[0],
    });

  } catch (error) {
    // Something failed — roll back everything (balance restored, no partial state)
    await session.abortTransaction();
    session.endSession();
    console.error('Buy stock error:', error);
    res.status(500).json({ success: false, message: 'Failed to execute buy order.' });
  }
};

// @desc    Sell stock
// @route   POST /api/portfolio/sell
// @access  Private
const sellStock = async (req, res) => {
  const { symbol, quantity, pricePerShare } = req.body;

  if (!symbol || !quantity || quantity <= 0 || !pricePerShare || pricePerShare <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid trade parameters.' });
  }

  const qty = parseInt(quantity);
  const totalAmount = qty * pricePerShare;

  // ✅ FIX: Wrap everything in a MongoDB transaction
  // Old code: user.save() and portfolio.save() were separate — if one failed, data became inconsistent.
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    let portfolio = await Portfolio.findOne({ user: req.user._id }).session(session);
    if (!portfolio) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'Portfolio not found.' });
    }

    const holdingIdx = portfolio.holdings.findIndex((h) => h.symbol === symbol.toUpperCase());
    if (holdingIdx === -1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ success: false, message: 'You do not own this stock.' });
    }

    const holding = portfolio.holdings[holdingIdx];
    if (holding.quantity < qty) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Insufficient shares. You own ${holding.quantity}, trying to sell ${qty}.`,
      });
    }

    // Get current price for P&L calculation
    const currentPrice = await getCurrentPrice(symbol);
    const salePrice = currentPrice || pricePerShare;

    const user = await User.findById(req.user._id).session(session);
    const balanceBefore = user.portfolioBalance;

    // Add proceeds to balance
    user.portfolioBalance += totalAmount;
    user.portfolioBalance = parseFloat(user.portfolioBalance.toFixed(6));
    await user.save({ session });

    // Calculate P&L
    const averageBuyPrice = holding.averageBuyPrice;
    const costBasis = averageBuyPrice * qty;
    const pnl = totalAmount - costBasis;
    const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;

    // Update holding
    if (holding.quantity === qty) {
      // Sold all - remove holding
      portfolio.holdings.splice(holdingIdx, 1);
    } else {
      // Partial sell
      holding.quantity -= qty;
      holding.totalInvested = holding.averageBuyPrice * holding.quantity;
      holding.currentPrice = salePrice;
      holding.lastUpdated = Date.now();
    }

    // Recalculate totals
    portfolio.totalInvested = portfolio.holdings.reduce((sum, h) => sum + h.totalInvested, 0);
    portfolio.totalCurrentValue = portfolio.holdings.reduce((sum, h) => sum + (h.currentPrice * h.quantity), 0);
    portfolio.totalPnL = portfolio.totalCurrentValue - portfolio.totalInvested;
    portfolio.pnlPercent = portfolio.totalInvested > 0
      ? (portfolio.totalPnL / portfolio.totalInvested) * 100
      : 0;

    await portfolio.save({ session });

    // Record trade
    const trade = await Trade.create([{
      user: user._id,
      symbol: symbol.toUpperCase(),
      companyName: holding.companyName,
      type: 'SELL',
      quantity: qty,
      pricePerShare,
      totalAmount,
      averageBuyPrice,
      pnl,
      pnlPercent,
      balanceBefore,
      balanceAfter: user.portfolioBalance,
    }], { session });

    // All good — commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: `Successfully sold ${qty} shares of ${symbol.toUpperCase()}`,
      balance: user.portfolioBalance,
      trade: trade[0],
      pnl,
      pnlPercent,
    });

  } catch (error) {
    // Something failed — roll back everything (no partial state)
    await session.abortTransaction();
    session.endSession();
    console.error('Sell stock error:', error);
    res.status(500).json({ success: false, message: 'Failed to execute sell order.' });
  }
};

// @desc    Get trade history
// @route   GET /api/portfolio/trades
// @access  Private
const getTrades = async (req, res) => {
  try {
    const trades = await Trade.find({ user: req.user._id })
      .sort({ executedAt: -1 })
      .limit(100); // Max 100 trades
    res.json({ success: true, trades });
  } catch (error) {
    console.error('Get trades error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trade history.' });
  }
};

module.exports = { getPortfolio, buyStock, sellStock, getTrades };
