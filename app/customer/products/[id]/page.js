'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  Shield, 
  TrendingUp,
  Loader2,
  ShoppingCart,
  Star,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ProductSaveButton from '@/components/product/ProductSaveButton';
import ProductShareButton from '@/components/product/ProductShareButton';
import { addToCart } from '@/store/slices/cartSlice';
import { getReferralCodeFromURL, saveReferralCodeToCookie, getReferralCodeFromStorage } from '@/lib/cartUtils';
import { trackProductViewWithReferral } from '@/lib/referralTracking';

// Helper functions to handle both S3 and local URLs
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  if (imagePath.startsWith('/')) return `http://localhost:5000${imagePath}`;
  return null;
};

const getImageUrls = (images, urlField = 'imageUrl') => {
  if (!Array.isArray(images) || images.length === 0) return [];
  return images.map(img => {
    const path = typeof img === 'string' ? img : img[urlField];
    return getImageUrl(path);
  }).filter(url => url !== null);
};

export default function CustomerProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { totalItems, items: cartItems } = useSelector((state) => state.cart);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageError, setImageError] = useState(false);

  const productId = params.id;

  useEffect(() => {
    if (productId) {
      fetchProductDetails();
      
      // Track product view with referral
      const referralCode = getReferralCodeFromURL() || getReferralCodeFromStorage();
      if (referralCode) {
        saveReferralCodeToCookie(referralCode);
        trackProductViewWithReferral(productId, referralCode);
      }
    }
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public/products/${productId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch product');
      }

      const result = await response.json();
      
      if (result.status === 'success') {
        const { product: productData, images, videos } = result.data;

        // Format product data with backend URL for images
        setProduct({
          ...productData,
          images: getImageUrls(images, 'image_url'),
          imageUrl: images.length > 0 ? getImageUrl(images[0].image_url) : null,
          videos: videos.map(vid => ({
            url: getImageUrl(vid.video_url),
            thumbnail: getImageUrl(vid.thumbnail_url)
          })),
          catalog_url: getImageUrl(productData.catalog_url),
          brand: productData.brand_name || productData.brand || null,
          costPrice: parseFloat(productData.cost_price) || 0,
          skaarviMargin: parseFloat(productData.skaarvi_margin) || 0,
          resellerProfit: parseFloat(productData.reseller_margin) || parseFloat(productData.reseller_profit) || 0,
          sellingPrice: parseFloat(productData.selling_price) || 0,
          price: parseFloat(productData.selling_price) || 0,
          stock: productData.stock_quantity || 0,
          resellerProfit: parseFloat(productData.reseller_profit) || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    const referralCode = getReferralCodeFromStorage();
    
    const cartData = {
      productId: product.id,
      name: product.name,
      price: product.sellingPrice || product.price,
      image: product.imageUrl,
      stock: product.stock,
      quantity,
      referralCode
    };
    
    console.log('[Add to Cart] Product data:', {
      id: product.id,
      name: product.name,
      sellingPrice: product.sellingPrice,
      price: product.price,
      stock: product.stock,
      quantity
    });
    console.log('[Add to Cart] Sending to cart:', cartData);
    
    dispatch(addToCart(cartData));
    
    toast.success(`${product.name} added to cart!`);
  };

  const handleBuyNow = () => {
    if (!product) return;
    
    // Check if product is already in cart
    const existingItem = cartItems.find(item => item.productId === product.id);
    
    if (!existingItem) {
      // Only add to cart if it's not already there
      handleAddToCart();
    }
    
    // Navigate to checkout
    router.push('/customer/checkout');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: 'rgb(var(--color-primary))' }} />
          <p style={{ color: 'rgb(var(--color-text-secondary))' }}>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 mx-auto mb-4" style={{ color: 'rgb(var(--color-text-secondary))' }} />
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
            Product Not Found
          </h2>
          <p className="mb-6" style={{ color: 'rgb(var(--color-text-secondary))' }}>
            The product you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => router.push('/customer/products')}
            className="btn btn-primary"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  const images = product.images || [product.imageUrl].filter(Boolean);
  const discount = product.mrp && product.mrp > (product.sellingPrice || product.price)
    ? Math.round(((product.mrp - (product.sellingPrice || product.price)) / product.mrp) * 100)
    : 0;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(var(--color-background))' }}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          style={{ color: 'rgb(var(--color-text-secondary))' }}
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Products</span>
        </button>
      </div>

      {/* Product Details */}
      <main>
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-lg overflow-hidden border" style={{ 
              backgroundColor: 'rgb(var(--color-surface))',
              borderColor: 'rgb(var(--color-border))'
            }}>
              {images[selectedImage] && !imageError ? (
                <img
                  src={images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Package className="h-24 w-24" style={{ color: 'rgb(var(--color-text-secondary))' }} />
                </div>
              )}
              
              {/* Stock Badge */}
              {product.stock <= 10 && product.stock > 0 && (
                <div className="absolute top-4 left-4 text-sm font-bold px-3 py-1 rounded" style={{
                  backgroundColor: 'rgb(var(--color-warning))',
                  color: 'white'
                }}>
                  Only {product.stock} left
                </div>
              )}
              
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <span className="px-6 py-3 rounded-lg font-bold text-lg" style={{
                    backgroundColor: 'rgb(var(--color-danger))',
                    color: 'white'
                  }}>
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 transition-all"
                    style={{
                      backgroundColor: 'rgb(var(--color-surface))',
                      borderColor: selectedImage === index 
                        ? 'rgb(var(--color-primary))' 
                        : 'rgb(var(--color-border))'
                    }}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Product Videos */}
            {product.videos && product.videos.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
                  Product Videos
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {product.videos.map((video, index) => (
                    <div key={index} className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                      <video
                        controls
                        className="w-full h-full"
                        poster={video.thumbnail}
                      >
                        <source src={video.url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Catalog */}
            {product.catalog_url && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
                  Product Catalog
                </h3>
                <div className="rounded-lg border-2 p-4" style={{ 
                  backgroundColor: 'rgb(var(--color-surface))',
                  borderColor: 'rgb(var(--color-border))'
                }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                        <Package className="h-6 w-6" style={{ color: 'rgb(239, 68, 68)' }} />
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
                          Product Catalog (PDF)
                        </p>
                        <p className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                          View detailed specifications and information
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <a
                      href={`http://localhost:5000${product.catalog_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 btn btn-primary text-center"
                    >
                      View Catalog
                    </a>
                    <a
                      href={`http://localhost:5000${product.catalog_url}`}
                      download
                      className="flex-1 btn btn-outline text-center"
                    >
                      Download PDF
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                {product.name}
              </h1>
              {product.brand && (
                <p style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  Brand: <span className="font-semibold">{product.brand}</span>
                </p>
              )}
            </div>

            {/* Rating (placeholder) */}
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <span style={{ color: 'rgb(var(--color-text-secondary))' }}>(4.5)</span>
            </div>

            {/* Pricing with Transparent Breakdown */}
            <div className="rounded-lg p-6 space-y-4" style={{ backgroundColor: 'rgb(var(--color-surface))', border: '2px solid rgb(var(--color-border))' }}>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold" style={{ color: 'rgb(var(--color-primary))' }}>
                  {formatPrice(product.sellingPrice || product.price)}
                </span>
              </div>

              {/* Price Breakdown */}
              <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: 'rgba(var(--color-primary), 0.05)', border: '1px solid rgba(var(--color-primary), 0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Info className="h-4 w-4" style={{ color: 'rgb(var(--color-primary))' }} />
                  <span className="text-sm font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
                    Transparent Pricing Breakdown
                  </span>
                </div>
                
                <div className="space-y-1.5 text-sm">
                  {product.costPrice && (
                    <div className="flex justify-between items-center">
                      <span style={{ color: 'rgb(var(--color-text-secondary))' }}>Manufacturer Cost:</span>
                      <span className="font-medium" style={{ color: 'rgb(var(--color-text))' }}>
                        {formatPrice(product.costPrice)}
                      </span>
                    </div>
                  )}
                  
                  {product.skaarviMargin > 0 && (
                    <div className="flex justify-between items-center">
                      <span style={{ color: 'rgb(var(--color-text-secondary))' }}>Skaarvi Margin:</span>
                      <span className="font-medium text-blue-600">
                        +{formatPrice(product.skaarviMargin)}
                      </span>
                    </div>
                  )}
                  
                  {product.resellerProfit > 0 && (
                    <div className="flex justify-between items-center">
                      <span style={{ color: 'rgb(var(--color-text-secondary))' }}>Reseller Margin:</span>
                      <span className="font-medium text-green-600">
                        +{formatPrice(product.resellerProfit)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span style={{ color: 'rgb(var(--color-text-secondary))' }}>Platform Fee (Fixed):</span>
                    <span className="font-medium text-purple-600">
                      +{formatPrice(5)}
                    </span>
                  </div>
                  
                  <div className="pt-2 border-t flex justify-between items-center" style={{ borderColor: 'rgba(var(--color-border), 0.5)' }}>
                    <span className="font-semibold" style={{ color: 'rgb(var(--color-text))' }}>Your Price:</span>
                    <span className="text-lg font-bold" style={{ color: 'rgb(var(--color-primary))' }}>
                      {formatPrice(product.sellingPrice || product.price)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reseller Profit Highlight */}
              {product.resellerProfit && (
                <div className="flex items-center gap-2 p-3 rounded-lg font-semibold" style={{ 
                  backgroundColor: 'rgba(var(--color-success), 0.1)',
                  border: '1px solid rgb(var(--color-success))',
                  color: 'rgb(var(--color-success))'
                }}>
                  <TrendingUp className="h-5 w-5" />
                  <span>You earn {formatPrice(product.resellerProfit)} profit per sale!</span>
                </div>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4">
              <span className="font-medium" style={{ color: 'rgb(var(--color-text))' }}>Quantity:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border hover:opacity-80 flex items-center justify-center"
                  style={{ borderColor: 'rgb(var(--color-border))' }}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="w-12 text-center font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 rounded-lg border hover:opacity-80 flex items-center justify-center"
                  style={{ borderColor: 'rgb(var(--color-border))' }}
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 btn btn-outline flex items-center justify-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0}
                className="flex-1 btn btn-primary"
              >
                Buy Now
              </button>
            </div>

            {/* Save & Share */}
            <div className="flex gap-3">
              <div className="flex-1">
                <ProductSaveButton 
                  productId={product.id}
                  source="customer_product_detail"
                />
              </div>
              <div className="flex-1">
                <ProductShareButton
                  productId={product.id}
                  productName={product.name}
                  productImage={product.imageUrl}
                  productUrl={`/customer/products/${product.id}`}
                  source="customer_product_detail"
                />
              </div>
            </div>

            {/* Features */}
            <div className="border-t pt-6" style={{ borderColor: 'rgb(var(--color-border))' }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'rgb(var(--color-text))' }}>
                Key Features
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  <Truck className="h-5 w-5" />
                  <span>Free Delivery</span>
                </div>
                <div className="flex items-center gap-2" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  <Shield className="h-5 w-5" />
                  <span>Secure Payment</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description & Details */}
        <div className="mt-12 grid md:grid-cols-2 gap-8">
          {/* Description */}
          <div className="rounded-lg p-6 border" style={{ 
            backgroundColor: 'rgb(var(--color-surface))',
            borderColor: 'rgb(var(--color-border))'
          }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: 'rgb(var(--color-text))' }}>
              Product Description
            </h2>
            <p className="leading-relaxed" style={{ color: 'rgb(var(--color-text-secondary))' }}>
              {product.description}
            </p>
            
            {product.features && product.features.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'rgb(var(--color-text))' }}>
                  Features
                </h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      <span className="mt-1" style={{ color: 'rgb(var(--color-primary))' }}>•</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="rounded-lg p-6 border" style={{ 
              backgroundColor: 'rgb(var(--color-surface))',
              borderColor: 'rgb(var(--color-border))'
            }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'rgb(var(--color-text))' }}>
                Specifications
              </h2>
              <dl className="space-y-3">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b pb-2" style={{ borderColor: 'rgb(var(--color-border))' }}>
                    <dt className="font-medium" style={{ color: 'rgb(var(--color-text))' }}>{key}</dt>
                    <dd style={{ color: 'rgb(var(--color-text-secondary))' }}>{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
