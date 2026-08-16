'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StockHistoryPage({ params }) {
  const router = useRouter();
  const { productId } = params;
  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    change_type: '',
    start_date: '',
    end_date: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchProduct();
    fetchHistory();
  }, [productId, filters, pagination.page]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/inventory/${productId}`);
      const data = await response.json();
      if (data.status === 'success') {
        setProduct(data.data.product);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
    }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });

      const response = await fetch(`/api/inventory/${productId}/history?${params}`);
      const data = await response.json();

      if (data.status === 'success') {
        setHistory(data.data.history);
        setPagination({
          ...pagination,
          total: data.data.pagination.total,
          pages: data.data.pagination.pages,
        });
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChangeTypeColor = (type) => {
    switch (type) {
      case 'increase': return 'text-green-600 bg-green-100';
      case 'decrease': return 'text-red-600 bg-red-100';
      case 'update': return 'text-blue-600 bg-blue-100';
      case 'order_placed': return 'text-purple-600 bg-purple-100';
      case 'order_cancelled': return 'text-orange-600 bg-orange-100';
      case 'adjustment': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getChangeTypeLabel = (type) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/manufacturer/inventory')}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 mb-4 flex items-center"
          >
            ← Back to Inventory
          </button>
          {product && (
            <>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Stock History: {product.name}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>Current Stock: <strong className="text-gray-900 dark:text-white">{product.stock_quantity}</strong></span>
                <span>•</span>
                <span>Threshold: <strong className="text-gray-900 dark:text-white">{product.low_stock_threshold}</strong></span>
                <span>•</span>
                <span>Total Sold: <strong className="text-gray-900 dark:text-white">{product.sales_count}</strong></span>
              </div>
            </>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filters.change_type}
              onChange={(e) => setFilters({ ...filters, change_type: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="increase">Increase</option>
              <option value="decrease">Decrease</option>
              <option value="update">Update</option>
              <option value="order_placed">Order Placed</option>
              <option value="order_cancelled">Order Cancelled</option>
              <option value="adjustment">Adjustment</option>
            </select>
            
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Start Date"
            />

            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="End Date"
            />
          </div>
        </div>

        {/* History Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading history...</p>
            </div>
          ) : history.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No stock changes found
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-4">
                {history.map((log, index) => (
                  <div key={log.id} className="relative pl-8 pb-6 border-l-2 border-gray-200 dark:border-gray-600 last:border-l-0">
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-0 -ml-2 w-4 h-4 rounded-full" style={{ backgroundColor: 'rgb(var(--color-primary))' }}></div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getChangeTypeColor(log.change_type)}`}>
                          {getChangeTypeLabel(log.change_type)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(log.changed_at)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-2">
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Previous Stock</span>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {log.previous_stock}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Change</span>
                          <p className={`text-lg font-semibold ${log.quantity_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {log.quantity_change >= 0 ? '+' : ''}{log.quantity_change}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">New Stock</span>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {log.new_stock}
                          </p>
                        </div>
                      </div>
                      
                      {log.reason && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Reason: </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{log.reason}</span>
                        </div>
                      )}
                      
                      {log.notes && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 italic">
                          Note: {log.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} changes
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
