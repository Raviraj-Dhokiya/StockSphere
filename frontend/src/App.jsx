import React, { useEffect, useState, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster, toast } from 'react-hot-toast';
import io from 'socket.io-client';

import { fetchCurrentUser, setInitialLoadingDone } from './store/slices/authSlice';
import { addLiveNotification } from './store/slices/notificationSlice';
import { updateStockPrice } from './store/slices/stocksSlice';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { SocketContext } from './context/SocketContext';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import MarketPage from './pages/MarketPage';
import WatchlistPage from './pages/WatchlistPage';
import StockDetailPage from './pages/StockDetailPage';
import PortfolioPage from './pages/PortfolioPage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  const dispatch = useDispatch();
  const { user, token, initialLoading } = useSelector((state) => state.auth);
  const { quotes } = useSelector((state) => state.stocks);

  // ✅ FIX: Use useState instead of useRef so socket can be shared via SocketContext.
  // Old code used useRef — context can't reactively share a ref value.
  const [socket, setSocket] = useState(null);
  const subscribedSymbols = useRef(new Set());

  // On mount: check auth state
  useEffect(() => {
    if (token) {
      dispatch(fetchCurrentUser());
    } else {
      dispatch(setInitialLoadingDone());
    }
  }, [dispatch, token]);

  // Manage socket connection when user logs in/out
  useEffect(() => {
    if (user) {
      // Create ONE single socket for the entire app lifetime of this session.
      // StockDetailPage and other pages will use this via SocketContext — NOT create their own.
      const socketInstance = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        transports: ['websocket', 'polling'],
      });
      setSocket(socketInstance);

      // Join user room for notifications
      socketInstance.emit('join_user', user._id);

      // Notification handler
      const handleNotification = (notif) => {
        dispatch(addLiveNotification(notif));
        toast(`🔔 ${notif.message}`, {
          icon: '🔔',
          style: { background: '#1a2235', color: '#fff', border: '1px solid #2a3548' },
        });
      };

      // Live stock price handler (global - for portfolio updates)
      const handlePriceUpdate = (data) => {
        dispatch(updateStockPrice(data));
      };

      socketInstance.on('new_notification', handleNotification);
      socketInstance.on('stock_price_update', handlePriceUpdate);

      return () => {
        socketInstance.off('new_notification', handleNotification);
        socketInstance.off('stock_price_update', handlePriceUpdate);
        socketInstance.disconnect();
        setSocket(null);
        subscribedSymbols.current.clear();
      };
    }
  }, [user, dispatch]);

  // Subscribe to any new stocks loaded into Redux
  useEffect(() => {
    if (socket && quotes) {
      const currentSymbols = Object.keys(quotes);
      currentSymbols.forEach((sym) => {
        if (!subscribedSymbols.current.has(sym)) {
          socket.emit('join_stock', sym);
          subscribedSymbols.current.add(sym);
        }
      });
    }
  }, [quotes, socket]);

  // Show loading spinner while checking auth
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-surface-border border-t-accent-green rounded-full animate-spin" />
          <p className="text-gray-500 font-mono text-sm tracking-wider uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1a2235', color: '#fff', border: '1px solid #2a3548' },
          success: { iconTheme: { primary: '#00d4aa', secondary: '#080c14' } },
          error: { iconTheme: { primary: '#ff4d6d', secondary: '#fff' } },
        }}
      />
      {/* ✅ FIX: Provide the single socket to all child components via context.
          StockDetailPage now uses useSocket() instead of creating its own. */}
      <SocketContext.Provider value={socket}>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/market" element={<MarketPage />} />
              <Route path="/watchlist" element={<WatchlistPage />} />
              <Route path="/portfolio" element={<PortfolioPage />} />
              <Route path="/community" element={<CommunityPage />} />
              <Route path="/profile/:id" element={<ProfilePage />} />
              <Route path="/stocks/:symbol" element={<StockDetailPage />} />
              <Route path="/stock/:symbol" element={<StockDetailPage />} />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </SocketContext.Provider>
    </>
  );
}

export default App;
