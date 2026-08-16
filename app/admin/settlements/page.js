'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, Calendar, CheckCircle, Clock, XCircle, Eye, Search, Download, History
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';
import { exportToCSV } from '@/lib/exportUtils';

export default function SettlementsManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [stats, setStats] = useState({
    pendingAmount: 0,
    settlementsThisMonth: 0,
    totalSettled: 0,
    nextSettlementDate: null,
  });
  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [settlementHistory, setSettlementHistory] = useState([]);
  const [selectedManufacturerId, setSelectedManufacturerId] = useState(null);
  const [processFormData, setProcessFormData] = useState({
    manufacturerId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchSettlements();
    fetchManufacturers();
  }, [filters.status, pagination.page]);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to continue');
        router.push('/login/admin');
        return;
      }

      const params = new URLSearchParams({
        status: filters.status,
        page: pagination.page,
        limit: 20,
        search: filters.search,
      });

      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/admin/settlements?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch settlements');

      const data = await response.json();

      setSettlements(data.data.settlements || []);
      setPagination(data.data.pagination || { page: 1, totalPages: 1, total: 0 });

      // Set stats from backend
      setStats({
        pendingAmount: data.data.stats?.pendingAmount || 0,
        settlementsThisMonth: data.data.stats?.settlementsThisMonth || 0,
        totalSettled: data.data.stats?.totalSettled || 0,
        nextSettlementDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
      });
    } catch (error) {
      console.error('Settlements fetch error:', error);
      toast.error('Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  const fetchManufacturers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/manufacturers', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setManufacturers(data.data?.manufacturers || []);
      }
    } catch (error) {
      console.error('Manufacturers fetch error:', error);
    }
  };

  const handleProcessSettlement = async () => {
    if (!processFormData.manufacturerId || !processFormData.startDate || !processFormData.endDate) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/settlements/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processFormData),
      });

      if (!response.ok) throw new Error('Failed to process settlement');

      const data = await response.json();
      toast.success('Settlement processed successfully');
      setShowProcessModal(false);
      setProcessFormData({ manufacturerId: '', startDate: '', endDate: '' });
      fetchSettlements();
    } catch (error) {
      console.error('Process settlement error:', error);
      toast.error('Failed to process settlement');
    }
  };

  const handleMarkAsPaid = async (reason = '') => {
    if (!selectedSettlement) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/settlements/${selectedSettlement.settlementId}/mark-paid`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionDetails: reason }),
      });

      if (!response.ok) throw new Error('Failed to mark as paid');

      toast.success('Settlement marked as paid');
      setShowMarkPaidModal(false);
      setShowDetailsModal(false);
      fetchSettlements();
    } catch (error) {
      console.error('Mark paid error:', error);
      toast.error('Failed to mark settlement as paid');
    }
  };

  const fetchSettlementHistory = async (manufacturerId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/settlements/manufacturer/${manufacturerId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch settlement history');

      const data = await response.json();
      setSettlementHistory(data.data || []);
      setSelectedManufacturerId(manufacturerId);
      setShowHistoryModal(true);
    } catch (error) {
      console.error('Settlement history fetch error:', error);
      toast.error('Failed to load settlement history');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchSettlements();
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      search: '',
      startDate: '',
      endDate: '',
    });
    setPagination({ ...pagination, page: 1 });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {status?.toUpperCase()}
      </span>
    );
  };

  const statsCards = [
    {
      title: 'Pending Settlements',
      value: formatCurrency(stats.pendingAmount),
      icon: Clock,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'This Month',
      value: formatCurrency(stats.settlementsThisMonth),
      icon: Calendar,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Total Settled',
      value: formatCurrency(stats.totalSettled),
      icon: CheckCircle,
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Next Settlement',
      value: stats.nextSettlementDate ? formatDate(stats.nextSettlementDate) : 'TBD',
      icon: DollarSign,
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ];

  if (loading && settlements.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Manufacturer Settlements
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Process and track manufacturer payments
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (settlements.length === 0) {
                toast.error('No settlements to export');
                return;
              }
              const headers = [
                { key: 'settlementId', label: 'ID' },
                { key: 'manufacturerName', label: 'Manufacturer' },
                { key: 'amount', label: 'Amount (\u20b9)' },
                { key: 'orderCount', label: 'Orders' },
                { key: 'status', label: 'Status' },
              ];
              exportToCSV(settlements, headers, `settlements-export-${new Date().toISOString().split('T')[0]}.csv`);
              toast.success('Settlements exported successfully');
            }}
            className="btn btn-success"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => setShowProcessModal(true)}
            className="px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: 'rgb(var(--color-primary))' }}
          >
            <DollarSign className="w-4 h-4" />
            Process Settlement
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by manufacturer..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
          />

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: 'rgb(var(--color-primary))' }}
            >
              Search
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="px-4 py-2 rounded-lg transition-all hover:opacity-90 active:scale-95"
              style={{ 
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)'
              }}
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Settlements Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Settlement ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Manufacturer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No settlements found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Process your first settlement to get started
                    </p>
                    <button
                      onClick={() => setShowProcessModal(true)}
                      className="px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 active:scale-95 inline-flex items-center gap-2"
                      style={{ backgroundColor: 'rgb(var(--color-primary))' }}
                    >
                      <DollarSign className="w-4 h-4" />
                      Process Settlement
                    </button>
                  </td>
                </tr>
              ) : (
                settlements.map((settlement) => (
                  <tr
                    key={settlement.settlementId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedSettlement(settlement);
                      setShowDetailsModal(true);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900 dark:text-white">
                        #{settlement.settlementId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {settlement.manufacturerName}
                      </div>
                      {settlement.brandName && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {settlement.brandName}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(settlement.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {settlement.orderCount} orders
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatDate(settlement.startDate)} - {formatDate(settlement.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(settlement.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSettlement(settlement);
                            setShowDetailsModal(true);
                          }}
                          className="transition-all hover:opacity-70 active:scale-95"
                          style={{ color: 'rgb(var(--color-primary))' }}
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fetchSettlementHistory(settlement.manufacturerId);
                          }}
                          className="transition-all hover:opacity-70 active:scale-95"
                          style={{ color: 'rgb(var(--color-text-secondary))' }}
                          title="Settlement History"
                        >
                          <History className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90 active:scale-95"
                style={{ 
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)'
                }}
              >
                Previous
              </button>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90 active:scale-95"
                style={{ 
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Process Settlement Modal */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Process New Settlement
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Manufacturer
                </label>
                <select
                  value={processFormData.manufacturerId}
                  onChange={(e) => setProcessFormData({ ...processFormData, manufacturerId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select manufacturer...</option>
                  {manufacturers.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.companyName || m.company_name} {m.brandName || m.brand_name ? `(${m.brandName || m.brand_name})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={processFormData.startDate}
                  onChange={(e) => setProcessFormData({ ...processFormData, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={processFormData.endDate}
                  onChange={(e) => setProcessFormData({ ...processFormData, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleProcessSettlement}
                className="flex-1 px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: 'rgb(var(--color-primary))' }}
              >
                Process Settlement
              </button>
              <button
                onClick={() => {
                  setShowProcessModal(false);
                  setProcessFormData({ manufacturerId: '', startDate: '', endDate: '' });
                }}
                className="flex-1 px-4 py-2 rounded-lg transition-all hover:opacity-90 active:scale-95"
                style={{ 
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settlement Details Modal */}
      {showDetailsModal && selectedSettlement && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Settlement #{selectedSettlement.settlementId}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedSettlement.manufacturerName}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedSettlement.status)}</div>
                </div>
                {selectedSettlement.status === 'pending' && (
                  <button
                    onClick={() => setShowMarkPaidModal(true)}
                    className="px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 active:scale-95 flex items-center gap-2"
                    style={{ backgroundColor: '#10b981' }}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Paid
                  </button>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Amount Calculation</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Gross Sales</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {formatCurrency(selectedSettlement.grossSales || selectedSettlement.totalOrderValue || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Platform Fee</span>
                    <span className="text-red-600 dark:text-red-400">
                      -{formatCurrency(selectedSettlement.platformFee || selectedSettlement.platformFeeAmount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                    <span className="font-semibold text-gray-900 dark:text-white">Net Payable</span>
                    <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                      {formatCurrency(selectedSettlement.netPayable || selectedSettlement.amount || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Period</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">
                    {formatDate(selectedSettlement.startDate)} - {formatDate(selectedSettlement.endDate)}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Orders Count</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-1">
                    {selectedSettlement.orderCount} orders
                  </p>
                </div>
              </div>

              {selectedSettlement.status === 'paid' && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <h3 className="font-semibold text-green-900 dark:text-green-400 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Payment Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    {selectedSettlement.transactionId && (
                      <p className="text-green-900 dark:text-green-300">
                        <span className="font-medium">Transaction ID:</span> {selectedSettlement.transactionId}
                      </p>
                    )}
                    {selectedSettlement.paidAt && (
                      <p className="text-green-900 dark:text-green-300">
                        <span className="font-medium">Paid On:</span> {formatDate(selectedSettlement.paidAt)}
                      </p>
                    )}
                    {selectedSettlement.transactionDetails && (
                      <p className="text-green-900 dark:text-green-300">
                        <span className="font-medium">Details:</span> {selectedSettlement.transactionDetails}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mark as Paid Modal */}
      {showMarkPaidModal && selectedSettlement && (
        <ConfirmModal
          isOpen={showMarkPaidModal}
          onClose={() => setShowMarkPaidModal(false)}
          onConfirm={handleMarkAsPaid}
          title="Mark Settlement as Paid"
          message="Confirm that you have transferred the amount to the manufacturer's account."
          type="info"
          showInput={true}
          inputLabel="Transaction Details (optional)"
          inputPlaceholder="Transaction ID, payment reference, etc."
          inputRequired={false}
        />
      )}

      {/* Settlement History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <History className="w-6 h-6" />
                  Settlement History
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  All settlements for this manufacturer
                </p>
              </div>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSettlementHistory([]);
                  setSelectedManufacturerId(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {settlementHistory.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg text-gray-600 dark:text-gray-400">
                    No settlement history found
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {settlementHistory.map((settlement) => (
                    <div
                      key={settlement.settlementId}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Settlement #{settlement.settlementId}
                            </h3>
                            {getStatusBadge(settlement.status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Net Payable</p>
                              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(settlement.amount)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Gross Sales</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {formatCurrency(settlement.totalOrderValue || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Platform Fee</p>
                              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                                {formatCurrency(settlement.platformFeeAmount || 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Orders</p>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {settlement.orderCount} orders
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {formatDate(settlement.startDate)} - {formatDate(settlement.endDate)}
                              </span>
                            </div>
                            {settlement.paidAt && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>Paid on {formatDate(settlement.paidAt)}</span>
                              </div>
                            )}
                            {settlement.transactionId && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">TXN:</span>
                                <span>{settlement.transactionId}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedSettlement(settlement);
                            setShowHistoryModal(false);
                            setShowDetailsModal(true);
                          }}
                          className="ml-4 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                          style={{ color: 'rgb(var(--color-primary))' }}
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
