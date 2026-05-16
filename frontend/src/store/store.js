import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import watchlistReducer from './slices/watchlistSlice';
import portfolioReducer from './slices/portfolioSlice';
import communityReducer from './slices/communitySlice';
import notificationReducer from './slices/notificationSlice';
import stocksReducer from './slices/stocksSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    watchlist: watchlistReducer,
    portfolio: portfolioReducer,
    community: communityReducer,
    notifications: notificationReducer,
    stocks: stocksReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
