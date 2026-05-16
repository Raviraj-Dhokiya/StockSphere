# StockSphere 📈

StockSphere is a modern, full-stack virtual stock trading web application built with the **MERN Stack** (MongoDB, Express.js, React, Node.js). It provides users with a real-time, interactive environment to simulate stock market investing, track portfolios, and engage with a trading community without risking real money.

---

## 🚀 Key Features

### 1. 🔐 Secure Authentication & Authorization
* **JWT-Based Auth:** Secure JSON Web Token authentication system.
* **Password Hashing:** Passwords are encrypted using `bcrypt.js` before saving to the database.
* **Protected Routes:** Both backend APIs and frontend React routes are protected from unauthorized access.
* **Persistent Login:** Session is maintained efficiently using Redux state and local storage tokens.

### 2. ⚡ Real-Time Market Data (Finnhub API + WebSockets)
* **Live Price Updates:** Utilizes `Socket.io` to stream real-time stock prices to the frontend.
* **Smart Polling/Caching:** The backend intelligently caches baseline quotes and simulates live fluctuations to bypass strict Finnhub API rate limits (30 calls/min) while ensuring a highly dynamic UI.
* **Global Redux Sync:** When a stock price updates via WebSocket, the Redux `stocksSlice` updates instantly, automatically re-rendering the Dashboard, Portfolio, and Watchlist pages in real-time.

### 3. 💼 Virtual Portfolio Management
* **Simulated Trading:** Users receive a virtual cash balance to "Buy" and "Sell" real-world stocks.
* **Dynamic P&L (Profit/Loss):** Portfolio holdings automatically calculate Total Return, PnL %, and Current Value using real-time socket data.
* **Trade History:** Tracks every transaction (Buy/Sell, quantity, average price) securely in MongoDB.

### 4. 📊 Interactive Stock Analysis
* **Stock Search:** Search for any US stock ticker or company name.
* **Historical Charts:** Integrates `Chart.js` to render beautiful, interactive price history charts.
* **Company Data:** Displays market cap, high/low, and current trends.

### 5. ⭐ Watchlist
* **Personalized Tracking:** Users can add/remove stocks to their personal watchlist.
* **Live Grid:** The Watchlist dynamically updates alongside market ticks.

### 6. 💬 Live Community Forum
* **Social Trading:** A dedicated Community page where users can share tips and analysis.
* **Real-time Interactions:** New posts, comments, and "likes" are broadcasted live via Socket.io to all active users without needing a page refresh.

---

## 🛠️ Technology Stack

**Frontend (Client):**
* **React.js** (v18) + **Vite**
* **Redux Toolkit** (State Management)
* **Tailwind CSS** (Modern styling & UI)
* **React Router DOM** (Navigation)
* **Chart.js / React-Chartjs-2** (Data Visualization)
* **Socket.io-client** (Real-time communication)
* **React Hot Toast** (Notifications)

**Backend (Server):**
* **Node.js** & **Express.js** (REST API framework)
* **MongoDB** & **Mongoose** (NoSQL Database & ODM)
* **Socket.io** (WebSocket Server)
* **JWT & Bcrypt** (Security)
* **Node-Fetch** (External Finnhub API calls)

---

## 📂 Project Structure & Architecture

```text
StockSphere/
│
├── backend/                      # ⚙️ Node.js / Express Server
│   ├── config/                   # Database connection setups
│   ├── controllers/              # Core business logic (Auth, Portfolio, Stocks, etc.)
│   ├── middleware/               # Auth guards & Validation logic
│   ├── models/                   # Mongoose DB Schemas (User, Trade, Post, etc.)
│   ├── routes/                   # Express API route definitions
│   ├── server.js                 # Entry point & CORS/Express setup
│   └── socketService.js          # WebSockets engine (Price simulation & Live Chat)
│
├── frontend/                     # 🎨 React.js / Vite Client
│   ├── src/
│   │   ├── components/           # Reusable UI (Navbar, Sidebar, Layout, Chart)
│   │   ├── hooks/                # Custom React Hooks (useStockSearch)
│   │   ├── pages/                # App Views (Dashboard, Market, Portfolio, Community)
│   │   ├── services/             # Axios API wrapper functions
│   │   ├── store/                # Redux Toolkit configuration
│   │   │   └── slices/           # Redux state slices (auth, stocks, portfolio)
│   │   ├── App.jsx               # Global Socket.io listeners & Route Provider
│   │   └── main.jsx              # React DOM entry point
│   │
│   ├── tailwind.config.js        # Custom Tailwind design system & colors
│   └── vite.config.js            # Build tools & dev server proxy
│
└── package.json                  # Root concurrency scripts
```

---

## 🧠 How the Architecture Works (Under the Hood)

### 1. Global Socket Subscriptions (`App.jsx`)
Instead of connecting to WebSockets on every individual page, `App.jsx` listens to the Redux `quotes` object. Whenever a user visits a page that loads a stock (e.g., Dashboard loads Apple, Portfolio loads Tesla), `App.jsx` automatically emits a `join_stock` event to the backend. This ensures the user gets live prices only for what they are actively looking at.

### 2. Rate-Limit Immune Live Market (`socketService.js`)
Free API tiers strictly limit data requests. To provide a "Wall Street" fast-paced experience:
1. The backend fetches the *real* baseline price from Finnhub once.
2. It caches this baseline in memory.
3. Every 3 seconds, it generates a micro-fluctuation (-0.2% to +0.2%) on the baseline and emits it via sockets.
4. Result: Users see a hyper-active, live-updating market without crashing the API limits.

### 3. Finnhub API Integration
The application heavily relies on the **Finnhub Stock API** for accurate market data. Here's how it is integrated:
* **Symbol Search (`/search`):** When a user types in the search bar, the backend hits the `finnhub.io/api/v1/search` endpoint to find matching company tickers and names.
* **Real-time Quotes (`/quote`):** Used to fetch the current price, day high/low, and open/close prices for individual stocks (e.g., AAPL, TSLA). This data initializes the Redux `quotes` state before WebSockets take over.
* **Historical Data (`/stock/candle`):** To render the Chart.js graphs, the backend uses Finnhub's "Stock Candles" endpoint to fetch past prices (open, close, high, low, volume) over a specific resolution (e.g., daily) and time span (e.g., past 6 months).
* **Company Profiles (`/stock/profile2`):** Fetches meta-information like the company's industry, market capitalization, and website to display on the Stock Detail page.

---

## 💻 Local Development Setup

### Prerequisites
* Node.js (v16+)
* MongoDB URI (Local or Atlas)
* Finnhub API Key (Free tier from finnhub.io)

### 1. Install Dependencies
Run the install command in the root folder to install packages for both frontend and backend concurrently:
```bash
npm install --prefix frontend && npm install --prefix backend && npm install
```

### 2. Environment Variables
Create `.env` files in both the `backend/` and `frontend/` folders based on the provided `.env.example` files.
* **Backend:** Add your `MONGODB_URI`, `JWT_SECRET`, and `FINNHUB_API_KEY`.
* **Frontend:** Add your `VITE_API_URL` and `VITE_SOCKET_URL`.

### 3. Run the Application
Start both the Vite frontend and the Express backend simultaneously with one command from the root directory:
```bash
npm run dev
```

The app will be accessible at `http://localhost:3000`.

---
*Built with ❤️ for modern web development.*
