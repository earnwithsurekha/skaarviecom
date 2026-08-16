'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Wallet, 
  DollarSign, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Filter,
  ChevronRight,
  Building,
  Smartphone,
  Calendar
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function WithdrawalsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [balance, setBalance] = useState(null);
  const [profile, setProfile] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [statusFilter, setStatusFilter] = useState('all');
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchWithdrawals();
  }, [pagination.page, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balanceRes, profileRes] = await Promise.all([
        fetch('/api/reseller/wallet/balance'),
        fetch('/api/reseller/profile')
      ]);

      const balanceData = await balanceRes.json();
      const profileData = await profileRes.json();

      if (balanceData.status === 'success') {
        setBalance(balanceData.data);
      }

      if (profileData.status === 'success') {
        setProfile(profileData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`/api/reseller/withdrawals?${params}`);
      const data = await response.json();

      if (data.status === 'success') {
        setWithdrawals(data.data.withdrawals);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to load withdrawals');
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    
    const withdrawAmount = parseFloat(amount);

    // Validation
    if (!withdrawAmount || withdrawAmount < 500) {
      toast.error('Minimum withdrawal amount is ₹500');
      return;
    }

    if (withdrawAmount > balance.current_balance) {
      toast.error('Insufficient balance');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    // Check if payment details are configured
    if (paymentMethod === 'bank' && (!profile?.bank_account_number || !profile?.bank_ifsc)) {
      toast.error('Please update your bank account details in profile');
      router.push('/reseller/profile');
      return;
    }

    if (paymentMethod === 'upi' && !profile?.upi_id) {
      toast.error('Please update your UPI ID in profile');
      router.push('/reseller/profile');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/reseller/withdrawals/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: withdrawAmount,
          payment_method: paymentMethod
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success('Withdrawal request submitted successfully');
        setShowRequestModal(false);
        setAmount('');
        fetchData();
        fetchWithdrawals();
      } else {
        toast.error(data.message || 'Failed to submit request');
      }
    } catch (error) {
      console.error('Withdrawal request error:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        icon: Clock,
        text: 'Pending',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      },
      approved: {
        icon: CheckCircle,
        text: 'Approved',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      },
      paid: {
        icon: CheckCircle,
        text: 'Paid',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      },
      rejected: {
        icon: XCircle,
        text: 'Rejected',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.text}
      </span>
    );
  };

  const getPaymentMethodIcon = (method) => {
    return method === 'bank' ? Building : Smartphone;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Withdrawals
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Request and manage your withdrawals
          </p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          disabled={!balance || balance.current_balance < 500}
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: 'rgb(var(--color-primary))' }}
        >
          <DollarSign className="h-5 w-5" />
          Request Withdrawal
        </button>
      </div>

      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Available Balance
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{balance?.current_balance?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Withdrawable amount
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending Requests
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {withdrawals.filter(w => w.status === 'pending').length}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Under review
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Withdrawn
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ₹{balance?.withdrawn_amount?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Lifetime withdrawals
          </p>
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Payment Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {profile?.bank_account_number && profile?.bank_ifsc ? (
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Bank Account
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {profile.bank_account_holder || 'N/A'}
                </p>
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                  {profile.bank_account_number?.replace(/\d(?=\d{4})/g, '*')}
                </p>
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                  IFSC: {profile.bank_ifsc}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-900/30">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-400">
                  Bank Account Not Set
                </p>
                <button
                  onClick={() => router.push('/reseller/profile')}
                  className="text-xs text-yellow-700 dark:text-yellow-500 underline"
                >
                  Add bank details
                </button>
              </div>
            </div>
          )}

          {profile?.upi_id ? (
            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Smartphone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  UPI ID
                </p>
                <p className="text-xs font-mono text-gray-600 dark:text-gray-400">
                  {profile.upi_id}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-900/30">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-400">
                  UPI ID Not Set
                </p>
                <button
                  onClick={() => router.push('/reseller/profile')}
                  className="text-xs text-yellow-700 dark:text-yellow-500 underline"
                >
                  Add UPI ID
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Withdrawal History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Withdrawal History
          </h2>
          <div className="flex gap-2">
            {['all', 'pending', 'approved', 'paid', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
                style={statusFilter === status ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Payment Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Processed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {withdrawals.map((withdrawal) => {
                const PaymentIcon = getPaymentMethodIcon(withdrawal.payment_method);
                return (
                  <tr key={withdrawal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(withdrawal.requested_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        ₹{parseFloat(withdrawal.amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <PaymentIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {withdrawal.payment_method}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(withdrawal.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {withdrawal.processed_at
                        ? new Date(withdrawal.processed_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {withdrawals.length === 0 && (
          <div className="p-12 text-center">
            <Wallet className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Withdrawal Requests
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You haven't made any withdrawal requests yet
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {withdrawals.length} of {pagination.total} withdrawals
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Request Withdrawal Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Request Withdrawal
              </h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
              {/* Available Balance */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-400 mb-1">
                  Available Balance
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-300">
                  ₹{balance?.current_balance?.toFixed(2) || '0.00'}
                </p>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Withdrawal Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount (Min: ₹500)"
                  min="500"
                  step="1"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum withdrawal amount is ₹500
                </p>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Payment Method
                </label>
                <div className="space-y-2">
                  <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    paymentMethod === 'bank'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={paymentMethod === 'bank'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4"
                      disabled={!profile?.bank_account_number}
                    />
                    <Building className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Bank Account
                      </p>
                      {profile?.bank_account_number ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {profile.bank_account_number?.replace(/\d(?=\d{4})/g, '*')}
                        </p>
                      ) : (
                        <p className="text-xs text-red-500">Not configured</p>
                      )}
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    paymentMethod === 'upi'
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === 'upi'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4"
                      disabled={!profile?.upi_id}
                    />
                    <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        UPI
                      </p>
                      {profile?.upi_id ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {profile.upi_id}
                        </p>
                      ) : (
                        <p className="text-xs text-red-500">Not configured</p>
                      )}
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex-1 px-4 py-2 rounded-lg text-white font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: 'rgb(var(--color-primary))' }}
                >
                  {processing ? 'Processing...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
