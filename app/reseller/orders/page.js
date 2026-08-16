'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Search,
  Filter,
  Eye,
  Calendar,
  TrendingUp,
  Clock,
  Loader,
  Truck,
  CheckCircle,
  XCircle,
  RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function OrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    returned: 0
  });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({
    search: '',
    status: ''
  });

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, filters.status]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/');
        return;
      }

      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        ...filters
      });

      const response = await fetch(`/api/reseller/orders?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch orders');

      const data = await response.json();
      
      if (data.status === 'success') {
        setOrders(data.data.orders);
        setPagination(data.data.pagination);
        
        // Calculate stats from orders
        const orderStats = data.data.orders.reduce((acc, order) => {
          const status = order.order_status || 'pending';
          acc[status] = (acc[status] || 0) + 1;
          acc.total += 1;
          return acc;
        }, { total: 0, pending: 0, processing: 0, confirmed: 0, shipped: 0, delivered: 0, cancelled: 0, returned: 0 });
        
        setStats(orderStats);
      }

    } catch (error) {
      console.error('Orders fetch error:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchOrders();
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        icon: Clock,
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      },
      confirmed: {
        icon: CheckCircle,
        label: 'Confirmed',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      },
      processing: {
        icon: Loader,
        label: 'Processing',
        className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      },
      shipped: {
        icon: Truck,
        label: 'Shipped',
        className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
      },
      delivered: {
        icon: CheckCircle,
        label: 'Delivered',
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      },
      cancelled: {
        icon: XCircle,
        label: 'Cancelled',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      },
      returned: {
        icon: RotateCcw,
        label: 'Returned',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      }
    };
    return configs[status] || configs.pending;
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'rgb(var(--color-primary))' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Orders
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Track orders generated from your referrals
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Total</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-yellow-200 dark:border-yellow-900/30">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400 uppercase">Pending</p>
          </div>
          <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-400">{stats.pending}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-purple-200 dark:border-purple-900/30">
          <div className="flex items-center gap-2 mb-2">
            <Loader className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase">Processing</p>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-400">{stats.processing + (stats.confirmed || 0)}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-indigo-200 dark:border-indigo-900/30">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase">Shipped</p>
          </div>
          <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-400">{stats.shipped}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-green-200 dark:border-green-900/30">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase">Delivered</p>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-400">{stats.delivered}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-red-200 dark:border-red-900/30">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase">Cancelled</p>
          </div>
          <p className="text-2xl font-bold text-red-900 dark:text-red-400">{stats.cancelled}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-300 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <RotateCcw className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Returned</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.returned}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by order ID, customer name..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
              />
            </div>
          </div>
          
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded-lg text-white transition-all hover:opacity-90"
            style={{ backgroundColor: 'rgb(var(--color-primary))' }}
          >
            Search
          </button>
          <button
            onClick={() => {
              setFilters({ search: '', status: '' });
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Items</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Commission</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.order_status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
                      #{order.order_number}
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <p className="text-sm text-gray-900 dark:text-white line-clamp-2" title={order.products}>
                      {order.products || 'N/A'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {order.customer_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.customer_mobile}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="h-4 w-4" />
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      ₹{parseFloat(order.total_amount).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      ₹{parseFloat(order.commission_earned || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${statusConfig.className}`}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/reseller/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-opacity hover:opacity-70"
                      style={{ color: 'rgb(var(--color-primary))' }}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {orders.length} of {pagination.total} orders
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && orders.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Orders Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Orders from your referrals will appear here
          </p>
        </div>
      )}
    </div>
  );
}
