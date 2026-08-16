'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchReturns();
  }, [filter]);

  const fetchReturns = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/returns?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.data) {
        setReturns(data.data.returns || []);
      } else {
        toast.error(data.message || 'Failed to fetch returns');
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
      toast.error('Failed to fetch returns');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedReturn) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/returns/${selectedReturn.id}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminNotes }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Return request approved successfully');
        setShowApproveModal(false);
        setSelectedReturn(null);
        setAdminNotes('');
        await fetchReturns();
      } else {
        toast.error(data.message || 'Failed to approve return');
      }
    } catch (error) {
      console.error('Error approving return:', error);
      toast.error('Failed to approve return');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReturn) return;

    if (!adminNotes || adminNotes.trim().length < 10) {
      toast.error('Please provide a detailed reason for rejection (minimum 10 characters)');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/admin/returns/${selectedReturn.id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminNotes }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Return request rejected');
        setShowRejectModal(false);
        setSelectedReturn(null);
        setAdminNotes('');
        await fetchReturns();
      } else {
        toast.error(data.message || 'Failed to reject return');
      }
    } catch (error) {
      console.error('Error rejecting return:', error);
      toast.error('Failed to reject return');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColorClasses = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const filteredReturns = returns.filter(ret => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      ret.order_number?.toLowerCase().includes(search) ||
      ret.customer_name?.toLowerCase().includes(search) ||
      ret.customer_email?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: returns.length,
    pending: returns.filter(r => r.return_status === 'pending').length,
    approved: returns.filter(r => r.return_status === 'approved').length,
    rejected: returns.filter(r => r.return_status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Return Management
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Review and process customer return requests
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Returns</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <Package className="h-10 w-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.pending}</p>
            </div>
            <Clock className="h-10 w-10 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.approved}</p>
            </div>
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.rejected}</p>
            </div>
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Approved
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              Rejected
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Returns List */}
      {filteredReturns.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No return requests found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm 
              ? 'No results match your search criteria'
              : filter === 'pending'
                ? 'No pending return requests at the moment'
                : `No ${filter} return requests`
            }
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReturns.map((returnRequest) => (
                  <tr key={returnRequest.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 flex-shrink-0 bg-gray-100 dark:bg-gray-600 rounded overflow-hidden">
                          {returnRequest.product_image ? (
                            <img
                              src={returnRequest.product_image}
                              alt="Product"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            #{returnRequest.order_number}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                            {returnRequest.products}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {returnRequest.customer_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {returnRequest.customer_email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ₹{parseFloat(returnRequest.total_amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(returnRequest.return_requested_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClasses(returnRequest.return_status)}`}>
                        {getStatusIcon(returnRequest.return_status)}
                        {returnRequest.return_status.charAt(0).toUpperCase() + returnRequest.return_status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {returnRequest.return_status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedReturn(returnRequest);
                              setShowApproveModal(true);
                            }}
                            className="btn btn-success btn-sm"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedReturn(returnRequest);
                              setShowRejectModal(true);
                            }}
                            className="btn btn-danger btn-sm"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => router.push(`/admin/orders/${returnRequest.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-blue-600 dark:text-blue-400 
                                   hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors text-xs font-medium"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedReturn && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => !actionLoading && setShowApproveModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Approve Return Request
              </h3>
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Order: <span className="font-medium text-gray-900 dark:text-white">{selectedReturn.order_number}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Customer: <span className="font-medium text-gray-900 dark:text-white">{selectedReturn.customer_name}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Amount: <span className="font-medium text-gray-900 dark:text-white">₹{selectedReturn.total_amount}</span>
                </p>
              </div>
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Return Reason:</strong><br />
                  {selectedReturn.return_reason}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  disabled={actionLoading}
                  rows={3}
                  placeholder="Add any notes for internal reference..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setAdminNotes('');
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                           bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                           rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="btn btn-success"
                >
                  {actionLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Approve Return
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedReturn && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => !actionLoading && setShowRejectModal(false)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Reject Return Request
              </h3>
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Order: <span className="font-medium text-gray-900 dark:text-white">{selectedReturn.order_number}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  Customer: <span className="font-medium text-gray-900 dark:text-white">{selectedReturn.customer_name}</span>
                </p>
              </div>
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Return Reason:</strong><br />
                  {selectedReturn.return_reason}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason for Rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  disabled={actionLoading}
                  rows={3}
                  placeholder="Provide a detailed reason for rejecting this return (minimum 10 characters)..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {adminNotes.length}/10 characters minimum
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setAdminNotes('');
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                           bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                           rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 
                           disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="btn btn-danger"
                >
                  {actionLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      Reject Return
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
