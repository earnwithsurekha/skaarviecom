'use client';

import { useEffect, useState } from 'react';
import { Package, Loader2, Search, Filter } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import Footer from '@/components/Footer';
import ProductCard from '@/components/product/ProductCard';

// Helper function to handle both S3 and local URLs
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // Already a full URL (S3)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Legacy local path
  if (imagePath.startsWith('/')) {
    return `http://localhost:5000${imagePath}`;
  }
  return null;
};

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/public/products?limit=50');
      
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          // Transform API data to match ProductCard expectations
          const transformedProducts = (result.data.products || []).map(product => ({
            ...product,
            imageUrl: getImageUrl(product.primary_image),
            sellingPrice: parseFloat(product.selling_price) || 0,
            price: parseFloat(product.selling_price) || 0,
            stock: product.stock_quantity || 0,
            resellerProfit: product.reseller_profit || 0
          }));
          setProducts(transformedProducts);
        } else {
          setProducts([]);
        }
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('Fetch products error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/public/categories');
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          const allCats = result.data.allCategories || [];
          setCategories([
            { id: 'all', name: 'All Products' },
            ...allCats.map(cat => ({ id: cat.id, name: cat.name }))
          ]);
        }
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
      setCategories([{ id: 'all', name: 'All Products' }]);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-x-hidden">
      {/* Universal Header with Login Modal */}
      <PublicHeader />

      {/* Main Content with Sidebar */}
      <div className="flex-1 flex overflow-x-hidden">
        {/* Left Sidebar - Categories */}
        <aside className="hidden lg:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="p-6 space-y-6">
            {/* Categories Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h2 className="font-bold text-gray-900 dark:text-white">Categories</h2>
              </div>
              <ul className="space-y-2 overflow-y-auto max-h-[calc(100vh-250px)] pr-2">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {cat.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-8 w-full max-w-full">
          {/* Mobile Category Filter - Only visible on mobile */}
          <div className="lg:hidden mb-4 w-full">
            <div className="flex items-center gap-2 mb-3 px-1">
              <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h2 className="font-bold text-gray-900 dark:text-white">Filter by Category</h2>
            </div>
            <div className="w-full overflow-x-auto overflow-y-hidden pb-3" style={{ 
              scrollbarWidth: 'thin',
              WebkitOverflowScrolling: 'touch'
            }}>
              <div className="flex gap-2 flex-nowrap min-w-max px-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative w-full max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 shadow-sm"
              />
            </div>
          </div>

          {/* Products Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {selectedCategory === 'all' ? 'Featured Products' : categories.find(c => c.id === selectedCategory)?.name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No products found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? 'Try a different search term' : 'Products will appear here soon'}
              </p>
            </div>
          )}

          {/* Products Grid */}
          {!loading && filteredProducts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 w-full">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
