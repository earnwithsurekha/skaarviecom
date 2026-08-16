'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Heart, 
  Share2, 
  MousePointer, 
  ShoppingCart,
  TrendingUp,
  Loader2,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import AnalyticsCard from '@/components/manufacturer/analytics/AnalyticsCard';
import AnalyticsTable from '@/components/manufacturer/analytics/AnalyticsTable';
import { toast } from 'react-hot-toast';

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState('all'); // all, 7days, 30days, 90days
  const [sortBy, setSortBy] = useState('saves');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, sortBy]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login/manufacturer');
        return;
      }

      // Build query params
      const params = new URLSearchParams();
      params.append('sortBy', sortBy);
      params.append('limit', '50');
      
      // Add date range
      if (dateRange !== 'all') {
        const endDate = new Date();
        const startDate = new Date();
        
        if (dateRange === '7days') startDate.setDate(startDate.getDate() - 7);
        else if (dateRange === '30days') startDate.setDate(startDate.getDate() - 30);
        else if (dateRange === '90days') startDate.setDate(startDate.getDate() - 90);
        
        params.append('startDate', startDate.toISOString().split('T')[0]);
        params.append('endDate', endDate.toISOString().split('T')[0]);
      }

      const response = await fetch(`/api/manufacturers/analytics/overview?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login/manufacturer');
          return;
        }
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        setAnalytics(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Analytics fetch error:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  const handleSortChange = (field) => {
    setSortBy(field);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: 'rgb(var(--color-primary))' }} />
          <p style={{ color: 'rgb(var(--color-text-secondary))' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const products = analytics?.products || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
            Reseller Demand Analytics
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
            Track how resellers interact with your products
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Date Range Filter */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Range:</span>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All Time' },
                { value: '7days', label: 'Last 7 Days' },
                { value: '30days', label: 'Last 30 Days' },
                { value: '90days', label: 'Last 90 Days' },
              ].map((range) => (
                <button
                  key={range.value}
                  onClick={() => handleDateRangeChange(range.value)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    dateRange === range.value
                      ? 'btn-primary'
                      : 'btn-outline'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 btn btn-outline rounded-md ">
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnalyticsCard
            title="Total Saves"
            value={summary.totalSaves || 0}
            icon={Heart}
            subtitle={`Across ${summary.totalProducts || 0} products`}
            colorClass="text-pink-600 dark:text-pink-400"
          />
          <AnalyticsCard
            title="Total Shares"
            value={summary.totalShares || 0}
            icon={Share2}
            subtitle="Social media & direct shares"
            colorClass="text-blue-600 dark:text-blue-400"
          />
          <AnalyticsCard
            title="Total Clicks"
            value={summary.totalClicks || 0}
            icon={MousePointer}
            subtitle="Product page views"
            colorClass="text-purple-600 dark:text-purple-400"
          />
          <AnalyticsCard
            title="Total Orders"
            value={summary.totalOrders || 0}
            icon={ShoppingCart}
            subtitle={`${summary.totalUnitsSold || 0} units sold`}
            colorClass="text-green-600 dark:text-green-400"
          />
        </div>

        {/* Conversion Rate Card */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium opacity-90 mb-2">Average Conversion Rate</h3>
                <p className="text-4xl font-bold">
                  {summary.averageConversionRate || '0.00'}%
                </p>
                <p className="text-sm opacity-80 mt-2">
                  From clicks to orders across all products
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-4 rounded-lg">
                <TrendingUp className="h-12 w-12" />
              </div>
            </div>
          </div>
        </div>

        {/* Sort Options */}
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
          <div className="flex gap-2">
            {[
              { value: 'saves', label: 'Saves' },
              { value: 'shares', label: 'Shares' },
              { value: 'clicks', label: 'Clicks' },
              { value: 'orders', label: 'Orders' },
              { value: 'conversion', label: 'Conversion' },
            ].map((sort) => (
              <button
                key={sort.value}
                onClick={() => handleSortChange(sort.value)}
                className={sortBy === sort.value ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
              >
                {sort.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Product Performance
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Showing {products.length} of {summary.totalProducts || 0} products
            </p>
          </div>
          <AnalyticsTable 
            products={products} 
            currentSort={sortBy}
            onSort={(field) => handleSortChange(field)}
          />
        </div>
      </div>
    </div>
  );
}
