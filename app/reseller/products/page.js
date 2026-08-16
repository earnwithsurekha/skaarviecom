'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Search,
  Filter,
  Grid3x3,
  List,
  Bookmark,
  BookmarkCheck,
  Share2,
  Eye,
  TrendingUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';

export default function ProductsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    minProfit: '',
    sortBy: 'created_at'
  });
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, filters.sortBy, filters.category, filters.search, activeTab]);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setCategories(data.data || []);
        }
      }
    } catch (error) {
      console.error('Categories fetch error:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/');
        return;
      }

      // Apply tab-specific filters
      let tabFilters = { ...filters };
      if (activeTab === 'trending') {
        tabFilters.sortBy = 'profit_desc'; // High profit = trending
      } else if (activeTab === 'best_selling') {
        tabFilters.sortBy = 'created_at'; // Most recent orders (placeholder)
      } else if (activeTab === 'new_arrivals') {
        tabFilters.sortBy = 'created_at';
      }

      const params = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        ...tabFilters
      });

      const response = await fetch(`/api/reseller/products?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch products');

      const data = await response.json();
      
      if (data.status === 'success') {
        setProducts(data.data.products);
        setPagination(data.data.pagination);
      }

    } catch (error) {
      console.error('Products fetch error:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchProducts();
  };

  const handleSaveProduct = async (productId, isSaved) => {
    try {
      const token = localStorage.getItem('token');
      const method = isSaved ? 'DELETE' : 'POST';
      
      const response = await fetch(`/api/reseller/products/${productId}/save`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to save product');

      toast.success(isSaved ? 'Product removed from saved items' : 'Product saved successfully');
      
      // Update local state
      setProducts(products.map(p => 
        p.id === productId ? { ...p, is_saved: !isSaved } : p
      ));

    } catch (error) {
      console.error('Save product error:', error);
      toast.error('Failed to save product');
    }
  };

  const getStockBadge = (status) => {
    const badges = {
      in_stock: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      low_stock: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      out_of_stock: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return badges[status] || badges.out_of_stock;
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'rgb(var(--color-primary))' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Products
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Browse products to promote and earn commission
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            style={viewMode === 'grid' ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
          >
            <Grid3x3 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            style={viewMode === 'list' ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => { setActiveTab('all'); setPagination({ ...pagination, page: 1 }); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'all'
              ? 'bg-primary text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          style={activeTab === 'all' ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
        >
          All Products
        </button>
        <button
          onClick={() => { setActiveTab('trending'); setPagination({ ...pagination, page: 1 }); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'trending'
              ? 'bg-primary text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          style={activeTab === 'trending' ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
        >
          <TrendingUp className="h-4 w-4" />
          Trending
        </button>
        <button
          onClick={() => { setActiveTab('best_selling'); setPagination({ ...pagination, page: 1 }); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'best_selling'
              ? 'bg-primary text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          style={activeTab === 'best_selling' ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
        >
          Best Selling
        </button>
        <button
          onClick={() => { setActiveTab('new_arrivals'); setPagination({ ...pagination, page: 1 }); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeTab === 'new_arrivals'
              ? 'bg-primary text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          style={activeTab === 'new_arrivals' ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
        >
          New Arrivals
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
              />
            </div>
          </div>

          <div>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
            >
              <option value="">All Categories</option>
              {categories && categories.length > 0 && categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="number"
              placeholder="Min price (₹)"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
            />
          </div>

          <div>
            <input
              type="number"
              placeholder="Max price (₹)"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
            />
          </div>
          
          <div>
            <input
              type="number"
              placeholder="Min profit (₹)"
              value={filters.minProfit}
              onChange={(e) => setFilters({ ...filters, minProfit: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mt-4">
          <div className="md:col-span-2">
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
            >
              <option value="created_at">Newest First</option>
              <option value="profit_desc">Highest Profit</option>
              <option value="profit_asc">Lowest Profit</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>
                
          <div className="md:col-span-4"></div>
        </div>
        
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded-lg text-white transition-all hover:opacity-90"
            style={{ backgroundColor: 'rgb(var(--color-primary))' }}
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              setFilters({
                search: '',
                category: '',
                minPrice: '',
                maxPrice: '',
                minProfit: '',
                sortBy: 'created_at'
              });
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Products Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow group"
            >
              <div className="relative aspect-square">
                {product.primary_image ? (
                  <Image
                    src={product.primary_image}
                    alt={product.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={() => handleSaveProduct(product.id, product.is_saved)}
                  className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:scale-110 transition-transform"
                >
                  {product.is_saved ? (
                    <BookmarkCheck className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Bookmark className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
                <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-medium rounded-full ${getStockBadge(product.stock_status)}`}>
                  {product.stock_status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
                  {product.name}
                </h3>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Selling Price:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ₹{parseFloat(product.selling_price).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Your Profit:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      ₹{parseFloat(product.reseller_profit).toFixed(2)}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/reseller/products/${product.id}`}
                  className="block w-full py-2 text-center rounded-lg text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: 'rgb(var(--color-primary))' }}
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Selling Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Your Profit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 flex-shrink-0">
                        {product.primary_image ? (
                          <Image
                            src={product.primary_image}
                            alt={product.name}
                            fill
                            className="object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                          {product.name}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {product.category_name || 'Uncategorized'}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                    ₹{parseFloat(product.selling_price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 font-semibold text-green-600 dark:text-green-400">
                    ₹{parseFloat(product.reseller_profit).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStockBadge(product.stock_status)}`}>
                      {product.stock_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveProduct(product.id, product.is_saved)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title={product.is_saved ? 'Remove from saved' : 'Save product'}
                      >
                        {product.is_saved ? (
                          <BookmarkCheck className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Bookmark className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                      <Link
                        href={`/reseller/products/${product.id}`}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="View details"
                      >
                        <Eye className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {products.length} of {pagination.total} products
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page >= pagination.totalPages}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Products Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your filters or search terms
          </p>
        </div>
      )}
    </div>
  );
}
