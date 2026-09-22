'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { Search, Loader2, Package, Filter, X } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';

// Helper function to handle both S3 and local URLs
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  if (imagePath.startsWith('/')) {
    return imagePath;
  }
  return null;
};

export default function CustomerProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);

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
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, deferredSearchQuery]);

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
        ...(deferredSearchQuery && { search: deferredSearchQuery })
      });
      const response = await fetch(`/api/public/products?${params}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          // Transform API data to match ProductCard expectations
          const transformedProducts = (result.data.products || []).map(product => ({
            ...product,
            imageUrl: getImageUrl(product.primary_image),
            sellingPrice: Number.parseFloat(product.selling_price) || 0,
            price: Number.parseFloat(product.selling_price) || 0,
            stock: product.stock_quantity || 0
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

  const sortedProducts = [...filteredProducts].sort((firstProduct, secondProduct) => {
    if (sortBy === 'price_low') {
      return firstProduct.sellingPrice - secondProduct.sellingPrice;
    }

    if (sortBy === 'price_high') {
      return secondProduct.sellingPrice - firstProduct.sellingPrice;
    }

    if (sortBy === 'popular') {
      const salesDifference = Number(secondProduct.sales_count || 0)
        - Number(firstProduct.sales_count || 0);

      return salesDifference || Number(secondProduct.views_count || 0)
        - Number(firstProduct.views_count || 0);
    }

    return (Date.parse(secondProduct.created_at) || 0)
      - (Date.parse(firstProduct.created_at) || 0);
  });

  return (
    <div className="min-h-[calc(100vh-5rem)] lg:flex lg:h-[calc(100vh-5rem)]">
      {/* Left Sidebar - Categories and Filters (Desktop) */}
      <aside className="hidden lg:block w-64 border-r overflow-y-auto" style={{ backgroundColor: 'rgb(var(--color-background))', borderColor: 'rgb(var(--color-border))' }}>
        <div className="p-6 space-y-6">
          {/* Categories Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5" style={{ color: 'rgb(var(--color-text-secondary))' }} />
              <h2 className="font-bold" style={{ color: 'rgb(var(--color-text))' }}>Categories</h2>
            </div>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors`}
                    style={selectedCategory === cat.id ? {
                      backgroundColor: 'rgba(var(--color-primary), 0.1)',
                      color: 'rgb(var(--color-primary))',
                      fontWeight: '600'
                    } : {
                      color: 'rgb(var(--color-text))'
                    }}
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
              <Filter className="h-5 w-5" style={{ color: 'rgb(var(--color-text-secondary))' }} />
              <h2 className="font-bold" style={{ color: 'rgb(var(--color-text))' }}>Price Range</h2>
            </div>
            <ul className="space-y-2">
              {priceRanges.map((range) => (
                <li key={range.id}>
                  <button
                    onClick={() => setPriceRange(range.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors`}
                    style={priceRange === range.id ? {
                      backgroundColor: 'rgba(var(--color-primary), 0.1)',
                      color: 'rgb(var(--color-primary))',
                      fontWeight: '600'
                    } : {
                      color: 'rgb(var(--color-text))'
                    }}
                  >
                    {range.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Sort Section */}
          <div>
            <h2 className="font-bold mb-4" style={{ color: 'rgb(var(--color-text))' }}>Sort By</h2>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input"
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
      <main className="min-w-0 flex-1 lg:overflow-y-auto lg:p-8">
        <div
          className="sticky top-16 z-20 border-b px-3 py-3 lg:static lg:mb-6 lg:border-0 lg:bg-transparent lg:p-0"
          style={{
            backgroundColor: 'rgb(var(--color-background))',
            borderColor: 'rgb(var(--color-border))',
          }}
        >
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search products and brands"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 pl-10 pr-4 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none sm:h-12 sm:text-base dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-400"
            />
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`min-h-10 flex-none rounded-full border px-4 text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end justify-between gap-3 px-3 pb-3 pt-4 lg:mb-6 lg:px-0 lg:pb-0 lg:pt-0">
          <div>
            <h1 className="text-lg font-bold text-gray-900 sm:text-2xl dark:text-white">
              {selectedCategory === 'all' ? 'All Products' : categories.find(c => c.id === selectedCategory)?.name}
            </h1>
            <p className="mt-0.5 text-xs text-gray-600 sm:mt-1 sm:text-sm dark:text-gray-400">
              {filteredProducts.length} products found
            </p>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="h-10 max-w-28 rounded-lg border border-gray-300 bg-white px-2 text-xs font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              aria-label="Sort products"
            >
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low</option>
              <option value="price_high">Price: High</option>
              <option value="popular">Popular</option>
            </select>
            <button
              type="button"
              onClick={() => setShowMobileFilters(true)}
              className="relative flex h-10 items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
            >
              <Filter className="h-4 w-4" />
              Filter
              {priceRange !== 'all' && <span className="h-2 w-2 rounded-full bg-blue-600" />}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedProducts.length === 0 && (
          <div className="px-4 py-20 text-center">
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
        {!loading && sortedProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-2 px-2 pb-4 sm:gap-4 sm:px-4 lg:grid-cols-2 lg:gap-6 lg:px-0 xl:grid-cols-3 2xl:grid-cols-4">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <>
          {/* Backdrop */}
          <button
            type="button"
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setShowMobileFilters(false)}
            aria-label="Close product filters"
          />
          
          {/* Drawer */}
          <section className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-lg bg-white dark:bg-gray-800 lg:hidden">
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filters</h2>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="flex h-11 w-11 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close product filters"
              >
                <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Filter Content */}
            <div className="space-y-6 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
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
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Sort By</h3>
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

              {/* Apply Button */}
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
              >
                Apply Filters
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
