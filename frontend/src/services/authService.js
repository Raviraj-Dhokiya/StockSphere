import API from './api';

const authService = {
  register: async (userData) => {
    const { data } = await API.post('/auth/register', userData);
    return data;
  },

  login: async (credentials) => {
    const { data } = await API.post('/auth/login', credentials);
    return data;
  },

  getMe: async () => {
    const { data } = await API.get('/auth/me');
    return data;
  },
};

export default authService;
