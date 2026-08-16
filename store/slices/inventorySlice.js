import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunks for API calls
export const fetchInventory = createAsyncThunk(
  'inventory/fetchInventory',
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(`/api/inventory?${queryParams}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        return data.data;
      } else {
        return rejectWithValue(data.message);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchProductStock = createAsyncThunk(
  'inventory/fetchProductStock',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/inventory/${productId}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        return data.data.product;
      } else {
        return rejectWithValue(data.message);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchStockHistory = createAsyncThunk(
  'inventory/fetchStockHistory',
  async ({ productId, params = {} }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(params);
      const response = await fetch(`/api/inventory/${productId}/history?${queryParams}`);
      const data = await response.json();
      
      if (data.status === 'success') {
        return { productId, ...data.data };
      } else {
        return rejectWithValue(data.message);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const increaseStock = createAsyncThunk(
  'inventory/increaseStock',
  async ({ productId, quantity, reason, notes }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/inventory/${productId}/increase`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, reason, notes }),
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        return data.data;
      } else {
        return rejectWithValue(data.message);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const decreaseStock = createAsyncThunk(
  'inventory/decreaseStock',
  async ({ productId, quantity, reason, notes }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/inventory/${productId}/decrease`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity, reason, notes }),
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        return data.data;
      } else {
        return rejectWithValue(data.message);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateStock = createAsyncThunk(
  'inventory/updateStock',
  async ({ productId, newStock, reason, notes }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/inventory/${productId}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStock, reason, notes }),
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        return data.data;
      } else {
        return rejectWithValue(data.message);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateThreshold = createAsyncThunk(
  'inventory/updateThreshold',
  async ({ productId, threshold }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/inventory/${productId}/threshold`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold }),
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        return data.data;
      } else {
        return rejectWithValue(data.message);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  products: [],
  selectedProduct: null,
  stockHistory: {},
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  filters: {
    search: '',
    low_stock_only: false,
    sort_by: 'name',
    sort_order: 'asc',
  },
  loading: false,
  actionLoading: false,
  error: null,
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Inventory
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Product Stock
      .addCase(fetchProductStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductStock.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedProduct = action.payload;
      })
      .addCase(fetchProductStock.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch Stock History
      .addCase(fetchStockHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStockHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.stockHistory[action.payload.productId] = {
          history: action.payload.history,
          pagination: action.payload.pagination,
        };
      })
      .addCase(fetchStockHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Stock Actions
      .addCase(increaseStock.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(increaseStock.fulfilled, (state, action) => {
        state.actionLoading = false;
        // Update product in list if exists
        const index = state.products.findIndex(p => p.id === action.payload.product.id);
        if (index !== -1) {
          state.products[index] = action.payload.product;
        }
        if (state.selectedProduct?.id === action.payload.product.id) {
          state.selectedProduct = action.payload.product;
        }
      })
      .addCase(increaseStock.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      .addCase(decreaseStock.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(decreaseStock.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.products.findIndex(p => p.id === action.payload.product.id);
        if (index !== -1) {
          state.products[index] = action.payload.product;
        }
        if (state.selectedProduct?.id === action.payload.product.id) {
          state.selectedProduct = action.payload.product;
        }
      })
      .addCase(decreaseStock.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      .addCase(updateStock.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateStock.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.products.findIndex(p => p.id === action.payload.product.id);
        if (index !== -1) {
          state.products[index] = action.payload.product;
        }
        if (state.selectedProduct?.id === action.payload.product.id) {
          state.selectedProduct = action.payload.product;
        }
      })
      .addCase(updateStock.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      })
      
      .addCase(updateThreshold.pending, (state) => {
        state.actionLoading = true;
        state.error = null;
      })
      .addCase(updateThreshold.fulfilled, (state, action) => {
        state.actionLoading = false;
        const index = state.products.findIndex(p => p.id === action.payload.product.id);
        if (index !== -1) {
          state.products[index] = action.payload.product;
        }
        if (state.selectedProduct?.id === action.payload.product.id) {
          state.selectedProduct = action.payload.product;
        }
      })
      .addCase(updateThreshold.rejected, (state, action) => {
        state.actionLoading = false;
        state.error = action.payload;
      });
  },
});

export const { setFilters, setPagination, clearSelectedProduct, clearError } = inventorySlice.actions;

export default inventorySlice.reducer;
