'use client';

import { useEffect, useState } from 'react';
import { Search, Loader2, Package, Filter, X } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import PublicHeader from '@/components/PublicHeader';
import Footer from '@/components/Footer';

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

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const priceRanges = [
    { id: 'all', name: 'All Prices' },
    { id: '0-500', name: 'Under ₹500' },
    { id: '500-1000', name: '₹500 - ₹1,000' },
    { id: '1000-2000', name: '₹1,000 - ₹2,000' },
    { id: '2000-5000', name: '₹2,000 - ₹5,000' },
    { id: '5000+', name: 'Above ₹5,000' },
  ];

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/public/categories');
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          const allCats = result.data?.allCategories || [];
          // Add 'All Products' option at the beginning
          setCategories([{ id: 'all', name: 'All Products' }, ...allCats]);
        }
      }
    } catch (error) {
      console.error('Fetch categories error:', error);
      setCategories([{ id: 'all', name: 'All Products' }]);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '100',
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(searchQuery && { search: searchQuery })
      });
      console.log('[Products Page] Fetching with params:', {
        selectedCategory,
        searchQuery,
        paramsString: params.toString()
      });
      const response = await fetch(`/api/public/products?${params}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('[Products Page] API Response:', result);
        console.log('[Products Page] Products array:', result.data?.products);
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
          console.log('[Products Page] Transformed products count:', transformedProducts.length);
          console.log('[Products Page] First product:', transformedProducts[0]);
          setProducts(transformedProducts);
        } else {
          console.log('[Products Page] API status not success:', result.status);
          setProducts([]);
        }
      } else {
        console.log('[Products Page] Response not OK:', response.status);
        setProducts([]);
      }
    } catch (error) {
      console.error('Fetch products error:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    // Price range filter (search and category already handled by backend)
    let matchesPrice = true;
    if (priceRange !== 'all') {
      const price = product.sellingPrice || product.price || 0;
      if (priceRange === '0-500') matchesPrice = price < 500;
      else if (priceRange === '500-1000') matchesPrice = price >= 500 && price < 1000;
      else if (priceRange === '1000-2000') matchesPrice = price >= 1000 && price < 2000;
      else if (priceRange === '2000-5000') matchesPrice = price >= 2000 && price < 5000;
      else if (priceRange === '5000+') matchesPrice = price >= 5000;
    }

    return matchesPrice;
  });

  console.log('[Products Page] Total products:', products.length);
  console.log('[Products Page] Filtered products:', filteredProducts.length);
  console.log('[Products Page] Price range:', priceRange);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Universal Header */}
      <PublicHeader />

      <div className="flex-1 flex">
        {/* Left Sidebar - Categories and Filters */}
        <aside className="hidden lg:block w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Categories Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h2 className="font-bold text-gray-900 dark:text-white">Categories</h2>
              </div>
              <ul className="space-y-2">
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

            {/* Price Range Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h2 className="font-bold text-gray-900 dark:text-white">Price Range</h2>
              </div>
              <ul className="space-y-2">
                {priceRanges.map((range) => (
                  <li key={range.id}>
                    <button
                      onClick={() => setPriceRange(range.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        priceRange === range.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {range.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Sort Section */}
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white mb-4">Sort By</h2>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 lg:p-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-2xl">
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
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedCategory === 'all' ? 'All Products' : categories.find(c => c.id === selectedCategory)?.name}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {filteredProducts.length} products found
              </p>
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Filter className="h-5 w-5" />
              <span className="font-medium">Filters</span>
            </button>
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
                Try adjusting your filters or search query
              </p>
            </div>
          )}

          {/* Products Grid */}
          {!loading && filteredProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setShowMobileFilters(false)}
          />
          
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-gray-800 shadow-2xl z-50 lg:hidden overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filters</h2>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Filter Content */}
            <div className="p-6 space-y-6">
              {/* Categories Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Categories</h3>
                </div>
                <ul className="space-y-2">
                  {categories.map((cat) => (
                    <li key={cat.id}>
                      <button
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setShowMobileFilters(false);
                        }}
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

              {/* Price Range Section */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Price Range</h3>
                </div>
                <ul className="space-y-2">
                  {priceRanges.map((range) => (
                    <li key={range.id}>
                      <button
                        onClick={() => {
                          setPriceRange(range.id);
                          setShowMobileFilters(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          priceRange === range.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {range.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Sort Section */}
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setShowMobileFilters(false);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>

              {/* Apply Button */}
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
