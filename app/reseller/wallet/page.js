'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  Calendar,
  Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function WalletPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filter, setFilter] = useState('all');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, filter]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch('/api/reseller/wallet/balance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch wallet balance');

      const data = await response.json();
      
      if (data.status === 'success') {
        setBalance(data.data);
      }

    } catch (error) {
      console.error('Wallet fetch error:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        ...(filter !== 'all' && { type: filter })
      });

      const response = await fetch(`/api/reseller/wallet/transactions?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch transactions');

      const data = await response.json();
      
      if (data.status === 'success') {
        setTransactions(data.data.transactions);
        setPagination(data.data.pagination);
      }

    } catch (error) {
      console.error('Transactions fetch error:', error);
      toast.error('Failed to load transactions');
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(withdrawAmount);
    
    if (!amount || amount < 500) {
      toast.error('Minimum withdrawal amount is ₹500');
      return;
    }

    if (amount > balance.current_balance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/reseller/withdrawals/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          payment_method: paymentMethod
        })
      });

      if (!response.ok) throw new Error('Failed to request withdrawal');

      const data = await response.json();
      
      if (data.status === 'success') {
        toast.success('Withdrawal request submitted successfully');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        fetchWalletData();
        fetchTransactions();
      } else {
        toast.error(data.message || 'Failed to request withdrawal');
      }

    } catch (error) {
      console.error('Withdrawal error:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setProcessing(false);
    }
  };

  // Calculate approved earnings (total - pending)
  const approvedEarnings = (balance?.total_earned || 0) - (balance?.pending_balance || 0);

  const balanceCards = [
    {
      title: 'Total Earnings',
      value: `₹${balance?.total_earned?.toFixed(2) || '0.00'}`,
      subtitle: 'Lifetime earnings',
      icon: DollarSign,
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Pending Earnings',
      value: `₹${balance?.pending_balance?.toFixed(2) || '0.00'}`,
      subtitle: 'Awaiting clearance',
      icon: TrendingUp,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      title: 'Approved Earnings',
      value: `₹${approvedEarnings.toFixed(2)}`,
      subtitle: 'Cleared earnings',
      icon: TrendingUp,
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    },
    {
      title: 'Withdrawn Earnings',
      value: `₹${balance?.withdrawn_amount?.toFixed(2) || '0.00'}`,
      subtitle: 'Total withdrawn',
      icon: TrendingDown,
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Available Balance',
      value: `₹${balance?.current_balance?.toFixed(2) || '0.00'}`,
      subtitle: 'Withdrawable now',
      icon: Wallet,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'rgb(var(--color-primary))' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Wallet
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage your earnings and withdrawals
          </p>
        </div>
        <button
          onClick={() => setShowWithdrawModal(true)}
          disabled={!balance || balance.current_balance < 500}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'rgb(var(--color-primary))' }}
        >
          <Plus className="h-5 w-5" />
          Request Withdrawal
        </button>
      </div>

      {/* Earnings Summary Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Earnings Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {balanceCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-900 rounded-lg p-5 border border-gray-200 dark:border-gray-700"
              >
                <div className={`${card.bgColor} p-3 rounded-lg inline-block mb-3`}>
                  <Icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {card.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {card.subtitle}
                </p>
              </div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Clearance</p>
            <p className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
              ₹{balance?.pending_balance?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ready to Withdraw</p>
            <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              ₹{balance?.current_balance?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Minimum Withdrawal</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">₹500.00</p>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Transaction History
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              style={filter === 'all' ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
            >
              All
            </button>
            <button
              onClick={() => setFilter('credit')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'credit'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              style={filter === 'credit' ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
            >
              Credit
            </button>
            <button
              onClick={() => setFilter('debit')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'debit'
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
              style={filter === 'debit' ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
            >
              Debit
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Reference</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {new Date(txn.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {txn.transaction_type === 'credit' ? (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <TrendingUp className="h-4 w-4" />
                        Credit
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <TrendingDown className="h-4 w-4" />
                        Debit
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {txn.description || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {txn.reference_number || '-'}
                  </td>
                  <td className={`px-6 py-4 text-right font-semibold ${
                    txn.transaction_type === 'credit'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {txn.transaction_type === 'credit' ? '+' : '-'}₹{parseFloat(txn.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900 dark:text-white">
                    ₹{parseFloat(txn.balance_after).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="p-12 text-center">
            <Wallet className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Transactions Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your transaction history will appear here
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Request Withdrawal
              </h2>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Available Balance
                </label>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ₹{balance?.current_balance?.toFixed(2) || '0.00'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Withdrawal Amount *
                </label>
                <input
                  type="number"
                  min="500"
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount (Min ₹500)"
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum withdrawal: ₹500
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                  required
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="upi">UPI</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'rgb(var(--color-primary))' }}
                >
                  {processing ? 'Processing...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
