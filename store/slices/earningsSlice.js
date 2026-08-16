import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const fetchEarningsOverview = createAsyncThunk(
  'earnings/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/earnings/overview');
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Failed to fetch earnings overview');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchProductEarnings = createAsyncThunk(
  'earnings/fetchProducts',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 20, sortBy = 'revenue', sortOrder = 'DESC', search = '' } = filters;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(search && { search }),
      });

      const response = await fetch(`/api/earnings/products?${queryParams}`);
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Failed to fetch product earnings');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchEarningsTimeline = createAsyncThunk(
  'earnings/fetchTimeline',
  async ({ period = 'daily', startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        period,
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && { endDate: endDate.toISOString() }),
      });

      const response = await fetch(`/api/earnings/timeline?${queryParams}`);
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Failed to fetch earnings timeline');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Initial state
const initialState = {
  overview: {
    totalSales: 0,
    platformFee: 0,
    netEarnings: 0,
    amountPaid: 0,
    pendingAmount: 0,
    ordersCount: 0,
  },
  productEarnings: [],
  timeline: [],
  filters: {
    page: 1,
    limit: 20,
    sortBy: 'revenue',
    sortOrder: 'DESC',
    search: '',
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  timelineFilters: {
    period: 'daily',
    startDate: null,
    endDate: null,
  },
  loading: false,
  timelineLoading: false,
  error: null,
};

// Slice
const earningsSlice = createSlice({
  name: 'earnings',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setTimelineFilters: (state, action) => {
      state.timelineFilters = { ...state.timelineFilters, ...action.payload };
    },
    clearError: (state) => {
      state.error = null;
    },
    resetEarnings: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Fetch Overview
    builder
      .addCase(fetchEarningsOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEarningsOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = action.payload;
      })
      .addCase(fetchEarningsOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch earnings overview';
      });

    // Fetch Product Earnings
    builder
      .addCase(fetchProductEarnings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductEarnings.fulfilled, (state, action) => {
        state.loading = false;
        state.productEarnings = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProductEarnings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch product earnings';
      });

    // Fetch Timeline
    builder
      .addCase(fetchEarningsTimeline.pending, (state) => {
        state.timelineLoading = true;
        state.error = null;
      })
      .addCase(fetchEarningsTimeline.fulfilled, (state, action) => {
        state.timelineLoading = false;
        state.timeline = action.payload.timeline;
        state.timelineFilters = {
          period: action.payload.period,
          startDate: action.payload.startDate,
          endDate: action.payload.endDate,
        };
      })
      .addCase(fetchEarningsTimeline.rejected, (state, action) => {
        state.timelineLoading = false;
        state.error = action.payload || 'Failed to fetch earnings timeline';
      });
  },
});

export const { setFilters, setTimelineFilters, clearError, resetEarnings } = earningsSlice.actions;
export default earningsSlice.reducer;
