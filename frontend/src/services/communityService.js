import API from './api';

const communityService = {
  getFeed: async () => {
    const { data } = await API.get('/community/feed');
    return data;
  },
  
  createPost: async (content, tags) => {
    const { data } = await API.post('/community/posts', { content, tags });
    return data;
  },

  deletePost: async (postId) => {
    const { data } = await API.delete(`/community/posts/${postId}`);
    return data;
  },

  toggleLike: async (postId) => {
    const { data } = await API.post(`/community/posts/${postId}/like`);
    return data;
  },

  getComments: async (postId) => {
    const { data } = await API.get(`/community/posts/${postId}/comments`);
    return data;
  },

  addComment: async (postId, content) => {
    const { data } = await API.post(`/community/posts/${postId}/comments`, { content });
    return data;
  },

  getUserProfile: async (userId) => {
    const { data } = await API.get(`/community/profile/${userId}`);
    return data;
  },

  getNotifications: async () => {
    const { data } = await API.get('/notifications');
    return data;
  },

  markNotificationsRead: async () => {
    const { data } = await API.put('/notifications/read');
    return data;
  }
};

export default communityService;
