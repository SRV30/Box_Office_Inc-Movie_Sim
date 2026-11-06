import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';

// Async action to fetch studio awards
export const fetchAwards = createAsyncThunk(
  'awards/fetchAwards',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/awards');
      const payload = response.data;
      return Array.isArray(payload) ? payload : (payload.awards || []);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch awards');
    }
  }
);

const awardsSlice = createSlice({
  name: 'awards',
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAwards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAwards.fulfilled, (state, action) => {
        state.loading = false;
        state.data = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchAwards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default awardsSlice.reducer;
