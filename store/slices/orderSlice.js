import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  orders: [],
  currentOrder: null,
  filters: {
    status: 'all',
    search: '',
    startDate: null,
    endDate: null
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  },
  loading: false,
  error: null,
  stats: {
    totalOrders: 0,
    newOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0
  }
};

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setOrders: (state, action) => {
      state.orders = action.payload;
      state.loading = false;
      state.error = null;
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
      state.loading = false;
      state.error = null;
    },
    updateOrder: (state, action) => {
      const index = state.orders.findIndex(o => o.id === action.payload.id);
      if (index !== -1) {
        state.orders[index] = action.payload;
      }
      if (state.currentOrder?.id === action.payload.id) {
        state.currentOrder = action.payload;
      }
    },
    updateOrderStatus: (state, action) => {
      const { orderId, status } = action.payload;
      const orderIndex = state.orders.findIndex(order => order.id === orderId);
      if (orderIndex !== -1) {
        state.orders[orderIndex].orderStatus = status;
      }
      if (state.currentOrder?.id === orderId) {
        state.currentOrder.orderStatus = status;
      }
    },
    updateFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    setStats: (state, action) => {
      state.stats = action.payload;
    },
    clearOrders: (state) => {
      state.orders = [];
      state.currentOrder = null;
      state.filters = initialState.filters;
      state.pagination = initialState.pagination;
    }
  },
});

export const {
  setOrders,
  setCurrentOrder,
  updateOrder,
  updateOrderStatus,
  updateFilters,
  setPagination,
  setLoading,
  setError,
  clearError,
  setStats,
  clearOrders
} = orderSlice.actions;

export default orderSlice.reducer;
