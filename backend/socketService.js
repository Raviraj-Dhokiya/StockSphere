const { getStockQuote } = require('./controllers/stockController');
// Actually, we should fetch from finnhub. 
const fetch = require('node-fetch');

const FINNHUB_BASE = 'https://finnhub.io/api/v1';
const getKey = () => process.env.FINNHUB_API_KEY;

let ioInstance = null;
const activeSymbols = new Set();

const fetchStockPrice = async (symbol) => {
  try {
    const res = await fetch(`${FINNHUB_BASE}/quote?symbol=${symbol.toUpperCase()}&token=${getKey()}`);
    const quote = await res.json();
    if (quote && quote.c) {
      return { symbol: symbol.toUpperCase(), price: quote.c, change: quote.d, changePercent: quote.dp };
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
