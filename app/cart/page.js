'use client';

import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ArrowLeft, Package, Tag, Home } from 'lucide-react';
import { removeFromCart, updateQuantity, clearCart } from '@/store/slices/cartSlice';
import { formatPrice } from '@/lib/cartUtils';
import PublicHeader from '@/components/PublicHeader';
import Footer from '@/components/Footer';
import toast from 'react-hot-toast';

export default function CartPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { items, subtotal, totalItems, shipping, total, referralCode } = useSelector((state) => state.cart);
  const { isAuthenticated } = useSelector((state) => state.auth);

  const handleRemoveItem = (productId, productName) => {
    dispatch(removeFromCart(productId));
    toast.success(`${productName} removed from cart`);
  };

  const handleUpdateQuantity = (productId, newQuantity, maxStock) => {
    if (newQuantity < 1) {
      return;
    }
    if (newQuantity > maxStock) {
      toast.error(`Only ${maxStock} items available in stock`);
      return;
    }
    dispatch(updateQuantity({ productId, quantity: newQuantity }));
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      dispatch(clearCart());
      toast.success('Cart cleared');
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    // Redirect to checkout page
    router.push('/checkout');
  };

  const handleContinueShopping = () => {
    router.push('/products');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Universal Header */}
      <PublicHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to Home Button */}
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Home</span>
        </button>

        {/* Page Title */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <ShoppingCart className="h-8 w-8" />
              Shopping Cart
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleClearCart}
              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium flex items-center gap-2 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Clear Cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="text-center py-16">
            <div className="inline-flex p-6 bg-gray-100 dark:bg-gray-800 rounded-full mb-6">
              <ShoppingCart className="h-16 w-16 text-gray-400 dark:text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Your cart is empty
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              Browse our products and add items to your cart to get started with your order.
            </p>
            <button
              onClick={handleContinueShopping}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
            >
              <Package className="h-5 w-5" />
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Referral Info Banner */}
              {referralCode && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-3">
                  <Tag className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-green-900 dark:text-green-200">
                      Referral Applied
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Referral code: <strong>{referralCode}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Cart Items List */}
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex gap-4"
                >
                  {/* Product Image */}
                  <div
                    className="w-24 h-24 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => router.push(`/products/${item.productId}`)}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover hover:scale-110 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <h3
                      className="font-semibold text-gray-900 dark:text-white mb-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      onClick={() => router.push(`/products/${item.productId}`)}
                    >
                      {item.name}
                    </h3>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatPrice(item.price)}
                    </p>
                    {item.referralCode && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Via: {item.referralCode}
                      </p>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => handleRemoveItem(item.productId, item.name)}
                      className="text-red-600 hover:text-red-700 transition-colors"
                      title="Remove from cart"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>

                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1, item.maxStock)}
                        disabled={item.quantity <= 1}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-semibold text-gray-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1, item.maxStock)}
                        disabled={item.quantity >= item.maxStock}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <p className="text-sm font-bold text-gray-900 dark:text-white mt-2">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Continue Shopping */}
              <button
                onClick={handleContinueShopping}
                className="w-full mt-4 py-3 px-4 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-5 w-5" />
                Continue Shopping
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal ({totalItems} items)</span>
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Shipping</span>
                    <span className="font-semibold">
                      {shipping === 0 ? (
                        <span className="text-green-600 dark:text-green-400">FREE</span>
                      ) : (
                        formatPrice(shipping)
                      )}
                    </span>
                  </div>
                  {shipping > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Add {formatPrice(500 - subtotal)} more for free shipping
                    </p>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-5 w-5" />
                </button>

                {!isAuthenticated && (
                  <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
                    You'll be asked to login at checkout
                  </p>
                )}

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-green-600" />
                    <span>Secure Checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-green-600" />
                    <span>Free Returns within 7 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
