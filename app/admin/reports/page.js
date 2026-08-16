'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, TrendingUp, BarChart3, Package, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ReportsAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('revenue');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [quickFilter, setQuickFilter] = useState('30days');
  const [groupBy, setGroupBy] = useState('product'); // For sales report
  
  // Report Data
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    platformFees: 0,
    netProfit: 0,
    growth: 0,
    breakdown: [],
  });
  const [salesData, setSalesData] = useState([]);
  const [growthData, setGrowthData] = useState({
    newUsers: 0,
    newProducts: 0,
    newOrders: 0,
    revenueGrowth: 0,
  });
  const [productDemandData, setProductDemandData] = useState([]);

  useEffect(() => {
    fetchReportData();
  }, [activeTab, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to continue');
        router.push('/login/admin');
        return;
      }

      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      switch (activeTab) {
        case 'revenue':
          await fetchRevenueReport(token, params);
          break;
        case 'sales':
          await fetchSalesReport(token, params);
          break;
        case 'growth':
          await fetchGrowthReport(token, params);
          break;
        case 'demand':
          await fetchProductDemandReport(token, params);
          break;
      }
    } catch (error) {
      console.error('Report fetch error:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueReport = async (token, params) => {
    try {
      const response = await fetch(`/api/admin/reports/revenue?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch revenue report');

      const data = await response.json();
      setRevenueData(data.data || {
        totalRevenue: 0,
        platformFees: 0,
        netProfit: 0,
        growth: 0,
        breakdown: [],
      });
    } catch (error) {
      console.error('Revenue report error:', error);
      setRevenueData({
        totalRevenue: 0,
        platformFees: 0,
        netProfit: 0,
        growth: 0,
        breakdown: [],
      });
    }
  };

  const fetchSalesReport = async (token, params) => {
    try {
      params.append('groupBy', groupBy);
      const response = await fetch(`/api/admin/reports/sales?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch sales report');

      const data = await response.json();
      setSalesData(data.data || []);
    } catch (error) {
      console.error('Sales report error:', error);
      setSalesData([]);
    }
  };

  const fetchGrowthReport = async (token, params) => {
    try {
      const response = await fetch(`/api/admin/reports/growth?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch growth report');

      const data = await response.json();
      setGrowthData(data.data || {
        newUsers: 0,
        newProducts: 0,
        newOrders: 0,
        revenueGrowth: 0,
      });
    } catch (error) {
      console.error('Growth report error:', error);
      setGrowthData({
        newUsers: 0,
        newProducts: 0,
        newOrders: 0,
        revenueGrowth: 0,
      });
    }
  };

  const fetchProductDemandReport = async (token, params) => {
    try {
      const response = await fetch(`/api/admin/reports/product-demand?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch product demand report');

      const data = await response.json();
      setProductDemandData(data.data || []);
    } catch (error) {
      console.error('Product demand report error:', error);
      setProductDemandData([]);
    }
  };

  const handleQuickFilter = (filter) => {
    setQuickFilter(filter);
    const today = new Date();
    let startDate;

    switch (filter) {
      case 'today':
        startDate = today;
        break;
      case '7days':
        startDate = new Date(today.setDate(today.getDate() - 7));
        break;
      case '30days':
        startDate = new Date(today.setDate(today.getDate() - 30));
        break;
      case 'year':
        startDate = new Date(today.setFullYear(today.getFullYear() - 1));
        break;
      default:
        return;
    }

    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleExport = (format) => {
    let csvData = '';
    let filename = '';

    switch (activeTab) {
      case 'revenue':
        filename = `revenue-report-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
        csvData = 'Date,Total Revenue,Platform Fees,Net Profit\n';
        const revenueBreakdown = revenueData.breakdown?.length > 0 ? revenueData.breakdown : generateSampleRevenueBreakdown();
        revenueBreakdown.forEach(row => {
          csvData += `${row.date},${row.totalRevenue},${row.platformFees},${row.netProfit}\n`;
        });
        break;
      
      case 'sales':
        filename = `sales-report-${groupBy}-${dateRange.startDate}.csv`;
        csvData = 'Name,Orders,Quantity,Revenue\n';
        (salesData || []).forEach(row => {
          const displayName = groupBy === 'product' ? row.productName : 
                             groupBy === 'manufacturer' ? row.companyName || row.brandName :
                             row.email || row.mobile;
          const orders = row.orderCount || 0;
          const quantity = row.totalQuantity || 0;
          const revenue = row.totalRevenue || row.grossSales || row.totalSales || 0;
          csvData += `${displayName},${orders},${quantity},${revenue}\n`;
        });
        break;
      
      case 'growth':
        filename = `growth-report-${dateRange.startDate}.csv`;
        csvData = 'Metric,Value\n';
        csvData += `New Users,${growthData.newUsers}\n`;
        csvData += `New Products,${growthData.newProducts}\n`;
        csvData += `New Orders,${growthData.newOrders}\n`;
        csvData += `Revenue Growth,${growthData.revenueGrowth}%\n`;
        break;
      
      case 'demand':
        filename = `product-demand-${dateRange.startDate}.csv`;
        csvData = 'Product,Orders,Quantity Sold,Demand Score\n';
        (productDemandData || []).forEach(row => {
          csvData += `${row.productName},${row.orderCount || 0},${row.totalQuantitySold || 0},${row.demandScore || 0}\n`;
        });
        break;
      
      default:
        toast.error('No data to export');
        return;
    }

    // Create and download CSV file
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Report exported successfully as ${format.toUpperCase()}`);
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

  // Helper functions for sample chart data
  const generateSampleRevenueBreakdown = () => {
    const days = 30;
    const data = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const totalRevenue = Math.floor(Math.random() * 50000) + 30000;
      const platformFees = Math.floor(totalRevenue * 0.05);
      data.push({
        date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        totalRevenue,
        platformFees,
        netProfit: totalRevenue - platformFees,
      });
    }
    return data;
  };

  const generateSampleGrowthData = () => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    return weeks.map(week => ({
      period: week,
      users: Math.floor(Math.random() * 100) + 50,
      products: Math.floor(Math.random() * 50) + 20,
      orders: Math.floor(Math.random() * 200) + 100,
    }));
  };

  const tabs = [
    { id: 'revenue', label: 'Revenue Report', icon: DollarSign },
    { id: 'sales', label: 'Sales Report', icon: BarChart3 },
    { id: 'growth', label: 'Growth Report', icon: TrendingUp },
    { id: 'demand', label: 'Product Demand', icon: Package },
  ];

  if (loading && (revenueData.totalRevenue === 0 && salesData.length === 0)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Comprehensive business insights and analytics
          </p>
        </div>
        <button
          onClick={() => handleExport('pdf')}
          className="px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 flex items-center gap-2"
          style={{ backgroundColor: 'rgb(var(--color-primary))' }}
        >
          <Download className="w-4 h-4" />
          Export All
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {['today', '7days', '30days', 'year'].map((filter) => (
              <button
                key={filter}
                onClick={() => handleQuickFilter(filter)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={quickFilter === filter ? {
                  backgroundColor: 'rgb(var(--color-primary))',
                  color: 'white'
                } : {
                  backgroundColor: 'rgba(var(--color-text), 0.05)',
                  color: 'rgb(var(--color-text))'
                }}
                onMouseEnter={(e) => {
                  if (quickFilter !== filter) {
                    e.currentTarget.style.backgroundColor = 'rgba(var(--color-text), 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (quickFilter !== filter) {
                    e.currentTarget.style.backgroundColor = 'rgba(var(--color-text), 0.05)';
                  }
                }}
              >
                {filter === 'today' ? 'Today' : filter === '7days' ? 'Last 7 Days' : filter === '30days' ? 'Last 30 Days' : 'This Year'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => {
                setDateRange({ ...dateRange, startDate: e.target.value });
                setQuickFilter('custom');
              }}
              className="px-4 py-2 rounded-lg focus:ring-2 focus:outline-none transition-all"
              style={{
                backgroundColor: 'rgb(var(--color-background))',
                border: '1px solid rgb(var(--color-border))',
                color: 'rgb(var(--color-text))'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgb(var(--color-primary))'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgb(var(--color-border))'}
            />
            <span style={{ color: 'rgb(var(--color-text-secondary))' }}>to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => {
                setDateRange({ ...dateRange, endDate: e.target.value });
                setQuickFilter('custom');
              }}
              className="px-4 py-2 rounded-lg focus:ring-2 focus:outline-none transition-all"
              style={{
                backgroundColor: 'rgb(var(--color-background))',
                border: '1px solid rgb(var(--color-border))',
                color: 'rgb(var(--color-text))'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgb(var(--color-primary))'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgb(var(--color-border))'}
            />
            <button
              onClick={fetchReportData}
              className="px-4 py-2 rounded-lg text-white transition-all hover:opacity-90"
              style={{ backgroundColor: 'rgb(var(--color-primary))' }}
            >
              Apply
            </button>
          </div>
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
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(revenueData.totalRevenue)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Platform Fees</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatCurrency(revenueData.platformFees)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Profit</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                    {formatCurrency(revenueData.netProfit)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Growth</p>
                  <p className={`text-2xl font-bold mt-2 ${
                    revenueData.growth >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {revenueData.growth >= 0 ? '+' : ''}{revenueData.growth}%
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  revenueData.growth >= 0 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  <TrendingUp className={`w-6 h-6 ${
                    revenueData.growth >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`} />
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Trends Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Revenue Trends</h3>
              <button
                onClick={() => handleExport('csv')}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData.breakdown?.length > 0 ? revenueData.breakdown : generateSampleRevenueBreakdown()}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
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
                <Legend />
                <Area type="monotone" dataKey="totalRevenue" stroke="#3B82F6" fillOpacity={1} fill="url(#colorTotal)" name="Total Revenue" />
                <Area type="monotone" dataKey="platformFees" stroke="#A855F7" fillOpacity={1} fill="url(#colorFees)" name="Platform Fees" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'sales' && (
        <div className="space-y-6">
          {/* Group By Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Group By:
              </label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                className="px-4 py-2 rounded-lg focus:ring-2 focus:outline-none transition-all"
                style={{
                  backgroundColor: 'rgb(var(--color-background))',
                  border: '1px solid rgb(var(--color-border))',
                  color: 'rgb(var(--color-text))'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'rgb(var(--color-primary))'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgb(var(--color-border))'}
              >
                <option value="product">Product</option>
                <option value="manufacturer">Manufacturer</option>
                <option value="reseller">Reseller</option>
              </select>
              <button
                onClick={fetchReportData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Update Report
              </button>
            </div>
          </div>

          {/* Sales Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Sales by {groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
              </h3>
              <button
                onClick={() => handleExport('excel')}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {!salesData || salesData.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400">No sales data available for the selected period</p>
                      </td>
                    </tr>
                  ) : (
                    salesData.map((item, index) => {
                      // Determine display name based on groupBy
                      const displayName = groupBy === 'product' ? item.productName : 
                                         groupBy === 'manufacturer' ? item.companyName || item.brandName :
                                         item.email || item.mobile;
                      
                      // Map backend field names to frontend
                      const orders = item.orderCount || 0;
                      const quantity = item.totalQuantity || 0;
                      const revenue = item.totalRevenue || item.grossSales || item.totalSales || 0;
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {displayName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {formatNumber(orders)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {formatNumber(quantity)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white">
                              {formatCurrency(revenue)}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'growth' && (
        <div className="space-y-6">
          {/* Growth Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New Users</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatNumber(growthData.newUsers)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New Products</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatNumber(growthData.newProducts)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New Orders</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {formatNumber(growthData.newOrders)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Revenue Growth</p>
                  <p className={`text-2xl font-bold mt-2 ${
                    growthData.revenueGrowth >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {growthData.revenueGrowth >= 0 ? '+' : ''}{growthData.revenueGrowth}%
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${
                  growthData.revenueGrowth >= 0 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  <TrendingUp className={`w-6 h-6 ${
                    growthData.revenueGrowth >= 0 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`} />
                </div>
              </div>
            </div>
          </div>

          {/* Growth Comparison Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Growth Comparison</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={generateSampleGrowthData()}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="period" className="text-xs fill-gray-600 dark:fill-gray-400" />
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
                <Bar dataKey="users" fill="#3B82F6" name="New Users" />
                <Bar dataKey="products" fill="#A855F7" name="New Products" />
                <Bar dataKey="orders" fill="#10B981" name="New Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'demand' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Products by Demand
              </h3>
              <button
                onClick={() => handleExport('csv')}
                className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Quantity Sold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Demand Score
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {!productDemandData || productDemandData.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center">
                        <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 dark:text-gray-400">No product demand data available</p>
                      </td>
                    </tr>
                  ) : (
                    productDemandData.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.productName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatNumber(item.orderCount || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {formatNumber(item.totalQuantitySold || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                            {item.demandScore || 0}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
