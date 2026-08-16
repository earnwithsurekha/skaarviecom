'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { 
  ShoppingCart, Heart, Share2, Star, Package, Truck,
  ChevronLeft, ChevronRight, Check, AlertCircle
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function PublicProductPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const referralCode = searchParams.get('ref');
  
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    if (params.slug) {
      fetchProductDetails();
      trackReferralClick();
    }
  }, [params.slug]);

  const fetchProductDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/public/products/${params.slug}`);
      const result = await response.json();

      if (result.status === 'success') {
        setProduct(result.data.product);
        setImages(result.data.images || []);
        setVideos(result.data.videos || []);
        setRelatedProducts(result.data.relatedProducts || []);
      } else {
        console.error('Failed to fetch product:', result.message);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackReferralClick = async () => {
    if (!referralCode) return;

    // Generate or get session ID
    let sessionId = sessionStorage.getItem('visitor_session_id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('visitor_session_id', sessionId);
    }

    try {
      // Detect device and browser
      const userAgent = navigator.userAgent;
      let deviceType = 'desktop';
      let browser = 'unknown';

      if (/mobile/i.test(userAgent)) deviceType = 'mobile';
      else if (/tablet/i.test(userAgent)) deviceType = 'tablet';

      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';

      await fetch('/api/track/referral-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralCode,
          productId: params.slug,
          sessionId,
          userAgent,
          referrerUrl: document.referrer,
          deviceType,
          browser
        })
      });
    } catch (error) {
      console.error('Error tracking referral click:', error);
    }
  };

  const handleAddToCart = () => {
    // TODO: Implement cart functionality
    // Store referral code in cart item for order attribution
    const cartItem = {
      productId: product.id,
      quantity,
      referralCode: referralCode || null
    };
    
    // For now, just show success message
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4" style={{ color: 'rgb(var(--color-text) / 0.5)' }} />
          <h1 className="text-2xl font-semibold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
            Product not found
          </h1>
          <p className="mb-6" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
            The product you're looking for doesn't exist or is no longer available.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-lg"
            style={{ backgroundColor: 'rgb(var(--color-primary))', color: 'white' }}
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(var(--color-background))' }}>
      {/* Referral Banner */}
      {referralCode && (
        <div 
          className="py-2 text-center text-sm"
          style={{ backgroundColor: 'rgb(var(--color-primary))', color: 'white' }}
        >
          🎁 You're viewing this product through a referral link. Support your referrer by purchasing!
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Left Column - Images */}
          <div>
            {/* Main Image */}
            <div 
              className="relative rounded-lg overflow-hidden mb-4"
              style={{ 
                backgroundColor: 'rgb(var(--color-surface))',
                height: '500px'
              }}
            >
              {images.length > 0 ? (
                <>
                  <img
                    src={images[selectedImageIndex]?.image_url}
                    alt={product.name}
                    className="w-full h-full object-contain"
                  />
                  
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', color: 'white' }}
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full"
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', color: 'white' }}
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="w-20 h-20" style={{ color: 'rgb(var(--color-text) / 0.3)' }} />
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className="aspect-square rounded-lg overflow-hidden border-2 transition-all"
                    style={{
                      borderColor: index === selectedImageIndex 
                        ? 'rgb(var(--color-primary))' 
                        : 'rgb(var(--color-border))',
                      backgroundColor: 'rgb(var(--color-surface))'
                    }}
                  >
                    <img
                      src={image.image_url}
                      alt={`View ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Info & Purchase */}
          <div>
            {/* Category Badge */}
            <span 
              className="inline-block text-sm px-3 py-1 rounded-full mb-3"
              style={{ 
                backgroundColor: 'rgb(var(--color-primary) / 0.1)',
                color: 'rgb(var(--color-primary))'
              }}
            >
              {product.category_name || 'Uncategorized'}
            </span>

            {/* Product Title */}
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
              {product.name}
            </h1>

            {/* Manufacturer */}
            {product.manufacturer_name && (
              <p className="text-sm mb-4" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                by {product.manufacturer_name}
              </p>
            )}

            {/* Price Section */}
            <div 
              className="p-6 rounded-lg mb-6"
              style={{ backgroundColor: 'rgb(var(--color-surface))' }}
            >
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-4xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
                  ₹{product.selling_price}
                </span>
                {referralCode && (
                  <span 
                    className="text-sm px-3 py-1 rounded-full"
                    style={{ 
                      backgroundColor: 'rgb(34, 197, 94, 0.1)',
                      color: 'rgb(34, 197, 94)'
                    }}
                  >
                    Referred Product
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 mb-4 pb-4 border-b" style={{ borderColor: 'rgb(var(--color-border))' }}>
                <Package className="w-5 h-5" style={{ color: 'rgb(var(--color-text) / 0.7)' }} />
                <span className="text-sm" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                  Stock:
                </span>
                <span 
                  className={`text-sm font-medium ${
                    product.stock_quantity > 10 ? 'text-green-600' : 
                    product.stock_quantity > 0 ? 'text-orange-500' : 'text-red-500'
                  }`}
                >
                  {product.stock_status === 'in_stock' ? 'In Stock' : 
                   product.stock_status === 'low_stock' ? `Only ${product.stock_quantity} left!` : 
                   'Out of Stock'}
                </span>
              </div>

              {/* Quantity Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ 
                      backgroundColor: 'rgb(var(--color-background))',
                      border: '1px solid rgb(var(--color-border))'
                    }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 h-10 text-center rounded-lg"
                    style={{ 
                      backgroundColor: 'rgb(var(--color-background))',
                      border: '1px solid rgb(var(--color-border))',
                      color: 'rgb(var(--color-text))'
                    }}
                  />
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ 
                      backgroundColor: 'rgb(var(--color-background))',
                      border: '1px solid rgb(var(--color-border))'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock_status === 'out_of_stock' || addedToCart}
                  className="w-full py-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  style={{ 
                    backgroundColor: addedToCart ? 'rgb(34, 197, 94)' : 'rgb(var(--color-primary))',
                    color: 'white'
                  }}
                >
                  {addedToCart ? (
                    <>
                      <Check className="w-5 h-5" />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
                    </>
                  )}
                </button>

                <button
                  className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  style={{ 
                    backgroundColor: 'rgb(var(--color-surface))',
                    border: '1px solid rgb(var(--color-border))',
                    color: 'rgb(var(--color-text))'
                  }}
                >
                  <Heart className="w-5 h-5" />
                  Add to Wishlist
                </button>
              </div>

              {/* Delivery Info */}
              <div className="mt-6 pt-6 border-t" style={{ borderColor: 'rgb(var(--color-border))' }}>
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5" style={{ color: 'rgb(var(--color-text) / 0.7)' }} />
                  <span className="text-sm" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                    Delivery: {product.delivery_time || '3-5 business days'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Description & Specs */}
        <div 
          className="rounded-lg overflow-hidden mb-12"
          style={{ backgroundColor: 'rgb(var(--color-surface))' }}
        >
          <div 
            className="flex border-b"
            style={{ borderColor: 'rgb(var(--color-border))' }}
          >
            <button
              onClick={() => setActiveTab('description')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'description' ? 'border-b-2' : ''
              }`}
              style={{
                color: activeTab === 'description' 
                  ? 'rgb(var(--color-primary))' 
                  : 'rgb(var(--color-text) / 0.7)',
                borderColor: activeTab === 'description' 
                  ? 'rgb(var(--color-primary))' 
                  : 'transparent'
              }}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('specifications')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'specifications' ? 'border-b-2' : ''
              }`}
              style={{
                color: activeTab === 'specifications' 
                  ? 'rgb(var(--color-primary))' 
                  : 'rgb(var(--color-text) / 0.7)',
                borderColor: activeTab === 'specifications' 
                  ? 'rgb(var(--color-primary))' 
                  : 'transparent'
              }}
            >
              Specifications
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'shipping' ? 'border-b-2' : ''
              }`}
              style={{
                color: activeTab === 'shipping' 
                  ? 'rgb(var(--color-primary))' 
                  : 'rgb(var(--color-text) / 0.7)',
                borderColor: activeTab === 'shipping' 
                  ? 'rgb(var(--color-primary))' 
                  : 'transparent'
              }}
            >
              Shipping & Returns
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'description' && (
              <p className="whitespace-pre-wrap" style={{ color: 'rgb(var(--color-text))' }}>
                {product.description || 'No description available.'}
              </p>
            )}

            {activeTab === 'specifications' && (
              <div>
                {product.specifications ? (
                  <div className="space-y-3">
                    {Object.entries(JSON.parse(product.specifications)).map(([key, value]) => (
                      <div key={key} className="flex py-2 border-b" style={{ borderColor: 'rgb(var(--color-border))' }}>
                        <span className="w-1/3 font-medium" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                          {key}
                        </span>
                        <span style={{ color: 'rgb(var(--color-text))' }}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                    No specifications available.
                  </p>
                )}
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-4" style={{ color: 'rgb(var(--color-text))' }}>
                <div>
                  <h4 className="font-semibold mb-2">Shipping Information</h4>
                  <p style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                    {product.shipping_info || 'Free shipping on orders above ₹500.'}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Return Policy</h4>
                  <p style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                    {product.return_policy || '7 days return policy applies.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6" style={{ color: 'rgb(var(--color-text))' }}>
              Related Products
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <a
                  key={relatedProduct.id}
                  href={`/p/${relatedProduct.slug}${referralCode ? `?ref=${referralCode}` : ''}`}
                  className="rounded-lg overflow-hidden transition-transform hover:scale-105"
                  style={{ backgroundColor: 'rgb(var(--color-surface))' }}
                >
                  <div className="aspect-square bg-gray-100">
                    {relatedProduct.primary_image && (
                      <img
                        src={relatedProduct.primary_image}
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium mb-2 line-clamp-2" style={{ color: 'rgb(var(--color-text))' }}>
                      {relatedProduct.name}
                    </h3>
                    <p className="text-lg font-bold" style={{ color: 'rgb(var(--color-primary))' }}>
                      ₹{relatedProduct.selling_price}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
