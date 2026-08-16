'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  TrendingUp, Eye, Heart, Share2, ShoppingCart, Search, Download,
  Filter, TrendingDown, BarChart3, Target
} from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

export default function DemandAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [shareBreakdown, setShareBreakdown] = useState([]);
  const [showTrackingInfo, setShowTrackingInfo] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalClicks: 0,
    totalSaves: 0,
    totalShares: 0,
    totalOrders: 0,
    totalRevenue: 0,
    overallConversionRate: 0,
  });
  const [filters, setFilters] = useState({
    period: '30d',
    search: '',
    sortBy: 'conversionRate',
    sortOrder: 'DESC',
  });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    fetchDemandAnalytics();
    fetchTrendingProducts();
    fetchShareBreakdown();
  }, [pagination.page, filters.period, filters.sortBy, filters.sortOrder]);

  const fetchDemandAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to continue');
        router.push('/login/admin');
        return;
      }

      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        period: filters.period,
        search: filters.search,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      });

      const response = await fetch(`/api/admin/demand-analytics?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch demand analytics');

      const data = await response.json();

      // Show info banner if tracking tables are missing
      if (data.message && data.message.includes('Tracking tables')) {
        setShowTrackingInfo(true);
      }

      setProducts(data.data.products || []);
      setPagination(data.data.pagination || { page: 1, totalPages: 1, total: 0 });
      setStats(data.data.stats || {});
    } catch (error) {
      console.error('Demand analytics fetch error:', error);
      toast.error('Failed to load demand analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/demand-analytics/trending?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch trending products');

      const data = await response.json();
      setTrendingProducts(data.data || []);
    } catch (error) {
      console.error('Trending products fetch error:', error);
    }
  };

  const fetchShareBreakdown = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/admin/demand-analytics/share-breakdown?period=${filters.period}`,
        {
          headers: { 'Authorization': `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch share breakdown');

      const data = await response.json();
      setShareBreakdown(data.data || []);
    } catch (error) {
      console.error('Share breakdown fetch error:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
    fetchDemandAnalytics();
  };

  const clearFilters = () => {
    setFilters({ period: '30d', search: '', sortBy: 'conversionRate', sortOrder: 'DESC' });
    setPagination({ ...pagination, page: 1 });
  };

  const exportToCSV = () => {
    const csvData = products.map((p) => ({
      'Product Name': p.productName,
      'Manufacturer': p.manufacturerName,
      'Category': p.categoryName,
      'Total Clicks': p.totalClicks,
      'Total Saves': p.totalSaves,
      'Active Saves': p.activeSaves,
      'Total Shares': p.totalShares,
      'Total Orders': p.totalOrders,
      'Quantity Sold': p.totalQuantitySold,
      'Revenue': p.totalRevenue,
      'Conversion Rate': p.conversionRate.toFixed(2) + '%',
      'Engagement Score': p.engagementScore,
      'Trending Score': p.trendingScore,
    }));

    const headers = Object.keys(csvData[0] || {});
    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => headers.map((h) => `"${row[h]}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `demand-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  const statsCards = [
    {
      title: 'Total Clicks',
      value: formatNumber(stats.totalClicks),
      icon: Eye,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      subtitle: `${stats.productsWithClicks} products`,
    },
    {
      title: 'Total Saves',
      value: formatNumber(stats.totalSaves),
      icon: Heart,
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      iconColor: 'text-pink-600 dark:text-pink-400',
      subtitle: `${stats.productsWithSaves} products`,
    },
    {
      title: 'Total Shares',
      value: formatNumber(stats.totalShares),
      icon: Share2,
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      subtitle: `${stats.productsWithShares} products`,
    },
    {
      title: 'Total Orders',
      value: formatNumber(stats.totalOrders),
      icon: ShoppingCart,
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      iconColor: 'text-green-600 dark:text-green-400',
      subtitle: formatCurrency(stats.totalRevenue),
    },
    {
      title: 'Conversion Rate',
      value: `${parseFloat(stats.overallConversionRate || 0).toFixed(2)}%`,
      icon: Target,
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      iconColor: 'text-orange-600 dark:text-orange-400',
      subtitle: 'Click to order',
    },
  ];

  const periodOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: 'all', label: 'All Time' },
  ];

  const sortOptions = [
    { value: 'conversionRate', label: 'Conversion Rate' },
    { value: 'engagementScore', label: 'Engagement Score' },
    { value: 'trendingScore', label: 'Trending Score' },
    { value: 'totalClicks', label: 'Total Clicks' },
    { value: 'totalSaves', label: 'Total Saves' },
    { value: 'totalShares', label: 'Total Shares' },
    { value: 'totalOrders', label: 'Total Orders' },
    { value: 'totalRevenue', label: 'Revenue' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reseller Demand Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track product engagement and identify trending products
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="btn btn-success"
          disabled={products.length === 0}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Info Banner - Tracking Tables Missing */}
      {showTrackingInfo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                Limited Analytics Mode
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-400 mt-1">
                Some tracking tables are missing. Currently showing orders data only. 
                To enable full analytics (clicks, saves, shares), run: 
                <code className="mx-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 rounded text-xs font-mono">
                  docs/PRODUCT-DEMAND-TRACKING.sql
                </code>
              </p>
            </div>
            <button
              onClick={() => setShowTrackingInfo(false)}
              className="flex-shrink-0 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {card.title}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                    {card.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {card.subtitle}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
            />
          </div>
          
          <select
            value={filters.period}
            onChange={(e) => {
              setFilters({ ...filters, period: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
          >
            {periodOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => {
              setFilters({ ...filters, sortBy: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Sort by: {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filters.sortOrder}
            onChange={(e) => {
              setFilters({ ...filters, sortOrder: e.target.value });
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
          >
            <option value="DESC">High to Low</option>
            <option value="ASC">Low to High</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg text-white text-sm transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: 'rgb(var(--color-primary))' }}
            >
              Search
            </button>
            {filters.search && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 rounded-lg text-sm transition-all hover:opacity-90 active:scale-95 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Table */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Product Demand ({pagination.total})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Clicks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Saves
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Shares
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Conv. Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-600 dark:text-gray-400">No data available</p>
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.productId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {product.productImage && (
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={product.productImage}
                                alt={product.productName}
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {product.productName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {product.brandName} • {product.categoryName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                          <Eye className="w-4 h-4 text-blue-500" />
                          {formatNumber(product.totalClicks)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                          <Heart className="w-4 h-4 text-pink-500" />
                          {formatNumber(product.totalSaves)}
                          <span className="text-xs text-gray-500">({product.activeSaves})</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-white">
                          <Share2 className="w-4 h-4 text-purple-500" />
                          {formatNumber(product.totalShares)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {formatNumber(product.totalOrders)}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(product.totalRevenue)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          product.conversionRate >= 5
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : product.conversionRate >= 2
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
                        }`}>
                          {parseFloat(product.conversionRate).toFixed(2)}%
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Trending Products */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending Products
              </h3>
            </div>
            <div className="p-4">
              {trendingProducts.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">No trending products</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trendingProducts.map((product, index) => (
                    <div
                      key={product.productId}
                      className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        index === 1 ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400' :
                        index === 2 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                          {product.productName}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {formatNumber(product.trendingScore)}
                          </span>
                          {product.growthPercentage > 0 && (
                            <span className="text-green-600 dark:text-green-400">
                              +{parseFloat(product.growthPercentage).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Share Platform Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share Platforms
              </h3>
            </div>
            <div className="p-4">
              {shareBreakdown.length === 0 ? (
                <div className="text-center py-8">
                  <Share2 className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">No shares yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {shareBreakdown.map((platform) => {
                    const totalShares = shareBreakdown.reduce((sum, p) => sum + parseInt(p.totalShares), 0);
                    const percentage = (parseInt(platform.totalShares) / totalShares) * 100;
                    
                    return (
                      <div key={platform.platform}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-gray-900 dark:text-white capitalize">
                            {platform.platform}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            {formatNumber(platform.totalShares)} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${percentage}%`,
                              backgroundColor: 'rgb(var(--color-primary))',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
