import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const fetchSettlements = createAsyncThunk(
  'settlements/fetchList',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 20, status, startDate, endDate } = filters;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && { endDate: endDate.toISOString() }),
      });

      const response = await fetch(`/api/settlements?${queryParams}`);
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Failed to fetch settlements');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchSettlementDetail = createAsyncThunk(
  'settlements/fetchDetail',
  async (settlementId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/settlements/${settlementId}`);
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Failed to fetch settlement detail');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchPendingAmount = createAsyncThunk(
  'settlements/fetchPendingAmount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/settlements/pending-amount');
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Failed to fetch pending amount');
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
  settlements: [],
  selectedSettlement: null,
  settlementOrders: [],
  pendingAmount: 0,
  eligibleOrders: 0,
  filters: {
    page: 1,
    limit: 20,
    status: '',
    startDate: null,
    endDate: null,
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  loading: false,
  detailLoading: false,
  error: null,
};

// Slice
const settlementsSlice = createSlice({
  name: 'settlements',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearSelectedSettlement: (state) => {
      state.selectedSettlement = null;
      state.settlementOrders = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    resetSettlements: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Fetch Settlements List
    builder
      .addCase(fetchSettlements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettlements.fulfilled, (state, action) => {
        state.loading = false;
        state.settlements = action.payload.settlements;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchSettlements.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch settlements';
      });

    // Fetch Settlement Detail
    builder
      .addCase(fetchSettlementDetail.pending, (state) => {
        state.detailLoading = true;
        state.error = null;
      })
      .addCase(fetchSettlementDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedSettlement = action.payload.settlement;
        state.settlementOrders = action.payload.orders || [];
      })
      .addCase(fetchSettlementDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload || 'Failed to fetch settlement detail';
      });

    // Fetch Pending Amount
    builder
      .addCase(fetchPendingAmount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingAmount.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingAmount = action.payload.pendingAmount;
        state.eligibleOrders = action.payload.eligibleOrders;
      })
      .addCase(fetchPendingAmount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch pending amount';
      });
  },
});

export const { setFilters, clearSelectedSettlement, clearError, resetSettlements } = settlementsSlice.actions;
export default settlementsSlice.reducer;
