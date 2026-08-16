'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FolderOpen, Plus, Edit, Trash2, Eye, Package, Search, Grid3x3, List, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '@/components/ConfirmModal';
import { exportToCSV } from '@/lib/exportUtils';

export default function CategoriesManagementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    categoryName: '',
    description: '',
    parentCategoryId: null,
    sortOrder: 0,
    status: 'active',
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        toast.error('Please login to continue');
        router.push('/login/admin');
        return;
      }

      const response = await fetch('/api/admin/categories', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) throw new Error('Failed to fetch categories');

      const data = await response.json();
      setCategories(data.data || []);
    } catch (error) {
      console.error('Categories fetch error:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.categoryName || formData.categoryName.trim().length < 3) {
      errors.categoryName = 'Category name must be at least 3 characters';
    } else if (formData.categoryName.length > 100) {
      errors.categoryName = 'Category name must not exceed 100 characters';
    } else if (!/^[a-zA-Z0-9\s\-_]+$/.test(formData.categoryName)) {
      errors.categoryName = 'Category name can only contain letters, numbers, spaces, hyphens, and underscores';
    }

    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must not exceed 500 characters';
    }

    if (formData.sortOrder < 0 || formData.sortOrder > 9999) {
      errors.sortOrder = 'Sort order must be between 0 and 9999';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateCategory = () => {
    setModalMode('create');
    setFormData({
      categoryName: '',
      description: '',
      parentCategoryId: null,
      sortOrder: 0,
      status: 'active',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleEditCategory = (category) => {
    setModalMode('edit');
    setSelectedCategory(category);
    setFormData({
      categoryName: category.categoryName,
      description: category.description || '',
      parentCategoryId: category.parentCategoryId || null,
      sortOrder: category.sortOrder || 0,
      status: category.status || 'active',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleDeleteCategory = (category) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the form errors');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = modalMode === 'create' 
        ? '/api/admin/categories'
        : `/api/admin/categories/${selectedCategory.categoryId}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Operation failed');
      }

      toast.success(`Category ${modalMode === 'create' ? 'created' : 'updated'} successfully`);
      setShowModal(false);
      fetchCategories();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.message || `Failed to ${modalMode} category`);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/categories/${selectedCategory.categoryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Delete failed');
      }

      toast.success('Category deleted successfully');
      setShowDeleteModal(false);
      fetchCategories();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete category');
    }
  };

  const filteredCategories = categories.filter(cat =>
    cat.categoryName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const parentCategories = categories.filter(cat => !cat.parentCategoryId);

  if (loading) {
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
            Categories Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Organize products into categories
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (categories.length === 0) {
                toast.error('No categories to export');
                return;
              }
              const headers = [
                { key: 'categoryName', label: 'Category' },
                { key: 'description', label: 'Description' },
                { key: 'parentCategory', label: 'Parent' },
                { key: 'productCount', label: 'Products' },
              ];
              exportToCSV(categories, headers, `categories-export-${new Date().toISOString().split('T')[0]}.csv`);
              toast.success('Categories exported successfully');
            }}
            className="px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: 'rgba(var(--color-text), 0.7)' }}
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={handleCreateCategory}
            className="px-4 py-2 rounded-lg text-white transition-all hover:opacity-90 flex items-center gap-2"
            style={{ backgroundColor: 'rgb(var(--color-primary))' }}
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      </div>

      {/* Search and View Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Grid3x3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Categories Display */}
      {filteredCategories.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No categories found' : 'No categories yet'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm ? 'Try adjusting your search' : 'Create your first category to get started'}
          </p>
          {!searchTerm && (
            <button
              onClick={handleCreateCategory}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Category
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <div
              key={category.categoryId}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    {category.categoryName}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  category.status === 'active'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                }`}>
                  {category.status?.toUpperCase()}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Package className="w-4 h-4" />
                  <span>{category.productCount || 0} products</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    key={`view-${category.categoryId}`}
                    onClick={() => router.push(`/admin/products?category=${category.categoryId}`)}
                    className="p-2 hover:opacity-70 transition-opacity rounded-lg"
                    style={{ color: 'rgb(var(--color-primary))' }}
                    title="View Products"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    key={`edit-${category.categoryId}`}
                    onClick={() => handleEditCategory(category)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    key={`delete-${category.categoryId}`}
                    onClick={() => handleDeleteCategory(category)}
                    className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCategories.map((category) => (
                <tr key={category.categoryId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {category.categoryName}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 max-w-md truncate">
                      {category.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {category.productCount || 0}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      category.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                    }`}>
                      {category.status?.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        key={`view-${category.categoryId}`}
                        onClick={() => router.push(`/admin/products?category=${category.categoryId}`)}
                        className="hover:opacity-70 transition-opacity"
                        style={{ color: 'rgb(var(--color-primary))' }}
                        title="View Products"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        key={`edit-${category.categoryId}`}
                        onClick={() => handleEditCategory(category)}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        key={`delete-${category.categoryId}`}
                        onClick={() => handleDeleteCategory(category)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
            <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {modalMode === 'create' ? 'Create Category' : 'Edit Category'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.categoryName}
                  onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                    formErrors.categoryName
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="e.g., Electronics"
                />
                {formErrors.categoryName && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.categoryName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                    formErrors.description
                      ? 'border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Category description (optional)"
                />
                {formErrors.description && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Parent Category (Optional)
                </label>
                <select
                  value={formData.parentCategoryId || ''}
                  onChange={(e) => setFormData({ ...formData, parentCategoryId: e.target.value || null })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None (Top Level)</option>
                  {parentCategories
                    .filter(cat => !selectedCategory || cat.categoryId !== selectedCategory.categoryId)
                    .map(cat => (
                      <option key={cat.categoryId} value={cat.categoryId}>
                        {cat.categoryName}
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    min="0"
                    max="9999"
                    className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 ${
                      formErrors.sortOrder
                        ? 'border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {formErrors.sortOrder && (
                    <p className="mt-1 text-sm text-red-500">{formErrors.sortOrder}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-3">
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {modalMode === 'create' ? 'Create Category' : 'Update Category'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCategory && (
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Delete Category"
          message={`Are you sure you want to delete "${selectedCategory.categoryName}"? ${
            selectedCategory.productCount > 0
              ? `This category has ${selectedCategory.productCount} product(s). Products will become uncategorized.`
              : 'This action cannot be undone.'
          }`}
          type="danger"
        />
      )}
    </div>
  );
}
