'use client';

import { useState, useEffect } from 'react';
import { X, Package, Share2, Heart, ShoppingCart, Minus, Plus, Truck, Shield, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductDetailModal({ productId, onClose }) {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public/products/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch product');
      const data = await response.json();
      
      // Transform the data to match expected format
      const productData = {
        ...data.data.product,
        sellingPrice: data.data.product.selling_price,
        stockQuantity: data.data.product.stock_quantity,
        images: data.data.images.map(img => ({
          id: img.image_url,
          imageUrl: img.image_url,
          altText: img.alt_text
        })),
        specifications: data.data.product.specifications || {}
      };
      
      setProduct(productData);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product details');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.stockQuantity || 1)) {
      setQuantity(newQuantity);
    }
  };

  if (!productId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
        
        {/* Modal */}
        <div 
          className="relative w-full max-w-5xl rounded-lg shadow-2xl overflow-hidden"
          style={{ backgroundColor: 'rgb(var(--color-background))' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full hover:opacity-80 transition-opacity shadow-lg"
            style={{ 
              backgroundColor: 'rgb(var(--color-surface))',
              color: 'rgb(var(--color-text))'
            }}
          >
            <X className="w-6 h-6" />
          </button>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : product ? (
            <div className="grid md:grid-cols-2 gap-6 p-6 max-h-[90vh] overflow-y-auto">
              {/* Left: Images */}
              <div className="space-y-4">
                {/* Main Image */}
                <div className="relative aspect-square rounded-lg overflow-hidden" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[selectedImage]?.imageUrl || product.images[0]?.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-20 h-20" style={{ color: 'rgb(var(--color-text-secondary))' }} />
                    </div>
                  )}
                  
                  {/* Stock Badge */}
                  {product.stockQuantity <= 10 && product.stockQuantity > 0 && (
                    <div className="absolute top-4 left-4 bg-yellow-500 text-white text-sm font-bold px-3 py-1 rounded">
                      Only {product.stockQuantity} left
                    </div>
                  )}
                  {product.stockQuantity === 0 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Thumbnail Images */}
                {product.images && product.images.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {product.images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImage(index)}
                        className="aspect-square rounded-lg overflow-hidden border-2 transition-all"
                        style={{
                          borderColor: selectedImage === index ? 'rgb(var(--color-primary))' : 'rgb(var(--color-border))',
                          boxShadow: selectedImage === index ? '0 0 0 2px rgba(var(--color-primary), 0.2)' : 'none'
                        }}
                      >
                        <img
                          src={image.imageUrl}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Details */}
              <div className="space-y-4">
                {/* Title */}
                <div>
                  <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                    {product.name}
                  </h2>
                  {product.brandName && (
                    <p className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Brand: <span className="font-medium" style={{ color: 'rgb(var(--color-text))' }}>{product.brandName}</span>
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="border-t border-b py-4" style={{ borderColor: 'rgb(var(--color-border))' }}>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
                      {formatPrice(product.sellingPrice)}
                    </span>
                    {product.costPrice && product.costPrice > product.sellingPrice && (
                      <>
                        <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
                          {formatPrice(product.costPrice)}
                        </span>
                        <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                          {Math.round(((product.costPrice - product.sellingPrice) / product.costPrice) * 100)}% off
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: 'rgb(var(--color-text))' }}>Description</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Specifications */}
                {product.specifications && Object.keys(product.specifications).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: 'rgb(var(--color-text))' }}>Specifications</h3>
                    <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span style={{ color: 'rgb(var(--color-text-secondary))' }}>{key}:</span>
                          <span className="font-medium" style={{ color: 'rgb(var(--color-text))' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Selector */}
                {product.stockQuantity > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: 'rgb(var(--color-text))' }}>Quantity</h3>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        className="p-2 rounded-lg border hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        style={{ borderColor: 'rgb(var(--color-border))' }}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-lg font-semibold w-12 text-center" style={{ color: 'rgb(var(--color-text))' }}>
                        {quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(1)}
                        disabled={quantity >= product.stockQuantity}
                        className="p-2 rounded-lg border hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                        style={{ borderColor: 'rgb(var(--color-border))' }}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <span className="text-sm ml-2" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                        ({product.stockQuantity} available)
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                  <button
                    disabled={product.stockQuantity === 0}
                    className="w-full py-3 px-6 rounded-lg font-semibold transition-opacity flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: product.stockQuantity === 0 ? 'rgb(var(--color-border))' : 'rgb(var(--color-primary))',
                      color: 'white'
                    }}
                    onClick={() => toast('Please login to add items to cart')}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {product.stockQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  
                  <div className="flex gap-2">
                    <button
                      className="flex-1 py-2 px-4 border rounded-lg hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
                      style={{ borderColor: 'rgb(var(--color-border))', color: 'rgb(var(--color-text))' }}
                      onClick={() => toast('Please login to save products')}
                    >
                      <Heart className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      className="flex-1 py-2 px-4 border rounded-lg hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
                      style={{ borderColor: 'rgb(var(--color-border))', color: 'rgb(var(--color-text))' }}
                      onClick={() => toast('Share feature coming soon')}
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="rounded-lg p-4 space-y-3" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
                  {product.deliveryDays && (
                    <div className="flex items-start gap-3">
                      <Truck className="w-5 h-5 mt-0.5" style={{ color: 'rgb(var(--color-text-secondary))' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'rgb(var(--color-text))' }}>
                          Delivery in {product.deliveryDays} days
                        </p>
                        {product.shippingInfo && (
                          <p className="text-xs mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                            {product.shippingInfo}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 mt-0.5" style={{ color: 'rgb(var(--color-text-secondary))' }} />
                    <p className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Secure payments & buyer protection
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <RotateCcw className="w-5 h-5 mt-0.5" style={{ color: 'rgb(var(--color-text-secondary))' }} />
                    <p className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      7 days return policy
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <p className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>Product not found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
