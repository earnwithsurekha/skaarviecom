'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSalesReport, fetchProductReport, fetchResellerDemandReport } from '@/store/slices/reportsSlice';
import { BarChart3, TrendingUp, Users, Loader2 } from 'lucide-react';

export default function ReportsPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { salesReport, productReport, resellerDemand, loading } = useSelector((state) => state.reports);
  const [activeTab, setActiveTab] = useState('sales');

  useEffect(() => {
    // Fetch initial data
    dispatch(fetchSalesReport({ period: 'daily' }));
    dispatch(fetchProductReport({ type: 'best', limit: 10 }));
    dispatch(fetchResellerDemandReport({ limit: 10 }));
  }, [dispatch]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const tabs = [
    { id: 'sales', label: 'Sales Reports', icon: BarChart3 },
    { id: 'products', label: 'Product Reports', icon: TrendingUp },
    { id: 'demand', label: 'Reseller Demand', icon: Users },
  ];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
            Analytics & Reports
          </h1>
          <p style={{ color: 'rgb(var(--color-text-secondary))' }}>
            Insights into your sales, products, and reseller engagement
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          {loading.sales && activeTab === 'sales' && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          )}

          {/* Sales Reports Tab */}
          {activeTab === 'sales' && !loading.sales && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Sales Trend</h3>
              {salesReport.sales && salesReport.sales.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Orders</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Products Sold</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Revenue</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Net Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {salesReport.sales.map((sale, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{new Date(sale.date).toLocaleDateString()}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{sale.ordersCount}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{sale.productsSold}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{formatCurrency(sale.revenue)}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(sale.netRevenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No sales data available</p>
              )}
            </div>
          )}

          {/* Product Reports Tab */}
          {activeTab === 'products' && !loading.products && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Best Selling Products</h3>
              {productReport.products && productReport.products.length > 0 ? (
                <div className="grid gap-4">
                  {productReport.products.map((product, index) => (
                    <div key={product.productId} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-gray-400">#{index + 1}</div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{product.productName}</p>
                          {product.productSku && <p className="text-sm text-gray-500 dark:text-gray-400">SKU: {product.productSku}</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900 dark:text-white">{product.quantitySold} units sold</p>
                        <p className="text-sm text-green-600 dark:text-green-400">{formatCurrency(product.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No product data available</p>
              )}
            </div>
          )}

          {/* Reseller Demand Tab */}
          {activeTab === 'demand' && !loading.demand && (
            <div className="space-y-8">
              {/* Most Saved Products */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Most Saved Products</h3>
                {resellerDemand.mostSaved && resellerDemand.mostSaved.length > 0 ? (
                  <div className="grid gap-3">
                    {resellerDemand.mostSaved.map((product) => (
                      <div key={product.productId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{product.productName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{product.savesCount} saves</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-900 dark:text-white">{product.quantitySold} sold</p>
                          <p className="text-xs text-green-600 dark:text-green-400">{product.conversionRate}% conversion</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">No data available</p>
                )}
              </div>

              {/* Most Shared Products */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Most Shared Products</h3>
                {resellerDemand.mostShared && resellerDemand.mostShared.length > 0 ? (
                  <div className="grid gap-3">
                    {resellerDemand.mostShared.map((product) => (
                      <div key={product.productId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{product.productName}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{product.sharesCount} shares</p>
                        </div>
                        <div className="text-sm text-gray-900 dark:text-white">{product.quantitySold} sold</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">No data available</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
