import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  profile: null,
  stats: {
    totalEarnings: 0,
    pendingEarnings: 0,
    availableBalance: 0,
    totalOrders: 0,
    totalSalesValue: 0,
    totalClicks: 0,
    conversionRate: 0,
    totalReferrals: 0
  },
  resellerCode: null,
  loading: false,
  error: null
};

const resellerSlice = createSlice({
  name: 'reseller',
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.profile = action.payload;
      state.resellerCode = action.payload?.reseller_code;
    },
    setStats: (state, action) => {
      state.stats = action.payload;
    },
    updateProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload };
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearReseller: (state) => {
      return initialState;
    }
  }
});

export const {
  setProfile,
  setStats,
  updateProfile,
  setLoading,
  setError,
  clearReseller
} = resellerSlice.actions;

export default resellerSlice.reducer;
