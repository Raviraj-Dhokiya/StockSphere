require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
// Enable trust proxy for Render (since it's behind a reverse proxy)
app.set('trust proxy', 1);
const server = http.createServer(app);

// ─── Allowed CORS origins ────────────────────────────────────────────────────
// Add your Vercel frontend URL here via CLIENT_URL env var on Render
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

// ─── Socket.IO ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

const { initSocket } = require('./socketService');
initSocket(io);

// Attach io to every request (for use in controllers)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ─── MongoDB ─────────────────────────────────────────────────────────────────
connectDB();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Render health checks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      callback(new Error(`CORS blocked: ${origin} is not allowed.`));
    },
    credentials: true,
  })
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,                  // increased for Render free tier (cold starts)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api', limiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/stocks',        require('./routes/stocks'));
app.use('/api/watchlist',     require('./routes/watchlist'));
app.use('/api/portfolio',     require('./routes/portfolio'));
app.use('/api/community',     require('./routes/community'));
app.use('/api/notifications', require('./routes/notifications'));

// ─── Health Check (Render pings this to keep service alive) ─────────────────
app.get('/',       (req, res) => res.json({ success: true, message: 'StockSphere API is running 🚀', env: process.env.NODE_ENV }));
app.get('/health', (req, res) => res.json({ success: true, app: 'StockSphere', message: 'OK', timestamp: new Date().toISOString() }));
app.get('/api/health', (req, res) => res.json({ success: true, app: 'StockSphere', message: 'OK', timestamp: new Date().toISOString() }));

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err.message || err);
  if (err.message?.startsWith('CORS blocked')) {
    return res.status(403).json({ success: false, message: err.message });
  }
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📡 CORS allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`🗄️  MongoDB: ${process.env.MONGODB_URI ? 'URI set ✅' : 'URI NOT SET ❌'}`);
  console.log(`🔑 JWT: ${process.env.JWT_SECRET ? 'Secret set ✅' : 'Secret NOT SET ❌'}`);
  console.log(`📈 Finnhub: ${process.env.FINNHUB_API_KEY ? 'Key set ✅' : 'Key NOT SET ❌'}`);
  console.log(`\n🌐 Health check: http://localhost:${PORT}/health\n`);
});

// ─── Handle unhandled port errors gracefully ──────────────────────────────────
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use!`);
    console.error(`   Run this to fix: npx kill-port ${PORT}`);
    console.error(`   Or: Get-Process -Name node | Stop-Process -Force (PowerShell)\n`);
    process.exit(1);
  }
  throw err;
});
