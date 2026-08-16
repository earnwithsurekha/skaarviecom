'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Package } from 'lucide-react';
import ProductSaveButton from './ProductSaveButton';
import ProductShareButton from './ProductShareButton';
import { trackProductClick } from '@/lib/productTracking';

export default function ProductCard({ product, source = 'product_listing' }) {
  const router = useRouter();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Use relative URL for SSR compatibility
  const productUrl = `/products/${product.id}`;

  const handleProductClick = async () => {
    try {
      // Track click (non-blocking)
      trackProductClick(product.id, source).catch(err => 
        console.error('Tracking error:', err)
      );
      
      // Route based on authentication status
      if (isAuthenticated && (user?.role === 'customer' || user?.role === 'reseller')) {
        // Logged in users go to customer dashboard product details
        router.push(`/customer/products/${product.id}`);
      } else {
        // Not logged in or other roles go to public product page
        router.push(`/products/${product.id}`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden relative w-full">
      {/* Product Image */}
      <div 
        className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-700 cursor-pointer overflow-hidden group"
        onClick={handleProductClick}
      >
        {product.imageUrl && !imageError ? (
          <>
            <img
              src={product.imageUrl}
              alt={product.name}
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-110 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                console.error('Image failed to load:', product.imageUrl);
                setImageError(true);
                setImageLoaded(false);
              }}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Package className="h-8 w-8 text-gray-300 dark:text-gray-600 animate-pulse" />
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="h-10 w-10 text-gray-300 dark:text-gray-600" />
          </div>
        )}

        {/* Stock Badge */}
        {product.stock <= 10 && product.stock > 0 && (
          <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md">
            Only {product.stock} left
          </div>
        )}
        
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-lg">
              Out of Stock
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex gap-1.5 z-10">
          <ProductSaveButton 
            productId={product.id}
            source={source}
          />
          <ProductShareButton
            productId={product.id}
            productName={product.name}
            productImage={product.imageUrl}
            productUrl={productUrl}
            source={source}
          />
        </div>
      </div>

      {/* Product Info */}
      <div className="p-2 sm:p-3">
        <h3 
          className="font-semibold text-xs sm:text-sm text-gray-900 dark:text-white mb-1.5 line-clamp-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-h-[2.5rem] sm:min-h-[2rem]"
          onClick={handleProductClick}
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Pricing */}
        <div className="flex flex-wrap items-center gap-1 mb-2">
          <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white whitespace-nowrap">
            {formatPrice(product.sellingPrice || product.price)}
          </span>
          {product.mrp && product.mrp > (product.sellingPrice || product.price) && (
            <>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-through whitespace-nowrap">
                {formatPrice(product.mrp)}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400 whitespace-nowrap">
                {Math.round(((product.mrp - (product.sellingPrice || product.price)) / product.mrp) * 100)}% off
              </span>
            </>
          )}
        </div>

        {/* CTA Button */}
        <button
          onClick={handleProductClick}
          disabled={product.stock === 0}
          className={`w-full py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            product.stock === 0
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {product.stock === 0 ? 'Out of Stock' : 'View Details'}
        </button>
      </div>
    </div>
  );
}
