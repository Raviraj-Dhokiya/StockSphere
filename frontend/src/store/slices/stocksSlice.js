import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import stockService from '../../services/stockService';

// Thunk: fetch a stock quote and cache it
export const fetchStockQuote = createAsyncThunk(
  'stocks/fetchQuote',
  async (symbol, { rejectWithValue }) => {
    try {
      const data = await stockService.getQuote(symbol);
      return data.data; // { symbol, companyName, currentPrice, ... }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch stock');
    }
  }
);

export const fetchPopularQuotes = createAsyncThunk(
  'stocks/fetchPopular',
  async (symbols, { rejectWithValue, getState }) => {
    try {
      // Fetch sequentially with small delay to avoid 429
      const results = [];
      for (const sym of symbols) {
        try {
          const data = await stockService.getQuote(sym);
          if (data?.data) results.push(data.data);
        } catch (err) {
          // 429 or other error - skip this symbol, don't crash all
          if (err.response?.status !== 429) console.warn(`Failed to fetch ${sym}:`, err.message);
        }
        // Small delay between calls
        await new Promise((r) => setTimeout(r, 150));
      }
      return results;
    } catch (err) {
      return rejectWithValue('Failed to fetch popular stocks');
    }
  }
);

const stocksSlice = createSlice({
  name: 'stocks',
  initialState: {
    quotes: {}, // symbol -> quote data
    popular: [], // array of popular stock quotes
    popularLoading: false,
    loading: {}, // symbol -> bool
    error: null,
  },
  reducers: {
    // Update a single stock's live price via socket
    updateStockPrice: (state, action) => {
      const { symbol, price, change, changePercent } = action.payload;
      if (state.quotes[symbol]) {
        state.quotes[symbol].currentPrice = price;
        state.quotes[symbol].change = change;
        state.quotes[symbol].changePercent = changePercent;
      }
      // Also update in popular array
      const popStock = state.popular.find((s) => s.symbol === symbol);
      if (popStock) {
        popStock.currentPrice = price;
        popStock.change = change;
        popStock.changePercent = changePercent;
      }
    },
    clearStockError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Single stock quote
      .addCase(fetchStockQuote.pending, (state, action) => {
        state.loading[action.meta.arg] = true;
        state.error = null;
      })
      .addCase(fetchStockQuote.fulfilled, (state, action) => {
        const quote = action.payload;
        if (quote) {
          state.quotes[quote.symbol] = quote;
          state.loading[quote.symbol] = false;
        }
      })
      .addCase(fetchStockQuote.rejected, (state, action) => {
        state.loading[action.meta.arg] = false;
        state.error = action.payload;
      })

      // Popular stocks
      .addCase(fetchPopularQuotes.pending, (state) => {
        state.popularLoading = true;
      })
      .addCase(fetchPopularQuotes.fulfilled, (state, action) => {
        state.popularLoading = false;
        state.popular = action.payload;
        // Also cache in quotes map
        action.payload.forEach((quote) => {
          state.quotes[quote.symbol] = quote;
        });
      })
      .addCase(fetchPopularQuotes.rejected, (state) => {
        state.popularLoading = false;
      });
  },
});

export const { updateStockPrice, clearStockError } = stocksSlice.actions;
export default stocksSlice.reducer;
