'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  Wallet,
  ShoppingCart,
  TrendingUp,
  MousePointer,
  Users,
  Share2,
  Package
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ResellerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch('/api/reseller/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        setStats(data.data.stats);
        setRecentOrders(data.data.recentOrders || []);
      }

    } catch (error) {
      console.error('Dashboard fetch error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'Total Earnings',
      value: `₹${stats?.totalEarnings?.toFixed(2) || '0.00'}`,
      subtitle: 'Lifetime commission',
      icon: DollarSign,
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      trend: stats?.monthEarnings > 0 ? `₹${stats?.monthEarnings?.toFixed(2)} this month` : null
    },
    {
      title: 'Product Profit',
      value: `₹${stats?.avgCommissionPerOrder?.toFixed(2) || '0.00'}`,
      subtitle: 'Avg. per order',
      icon: TrendingUp,
      bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      trend: stats?.totalOrders > 0 ? `From ${stats?.totalOrders} orders` : null
    },
    {
      title: 'Product Clicks',
      value: stats?.totalClicks || '0',
      subtitle: 'Link engagement',
      icon: MousePointer,
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      iconColor: 'text-pink-600 dark:text-pink-400',
      trend: stats?.conversionRate > 0 ? `${stats?.conversionRate}% conversion` : null
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || '0',
      subtitle: 'Successfully generated',
      icon: ShoppingCart,
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      trend: stats?.totalSalesValue > 0 ? `₹${stats?.totalSalesValue?.toFixed(0)} sales` : null
    },
    {
      title: 'Conversion Rate',
      value: `${stats?.conversionRate || '0'}%`,
      subtitle: 'Clicks to orders',
      icon: TrendingUp,
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
      trend: stats?.totalClicks > 0 && stats?.totalOrders > 0 ? 'Keep sharing!' : 'Start sharing'
    },
    {
      title: 'Referral Growth',
      value: stats?.totalReferrals || '0',
      subtitle: 'Network members',
      icon: Users,
      bgColor: 'bg-teal-100 dark:bg-teal-900/30',
      iconColor: 'text-teal-600 dark:text-teal-400',
      trend: 'Build your team'
    },
    {
      title: 'Available Balance',
      value: `₹${stats?.availableBalance?.toFixed(2) || '0.00'}`,
      subtitle: 'Ready to withdraw',
      icon: Wallet,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      trend: stats?.pendingEarnings > 0 ? `₹${stats?.pendingEarnings?.toFixed(2)} pending` : null
    },
    {
      title: 'Sales Value',
      value: `₹${stats?.totalSalesValue?.toFixed(2) || '0.00'}`,
      subtitle: 'Total generated',
      icon: TrendingUp,
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      trend: stats?.totalOrders > 0 ? `${stats?.totalOrders} orders` : null
    }
  ];

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return badges[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reseller Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome to your reseller panel
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/reseller/products"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all hover:opacity-90"
            style={{ backgroundColor: 'rgb(var(--color-primary))' }}
          >
            <Package className="h-5 w-5" />
            Browse Products
          </Link>
        </div>
      </div>

      {/* Today's Performance Hero Card */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-green-100 text-sm font-medium mb-2">Today's Earnings</p>
            <p className="text-4xl font-bold mb-1">₹{stats?.todayEarnings?.toFixed(2) || '0.00'}</p>
            <p className="text-green-100 text-sm">
              Keep sharing to earn more! 🚀
            </p>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-green-100 text-xs mb-1">This Month</p>
              <p className="text-2xl font-bold">₹{stats?.monthEarnings?.toFixed(2) || '0.00'}</p>
            </div>
            <div className="h-16 w-px bg-green-400/30"></div>
            <div className="text-center">
              <p className="text-green-100 text-xs mb-1">Lifetime</p>
              <p className="text-2xl font-bold">₹{stats?.totalEarnings?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  {stat.subtitle}
                </p>
                {stat.trend && (
                  <p className="text-xs font-medium mt-2" style={{ color: 'rgb(var(--color-primary))' }}>
                    {stat.trend}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Motivational Insight Card */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border-2 border-purple-200 dark:border-purple-800">
          <div className="flex items-start gap-4">
            <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {stats?.totalOrders === 0 
                  ? '🎯 Start Your Journey!'
                  : stats?.totalOrders < 10
                  ? '🚀 Great Start!'
                  : stats?.totalOrders < 50
                  ? '💪 Keep Growing!'
                  : '⭐ You\'re a Star!'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {stats?.totalOrders === 0 
                  ? 'Share your first product to earn commission. Every journey starts with one sale!'
                  : stats?.conversionRate < 5
                  ? `Your conversion is ${stats?.conversionRate}%. Focus on targeted sharing for better results!`
                  : `Amazing ${stats?.conversionRate}% conversion! You're doing great. Keep it up!`}
              </p>
              {stats?.avgCommissionPerOrder > 0 && (
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-2">
                  💰 You earn ₹{stats?.avgCommissionPerOrder?.toFixed(2)} per order on average
                </p>
              )}
            </div>
          </div>
        </div>

        <Link
          href="/reseller/products"
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg group-hover:scale-110 transition-transform">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Browse Products
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Find products to promote
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/reseller/wallet"
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg group-hover:scale-110 transition-transform">
              <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                View Wallet
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Check your balance
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Growth Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Share2 className="h-5 w-5" style={{ color: 'rgb(var(--color-primary))' }} />
          💡 Quick Tips to Boost Your Earnings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">📱 Share Consistently</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Share 3-5 products daily on WhatsApp groups for better reach
            </p>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">👥 Build Your Network</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Refer other resellers to earn from their sales too
            </p>
          </div>
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">🎯 Track Performance</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Check analytics to see what products perform best
            </p>
          </div>
        </div>
      </div>

      {/* Remove old Quick Actions section as we've replaced it above */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/reseller/referrals"
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-lg group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                My Referrals
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage your network
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/reseller/analytics"
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Performance Analytics
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track your progress
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Orders - keeping existing section */}
      {recentOrders.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Orders
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Products
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {order.order_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {order.products?.substring(0, 50)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ₹{parseFloat(order.total_amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">
                      ₹{parseFloat(order.commission_earned).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(order.order_status)}`}>
                        {order.order_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/reseller/orders"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all orders →
            </Link>
          </div>
        </div>
      )}

      {/* Empty State for Recent Orders */}
      {recentOrders.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <ShoppingCart className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Orders Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start sharing products to generate your first order!
          </p>
          <Link
            href="/reseller/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white transition-all hover:opacity-90"
            style={{ backgroundColor: 'rgb(var(--color-primary))' }}
          >
            <Package className="h-5 w-5" />
            Browse Products
          </Link>
        </div>
      )}
    </div>
  );
}
