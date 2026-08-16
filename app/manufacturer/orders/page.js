'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Package, 
  Search, 
  Filter, 
  Download,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import OrdersTable from '@/components/manufacturer/orders/OrdersTable';
import OrderFilters from '@/components/manufacturer/orders/OrderFilters';
import { setOrders, setPagination, setLoading, setError, updateFilters } from '@/store/slices/orderSlice';

export default function OrdersPage() {
  const dispatch = useDispatch();
  const { orders, filters, pagination, loading } = useSelector((state) => state.order);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [filters, pagination.page]);

  const fetchOrders = async () => {
    try {
      dispatch(setLoading(true));
      
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      });

      const response = await fetch(`/api/orders?${queryParams}`, {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.status === 'success') {
        dispatch(setOrders(data.data.orders));
        dispatch(setPagination(data.data.pagination));
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Fetch orders error:', error);
      dispatch(setError(error.message));
      toast.error(error.message || 'Failed to load orders');
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleFilterChange = (newFilters) => {
    dispatch(updateFilters(newFilters));
    dispatch(setPagination({ page: 1 })); // Reset to first page when filters change
  };

  const handlePageChange = (newPage) => {
    dispatch(setPagination({ page: newPage }));
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.success('Export feature coming soon!');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
      {/* Header */}
      <header className="border-b sticky top-0 z-10" style={{ 
        backgroundColor: 'rgb(var(--color-background))',
        borderColor: 'rgb(var(--color-border))'
      }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
                Orders Management
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                Manage and fulfill your orders
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn btn-outline btn-sm"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              <button
                onClick={handleExport}
                className="btn btn-outline btn-sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {/* Filters */}
        {showFilters && (
          <OrderFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            onRefresh={fetchOrders}
          />
        )}

        {/* Orders Table */}
        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
              <p className="text-sm text-gray-500">
                {filters.status !== 'all' || filters.search
                  ? 'Try adjusting your filters'
                  : 'Your orders will appear here'}
              </p>
            </div>
          ) : (
            <>
              <OrdersTable orders={orders} onRefresh={fetchOrders} />
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="border-t px-6 py-4" style={{ borderColor: 'rgb(var(--color-border))' }}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} orders
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="btn btn-outline btn-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </button>
                      <span className="text-sm font-medium px-3">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="btn btn-outline btn-sm"
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
