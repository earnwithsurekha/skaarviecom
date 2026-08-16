'use client';

import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import {
  Package,
  ShoppingCart,
  Heart,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Store,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { formatPrice } from '@/lib/cartUtils';
import toast from 'react-hot-toast';

export default function CustomerDashboard() {
  const { user } = useSelector((state) => state.auth);
  
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
    totalSpent: 0,
  });
  
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgradeRequest, setUpgradeRequest] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    // Only check upgrade status for customers, not resellers
    if (user?.role === 'customer') {
      checkUpgradeStatus();
    }
  }, [user]);

  const checkUpgradeStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/customer/reseller-upgrade-status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUpgradeRequest(data.data);
      }
    } catch (error) {
      // No upgrade request found or error - that's okay
      console.log('No upgrade request found');
    }
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/customer/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.data?.orders) {
        const orders = data.data.orders;
        
        // Calculate stats
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(o => 
          ['pending', 'processing'].includes(o.order_status)
        ).length;
        const deliveredOrders = orders.filter(o => 
          o.order_status === 'delivered'
        ).length;
        const totalSpent = orders
          .filter(o => o.order_status !== 'cancelled')
          .reduce((sum, o) => sum + parseFloat(o.final_amount || 0), 0);

        setStats({
          totalOrders,
          pendingOrders,
          deliveredOrders,
          totalSpent,
        });

        // Set recent orders (top 5)
        setRecentOrders(orders.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatusBadge = (status) => {
    const statusConfig = {
      pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      processing: { icon: Package, color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      shipped: { icon: Truck, color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400' },
      delivered: { icon: CheckCircle, color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
      cancelled: { icon: XCircle, color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/20',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'Delivered',
      value: stats.deliveredOrders,
      icon: CheckCircle,
      color: 'from-green-500 to-green-600',
      iconBg: 'bg-green-100 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Total Spent',
      value: formatPrice(stats.totalSpent),
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
  ];

  const quickActions = [
    {
      title: 'Browse Products',
      description: 'Explore our latest collection',
      icon: ShoppingCart,
      href: '/products',
      color: 'from-blue-600 to-indigo-700',
    },
    {
      title: 'My Orders',
      description: 'Track your purchases',
      icon: Package,
      href: '/customer/orders',
      color: 'from-purple-600 to-pink-600',
    },
    {
      title: 'Wishlist',
      description: 'View saved items',
      icon: Heart,
      href: '/customer/wishlist',
      color: 'from-pink-600 to-rose-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 rounded-2xl shadow-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.name || user?.full_name || 'Customer'}! 👋
        </h1>
        <p className="text-blue-100">
          Track your orders, manage your profile, and discover amazing products.
        </p>
      </div>

      {/* Upgrade Request Status - Only show for customers */}
      {user?.role === 'customer' && upgradeRequest && (
        <div className={`rounded-2xl shadow-xl p-8 ${
          upgradeRequest.status === 'pending' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
          upgradeRequest.status === 'approved' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
          'bg-gradient-to-r from-red-500 to-rose-600'
        } text-white`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  {upgradeRequest.status === 'pending' && <Clock className="h-8 w-8" />}
                  {upgradeRequest.status === 'approved' && <CheckCircle className="h-8 w-8" />}
                  {upgradeRequest.status === 'rejected' && <XCircle className="h-8 w-8" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {upgradeRequest.status === 'pending' && 'Reseller Request Pending'}
                    {upgradeRequest.status === 'approved' && 'Reseller Request Approved!'}
                    {upgradeRequest.status === 'rejected' && 'Reseller Request Declined'}
                  </h2>
                  <p className="text-white/90 text-sm">
                    Submitted on {new Date(upgradeRequest.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <p className="text-white/90 mb-4">
                {upgradeRequest.status === 'pending' && 'Your request to become a reseller is under review. We\'ll notify you once it\'s processed.'}
                {upgradeRequest.status === 'approved' && 'Congratulations! Your reseller account has been activated. You can now start earning commissions!'}
                {upgradeRequest.status === 'rejected' && `Your request was declined. Reason: ${upgradeRequest.rejection_reason || 'Not specified'}`}
              </p>
              {upgradeRequest.status === 'approved' && (
                <Link
                  href="/reseller/dashboard"
                  className="inline-flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-all shadow-lg hover:shadow-xl"
                >
                  Go to Reseller Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reseller Access Card - Show for users who are already resellers */}
      {user?.role === 'reseller' && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <Store className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Reseller Account Active</h2>
                  <p className="text-blue-100 text-sm">Manage your reseller business</p>
                </div>
              </div>
              <p className="text-white/90 mb-6 max-w-2xl">
                You have an active reseller account. Access your reseller dashboard to manage products, 
                track commissions, view sales analytics, and more!
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/reseller/dashboard"
                  className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
                >
                  <Store className="h-5 w-5" />
                  Go to Reseller Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.iconBg} rounded-lg p-3`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold mb-4" style={{ color: 'rgb(var(--color-text))' }}>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="card hover:shadow-xl transition-all group"
              >
                <div className={`bg-gradient-to-r ${action.color} rounded-lg p-3 w-fit mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-1" style={{ color: 'rgb(var(--color-text))' }}>
                  {action.title}
                </h3>
                <p className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  {action.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
            Recent Orders
          </h2>
          {recentOrders.length > 0 && (
            <Link
              href="/customer/orders"
              className="text-sm font-semibold hover:underline"
              style={{ color: 'rgb(var(--color-primary))' }}
            >
              View All
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="h-16 w-16 mx-auto mb-4" style={{ color: 'rgb(var(--color-text-secondary))' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
              No orders yet
            </h3>
            <p className="mb-6" style={{ color: 'rgb(var(--color-text-secondary))' }}>
              Start shopping and place your first order!
            </p>
            <Link
              href="/products"
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <ShoppingCart className="h-5 w-5" />
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Order Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {order.order_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">
                          {formatPrice(order.final_amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getOrderStatusBadge(order.order_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link
                          href={`/customer/orders/${order.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-semibold"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
