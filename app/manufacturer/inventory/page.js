'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Edit, History } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function InventoryPage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    low_stock_only: false,
    sort_by: 'name',
    sort_order: 'asc',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalType, setModalType] = useState(null); // 'increase', 'decrease', 'update', 'threshold'
  const [modalData, setModalData] = useState({ quantity: '', reason: '', notes: '' });

  useEffect(() => {
    fetchInventory();
  }, [filters, pagination.page]);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });

      const response = await fetch(`/api/inventory?${params}`);
      const data = await response.json();

      if (data.status === 'success') {
        setProducts(data.data.products);
        setPagination({
          ...pagination,
          total: data.data.pagination.total,
          pages: data.data.pagination.pages,
        });
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStockAction = async () => {
    if (!selectedProduct || !modalType) return;

    try {
      const endpoint = `/api/inventory/${selectedProduct.id}/${modalType}`;
      const body = modalType === 'threshold' 
        ? { threshold: parseInt(modalData.quantity) }
        : { quantity: parseInt(modalData.quantity), reason: modalData.reason, notes: modalData.notes };

      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.status === 'success') {
        closeModal();
        fetchInventory();
        toast.success('Stock updated successfully');
      } else {
        toast.error(data.message || 'Failed to update stock');
      }
    } catch (error) {
      console.error('Stock action error:', error);
      toast.error('Failed to update stock');
    }
  };

  const openModal = (product, type) => {
    setSelectedProduct(product);
    setModalType(type);
    setModalData({ quantity: '', reason: '', notes: '' });
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setModalType(null);
    setModalData({ quantity: '', reason: '', notes: '' });
  };

  const getStockStatusColor = (status) => {
    switch (status) {
      case 'in_stock': return 'text-green-600 bg-green-100';
      case 'low_stock': return 'text-yellow-600 bg-yellow-100';
      case 'out_of_stock': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStockStatusLabel = (status) => {
    switch (status) {
      case 'in_stock': return 'In Stock';
      case 'low_stock': return 'Low Stock';
      case 'out_of_stock': return 'Out of Stock';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
            Inventory Management
          </h1>
          <p style={{ color: 'rgb(var(--color-text-secondary))' }}>
            Manage your product stock levels and track inventory changes
          </p>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input"
            />
            
            <select
              value={filters.sort_by}
              onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
              className="input"
            >
              <option value="name">Sort by Name</option>
              <option value="stock_quantity">Sort by Stock</option>
              <option value="sales_count">Sort by Sales</option>
              <option value="created_at">Sort by Date</option>
            </select>

            <select
              value={filters.sort_order}
              onChange={(e) => setFilters({ ...filters, sort_order: e.target.value })}
              className="input"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>

            <label className="flex items-center space-x-2 px-4 py-2 rounded-lg cursor-pointer" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
              <input
                type="checkbox"
                checked={filters.low_stock_only}
                onChange={(e) => setFilters({ ...filters, low_stock_only: e.target.checked })}
                className="w-4 h-4 rounded"
                style={{ accentColor: 'rgb(var(--color-primary))' }}
              />
              <span className="text-sm" style={{ color: 'rgb(var(--color-text))' }}>Low Stock Only</span>
            </label>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: 'rgb(var(--color-primary))' }}></div>
              <p className="mt-4" style={{ color: 'rgb(var(--color-text-secondary))' }}>Loading inventory...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center" style={{ color: 'rgb(var(--color-text-secondary))' }}>
              No products found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Sold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Threshold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: 'rgb(var(--color-border))' }}>
                  {products.map((product) => (
                    <tr key={product.id} className="transition-colors hover:opacity-90">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {product.images?.[0] && (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover mr-3"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium" style={{ color: 'rgb(var(--color-text))' }}>
                              {product.name}
                            </div>
                            <div className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                              SKU: {product.sku || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStockStatusColor(product.stockStatus)}`}>
                          {getStockStatusLabel(product.stockStatus)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'rgb(var(--color-text))' }}>
                        {product.availableStock}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'rgb(var(--color-text))' }}>
                        {product.soldStock}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: 'rgb(var(--color-text))' }}>
                        {product.low_stock_threshold}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal(product, 'increase')}
                            className="p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                            style={{ color: 'rgb(var(--color-success))', backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
                            title="Add Stock"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal(product, 'decrease')}
                            className="p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                            style={{ color: 'rgb(var(--color-danger))', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
                            title="Remove Stock"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal(product, 'update')}
                            className="p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                            style={{ color: 'rgb(var(--color-primary))', backgroundColor: 'rgba(var(--color-primary), 0.1)' }}
                            title="Update Stock"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => router.push(`/manufacturer/inventory/${product.id}/history`)}
                            className="p-2 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                            style={{ color: 'rgb(var(--color-text-secondary))', backgroundColor: 'rgba(var(--color-text-secondary), 0.1)' }}
                            title="View History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: 'rgb(var(--color-border))' }}>
              <div className="text-sm" style={{ color: 'rgb(var(--color-text))' }}>
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} products
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="btn btn-outline btn-sm"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.pages}
                  className="btn btn-outline btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stock Action Modal */}
      {modalType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="card p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--color-text))' }}>
              {modalType === 'increase' && 'Increase Stock'}
              {modalType === 'decrease' && 'Decrease Stock'}
              {modalType === 'update' && 'Update Stock'}
              {modalType === 'threshold' && 'Update Threshold'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                  {modalType === 'threshold' ? 'New Threshold' : 'Quantity'}
                </label>
                <input
                  type="number"
                  min="1"
                  value={modalData.quantity}
                  onChange={(e) => setModalData({ ...modalData, quantity: e.target.value })}
                  className="input"
                />
              </div>
              {modalType !== 'threshold' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                      Reason
                    </label>
                    <input
                      type="text"
                      value={modalData.reason}
                      onChange={(e) => setModalData({ ...modalData, reason: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                      Notes (Optional)
                    </label>
                    <textarea
                      value={modalData.notes}
                      onChange={(e) => setModalData({ ...modalData, notes: e.target.value })}
                      rows="3"
                      className="input"
                    />
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeModal}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleStockAction}
                disabled={!modalData.quantity}
                className="btn btn-primary"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
