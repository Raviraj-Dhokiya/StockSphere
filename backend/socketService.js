const { getStockQuote } = require('./controllers/stockController');
// Actually, we should fetch from finnhub. 
const fetch = require('node-fetch');

const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const getKey = () => process.env.FINNHUB_API_KEY;

let ioInstance = null;
const activeSymbols = new Set();

const fetchStockPrice = async (symbol) => {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol.toUpperCase()}?interval=1m`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (result && result.meta && result.meta.regularMarketPrice !== undefined) {
      const { regularMarketPrice, previousClose } = result.meta;
      const change = regularMarketPrice - previousClose;
      const changePercent = previousClose ? (change / previousClose) * 100 : 0;
      return { 
        symbol: symbol.toUpperCase(), 
        price: regularMarketPrice, 
        change: change, 
        changePercent: changePercent 
      };
    }
  } catch (error) {
    // console.error(`Failed to fetch price for ${symbol}`);
  }
  return null;
};

// Poll active symbols every 5 seconds
setInterval(async () => {
  if (!ioInstance || activeSymbols.size === 0) return;
  
  for (const symbol of activeSymbols) {
    const data = await fetchStockPrice(symbol);
    if (data) {
      ioInstance.to(`stock_${symbol}`).emit('stock_price_update', data);
    }
  }
}, 5000);

const initSocket = (io) => {
  ioInstance = io;
  
  io.on('connection', (socket) => {
    
    socket.on('join_stock', (symbol) => {
      const sym = symbol.toUpperCase();
      socket.join(`stock_${sym}`);
      activeSymbols.add(sym);
    });

    socket.on('join_user', (userId) => {
      socket.join(`user_${userId}`);
    });

    socket.on('leave_stock', (symbol) => {
      const sym = symbol.toUpperCase();
      socket.leave(`stock_${sym}`);
      
      // Remove from active list if no one else is in the room
      const room = io.sockets.adapter.rooms.get(`stock_${sym}`);
      if (!room || room.size === 0) {
        activeSymbols.delete(sym);
      }
    });

    socket.on('disconnect', () => {
      // Clean up empty rooms
      for (const symbol of activeSymbols) {
        const room = io.sockets.adapter.rooms.get(`stock_${symbol}`);
        if (!room || room.size === 0) {
          activeSymbols.delete(symbol);
        }
      }
    });
  });
};

module.exports = { initSocket };
