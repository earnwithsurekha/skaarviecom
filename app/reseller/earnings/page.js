'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Package,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EarningsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dailyEarnings, setDailyEarnings] = useState(0);
  const [weeklyEarnings, setWeeklyEarnings] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [lifetimeEarnings, setLifetimeEarnings] = useState(0);
  const [productEarnings, setProductEarnings] = useState([]);

  useEffect(() => {
    fetchAllEarnings();
  }, []);

  const fetchAllEarnings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/');
        return;
      }

      // Fetch all periods in parallel
      const [dailyRes, weeklyRes, monthlyRes, productsRes] = await Promise.all([
        fetch('/api/reseller/earnings/summary?period=today', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/reseller/earnings/summary?period=week', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/reseller/earnings/summary?period=month', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/reseller/earnings/by-product?limit=50', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [dailyData, weeklyData, monthlyData, productsData] = await Promise.all([
        dailyRes.json(),
        weeklyRes.json(),
        monthlyRes.json(),
        productsRes.json()
      ]);

      if (dailyData.status === 'success') {
        setDailyEarnings(dailyData.data.period_earnings);
        setLifetimeEarnings(dailyData.data.lifetime_earnings);
      }
      
      if (weeklyData.status === 'success') {
        setWeeklyEarnings(weeklyData.data.period_earnings);
      }
      
      if (monthlyData.status === 'success') {
        setMonthlyEarnings(monthlyData.data.period_earnings);
      }

      if (productsData.status === 'success') {
        setProductEarnings(productsData.data);
      }

    } catch (error) {
      console.error('Earnings fetch error:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Earnings Report
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your commission and earnings performance
          </p>
        </div>
        <button
          onClick={() => toast.success('Export feature coming soon!')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-all hover:opacity-90"
          style={{ backgroundColor: 'rgb(var(--color-primary))' }}
        >
          <Download className="h-5 w-5" />
          Export Report
        </button>
      </div>

      {/* Earnings Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Daily Earnings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-2 border-blue-200 dark:border-blue-900/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Daily Earnings
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ₹{dailyEarnings.toFixed(2)}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Today's commission
          </p>
        </div>

        {/* Weekly Earnings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-2 border-green-200 dark:border-green-900/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Weekly Earnings
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ₹{weeklyEarnings.toFixed(2)}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            Last 7 days
          </p>
        </div>

        {/* Monthly Earnings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-2 border-purple-200 dark:border-purple-900/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Monthly Earnings
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ₹{monthlyEarnings.toFixed(2)}
          </p>
          <p className="text-xs text-purple-600 dark:text-purple-400">
            Last 30 days
          </p>
        </div>

        {/* Lifetime Earnings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border-2 border-yellow-200 dark:border-yellow-900/30">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Package className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Lifetime Earnings
          </p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ₹{lifetimeEarnings.toFixed(2)}
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            All time total
          </p>
        </div>
      </div>

      {/* Product Wise Earnings */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Product Wise Earnings
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Commission earned from each product
          </p>
        </div>

        <div className="p-6">
          {productEarnings.length > 0 ? (
            <div className="space-y-3">
              {productEarnings.map((product, index) => (
                <div
                  key={product.product_id}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  style={{ 
                    backgroundColor: index < 3 ? 'rgb(var(--color-primary) / 0.05)' : 'transparent',
                    border: index < 3 ? '1px solid rgb(var(--color-primary) / 0.2)' : '1px solid rgb(var(--color-border))'
                  }}
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Rank Badge */}
                    <div 
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold"
                      style={index < 3 ? { 
                        backgroundColor: 'rgb(var(--color-primary))',
                        color: 'white'
                      } : {
                        backgroundColor: 'rgb(var(--color-surface))',
                        color: 'rgb(var(--color-text) / 0.7)'
                      }}
                    >
                      {index + 1}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {product.product_name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {product.order_count} {product.order_count === 1 ? 'order' : 'orders'}
                      </p>
                    </div>

                    {/* Earnings Amount */}
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        ₹{Number.parseFloat(product.total_commission).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        commission earned
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Earnings Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Start promoting products to see your earnings here
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Earnings Summary Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Earnings Summary
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Period</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Daily Earnings</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Today</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    ₹{dailyEarnings.toFixed(2)}
                  </p>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Weekly Earnings</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Last 7 days</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    ₹{weeklyEarnings.toFixed(2)}
                  </p>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <DollarSign className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Monthly Earnings</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Last 30 days</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    ₹{monthlyEarnings.toFixed(2)}
                  </p>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 bg-gray-50 dark:bg-gray-900">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                      <Package className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Lifetime Earnings</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">All time total</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="text-2xl font-bold" style={{ color: 'rgb(var(--color-primary))' }}>
                    ₹{lifetimeEarnings.toFixed(2)}
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
