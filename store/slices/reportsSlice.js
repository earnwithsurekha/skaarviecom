import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks
export const fetchSalesReport = createAsyncThunk(
  'reports/fetchSales',
  async ({ period = 'daily', startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        period,
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && { endDate: endDate.toISOString() }),
      });

      const response = await fetch(`/api/reports/sales?${queryParams}`);
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Failed to fetch sales report');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchProductReport = createAsyncThunk(
  'reports/fetchProducts',
  async ({ type = 'best', limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        type,
        limit: limit.toString(),
      });

      const response = await fetch(`/api/reports/products?${queryParams}`);
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Failed to fetch product report');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchResellerDemandReport = createAsyncThunk(
  'reports/fetchResellerDemand',
  async ({ limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
      });

      const response = await fetch(`/api/reports/reseller-demand?${queryParams}`);
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Failed to fetch reseller demand report');
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchRevenueReport = createAsyncThunk(
  'reports/fetchRevenue',
  async ({ groupBy = 'day', startDate, endDate } = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams({
        groupBy,
        ...(startDate && { startDate: startDate.toISOString() }),
        ...(endDate && { endDate: endDate.toISOString() }),
      });

      const response = await fetch(`/api/reports/revenue?${queryParams}`);
      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message || 'Failed to fetch revenue report');
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
  salesReport: {
    period: 'daily',
    startDate: null,
    endDate: null,
    sales: [],
  },
  productReport: {
    type: 'best',
    products: [],
  },
  resellerDemand: {
    mostSaved: [],
    mostShared: [],
    mostClicked: [],
    highestConversion: [],
  },
  revenueReport: {
    grossRevenue: 0,
    platformFees: 0,
    netRevenue: 0,
    totalOrders: 0,
    startDate: null,
    endDate: null,
    groupBy: 'day',
    breakdown: [],
  },
  loading: {
    sales: false,
    products: false,
    demand: false,
    revenue: false,
  },
  error: null,
};

// Slice
const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetReports: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    // Fetch Sales Report
    builder
      .addCase(fetchSalesReport.pending, (state) => {
        state.loading.sales = true;
        state.error = null;
      })
      .addCase(fetchSalesReport.fulfilled, (state, action) => {
        state.loading.sales = false;
        state.salesReport = action.payload;
      })
      .addCase(fetchSalesReport.rejected, (state, action) => {
        state.loading.sales = false;
        state.error = action.payload || 'Failed to fetch sales report';
      });

    // Fetch Product Report
    builder
      .addCase(fetchProductReport.pending, (state) => {
        state.loading.products = true;
        state.error = null;
      })
      .addCase(fetchProductReport.fulfilled, (state, action) => {
        state.loading.products = false;
        state.productReport = action.payload;
      })
      .addCase(fetchProductReport.rejected, (state, action) => {
        state.loading.products = false;
        state.error = action.payload || 'Failed to fetch product report';
      });

    // Fetch Reseller Demand Report
    builder
      .addCase(fetchResellerDemandReport.pending, (state) => {
        state.loading.demand = true;
        state.error = null;
      })
      .addCase(fetchResellerDemandReport.fulfilled, (state, action) => {
        state.loading.demand = false;
        state.resellerDemand = action.payload;
      })
      .addCase(fetchResellerDemandReport.rejected, (state, action) => {
        state.loading.demand = false;
        state.error = action.payload || 'Failed to fetch reseller demand report';
      });

    // Fetch Revenue Report
    builder
      .addCase(fetchRevenueReport.pending, (state) => {
        state.loading.revenue = true;
        state.error = null;
      })
      .addCase(fetchRevenueReport.fulfilled, (state, action) => {
        state.loading.revenue = false;
        state.revenueReport = action.payload;
      })
      .addCase(fetchRevenueReport.rejected, (state, action) => {
        state.loading.revenue = false;
        state.error = action.payload || 'Failed to fetch revenue report';
      });
  },
});

export const { clearError, resetReports } = reportsSlice.actions;
export default reportsSlice.reducer;
