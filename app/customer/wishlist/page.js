'use client';

import { useState } from 'react';
import { Heart, Package, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function CustomerWishlistPage() {
  // Placeholder for future implementation
  const [wishlist] = useState([]);

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

      {/* Empty State */}
      <div className="card p-12 text-center">
        <Heart className="h-16 w-16 mx-auto mb-4" style={{ color: 'rgb(var(--color-text-secondary))' }} />
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
          Your wishlist is empty
        </h3>
        <p className="mb-6" style={{ color: 'rgb(var(--color-text-secondary))' }}>
          Start adding products you love to your wishlist
        </p>
        <Link
          href="/products"
          className="btn btn-primary inline-flex items-center gap-2"
        >
          <ShoppingCart className="h-5 w-5" />
          Browse Products
        </Link>
      </div>
    </div>
  );
}
