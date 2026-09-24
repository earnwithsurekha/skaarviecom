'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package,
  Search,
  Filter,
  Grid3x3,
  List,
  Bookmark,
  BookmarkCheck,
  Eye,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  X
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    minProfit: '',
    sortBy: 'created_at'
  });
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const tabStripRef = useRef(null);

  const selectTab = (tab, event) => {
    setActiveTab(tab);
    setPagination((current) => ({ ...current, page: 1 }));
    event.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  const scrollTabs = (direction) => {
    tabStripRef.current?.scrollBy({ left: direction * 180, behavior: 'smooth' });
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, filters.sortBy, filters.category, filters.search, activeTab]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilters((currentFilters) => (
        currentFilters.search === searchInput
          ? currentFilters
          : { ...currentFilters, search: searchInput }
      ));
      setPagination((currentPagination) => (
        currentPagination.page === 1
          ? currentPagination
          : { ...currentPagination, page: 1 }
      ));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

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
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      minProfit: '',
      sortBy: 'created_at'
    });
    setPagination({ ...pagination, page: 1 });
    setFiltersOpen(false);
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
  const activeFilterCount = [
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.minProfit,
    filters.sortBy !== 'created_at' ? filters.sortBy : '',
  ].filter(Boolean).length;

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'rgb(var(--color-primary))' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="hidden items-center justify-between sm:flex">
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
            aria-label="Grid view"
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
            aria-label="List view"
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:hidden">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Search products"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="h-11 w-full border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="relative flex h-11 w-11 flex-none items-center justify-center border border-gray-300 bg-white text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          aria-label="Open product filters"
        >
          <Filter className="h-5 w-5" />
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white" style={{ backgroundColor: 'rgb(var(--color-primary))' }}>
              {activeFilterCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setViewMode('grid')}
          className="flex h-11 w-11 flex-none items-center justify-center"
          style={{
            backgroundColor: viewMode === 'grid' ? 'rgb(var(--color-primary))' : 'rgb(var(--color-background))',
            color: viewMode === 'grid' ? 'white' : 'rgb(var(--color-text-secondary))',
          }}
          aria-label="Grid view"
        >
          <Grid3x3 className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className="flex h-11 w-11 flex-none items-center justify-center"
          style={{
            backgroundColor: viewMode === 'list' ? 'rgb(var(--color-primary))' : 'rgb(var(--color-background))',
            color: viewMode === 'list' ? 'white' : 'rgb(var(--color-text-secondary))',
          }}
          aria-label="List view"
        >
          <List className="h-5 w-5" />
        </button>
      </div>

      {/* Quick Filter Tabs */}
      <div className="-mx-4 flex min-w-0 items-center gap-1 px-1 sm:mx-0 sm:px-0">
        <button
          type="button"
          onClick={() => scrollTabs(-1)}
          className="flex h-10 w-10 flex-none items-center justify-center text-gray-600 dark:text-gray-300 sm:hidden"
          aria-label="Scroll product tabs left"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div ref={tabStripRef} className="flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth pb-2 touch-pan-x">
          <button
            type="button"
            onClick={(event) => selectTab('all', event)}
            className={`flex-none snap-start px-3 py-2 sm:px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            style={activeTab === 'all' ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
          >
            All Products
          </button>
          <button
            type="button"
            onClick={(event) => selectTab('trending', event)}
            className={`flex flex-none snap-start items-center gap-2 px-3 py-2 sm:px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
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
            type="button"
            onClick={(event) => selectTab('best_selling', event)}
            className={`flex-none snap-start px-3 py-2 sm:px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'best_selling'
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            style={activeTab === 'best_selling' ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
          >
            Best Selling
          </button>
          <button
            type="button"
            onClick={(event) => selectTab('new_arrivals', event)}
            className={`flex-none snap-start px-3 py-2 sm:px-4 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'new_arrivals'
                ? 'bg-primary text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            style={activeTab === 'new_arrivals' ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
          >
            New Arrivals
          </button>
        </div>
        <button
          type="button"
          onClick={() => scrollTabs(1)}
          className="flex h-10 w-10 flex-none items-center justify-center text-gray-600 dark:text-gray-300 sm:hidden"
          aria-label="Scroll product tabs right"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {filtersOpen && (
        <button
          type="button"
          onClick={() => setFiltersOpen(false)}
          className="fixed inset-0 z-[55] bg-black/45 md:hidden"
          aria-label="Close product filters"
        />
      )}

      {/* Filters */}
      <div className={`${filtersOpen ? 'fixed' : 'hidden'} inset-x-0 bottom-0 z-[60] max-h-[82dvh] overflow-y-auto rounded-t-lg border-t border-gray-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl dark:border-gray-700 dark:bg-gray-800 md:static md:block md:max-h-none md:overflow-visible md:rounded-lg md:border md:p-4 md:shadow-sm`}>
        <div className="mb-4 flex items-center justify-between md:hidden">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Filters</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Refine products and earnings</p>
          </div>
          <button
            type="button"
            onClick={() => setFiltersOpen(false)}
            className="flex h-11 w-11 items-center justify-center text-gray-600 dark:text-gray-300"
            aria-label="Close product filters"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="hidden md:col-span-2 md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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
        
        <div className="mt-4 grid grid-cols-2 gap-3 md:flex md:gap-2">
          <button
            onClick={handleSearch}
            className="w-full rounded-lg px-4 py-2 text-white transition-all hover:opacity-90 md:w-auto"
            style={{ backgroundColor: 'rgb(var(--color-primary))' }}
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            className="w-full rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300 md:w-auto dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Products Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow group"
            >
              <div className="relative aspect-[4/3] sm:aspect-square">
                {product.primary_image ? (
                  <Image
                    src={product.primary_image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 767px) 50vw, (max-width: 1279px) 33vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <Package className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={() => handleSaveProduct(product.id, product.is_saved)}
                  className="absolute right-1.5 top-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg transition-transform hover:scale-110 dark:bg-gray-800 sm:right-2 sm:top-2"
                  aria-label={product.is_saved ? 'Remove from saved products' : 'Save product'}
                >
                  {product.is_saved ? (
                    <BookmarkCheck className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Bookmark className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  )}
                </button>
                <span className={`absolute left-1.5 top-1.5 px-1.5 py-1 text-[10px] font-medium capitalize sm:left-2 sm:top-2 sm:px-2 sm:text-xs ${getStockBadge(product.stock_status)}`}>
                  {product.stock_status.replace('_', ' ')}
                </span>
              </div>
              
              <div className="p-3 sm:p-4">
                <h3 className="mb-2 line-clamp-2 min-h-10 text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                  {product.name}
                </h3>

                <div className="mb-3 sm:hidden">
                  <p className="text-base font-bold text-gray-900 dark:text-white">
                    ₹{Number.parseFloat(product.selling_price).toFixed(2)}
                  </p>
                  <p className="text-xs font-semibold text-green-600 dark:text-green-400">
                    Earn ₹{Number.parseFloat(product.reseller_profit).toFixed(2)}
                  </p>
                </div>

                <div className="mb-4 hidden space-y-2 sm:block">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Selling Price:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      ₹{Number.parseFloat(product.selling_price).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Your Profit:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      ₹{Number.parseFloat(product.reseller_profit).toFixed(2)}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/reseller/products/${product.id}`}
                  className="flex min-h-10 w-full items-center justify-center px-2 text-center text-sm font-medium text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: 'rgb(var(--color-primary))' }}
                >
                  <span className="sm:hidden">Details</span>
                  <span className="hidden sm:inline">View Details</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="touch-pan-x overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full min-w-[860px]">
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
                    ₹{Number.parseFloat(product.selling_price).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 font-semibold text-green-600 dark:text-green-400">
                    ₹{Number.parseFloat(product.reseller_profit).toFixed(2)}
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
        <div className="portal-pagination flex items-center justify-between">
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
