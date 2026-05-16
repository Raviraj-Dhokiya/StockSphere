# StockSphere 📈

A full-stack real-time stock tracking and portfolio management application.

## Project Structure

```
StockSphere/
├── backend/                  # Node.js + Express API
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── stockController.js
│   │   └── watchlistController.js
│   ├── middleware/
│   │   └── auth.js           # JWT auth middleware
│   ├── models/
│   │   ├── User.js
│   │   └── Watchlist.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── stocks.js
│   │   └── watchlist.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
│
└── frontend/                 # React + Redux + Tailwind CSS
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── StockChart.jsx
    │   ├── hooks/
    │   │   └── useStockSearch.js
    │   ├── pages/
    │   │   ├── DashboardPage.jsx
    │   │   ├── LoginPage.jsx
    │   │   ├── MarketPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── StockDetailPage.jsx
    │   │   └── WatchlistPage.jsx
    │   ├── services/
    │   │   ├── api.js
    │   │   ├── authService.js
    │   │   ├── stockService.js
    │   │   └── watchlistService.js
    │   ├── store/
    │   │   ├── slices/
    │   │   │   ├── authSlice.js
    │   │   │   └── watchlistSlice.js
    │   │   └── store.js
    │   ├── App.jsx
    │   ├── index.css
    │   └── index.js
    ├── postcss.config.js
    ├── tailwind.config.js
    └── package.json
```

## Setup & Installation

### Backend
```bash
cd backend
npm install
cp .env.example .env   # Fill in your values
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Environment Variables (backend/.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stocktrader
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
FINNHUB_API_KEY=your_finnhub_api_key
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```
