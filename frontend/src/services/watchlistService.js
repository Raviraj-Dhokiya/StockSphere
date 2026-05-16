import API from './api';

const watchlistService = {
  getWatchlist: async () => {
    const { data } = await API.get('/watchlist');
    return data;
  },

  addStock: async (symbol, companyName) => {
    const { data } = await API.post('/watchlist', { symbol, companyName });
    return data;
  },

  removeStock: async (symbol) => {
    const { data } = await API.delete(`/watchlist/${symbol}`);
    return data;
  },
};

export default watchlistService;
