'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Store, User, MapPin, Phone, Mail, MessageCircle,
  Package, ShoppingCart, Eye, TrendingUp, Calendar,
  Share2, ExternalLink
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function PublicStorePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    if (params.username) {
      fetchStoreData();
      trackVisit();
    }
  }, [params.username]);

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/store/${params.username}`);
      const result = await response.json();

      if (result.status === 'success') {
        setStore(result.data.store);
        setProducts(result.data.products);
      } else {
        console.error('Failed to fetch store:', result.message);
      }
    } catch (error) {
      console.error('Error fetching store data:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackVisit = async () => {
    try {
      await fetch(`/api/store/visit/${params.username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAgent: navigator.userAgent,
          referrer: document.referrer
        })
      });
    } catch (error) {
      console.error('Error tracking visit:', error);
    }
  };

  const handleContact = () => {
    if (!store) return;
    
    const message = `Hi! I'm interested in the products from your store.`;
    const whatsappUrl = `https://wa.me/${store.phone_number}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleProductClick = (product) => {
    const slug = product.slug || `product-${product.id}`;
    router.push(`/p/${slug}?ref=${store.reseller_code}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!store) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'rgb(var(--color-background))' }}
      >
        <div className="text-center">
          <Store className="w-20 h-20 mx-auto mb-4" style={{ color: 'rgb(var(--color-text) / 0.3)' }} />
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
            Store Not Found
          </h1>
          <p className="mb-6" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
            The store you're looking for doesn't exist or is no longer active.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(var(--color-background))' }}>
      {/* Store Header */}
      <div 
        className="border-b"
        style={{ 
          backgroundColor: 'rgb(var(--color-surface))',
          borderColor: 'rgb(var(--color-border))'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-start gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {store.profile_photo ? (
                <img
                  src={store.profile_photo}
                  alt={store.full_name}
                  className="w-32 h-32 rounded-full object-cover border-4"
                  style={{ borderColor: 'rgb(var(--color-primary))' }}
                />
              ) : (
                <div 
                  className="w-32 h-32 rounded-full flex items-center justify-center border-4"
                  style={{ 
                    backgroundColor: 'rgb(var(--color-primary) / 0.1)',
                    borderColor: 'rgb(var(--color-primary))'
                  }}
                >
                  <User className="w-16 h-16" style={{ color: 'rgb(var(--color-primary))' }} />
                </div>
              )}
            </div>

            {/* Store Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
                    {store.store_name || store.full_name}
                  </h1>
                  {store.store_description && (
                    <p className="text-lg mb-4" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                      {store.store_description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                    {store.city && store.state && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{store.city}, {store.state}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Since {new Date(store.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div 
                  className="p-4 rounded-lg text-center"
                  style={{ backgroundColor: 'rgb(var(--color-background))' }}
                >
                  <Eye className="w-6 h-6 mx-auto mb-2" style={{ color: 'rgb(var(--color-primary))' }} />
                  <p className="text-2xl font-bold mb-1" style={{ color: 'rgb(var(--color-text))' }}>
                    {store.analytics.total_visitors}
                  </p>
                  <p className="text-xs" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                    Visitors
                  </p>
                </div>

                <div 
                  className="p-4 rounded-lg text-center"
                  style={{ backgroundColor: 'rgb(var(--color-background))' }}
                >
                  <ShoppingCart className="w-6 h-6 mx-auto mb-2" style={{ color: 'rgb(var(--color-primary))' }} />
                  <p className="text-2xl font-bold mb-1" style={{ color: 'rgb(var(--color-text))' }}>
                    {store.analytics.total_orders}
                  </p>
                  <p className="text-xs" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                    Orders
                  </p>
                </div>

                <div 
                  className="p-4 rounded-lg text-center"
                  style={{ backgroundColor: 'rgb(var(--color-background))' }}
                >
                  <TrendingUp className="w-6 h-6 mx-auto mb-2" style={{ color: 'rgb(var(--color-primary))' }} />
                  <p className="text-2xl font-bold mb-1" style={{ color: 'rgb(var(--color-text))' }}>
                    ₹{Number.parseFloat(store.analytics.total_earnings || 0).toLocaleString()}
                  </p>
                  <p className="text-xs" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                    Earnings
                  </p>
                </div>
              </div>

              {/* Contact Button */}
              <button
                onClick={handleContact}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-lg font-medium transition-all"
                style={{ 
                  backgroundColor: 'rgb(37, 211, 102)',
                  color: 'white'
                }}
              >
                <MessageCircle className="w-5 h-5" />
                Contact on WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
            Products ({products.length})
          </h2>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="rounded-lg overflow-hidden transition-all hover:shadow-lg text-left"
                style={{ 
                  backgroundColor: 'rgb(var(--color-surface))',
                  border: '1px solid rgb(var(--color-border))'
                }}
              >
                {/* Product Image */}
                <div 
                  className="relative h-48 overflow-hidden"
                  style={{ backgroundColor: 'rgb(var(--color-background))' }}
                >
                  {product.primary_image ? (
                    <img
                      src={product.primary_image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16" style={{ color: 'rgb(var(--color-text) / 0.3)' }} />
                    </div>
                  )}
                  
                  {/* Stock Badge */}
                  <div className="absolute top-2 right-2">
                    <span 
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        product.stock_status === 'in_stock' ? 'bg-green-100 text-green-700' :
                        product.stock_status === 'low_stock' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}
                    >
                      {product.stock_status === 'in_stock' ? 'In Stock' :
                       product.stock_status === 'low_stock' ? 'Low Stock' :
                       'Out of Stock'}
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2" style={{ color: 'rgb(var(--color-text))' }}>
                    {product.name}
                  </h3>
                  <p className="text-xs mb-2" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
                    {product.category_name}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold" style={{ color: 'rgb(var(--color-primary))' }}>
                      ₹{product.selling_price}
                    </span>
                    <ExternalLink className="w-4 h-4" style={{ color: 'rgb(var(--color-text) / 0.5)' }} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div 
            className="rounded-lg p-12 text-center"
            style={{ backgroundColor: 'rgb(var(--color-surface))' }}
          >
            <Package className="w-16 h-16 mx-auto mb-4" style={{ color: 'rgb(var(--color-text) / 0.3)' }} />
            <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
              No Products Yet
            </h3>
            <p style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
              This store hasn't added any products yet.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div 
        className="border-t mt-12 py-6"
        style={{ 
          backgroundColor: 'rgb(var(--color-surface))',
          borderColor: 'rgb(var(--color-border))'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm" style={{ color: 'rgb(var(--color-text) / 0.7)' }}>
          <p>Powered by Skaarvi Reseller Platform</p>
        </div>
      </div>
    </div>
  );
}
