import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import portfolioService from '../../services/portfolioService';
import { fetchCurrentUser } from './authSlice'; // To update user balance

export const fetchPortfolio = createAsyncThunk(
  'portfolio/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await portfolioService.getPortfolio();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch portfolio');
    }
  }
);

export const buyStock = createAsyncThunk(
  'portfolio/buy',
  async ({ symbol, companyName, quantity, pricePerShare }, { rejectWithValue, dispatch }) => {
    try {
      const data = await portfolioService.buyStock(symbol, companyName, quantity, pricePerShare);
      dispatch(fetchPortfolio()); // Refresh portfolio
      dispatch(fetchCurrentUser()); // Refresh user balance
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Buy order failed');
    }
  }
);

export const sellStock = createAsyncThunk(
  'portfolio/sell',
  async ({ symbol, quantity, pricePerShare }, { rejectWithValue, dispatch }) => {
    try {
      const data = await portfolioService.sellStock(symbol, quantity, pricePerShare);
      dispatch(fetchPortfolio()); // Refresh portfolio
      dispatch(fetchCurrentUser()); // Refresh user balance
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Sell order failed');
    }
  }
);

export const fetchTrades = createAsyncThunk(
  'portfolio/trades',
  async (_, { rejectWithValue }) => {
    try {
      return await portfolioService.getTrades();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch trades');
    }
  }
);

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState: {
    data: null,
    trades: [],
    loading: false,
    tradeLoading: false,
    error: null,
    tradeError: null,
  },
  reducers: {
    clearPortfolioError: (state) => { state.error = null; },
    clearTradeError: (state) => { state.tradeError = null; },
    updateHoldingCurrentPrice: (state, action) => {
      const { symbol, price } = action.payload;
      if (state.data && state.data.holdings) {
        const holding = state.data.holdings.find(h => h.symbol === symbol);
        if (holding) {
          holding.currentPrice = price;
          // Recalculate portfolio totals
          let totalCurrentValue = 0;
          state.data.holdings.forEach(h => {
             totalCurrentValue += (h.currentPrice * h.quantity);
          });
          state.data.totalCurrentValue = totalCurrentValue;
          state.data.totalPnL = totalCurrentValue - state.data.totalInvested;
          if(state.data.totalInvested > 0) {
            state.data.pnlPercent = (state.data.totalPnL / state.data.totalInvested) * 100;
          }
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Portfolio
      .addCase(fetchPortfolio.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.portfolio;
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Trades
      .addCase(fetchTrades.pending, (state) => { state.loading = true; })
      .addCase(fetchTrades.fulfilled, (state, action) => {
        state.loading = false;
        state.trades = action.payload.trades;
      })
      .addCase(fetchTrades.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Buy Stock
      .addCase(buyStock.pending, (state) => { state.tradeLoading = true; state.tradeError = null; })
      .addCase(buyStock.fulfilled, (state) => {
        state.tradeLoading = false;
      })
      .addCase(buyStock.rejected, (state, action) => {
        state.tradeLoading = false;
        state.tradeError = action.payload;
      })

      // Sell Stock
      .addCase(sellStock.pending, (state) => { state.tradeLoading = true; state.tradeError = null; })
      .addCase(sellStock.fulfilled, (state) => {
        state.tradeLoading = false;
      })
      .addCase(sellStock.rejected, (state, action) => {
        state.tradeLoading = false;
        state.tradeError = action.payload;
      });
  },
});

export const { clearPortfolioError, clearTradeError, updateHoldingCurrentPrice } = portfolioSlice.actions;
export default portfolioSlice.reducer;
