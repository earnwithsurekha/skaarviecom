'use client';

import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, DollarSign, Trash2, Star } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import { toast } from 'react-hot-toast';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending_approval'); // Default to pending approval
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [pricingForm, setPricingForm] = useState({
    skaarviMargin: 0,
    resellerMargin: 0
  });
  const [saving, setSaving] = useState(false);
  
  // Confirm modal states
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    message: '',
    showInput: false,
    inputValue: '',
    inputLabel: '',
    onConfirm: null
  });

  useEffect(() => {
    fetchProducts();
  }, [pagination.currentPage, statusFilter, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter })
      });

      const response = await fetch(`/api/admin/products?${params}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.status === 'success') {
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPricing = (product) => {
    setSelectedProduct(product);
    setPricingForm({
      skaarviMargin: parseFloat(product.skaarvi_margin) || parseFloat(product.skaarviMargin) || 0,
      resellerMargin: parseFloat(product.reseller_margin) || parseFloat(product.resellerMargin) || 0
    });
    setShowPricingModal(true);
  };

  const handleSavePricing = async () => {
    if (!selectedProduct) return;

    // Validation
    const skaarviMargin = parseFloat(pricingForm.skaarviMargin) || 0;
    const resellerMargin = parseFloat(pricingForm.resellerMargin) || 0;

    if (skaarviMargin < 0 || resellerMargin < 0) {
      toast.error('Margins cannot be negative');
      return;
    }

    try {
      setSaving(true);
      
      const pricingData = {
        skaarviMargin,
        resellerMargin
      };
      
      const response = await fetch(`/api/admin/products/${selectedProduct.id}/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(pricingData)
      });

      const data = await response.json();

      if (data.status === 'success') {
        setShowPricingModal(false);
        fetchProducts(); // Refresh list
        toast.success('Pricing updated successfully!');
      } else {
        toast.error(data.message || 'Failed to update pricing');
      }
    } catch (error) {
      console.error('Update pricing error:', error);
      toast.error('Failed to update pricing');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (productId) => {
    const product = products.find(p => p.id === productId);
    const isReapproval = product?.status === 'rejected';
    
    setConfirmModal({
      isOpen: true,
      type: 'success',
      title: isReapproval ? 'Reapprove Product' : 'Approve Product',
      message: isReapproval 
        ? 'Are you sure you want to reapprove this previously rejected product? It will be visible to all resellers.'
        : 'Are you sure you want to approve this product? It will be visible to all resellers.',
      showInput: false,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          const response = await fetch(`/api/admin/products/${productId}/approve`, {
            method: 'PATCH',
            credentials: 'include'
          });

          const data = await response.json();
          if (data.status === 'success') {
            fetchProducts();
            toast.success(isReapproval ? 'Product reapproved successfully!' : 'Product approved successfully!');
          } else {
            toast.error(data.message || 'Failed to approve product');
          }
        } catch (error) {
          console.error('Approve error:', error);
          toast.error('Failed to approve product');
        }
      }
    });
  };

  const handleReject = async (productId) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Reject Product',
      message: 'Please provide a reason for rejecting this product:',
      showInput: true,
      inputValue: '',
      inputLabel: 'Rejection Reason',
      inputRequired: true,
      onConfirm: async () => {
        const reason = confirmModal.inputValue;
        setConfirmModal({ ...confirmModal, isOpen: false });
        
        try {
          const response = await fetch(`/api/admin/products/${productId}/reject`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ reason })
          });

          const data = await response.json();
          if (data.status === 'success') {
            fetchProducts();
            toast.success('Product rejected successfully');
          } else {
            toast.error(data.message || 'Failed to reject product');
          }
        } catch (error) {
          console.error('Reject error:', error);
          toast.error('Failed to reject product');
        }
      }
    });
  };

  const handleDelete = async (productId, productName) => {
    setConfirmModal({
      isOpen: true,
      type: 'danger',
      title: 'Delete Product',
      message: `Are you sure you want to delete "${productName}"? This action cannot be undone. Products with existing orders cannot be deleted.`,
      showInput: false,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        
        try {
          const response = await fetch(`/api/admin/products/${productId}/delete`, {
            method: 'DELETE',
            credentials: 'include'
          });

          const data = await response.json();
          if (data.status === 'success') {
            fetchProducts();
            toast.success('Product deleted successfully');
          } else {
            toast.error(data.message || 'Failed to delete product');
          }
        } catch (error) {
          console.error('Delete error:', error);
          toast.error('Failed to delete product');
        }
      }
    });
  };

  const handleToggleFeatured = async (productId, productName, currentStatus) => {
    const newStatus = !currentStatus;
    
    try {
      const response = await fetch(`/api/admin/products/${productId}/featured`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isFeatured: newStatus })
      });

      const data = await response.json();
      if (data.status === 'success') {
        fetchProducts();
        toast.success(`Product ${newStatus ? 'featured' : 'unfeatured'} successfully`);
      } else {
        toast.error(data.message || 'Failed to update featured status');
      }
    } catch (error) {
      console.error('Toggle featured error:', error);
      toast.error('Failed to update featured status');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusBadge = (status) => {
    const styles = {
      approved: 'bg-green-100 text-green-800',
      pending_approval: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800',
      inactive: 'bg-gray-100 text-gray-600'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || styles.draft}`}>
        {status?.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const calculatePlatformFee = () => {
    return 5; // Fixed ₹5 platform fee
  };

  const calculateFinalPrice = (costPrice, skaarviMargin, resellerMargin) => {
    const cost = parseFloat(costPrice) || 0;
    const skaarvi = parseFloat(skaarviMargin) || 0;
    const reseller = parseFloat(resellerMargin) || 0;
    const platformFee = calculatePlatformFee();
    return cost + skaarvi + reseller + platformFee;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>Product Management</h1>
        <p className="mt-2" style={{ color: 'rgb(var(--color-text-secondary))' }}>
          Manage product pricing margins and approvals across the platform.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'rgb(var(--color-text-secondary))' }} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
              className="input w-full pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination(prev => ({ ...prev, currentPage: 1 }));
            }}
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

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'rgb(var(--color-surface))', borderBottom: '1px solid rgb(var(--color-border))' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  Manufacturer
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  Cost Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  Skaarvi Margin
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  Reseller Margin
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  Selling Price
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'rgb(var(--color-primary))' }}></div>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                    No products found
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="transition-colors" style={{ borderTop: '1px solid rgb(var(--color-border))' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(var(--color-surface))'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.images?.[0] && (
                          <img
                            src={product.images[0].imageUrl}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium" style={{ color: 'rgb(var(--color-text))' }}>{product.name}</div>
                            {product.isFeatured && (
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" title="Featured Product" />
                            )}
                          </div>
                          <div className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>{product.sku || 'No SKU'}</div>
                          {product.status === 'rejected' && product.rejectionReason && (
                            <div className="mt-1 text-xs text-red-600 italic">
                              Rejected: {product.rejectionReason}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'rgb(var(--color-text))' }}>
                      {product.category?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm" style={{ color: 'rgb(var(--color-text))' }}>
                      {product.manufacturer?.companyName || product.manufacturer?.brandName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right font-medium" style={{ color: 'rgb(var(--color-text))' }}>
                      {formatCurrency(product.costPrice)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-blue-600">
                      {formatCurrency(product.skaarviMargin)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                      {formatCurrency(product.resellerMargin)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold" style={{ color: 'rgb(var(--color-primary))' }}>
                      {formatCurrency(product.sellingPrice)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getStatusBadge(product.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditPricing(product)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit Pricing"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        {/* Show approve button for pending and rejected products */}
                        {(product.status === 'pending_approval' || product.status === 'rejected') && (
                          <button
                            onClick={() => handleApprove(product.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title={product.status === 'rejected' ? 'Reapprove Product' : 'Approve Product'}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {/* Show reject button for pending and approved products */}
                        {(product.status === 'pending_approval' || product.status === 'approved') && (
                          <button
                            onClick={() => handleReject(product.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Reject Product"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {/* Featured toggle for approved products */}
                        {product.status === 'approved' && (
                          <button
                            onClick={() => handleToggleFeatured(product.id, product.name, product.isFeatured)}
                            className={`p-2 rounded-lg transition-colors ${
                              product.isFeatured 
                                ? 'text-yellow-600 hover:bg-yellow-50' 
                                : 'text-gray-400 hover:bg-gray-50'
                            }`}
                            title={product.isFeatured ? 'Remove from Featured' : 'Make Featured'}
                          >
                            <Star className={`w-4 h-4 ${product.isFeatured ? 'fill-yellow-600' : ''}`} />
                          </button>
                        )}
                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {products.length} of {pagination.totalItems} products
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                disabled={pagination.currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Modal */}
      {showPricingModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">Edit Product Pricing</h2>
              <p className="mt-1 text-sm text-gray-600">{selectedProduct.name}</p>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Manufacturer Cost Price (Read-only) */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manufacturer Cost Price (Read-only)
                </label>
                <input
                  type="text"
                  value={formatCurrency(selectedProduct.costPrice || selectedProduct.cost_price)}
                  disabled
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Base price set by the manufacturer
                </p>
              </div>

              {/* Admin-Controlled Margins */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skaarvi Margin (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={pricingForm.skaarviMargin}
                    onChange={(e) => setPricingForm(prev => ({ ...prev, skaarviMargin: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Skaarvi's profit margin per unit
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reseller Margin (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={pricingForm.resellerMargin}
                    onChange={(e) => setPricingForm(prev => ({ ...prev, resellerMargin: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    placeholder="0.00"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Reseller's profit margin per unit
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Price Breakdown (Visible to Customer)</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Manufacturer Cost:</span>
                    <span className="font-medium">
                      {formatCurrency(selectedProduct.costPrice || selectedProduct.cost_price)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Skaarvi Margin:</span>
                    <span className="font-medium text-blue-600">
                      +{formatCurrency(pricingForm.skaarviMargin)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Reseller Margin:</span>
                    <span className="font-medium text-green-600">
                      +{formatCurrency(pricingForm.resellerMargin)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Platform Fee (Fixed):</span>
                    <span className="font-medium text-purple-600">
                      +{formatCurrency(calculatePlatformFee())}
                    </span>
                  </div>
                  <div className="pt-2 border-t-2 border-blue-300 flex justify-between items-center">
                    <span className="font-semibold text-gray-800">Final Customer Price:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(
                        calculateFinalPrice(
                          selectedProduct.costPrice || selectedProduct.cost_price,
                          pricingForm.skaarviMargin,
                          pricingForm.resellerMargin
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Note:</strong> The complete price breakdown will be visible to customers, showing transparency in pricing.
                </p>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-lg flex-shrink-0">
              <button
                onClick={() => setShowPricingModal(false)}
                disabled={saving}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePricing}
                disabled={saving}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        showInput={confirmModal.showInput}
        inputLabel={confirmModal.inputLabel}
        inputValue={confirmModal.inputValue}
        onInputChange={(value) => setConfirmModal({ ...confirmModal, inputValue: value })}
        inputRequired={confirmModal.inputRequired}
        confirmText={confirmModal.type === 'danger' ? 'Reject' : 'Approve'}
      />
    </div>
  );
}
