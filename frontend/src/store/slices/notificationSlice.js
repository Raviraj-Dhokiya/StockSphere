import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import communityService from '../../services/communityService';

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (_, { rejectWithValue }) => {
  try { return await communityService.getNotifications(); }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch notifications'); }
});

export const markNotificationsRead = createAsyncThunk('notifications/markRead', async (_, { rejectWithValue }) => {
  try { return await communityService.markNotificationsRead(); }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to mark notifications read'); }
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    items: [],
    unreadCount: 0,
    loading: false,
  },
  reducers: {
    addLiveNotification: (state, action) => {
      state.items.unshift(action.payload);
      state.unreadCount += 1;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload.notifications;
        state.unreadCount = action.payload.notifications.filter(n => !n.read).length;
      })
      .addCase(markNotificationsRead.fulfilled, (state) => {
        state.items.forEach(n => n.read = true);
        state.unreadCount = 0;
      });
  },
});

export const { addLiveNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
