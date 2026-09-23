'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Package } from 'lucide-react';
import ProductSaveButton from './ProductSaveButton';
import ProductShareButton from './ProductShareButton';
import { trackProductClick } from '@/lib/productTracking';

export default function ProductCard({
  product,
  source = 'product_listing',
  detailsBasePath,
  onSaveChange,
}) {
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
      
      // Page-specific destinations take precedence for dual-role accounts.
      if (detailsBasePath) {
        router.push(`${detailsBasePath}/${product.id}`);
      } else if (isAuthenticated && user?.role === 'customer') {
        router.push(`/customer/products/${product.id}`);
      } else if (isAuthenticated && (user?.role === 'reseller' || user?.resellerId)) {
        router.push(`/reseller/products/${product.id}`);
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
    <article className="relative w-full overflow-hidden rounded-lg border border-gray-200 bg-white transition-colors dark:border-gray-700 dark:bg-gray-800">
      {/* Product Image */}
      <div 
        className="group relative aspect-square overflow-hidden bg-gray-100 sm:aspect-[4/3] dark:bg-gray-700"
      >
        {product.imageUrl && !imageError ? (
          <>
            <img
              src={product.imageUrl}
              alt={product.name}
              className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
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

        <button
          type="button"
          onClick={handleProductClick}
          className="absolute inset-0 z-[1] cursor-pointer"
          aria-label={`View ${product.name}`}
        />

        {/* Stock Badge */}
        {product.stock <= 10 && product.stock > 0 && (
          <div className="pointer-events-none absolute left-2 top-2 z-[2] rounded bg-yellow-500 px-2 py-1 text-xs font-bold text-white shadow-md">
            Only {product.stock} left
          </div>
        )}
        
        {product.stock === 0 && (
          <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center bg-black bg-opacity-50">
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
            initialSaved={product.isSaved}
            onSaveChange={(isSaved) => onSaveChange?.(product.id, isSaved)}
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
      <div className="flex min-h-[9.25rem] flex-col p-3 sm:min-h-[9.5rem] sm:p-4">
        <button
          type="button"
          className="mb-2 line-clamp-2 min-h-[2.5rem] cursor-pointer text-left text-sm font-semibold leading-5 text-gray-900 transition-colors hover:text-blue-600 sm:text-base dark:text-white dark:hover:text-blue-400"
          onClick={handleProductClick}
          title={product.name}
        >
          {product.name}
        </button>

        {/* Pricing */}
        <div className="mb-3 flex flex-wrap items-baseline gap-x-1.5 gap-y-1">
          <span className="whitespace-nowrap text-lg font-bold text-gray-900 dark:text-white">
            {formatPrice(product.sellingPrice || product.price)}
          </span>
          {product.mrp && product.mrp > (product.sellingPrice || product.price) && (
            <>
              <span className="whitespace-nowrap text-xs text-gray-500 line-through dark:text-gray-400">
                {formatPrice(product.mrp)}
              </span>
              <span className="whitespace-nowrap text-xs font-semibold text-green-600 dark:text-green-400">
                {Math.round(((product.mrp - (product.sellingPrice || product.price)) / product.mrp) * 100)}% off
              </span>
            </>
          )}
        </div>

        {/* CTA Button */}
        <button
          onClick={handleProductClick}
          disabled={product.stock === 0}
          className={`mt-auto min-h-11 w-full rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
            product.stock === 0
              ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {product.stock === 0 ? 'Out of Stock' : 'View Product'}
        </button>
      </div>
    </article>
  );
}
