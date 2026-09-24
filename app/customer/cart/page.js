'use client';

import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ArrowLeft, Package, Tag, Home } from 'lucide-react';
import { removeFromCart, updateQuantity, clearCart, validateCart, getCartItemId } from '@/store/slices/cartSlice';
import { formatPrice } from '@/lib/cartUtils';
import toast from 'react-hot-toast';

export default function CustomerCartPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { items, subtotal, totalItems, platformFee, shipping, total, referralCode } = useSelector((state) => state.cart);

  // Validate cart on mount to fix any corrupted data
  useEffect(() => {
    dispatch(validateCart());
  }, [dispatch]);

  console.log('[Customer Cart] Cart state:', { items, subtotal, totalItems, platformFee, shipping, total, referralCode });
  console.log('[Customer Cart] Items detail:', items.map(item => ({
    id: item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    priceType: typeof item.price,
    quantityType: typeof item.quantity
  })));

  const handleRemoveItem = (cartItemId, productName) => {
    dispatch(removeFromCart(cartItemId));
    toast.success(`${productName} removed from cart`);
  };

  const handleUpdateQuantity = (cartItemId, newQuantity, maxStock) => {
    if (newQuantity < 1) {
      return;
    }
    if (newQuantity > maxStock) {
      toast.error(`Only ${maxStock} items available in stock`);
      return;
    }
    dispatch(updateQuantity({ cartItemId, quantity: newQuantity }));
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
    
    // Redirect to customer checkout page
    router.push('/customer/checkout');
  };

  const handleContinueShopping = () => {
    router.push('/customer/products');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(var(--color-background))' }}>
      <main className="min-w-0">
        {/* Back to Home Button */}
        <button
          onClick={() => router.push('/customer')}
          className="inline-flex items-center gap-2 mb-4 transition-colors hover:opacity-80"
          style={{ color: 'rgb(var(--color-text-secondary))' }}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </button>

        {/* Page Title */}
        <div className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-2xl font-bold sm:gap-3 sm:text-3xl" style={{ color: 'rgb(var(--color-text))' }}>
              <ShoppingCart className="h-7 w-7 flex-none sm:h-8 sm:w-8" />
              Shopping Cart
            </h1>
            <p className="text-sm mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
              {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleClearCart}
              className="flex min-h-11 flex-none items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: 'rgb(var(--color-danger))' }}
            >
              <Trash2 className="h-4 w-4" />
              Clear Cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="text-center py-16">
            <div className="inline-flex p-6 rounded-full mb-6" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
              <ShoppingCart className="h-16 w-16" style={{ color: 'rgb(var(--color-text-secondary))' }} />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'rgb(var(--color-text))' }}>
              Your cart is empty
            </h2>
            <p className="mb-8 max-w-md mx-auto" style={{ color: 'rgb(var(--color-text-secondary))' }}>
              Browse our products and add items to your cart to get started with your order.
            </p>
            <button
              onClick={handleContinueShopping}
              className="btn btn-primary inline-flex items-center gap-2"
            >
              <Package className="h-5 w-5" />
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
            {/* Cart Items */}
            <div className="min-w-0 space-y-4 lg:col-span-2">
              {/* Referral Info Banner */}
              {referralCode && (
                <div className="border rounded-lg p-4 flex items-center gap-3" style={{ 
                  backgroundColor: 'rgba(var(--color-success), 0.1)',
                  borderColor: 'rgb(var(--color-success))'
                }}>
                  <Tag className="h-5 w-5" style={{ color: 'rgb(var(--color-success))' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'rgb(var(--color-text))' }}>
                      Referral Applied
                    </p>
                    <p className="text-xs" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Referral code: <strong>{referralCode}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Cart Items List */}
              {items.map((item) => (
                <div
                  key={getCartItemId(item.productId, item.selectedSize, item.selectedColor)}
                  className="grid min-w-0 grid-cols-[4rem_minmax(0,1fr)] gap-3 rounded-lg p-3 shadow sm:grid-cols-[6rem_minmax(0,1fr)_auto] sm:gap-4 sm:p-4"
                  style={{ backgroundColor: 'rgb(var(--color-surface))' }}
                >
                  {/* Product Image */}
                  <div
                    className="h-16 w-16 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg sm:h-24 sm:w-24"
                    style={{ backgroundColor: 'rgb(var(--color-background))' }}
                    onClick={() => router.push(`/customer/products/${item.productId}`)}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover hover:scale-110 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8" style={{ color: 'rgb(var(--color-text-secondary))' }} />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="min-w-0">
                    <h3
                      className="mb-1 break-words font-semibold transition-opacity hover:opacity-80"
                      style={{ color: 'rgb(var(--color-text))' }}
                      onClick={() => router.push(`/customer/products/${item.productId}`)}
                    >
                      {item.name}
                    </h3>
                    <p className="text-lg font-bold mb-2" style={{ color: 'rgb(var(--color-primary))' }}>
                      {formatPrice(item.price)}
                    </p>
                    {item.selectedSize && (
                      <p className="mb-2 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                        Size: <span className="font-semibold">{item.selectedSize}</span>
                      </p>
                    )}
                    {item.selectedColor && (
                      <p className="mb-2 text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                        Color: <span className="font-semibold">{item.selectedColor}</span>
                      </p>
                    )}

                    {/* Quantity Controls */}
                    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                      <button
                        onClick={() => handleUpdateQuantity(getCartItemId(item.productId, item.selectedSize, item.selectedColor), item.quantity - 1, item.maxStock)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 rounded flex items-center justify-center border disabled:opacity-50"
                        style={{ borderColor: 'rgb(var(--color-border))' }}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-base font-semibold sm:w-12 sm:text-lg" style={{ color: 'rgb(var(--color-text))' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(getCartItemId(item.productId, item.selectedSize, item.selectedColor), item.quantity + 1, item.maxStock)}
                        disabled={item.quantity >= item.maxStock}
                        className="w-8 h-8 rounded flex items-center justify-center border disabled:opacity-50"
                        style={{ borderColor: 'rgb(var(--color-border))' }}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(getCartItemId(item.productId, item.selectedSize, item.selectedColor), item.name)}
                        className="ml-auto p-2 rounded hover:opacity-80"
                        style={{ color: 'rgb(var(--color-danger))' }}
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Stock Warning */}
                    {item.quantity >= item.maxStock && (
                      <p className="text-xs mt-2" style={{ color: 'rgb(var(--color-warning))' }}>
                        Maximum quantity available
                      </p>
                    )}
                  </div>

                  {/* Item Total */}
                  <div className="col-start-2 min-w-0 text-left sm:col-start-auto sm:text-right">
                    <p className="text-sm mb-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                      Item Total
                    </p>
                    <p className="break-words text-lg font-bold sm:text-xl" style={{ color: 'rgb(var(--color-text))' }}>
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="min-w-0 lg:col-span-1">
              <div className="sticky top-6 min-w-0 rounded-lg p-4 shadow sm:p-6" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
                <h2 className="text-xl font-bold mb-4" style={{ color: 'rgb(var(--color-text))' }}>
                  Order Summary
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex min-w-0 justify-between gap-3">
                    <span style={{ color: 'rgb(var(--color-text-secondary))' }}>Subtotal</span>
                    <span className="font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <span className="min-w-0 break-words" style={{ color: 'rgb(var(--color-text-secondary))' }}>Platform Fee ({totalItems} items × ₹5)</span>
                    <span className="flex-none font-semibold" style={{ color: 'rgb(var(--color-text))' }}>
                      {formatPrice(platformFee || 0)}
                    </span>
                  </div>
                  <div className="flex min-w-0 justify-between gap-3">
                    <span style={{ color: 'rgb(var(--color-text-secondary))' }}>Shipping</span>
                    <span className="font-semibold" style={{ color: shipping === 0 ? 'rgb(var(--color-success))' : 'rgb(var(--color-text))' }}>
                      {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                    </span>
                  </div>
                  <div className="border-t pt-3" style={{ borderColor: 'rgb(var(--color-border))' }}>
                    <div className="flex min-w-0 justify-between gap-3">
                      <span className="text-lg font-semibold" style={{ color: 'rgb(var(--color-text))' }}>Total</span>
                      <span className="text-xl font-bold" style={{ color: 'rgb(var(--color-primary))' }}>
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full btn btn-primary flex items-center justify-center gap-2 mb-3"
                >
                  Proceed to Checkout
                  <ArrowRight className="h-5 w-5" />
                </button>

                <button
                  onClick={handleContinueShopping}
                  className="w-full btn btn-outline flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
