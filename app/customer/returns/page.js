'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { formatPrice } from '@/lib/cartUtils';
import { getReturnStatusColor, getReturnStatusLabel, getDaysSinceDelivery } from '@/lib/orderUtils';
import toast from 'react-hot-toast';

export default function CustomerReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/customer/returns', {
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
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
    if (filter === 'all') return true;
    return ret.return_status === filter;
  });

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
          <h1 className="text-3xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
            My Returns
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
            Track and manage your return requests
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          All ({returns.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            filter === 'pending'
              ? 'bg-yellow-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Pending ({returns.filter(r => r.return_status === 'pending').length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            filter === 'approved'
              ? 'bg-green-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Approved ({returns.filter(r => r.return_status === 'approved').length})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            filter === 'rejected'
              ? 'bg-red-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          Rejected ({returns.filter(r => r.return_status === 'rejected').length})
        </button>
      </div>

      {/* Returns List */}
      {filteredReturns.length === 0 ? (
        <div className="card p-12 text-center">
          <Package className="h-16 w-16 mx-auto mb-4" style={{ color: 'rgb(var(--color-text-secondary))' }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
            No return requests found
          </h2>
          <p className="mb-6" style={{ color: 'rgb(var(--color-text-secondary))' }}>
            {filter === 'all' 
              ? "You haven't made any return requests yet"
              : `No ${filter} return requests`
            }
          </p>
          <Link
            href="/customer/orders"
            className="btn btn-primary inline-flex items-center gap-2"
          >
            View My Orders
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReturns.map((returnRequest) => (
            <div
              key={returnRequest.id}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Product Image */}
                <div className="w-20 h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                  {returnRequest.product_image ? (
                    <img
                      src={returnRequest.product_image}
                      alt="Product"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Return Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Order #{returnRequest.order_number}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                        {returnRequest.products}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(returnRequest.return_status)}
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColorClasses(returnRequest.return_status)}`}>
                        {getReturnStatusLabel(returnRequest.return_status)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 block">Return Amount</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {formatPrice(returnRequest.total_amount)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400 block">Requested On</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {new Date(returnRequest.return_requested_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    {returnRequest.return_approved_at && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 block">Approved On</span>
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          {new Date(returnRequest.return_approved_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                    {returnRequest.return_rejected_at && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400 block">Rejected On</span>
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          {new Date(returnRequest.return_rejected_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Return Reason */}
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                      Return Reason:
                    </span>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {returnRequest.return_reason}
                    </p>
                  </div>

                  {/* Admin Notes (for rejected/approved) */}
                  {returnRequest.admin_notes && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <span className="text-xs font-medium text-blue-700 dark:text-blue-300 block mb-1">
                        Admin Notes:
                      </span>
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        {returnRequest.admin_notes}
                      </p>
                    </div>
                  )}

                  {/* View Order Button */}
                  <div className="mt-4 flex justify-end">
                    <Link
                      href={`/customer/orders/${returnRequest.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium 
                               text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 
                               rounded-lg transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      View Order Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
