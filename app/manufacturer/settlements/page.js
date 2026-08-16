'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSettlements, fetchSettlementDetail, setFilters } from '@/store/slices/settlementsSlice';
import { FileText, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettlementsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { settlements, pagination, loading, selectedSettlement, settlementOrders, detailLoading } = useSelector((state) => state.settlements);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    dispatch(fetchSettlements({ page: 1, limit: 20 }));
  }, [dispatch]);

  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
    dispatch(setFilters({ status, page: 1 }));
    dispatch(fetchSettlements({ page: 1, limit: 20, status }));
  };

  const handleViewDetail = (settlementId) => {
    dispatch(fetchSettlementDetail(settlementId));
    setShowDetailModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
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
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      processed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const statusTabs = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Processed', value: 'processed' },
    { label: 'Paid', value: 'paid' },
  ];

  if (loading && settlements.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
            Settlement History
          </h1>
          <p style={{ color: 'rgb(var(--color-text-secondary))' }}>
            View your payment settlements and status
          </p>
        </div>

        {/* Status Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleStatusFilter(tab.value)}
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  selectedStatus === tab.value
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Settlements Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Settlement ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Gross Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Platform Fee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Net Payable</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {settlements.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No settlements found
                    </td>
                  </tr>
                ) : (
                  settlements.map((settlement) => (
                    <tr key={settlement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {settlement.settlementId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(settlement.settlementDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {settlement.ordersCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(settlement.grossRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(settlement.platformFeeTotal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(settlement.netPayable)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(settlement.status)}`}>
                          {settlement.status.charAt(0).toUpperCase() + settlement.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleViewDetail(settlement.id)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1"
                        >
                          <FileText className="w-4 h-4" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {showDetailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-800">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Settlement Details
                </h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {detailLoading ? (
                <div className="p-8 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : selectedSettlement ? (
                <div className="p-6">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Settlement ID</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedSettlement.settlementId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                      <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(selectedSettlement.status)}`}>
                        {selectedSettlement.status.charAt(0).toUpperCase() + selectedSettlement.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Settlement Date</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatDate(selectedSettlement.settlementDate)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Orders Count</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedSettlement.ordersCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Gross Revenue</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedSettlement.grossRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Platform Fee</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatCurrency(selectedSettlement.platformFeeTotal)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Net Payable</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(selectedSettlement.netPayable)}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Orders in this Settlement</h4>
                    <div className="space-y-2">
                      {settlementOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{order.order_number}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(order.ordered_at)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(order.manufacturerAmount)}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{order.order_status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
