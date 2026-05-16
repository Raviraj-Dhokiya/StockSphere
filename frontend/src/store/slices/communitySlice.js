import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import communityService from '../../services/communityService';

export const fetchFeed = createAsyncThunk('community/fetchFeed', async (_, { rejectWithValue }) => {
  try { return await communityService.getFeed(); }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch feed'); }
});

export const createPost = createAsyncThunk('community/createPost', async ({ content, tags }, { rejectWithValue }) => {
  try { return await communityService.createPost(content, tags); }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to create post'); }
});

export const toggleLike = createAsyncThunk('community/toggleLike', async (postId, { rejectWithValue }) => {
  try { return { postId, data: await communityService.toggleLike(postId) }; }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to like'); }
});

const communitySlice = createSlice({
  name: 'community',
  initialState: {
    posts: [],
    loading: false,
    error: null,
  },
  reducers: {
    // Socket handlers
    addLivePost: (state, action) => {
      // Prevent duplicates
      if (!state.posts.some(p => p._id === action.payload._id)) {
        state.posts.unshift(action.payload);
      }
    },
    removeLivePost: (state, action) => {
      state.posts = state.posts.filter(p => p._id !== action.payload);
    },
    updateLivePost: (state, action) => {
      const { id, likes } = action.payload;
      const post = state.posts.find(p => p._id === id);
      if (post) post.likes = likes;
    },
    incrementCommentCount: (state, action) => {
      const post = state.posts.find(p => p._id === action.payload);
      if (post) post.commentCount += 1;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeed.pending, (state) => { state.loading = true; })
      .addCase(fetchFeed.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload.posts;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(toggleLike.fulfilled, (state, action) => {
        const post = state.posts.find(p => p._id === action.payload.postId);
        if (post) post.likes = action.payload.data.likes;
      });
  },
});

export const { addLivePost, removeLivePost, updateLivePost, incrementCommentCount } = communitySlice.actions;
export default communitySlice.reducer;
