'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Eye, Package } from 'lucide-react';
import api from '@/lib/api';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from 'react-hot-toast';

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  
  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    onConfirm: null
  });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/products', { params: filters });
      setProducts(response.data.data.products);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Delete Product',
      message: 'Are you sure you want to delete this product? This action cannot be undone.',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          await api.delete(`/api/products/${id}`);
          toast.success('Product deleted successfully');
          fetchProducts(); // Refresh list
        } catch (error) {
          console.error('Failed to delete product:', error);
          toast.error('Failed to delete product');
        }
      }
    });
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || ''}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>Products</h1>
            <p className="mt-2 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
              Manage your product catalog
            </p>
          </div>
          <button
            onClick={() => router.push('/manufacturer/products/add')}
            className="btn btn-primary"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                placeholder="Search products..."
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                className="input"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'rgb(var(--color-primary))' }}></div>
            <p className="mt-4" style={{ color: 'rgb(var(--color-text-secondary))' }}>Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="card p-12 text-center">
            <Package size={64} className="mx-auto mb-4" style={{ color: 'rgb(var(--color-text-secondary))' }} />
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
              No products found
            </h3>
            <p className="mb-6" style={{ color: 'rgb(var(--color-text-secondary))' }}>
              Start by adding your first product to the catalog
            </p>
            <button
              onClick={() => router.push('/manufacturer/products/add')}
              className="btn btn-primary btn-lg"
            >
              <Plus size={20} />
              Add Your First Product
            </button>
          </div>
        ) : (
          <>
            <div className="card overflow-hidden">
              <table className="min-w-full divide-y" style={{ borderColor: 'rgb(var(--color-border))' }}>
                <thead style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'rgb(var(--color-border))' }}>
                  {products.map((product) => (
                    <tr key={product.id} className="transition-colors hover:opacity-90" style={{ backgroundColor: 'rgb(var(--color-background))' }}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            {product.images && product.images.length > 0 ? (
                              <img
                                src={product.images.find(img => img.isPrimary)?.imageUrl || product.images[0]?.imageUrl}
                                alt={product.name}
                                className="h-12 w-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="h-12 w-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
                                <Package size={24} style={{ color: 'rgb(var(--color-text-secondary))' }} />
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium" style={{ color: 'rgb(var(--color-text))' }}>
                              {product.name}
                            </div>
                            <div className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                              {product.category?.name || 'Uncategorized'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm" style={{ color: 'rgb(var(--color-text))' }}>
                          {product.sku || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm" style={{ color: 'rgb(var(--color-text))' }}>
                          ₹{product.costPrice ? parseFloat(product.costPrice).toFixed(2) : '0.00'}
                        </div>
                        <div className="text-xs" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                          Sell: ₹{product.sellingPrice ? parseFloat(product.sellingPrice).toFixed(2) : '0.00'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm" style={{ color: 'rgb(var(--color-text))' }}>
                          {product.stockQuantity !== null && product.stockQuantity !== undefined ? product.stockQuantity : 0}
                        </div>
                        {(product.stockQuantity !== null && product.stockQuantity !== undefined) && 
                         product.stockQuantity <= (product.lowStockThreshold || 10) && (
                          <div className="text-xs" style={{ color: 'rgb(var(--color-danger))' }}>
                            Low Stock
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(product.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/manufacturer/products/${product.id}`)}
                            className="p-2 rounded transition-colors hover:opacity-70"
                            style={{ color: 'rgb(var(--color-primary))' }}
                            title="View"
                          >
                            <Eye size={18} />
                          </button>
                          {product.status === 'draft' && (
                            <button
                              onClick={() => router.push(`/manufacturer/products/add?id=${product.id}`)}
                              className="p-2 rounded transition-colors hover:opacity-70"
                              style={{ color: 'rgb(var(--color-text-secondary))' }}
                              title="Edit"
                            >
                              <Edit size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-2 rounded transition-colors hover:opacity-70"
                            style={{ color: 'rgb(var(--color-danger))' }}
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm" style={{ color: 'rgb(var(--color-text))' }}>
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="btn btn-outline btn-sm"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page >= pagination.totalPages}
                    className="btn btn-outline btn-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
