import API from './api';

const stockService = {
  search: async (query) => {
    const { data } = await API.get(`/stocks/search?q=${encodeURIComponent(query)}`);
    return data;
  },

  getQuote: async (symbol) => {
    const { data } = await API.get(`/stocks/quote/${symbol}`);
    return data;
  },

  getCandles: async (symbol, resolution, from, to) => {
    const params = new URLSearchParams({ resolution });
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    const { data } = await API.get(`/stocks/candles/${symbol}?${params}`);
    return data;
  },

  getMarketStatus: async () => {
    const { data } = await API.get('/stocks/market-status');
    return data;
  },
};

export default stockService;
