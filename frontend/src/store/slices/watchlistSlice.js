import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import watchlistService from '../../services/watchlistService';

export const fetchWatchlist = createAsyncThunk(
  'watchlist/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await watchlistService.getWatchlist();
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch watchlist');
    }
  }
);

export const addToWatchlist = createAsyncThunk(
  'watchlist/add',
  async ({ symbol, companyName }, { rejectWithValue }) => {
    try {
      return await watchlistService.addStock(symbol, companyName);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add stock');
    }
  }
);

export const removeFromWatchlist = createAsyncThunk(
  'watchlist/remove',
  async (symbol, { rejectWithValue }) => {
    try {
      return await watchlistService.removeStock(symbol);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to remove stock');
    }
  }
);

const watchlistSlice = createSlice({
  name: 'watchlist',
  initialState: {
    stocks: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearWatchlistError: (state) => { state.error = null; },
    clearWatchlist: (state) => { state.stocks = []; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWatchlist.pending, (state) => { state.loading = true; })
      .addCase(fetchWatchlist.fulfilled, (state, action) => {
        state.loading = false;
        state.stocks = action.payload.stocks;
      })
      .addCase(fetchWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(addToWatchlist.pending, (state) => { state.loading = true; })
      .addCase(addToWatchlist.fulfilled, (state, action) => {
        state.loading = false;
        state.stocks = action.payload.stocks;
      })
      .addCase(addToWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(removeFromWatchlist.pending, (state) => { state.loading = true; })
      .addCase(removeFromWatchlist.fulfilled, (state, action) => {
        state.loading = false;
        state.stocks = action.payload.stocks;
      })
      .addCase(removeFromWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearWatchlistError, clearWatchlist } = watchlistSlice.actions;
export default watchlistSlice.reducer;
