import API from './api';

const portfolioService = {
  getPortfolio: async () => {
    const { data } = await API.get('/portfolio');
    return data;
  },
  
  buyStock: async (symbol, companyName, quantity, pricePerShare) => {
    const { data } = await API.post('/portfolio/buy', {
      symbol, companyName, quantity, pricePerShare
    });
    return data;
  },

  sellStock: async (symbol, quantity, pricePerShare) => {
    const { data } = await API.post('/portfolio/sell', {
      symbol, quantity, pricePerShare
    });
    return data;
  },

  getTrades: async () => {
    const { data } = await API.get('/portfolio/trades');
    return data;
  }
};

export default portfolioService;
