'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Heart, 
  Share2, 
  MousePointer, 
  ShoppingCart,
  Loader2,
  ArrowLeft,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Facebook,
  Twitter,
  Mail,
  MessageCircle,
  Link as LinkIcon,
  QrCode
} from 'lucide-react';
import AnalyticsCard from '@/components/manufacturer/analytics/AnalyticsCard';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { toast } from 'react-hot-toast';

export default function ProductAnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;
  
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    if (productId) {
      fetchProductAnalytics();
    }
  }, [productId, dateRange]);

  const fetchProductAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login/manufacturer');
        return;
      }

      // Build query params
      const params = new URLSearchParams();
      
      if (dateRange !== 'all') {
        const endDate = new Date();
        const startDate = new Date();
        
        if (dateRange === '7days') startDate.setDate(startDate.getDate() - 7);
        else if (dateRange === '30days') startDate.setDate(startDate.getDate() - 30);
        else if (dateRange === '90days') startDate.setDate(startDate.getDate() - 90);
        
        params.append('startDate', startDate.toISOString().split('T')[0]);
        params.append('endDate', endDate.toISOString().split('T')[0]);
      }

      const queryString = params.toString();
      const baseUrl = `/api/manufacturers/products/${productId}/analytics`;
      const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login/manufacturer');
          return;
        }
        if (response.status === 404) {
          toast.error('Product not found or access denied');
          router.push('/manufacturer/analytics');
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
      console.error('Product analytics fetch error:', error);
      toast.error('Failed to load product analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading product analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No analytics data available</p>
        </div>
      </div>
    );
  }

  const shareIcons = {
    whatsapp: MessageCircle,
    facebook: Facebook,
    twitter: Twitter,
    email: Mail,
    copy_link: LinkIcon,
    qr_code: QrCode,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/manufacturer/analytics')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {analytics.productName}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Product ID: {analytics.productId}
                </p>
              </div>
            </div>
            <ThemeSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Filter */}
        <div className="mb-6 flex items-center gap-2">
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
                onClick={() => setDateRange(range.value)}
                className={dateRange === range.value ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnalyticsCard
            title="Total Saves"
            value={analytics.totalSaves}
            icon={Heart}
            subtitle={`${analytics.uniqueResellers} unique resellers`}
            colorClass="text-pink-600 dark:text-pink-400"
          />
          <AnalyticsCard
            title="Total Shares"
            value={analytics.totalShares}
            icon={Share2}
            subtitle="Across all platforms"
            colorClass="text-blue-600 dark:text-blue-400"
          />
          <AnalyticsCard
            title="Total Clicks"
            value={analytics.totalClicks}
            icon={MousePointer}
            subtitle="Product page views"
            colorClass="text-purple-600 dark:text-purple-400"
          />
          <AnalyticsCard
            title="Total Orders"
            value={analytics.totalOrders}
            icon={ShoppingCart}
            subtitle={`${analytics.totalUnitsSold} units sold`}
            colorClass="text-green-600 dark:text-green-400"
          />
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <AnalyticsCard
            title="Unique Resellers"
            value={analytics.uniqueResellers}
            icon={Users}
            subtitle="Who saved this product"
            colorClass="text-indigo-600 dark:text-indigo-400"
          />
          <AnalyticsCard
            title="Total Revenue"
            value={analytics.totalRevenue.toLocaleString('en-IN')}
            valuePrefix="₹"
            icon={DollarSign}
            subtitle="From all orders"
            colorClass="text-emerald-600 dark:text-emerald-400"
          />
          <AnalyticsCard
            title="Units Sold"
            value={analytics.totalUnitsSold}
            icon={Package}
            subtitle="Total quantity ordered"
            colorClass="text-orange-600 dark:text-orange-400"
          />
        </div>

        {/* Conversion Rate */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium opacity-90 mb-2">Conversion Rate</h3>
                <p className="text-5xl font-bold mb-2">
                  {analytics.conversionRate.toFixed(2)}%
                </p>
                <p className="text-sm opacity-80">
                  {analytics.totalOrders} orders from {analytics.totalClicks} clicks
                </p>
              </div>
              <div className="bg-white bg-opacity-20 p-6 rounded-lg">
                <TrendingUp className="h-16 w-16" />
              </div>
            </div>
          </div>
        </div>

        {/* Share Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Share Breakdown by Platform
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(analytics.sharesByPlatform || {}).map(([platform, count]) => {
              const Icon = shareIcons[platform] || Share2;
              return (
                <div 
                  key={platform}
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center"
                >
                  <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {count}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                    {platform.replace('_', ' ')}
                  </p>
                </div>
              );
            })}
            {Object.keys(analytics.sharesByPlatform || {}).length === 0 && (
              <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
                No shares recorded yet
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
