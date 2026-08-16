'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Eye,
  ShoppingCart,
  BarChart3,
  Award,
  Share2,
  ExternalLink,
  Percent
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalOrders: 0,
    conversionRate: 0,
    totalEarnings: 0,
    avgOrderValue: 0,
    totalSalesValue: 0
  });
  const [topPerformingProducts, setTopPerformingProducts] = useState([]);
  const [mostSharedProducts, setMostSharedProducts] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch('/api/reseller/analytics/performance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch analytics');

      const data = await response.json();
      
      if (data.status === 'success') {
        const { overview, top_performing_products, most_shared_products } = data.data;
        
        setStats({
          totalClicks: overview.total_clicks || 0,
          totalOrders: overview.total_orders || 0,
          conversionRate: overview.conversion_rate || 0,
          totalEarnings: overview.total_commission || 0,
          avgOrderValue: overview.avg_order_value || 0,
          totalSalesValue: overview.total_sales_value || 0
        });
        
        setTopPerformingProducts(top_performing_products || []);
        setMostSharedProducts(most_shared_products || []);
      }

    } catch (error) {
      console.error('Analytics fetch error:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const metricsCards = [
    {
      title: 'Total Clicks',
      value: stats.totalClicks.toLocaleString(),
      subtitle: 'Link visits',
      icon: Eye,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders.toLocaleString(),
      subtitle: 'From referrals',
      icon: ShoppingCart,
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Conversion Rate',
      value: `${stats.conversionRate.toFixed(2)}%`,
      subtitle: 'Click to order',
      icon: TrendingUp,
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: 'Total Earnings',
      value: `₹${stats.totalEarnings.toFixed(2)}`,
      subtitle: 'All time',
      icon: DollarSign,
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      title: 'Avg. Order Value',
      value: `₹${stats.avgOrderValue.toFixed(2)}`,
      subtitle: 'Per order',
      icon: Package,
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      iconColor: 'text-pink-600 dark:text-pink-400'
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
      <div>
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="h-8 w-8" style={{ color: 'rgb(var(--color-primary))' }} />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Performance Analytics
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Track clicks, orders, conversion rates, and top performing products
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {metricsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {card.title}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {card.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {card.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Performance Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Performance Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-900/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Percent className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Conversion Rate</p>
            </div>
            <p className="text-3xl font-bold text-purple-900 dark:text-purple-100 mb-1">
              {stats.conversionRate.toFixed(2)}%
            </p>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              {stats.totalOrders} orders / {stats.totalClicks} clicks
            </p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-900/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Avg. Commission/Order</p>
            </div>
            <p className="text-3xl font-bold text-green-900 dark:text-green-100 mb-1">
              ₹{stats.totalOrders > 0 ? (stats.totalEarnings / stats.totalOrders).toFixed(2) : '0.00'}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              Per successful order
            </p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg border border-blue-200 dark:border-blue-900/30">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Generated Sales Value</p>
            </div>
            <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mb-1">
              ₹{stats.totalSalesValue.toFixed(2)}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Total revenue generated
            </p>
          </div>
        </div>
      </div>

      {/* Top Performing Products */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Performing Products
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Products with most orders and highest earnings
              </p>
            </div>
          </div>
        </div>

        {topPerformingProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Units Sold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Clicks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Conversion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {topPerformingProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm" style={{ backgroundColor: 'rgb(var(--color-primary))', color: 'white' }}>
                          #{topPerformingProducts.indexOf(product) + 1}
                        </div>
                        {product.product_image ? (
                          <img
                            src={product.product_image}
                            alt={product.product_name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {product.product_name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ₹{product.selling_price}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-gray-400" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {product.total_orders}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {product.units_sold} units
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {product.total_clicks}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${
                        product.conversion_rate >= 5
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : product.conversion_rate >= 2
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        <Percent className="h-3 w-3" />
                        {product.conversion_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">
                        ₹{product.total_commission.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/reseller/products/${product.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                        style={{ backgroundColor: 'rgb(var(--color-primary))', color: 'white' }}
                      >
                        <ExternalLink className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Award className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Performance Data Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start sharing products to see your top performers
            </p>
          </div>
        )}
      </div>

      {/* Most Shared Products */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Share2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Most Shared Products
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Products with highest click rates and engagement
              </p>
            </div>
          </div>
        </div>

        {mostSharedProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Clicks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Unique Visitors</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Conversion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {mostSharedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                          #{mostSharedProducts.indexOf(product) + 1}
                        </div>
                        {product.product_image ? (
                          <img
                            src={product.product_image}
                            alt={product.product_name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {product.product_name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            ₹{product.selling_price}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                          {product.total_clicks}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {product.unique_visitors}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 text-gray-400" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {product.total_orders}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${
                        product.conversion_rate >= 5
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : product.conversion_rate >= 2
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        <Percent className="h-3 w-3" />
                        {product.conversion_rate}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => router.push(`/reseller/products/${product.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors"
                        style={{ backgroundColor: 'rgb(var(--color-primary))', color: 'white' }}
                      >
                        <Share2 className="h-4 w-4" />
                        Share
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Share2 className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No Sharing Data Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Start sharing product links to track engagement
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
