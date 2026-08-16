'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Package,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  ChevronRight,
  Calendar,
  ShoppingBag
} from 'lucide-react';
import { formatPrice } from '@/lib/cartUtils';
import toast from 'react-hot-toast';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, searchQuery, statusFilter]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/customer/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.data?.orders) {
        setOrders(data.data.orders);
      } else {
        toast.error(data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.order_status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const getOrderStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        icon: Clock, 
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        label: 'Pending'
      },
      processing: { 
        icon: Package, 
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
        label: 'Processing'
      },
      shipped: { 
        icon: Truck, 
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
        label: 'Shipped'
      },
      delivered: { 
        icon: CheckCircle, 
        color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        label: 'Delivered'
      },
      cancelled: { 
        icon: XCircle, 
        color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        label: 'Cancelled'
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const isSuccess = status === 'success' || status === 'completed' || status === 'paid';
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
        isSuccess
          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
      }`}>
        {isSuccess ? 'Paid' : status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
          My Orders
        </h1>
        <p style={{ color: 'rgb(var(--color-text-secondary))' }}>
          Track and manage all your orders
        </p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'rgb(var(--color-text-secondary))' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order number..."
              className="input pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'rgb(var(--color-text-secondary))' }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input pl-10 pr-8 appearance-none cursor-pointer"
            >
              <option value="all">All Orders</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4" style={{ color: 'rgb(var(--color-text-secondary))' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
            {searchQuery || statusFilter !== 'all' ? 'No orders found' : 'No orders yet'}
          </h3>
          <p className="mb-6" style={{ color: 'rgb(var(--color-text-secondary))' }}>
            {searchQuery || statusFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Start shopping to see your orders here'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all shadow-md hover:shadow-lg"
            >
              <Package className="h-5 w-5" />
              Browse Products
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Link
              key={order.id}
              href={`/customer/orders/${order.id}`}
              className="block bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all p-6 group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Order Info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {order.order_number}
                        </h3>
                        {getOrderStatusBadge(order.order_status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="h-4 w-4" />
                          {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Payment:
                    </span>
                    {getPaymentStatusBadge(order.payment_status)}
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                    </span>
                  </div>
                </div>

                {/* Amount & Action */}
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Total Amount
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {formatPrice(order.final_amount)}
                    </p>
                  </div>
                  <ChevronRight className="h-6 w-6 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {orders.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {orders.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {orders.filter(o => ['pending', 'processing'].includes(o.order_status)).length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {orders.filter(o => o.order_status === 'delivered').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Delivered</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPrice(orders.reduce((sum, o) => sum + parseFloat(o.final_amount || 0), 0))}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
