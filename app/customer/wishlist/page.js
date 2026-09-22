'use client';

import { useEffect, useState } from 'react';
import { Heart, Loader2, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';

export default function CustomerWishlistPage() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/customer/wishlist', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await response.json();

        if (!response.ok || result.status !== 'success') {
          throw new Error(result.message || 'Failed to load wishlist');
        }

        setWishlist((result.data?.products || []).map((product) => ({
          ...product,
          imageUrl: product.images
            ?.slice()
            .sort((firstImage, secondImage) => (
              Number(secondImage.isPrimary) - Number(firstImage.isPrimary)
              || firstImage.sortOrder - secondImage.sortOrder
            ))[0]?.imageUrl || null,
          sellingPrice: Number(product.sellingPrice) || 0,
          price: Number(product.sellingPrice) || 0,
          stock: Number(product.stockQuantity) || 0,
          isSaved: true,
        })));
      } catch (fetchError) {
        console.error('Fetch wishlist error:', fetchError);
        setError(fetchError.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, []);

  const handleSaveChange = (productId, isSaved) => {
    if (!isSaved) {
      setWishlist((products) => products.filter((product) => product.id !== productId));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
          My Wishlist
        </h1>
        <p style={{ color: 'rgb(var(--color-text-secondary))' }}>
          Save your favorite products for later
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      )}

      {!loading && error && (
        <div className="card p-8 text-center">
          <p className="mb-4 text-red-600">{error}</p>
          <button onClick={() => location.reload()} className="btn btn-primary">
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && wishlist.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {wishlist.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              source="customer_wishlist"
              onSaveChange={handleSaveChange}
            />
          ))}
        </div>
      )}

      {!loading && !error && wishlist.length === 0 && (
        <div className="card p-12 text-center">
          <Heart className="h-16 w-16 mx-auto mb-4" style={{ color: 'rgb(var(--color-text-secondary))' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
            Your wishlist is empty
          </h3>
          <p className="mb-6" style={{ color: 'rgb(var(--color-text-secondary))' }}>
            Start adding products you love to your wishlist
          </p>
          <Link href="/customer/products" className="btn btn-primary inline-flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Browse Products
          </Link>
        </div>
      )}
    </div>
  );
}
