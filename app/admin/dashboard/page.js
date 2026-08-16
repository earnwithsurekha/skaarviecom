'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, TrendingUp, Package, ShoppingCart, Users, Store, 
  UserCheck, Clock, AlertCircle, CreditCard, Wallet, ArrowUpRight,
  ArrowDownRight, Activity, Target
} from 'lucide-react';
import toast from 'react-hot-toast';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DashboardSkeleton } from '@/components/SkeletonLoader';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30days');
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    businessOverview: {},
    financialOverview: {},
    growthMetrics: {},
    recentOrders: [],
    topProducts: [],
    statusDistribution: {},
  });

  useEffect(() => {
    fetchDashboardData();
  }, [timeframe]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to continue');
        router.push('/login/admin');
        return;
      }

      const response = await fetch(`/api/admin/dashboard/overview?timeframe=${timeframe}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Dashboard API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Dashboard API error:', errorData);
        throw new Error(errorData.message || 'Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data.data);
    } catch (error) {
      console.error('Dashboard error:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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

  // Business Overview Cards
  const businessCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(dashboardData.businessOverview?.totalRevenue),
      icon: DollarSign,
      color: 'blue',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(dashboardData.businessOverview?.todaysRevenue),
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(dashboardData.businessOverview?.monthlyRevenue),
      icon: Activity,
      color: 'purple',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Total Orders',
      value: formatNumber(dashboardData.businessOverview?.totalOrders),
      icon: ShoppingCart,
      color: 'orange',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
    },
    {
      title: 'Total Products',
      value: formatNumber(dashboardData.businessOverview?.totalProducts),
      icon: Package,
      color: 'pink',
      bgColor: 'bg-pink-100 dark:bg-pink-900/20',
      iconColor: 'text-pink-600 dark:text-pink-400',
    },
    {
      title: 'Total Manufacturers',
      value: formatNumber(dashboardData.businessOverview?.totalManufacturers),
      icon: Store,
      color: 'indigo',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      title: 'Total Resellers',
      value: formatNumber(dashboardData.businessOverview?.totalResellers),
      icon: Users,
      color: 'cyan',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
      iconColor: 'text-cyan-600 dark:text-cyan-400',
    },
    {
      title: 'Total Customers',
      value: formatNumber(dashboardData.businessOverview?.totalCustomers),
      icon: UserCheck,
      color: 'teal',
      bgColor: 'bg-teal-100 dark:bg-teal-900/20',
      iconColor: 'text-teal-600 dark:text-teal-400',
    },
  ];

  // Financial Overview Cards
  const financialCards = [
    {
      title: 'Skaarvi Margin Earned',
      value: formatCurrency(dashboardData.financialOverview?.skaarviMarginEarned),
      icon: Target,
      color: 'green',
      trend: 'up',
    },
    {
      title: 'Platform Fees Earned',
      value: formatCurrency(dashboardData.financialOverview?.platformFeesEarned),
      icon: CreditCard,
      color: 'blue',
      trend: 'up',
    },
    {
      title: 'Pending Settlements',
      value: formatCurrency(dashboardData.financialOverview?.pendingSettlements),
      icon: Clock,
      color: 'yellow',
    },
    {
      title: 'Pending Withdrawals',
      value: formatCurrency(dashboardData.financialOverview?.pendingWithdrawals),
      icon: Wallet,
      color: 'orange',
    },
    {
      title: 'Payment Gateway Charges',
      value: formatCurrency(dashboardData.financialOverview?.paymentGatewayCharges),
      icon: AlertCircle,
      color: 'red',
      trend: 'down',
    },
    {
      title: 'Net Profit',
      value: formatCurrency(dashboardData.financialOverview?.netProfit),
      icon: DollarSign,
      color: 'emerald',
      highlight: true,
    },
  ];

  // Growth Metrics
  const growthCards = [
    {
      title: 'New Resellers',
      value: formatNumber(dashboardData.growthMetrics?.newResellers),
      icon: Users,
      change: '+12%',
      trend: 'up',
    },
    {
      title: 'New Manufacturers',
      value: formatNumber(dashboardData.growthMetrics?.newManufacturers),
      icon: Store,
      change: '+8%',
      trend: 'up',
    },
    {
      title: 'New Products',
      value: formatNumber(dashboardData.growthMetrics?.newProducts),
      icon: Package,
      change: '+24%',
      trend: 'up',
    },
    {
      title: 'New Orders',
      value: formatNumber(dashboardData.growthMetrics?.newOrders),
      icon: ShoppingCart,
      change: '+15%',
      trend: 'up',
    },
  ];

  // Helper functions for sample chart data
  const generateSampleRevenueData = () => {
    const days = 30;
    const data = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        revenue: Math.floor(Math.random() * 50000) + 30000,
      });
    }
    return data;
  };

  const generateSamplePerformanceData = () => {
    const days = 14;
    const data = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        orders: Math.floor(Math.random() * 50) + 20,
        revenue: Math.floor(Math.random() * 5000) + 3000,
        customers: Math.floor(Math.random() * 15) + 5,
      });
    }
    return data;
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'financial', label: 'Financial', icon: DollarSign },
    { id: 'activity', label: 'Recent Activity', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Complete platform overview and financial metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 rounded-lg focus:ring-2 focus:outline-none transition-all"
            style={{
              backgroundColor: 'rgb(var(--color-background))',
              border: '1px solid rgb(var(--color-border))',
              color: 'rgb(var(--color-text))'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'rgb(var(--color-primary))'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'rgb(var(--color-border))'}
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-lg shadow-sm" style={{ 
        backgroundColor: 'rgb(var(--color-background))',
        border: '1px solid rgb(var(--color-border))'
      }}>
        <div className="flex p-1 gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md font-medium text-sm transition-all"
                style={activeTab === tab.id ? {
                  backgroundColor: 'rgba(var(--color-primary), 0.1)',
                  color: 'rgb(var(--color-primary))',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                } : {
                  color: 'rgb(var(--color-text-secondary))'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = 'rgba(var(--color-primary), 0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== tab.id) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Business Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {businessCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {card.title}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                          {card.value}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${card.bgColor}`}>
                        <Icon className={`w-6 h-6 ${card.iconColor}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Growth Metrics */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Growth Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {growthCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {card.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {card.value}
                          </span>
                          {card.trend === 'up' && (
                            <span className="text-sm text-green-600 dark:text-green-400 flex items-center">
                              <ArrowUpRight className="w-3 h-3" />
                              {card.change}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/admin/manufacturers')}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-6 text-left transition-colors"
              >
                <Store className="w-8 h-8 mb-2" />
                <p className="font-semibold">Manage Manufacturers</p>
                <p className="text-sm text-blue-100 mt-1">
                  {dashboardData.statusDistribution?.pendingManufacturers || 0} pending approval
                </p>
              </button>
              <button
                onClick={() => router.push('/admin/products')}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg p-6 text-left transition-colors"
              >
                <Package className="w-8 h-8 mb-2" />
                <p className="font-semibold">Manage Products</p>
                <p className="text-sm text-purple-100 mt-1">
                  {dashboardData.statusDistribution?.pendingProducts || 0} pending approval
                </p>
              </button>
              <button
                onClick={() => router.push('/admin/orders')}
                className="bg-green-600 hover:bg-green-700 text-white rounded-lg p-6 text-left transition-colors"
              >
                <ShoppingCart className="w-8 h-8 mb-2" />
                <p className="font-semibold">Manage Orders</p>
                <p className="text-sm text-green-100 mt-1">
                  {dashboardData.statusDistribution?.processingOrders || 0} processing
                </p>
              </button>
              <button
                onClick={() => router.push('/admin/settings')}
                className="bg-gray-600 hover:bg-gray-700 text-white rounded-lg p-6 text-left transition-colors"
              >
                <Activity className="w-8 h-8 mb-2" />
                <p className="font-semibold">Settings</p>
                <p className="text-sm text-gray-100 mt-1">Platform configuration</p>
              </button>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'financial' && (
        <section className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Financial Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {financialCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border ${
                      card.highlight
                        ? 'border-green-500 dark:border-green-600 ring-2 ring-green-200 dark:ring-green-900/50'
                        : 'border-gray-200 dark:border-gray-700'
                    } p-6 hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {card.title}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                          {card.value}
                        </p>
                      </div>
                      <Icon className={`w-6 h-6 text-${card.color}-600 dark:text-${card.color}-400`} />
                    </div>
                    {card.trend && (
                      <div className="mt-4 flex items-center">
                        {card.trend === 'up' ? (
                          <ArrowUpRight className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                        <span className={`text-sm ml-1 ${
                          card.trend === 'up' 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          Revenue component
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue Breakdown Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Revenue Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboardData.revenueBreakdown || generateSampleRevenueData()}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="date" className="text-xs fill-gray-600 dark:fill-gray-400" />
                <YAxis className="text-xs fill-gray-600 dark:fill-gray-400" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                  formatter={(value) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

    {activeTab === 'activity' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Orders
            </h2>
          </div>
          <div className="p-6">
            {dashboardData.recentOrders?.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No recent orders
              </p>
            ) : (
              <div className="space-y-4">
                {dashboardData.recentOrders?.slice(0, 5).map((order) => (
                  <div
                    key={order.orderId}
                    className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => router.push(`/admin/orders/${order.orderId}`)}
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        #{order.orderNumber}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {order.customerName} • {new Date(order.orderedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        order.orderStatus === 'delivered' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : order.orderStatus === 'cancelled'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Top Products */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Top Performing Products
            </h2>
          </div>
          <div className="p-6">
            {dashboardData.topProducts?.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No products sold yet
              </p>
            ) : (
              <div className="space-y-4">
                {dashboardData.topProducts?.map((product, index) => (
                  <div
                    key={product.productId}
                    className="flex items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {product.productName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {product.totalSold} units sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(product.revenue)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {product.orderCount} orders
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    )}

    {activeTab === 'analytics' && (
        <section className="space-y-6">
          {/* Growth Metrics */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Growth Metrics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {growthCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.title}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {card.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">
                            {card.value}
                          </span>
                          {card.trend === 'up' && (
                            <span className="text-sm text-green-600 dark:text-green-400 flex items-center">
                              <ArrowUpRight className="w-3 h-3" />
                              {card.change}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Performance Charts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Performance Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData.performanceData || generateSamplePerformanceData()}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="date" className="text-xs fill-gray-600 dark:fill-gray-400" />
                <YAxis className="text-xs fill-gray-600 dark:fill-gray-400" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(17, 24, 39, 0.9)', 
                    border: 'none', 
                    borderRadius: '8px',
                    color: '#fff'
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={2} name="Orders" />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} name="Revenue (₹)" />
                <Line type="monotone" dataKey="customers" stroke="#F59E0B" strokeWidth={2} name="New Customers" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Status Distribution
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
                  Manufacturers
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                      {dashboardData.statusDistribution?.pendingManufacturers || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Approved</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {dashboardData.statusDistribution?.approvedManufacturers || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
                  Products
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Pending</span>
                    <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                      {dashboardData.statusDistribution?.pendingProducts || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Approved</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {dashboardData.statusDistribution?.approvedProducts || 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
                  Orders
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Processing</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {dashboardData.statusDistribution?.processingOrders || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Delivered</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {dashboardData.statusDistribution?.deliveredOrders || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
    )}
    </div>
  );
}
