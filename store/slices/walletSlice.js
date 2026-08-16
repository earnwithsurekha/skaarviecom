import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  balance: {
    current_balance: 0,
    pending_balance: 0,
    total_earned: 0,
    withdrawn_amount: 0
  },
  transactions: [],
  withdrawals: [],
  pagination: {
    page: 1,
    totalPages: 1,
    total: 0
  },
  loading: false,
  error: null
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    setBalance: (state, action) => {
      state.balance = action.payload;
    },
    setTransactions: (state, action) => {
      state.transactions = action.payload.transactions;
      state.pagination = action.payload.pagination;
    },
    addTransaction: (state, action) => {
      state.transactions.unshift(action.payload);
    },
    setWithdrawals: (state, action) => {
      state.withdrawals = action.payload.withdrawals;
      state.pagination = action.payload.pagination;
    },
    addWithdrawal: (state, action) => {
      state.withdrawals.unshift(action.payload);
      // Deduct from current balance
      state.balance.current_balance -= action.payload.amount;
    },
    updateWithdrawalStatus: (state, action) => {
      const { id, status } = action.payload;
      const withdrawal = state.withdrawals.find(w => w.id === id);
      if (withdrawal) {
        withdrawal.status = status;
      }
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearWallet: (state) => {
      return initialState;
    }
  }
});

export const {
  setBalance,
  setTransactions,
  addTransaction,
  setWithdrawals,
  addWithdrawal,
  updateWithdrawalStatus,
  setLoading,
  setError,
  clearWallet
} = walletSlice.actions;

export default walletSlice.reducer;
