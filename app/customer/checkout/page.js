'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { 
  ShoppingCart, 
  MapPin, 
  CreditCard, 
  ArrowLeft, 
  Package,
  Loader2,
  User,
  Phone,
  Mail,
  Home
} from 'lucide-react';
import { clearCart, validateCart } from '@/store/slices/cartSlice';
import { formatPrice } from '@/lib/cartUtils';
import toast from 'react-hot-toast';

export default function CustomerCheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  
  const { items, total, subtotal, platformFee, shipping, referralCode } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  
  // Validate cart on mount to fix any corrupted data
  useEffect(() => {
    dispatch(validateCart());
  }, [dispatch]);
  
  console.log('[Customer Checkout] Cart state:', { items, subtotal, platformFee, shipping, total, referralCode });
  console.log('[Customer Checkout] Items detail:', items?.map(item => ({
    id: item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    total: item.price * item.quantity
  })));
  
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  
  // Shipping form state
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    mobile: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' or 'razorpay'

  useEffect(() => {
    // Only redirect if cart is empty AND not currently processing an order AND not just placed
    if (items.length === 0 && !orderPlaced && !orderLoading) {
      toast.error('Your cart is empty');
      router.push('/customer/products');
      return;
    }
    
    // Pre-fill user info
    if (user) {
      const userName = user.name || user.fullName || user.email?.split('@')[0] || '';
      setShippingInfo(prev => ({
        ...prev,
        fullName: userName,
        mobile: user.mobile || '',
        email: user.email || '',
      }));
    }
  }, [items.length, user, router, orderPlaced, orderLoading]);

  const validateShippingInfo = () => {
    if (!shippingInfo.fullName?.trim()) {
      toast.error('Please enter your full name');
      return false;
    }
    if (!shippingInfo.mobile?.trim() || !/^[0-9]{10}$/.test(shippingInfo.mobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return false;
    }
    if (!shippingInfo.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(shippingInfo.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    if (!shippingInfo.address?.trim()) {
      toast.error('Please enter your delivery address');
      return false;
    }
    if (!shippingInfo.city?.trim()) {
      toast.error('Please enter your city');
      return false;
    }
    if (!shippingInfo.state?.trim()) {
      toast.error('Please enter your state');
      return false;
    }
    if (!shippingInfo.pincode?.trim() || !/^[0-9]{6}$/.test(shippingInfo.pincode)) {
      toast.error('Please enter a valid 6-digit pincode');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateShippingInfo()) {
      return;
    }

    setOrderLoading(true);

    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          referralCode: item.referralCode,
        })),
        shippingAddress: shippingInfo,
        paymentMethod,
        referralCode: referralCode || items[0]?.referralCode,
        totalAmount: total,
      };

      const token = localStorage.getItem('token');
      const response = await fetch('/api/customer/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Mark order as placed
        setOrderPlaced(true);
        
        // Show success message
        toast.success('Order placed successfully!');
        
        // Store order ID before clearing cart
        const orderId = data.data?.orderId || data.data?.id;
        
        // Clear cart only after successful order creation
        dispatch(clearCart());
        
        // Small delay to ensure cart is cleared before navigation
        setTimeout(() => {
          // Redirect to order details or orders list
          if (orderId) {
            router.push(`/customer/orders/${orderId}`);
          } else {
            router.push('/customer/orders');
          }
        }, 100);
      } else {
        // Don't clear cart if order failed
        toast.error(data.message || 'Failed to place order. Please try again.');
        console.error('Order creation failed:', data);
      }
    } catch (error) {
      console.error('Place order error:', error);
      toast.error('Failed to place order. Please check your connection and try again.');
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(var(--color-background))' }}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/customer/cart')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              style={{ color: 'rgb(var(--color-text-secondary))' }}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'rgb(var(--color-text))' }}>
                <ShoppingCart className="h-8 w-8" />
                Checkout
              </h1>
              <p className="text-sm mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                Review your order and complete purchase
              </p>
            </div>
          </div>
        </div>
      </div>

      <main>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'rgb(var(--color-text))' }}>
                <MapPin className="h-5 w-5" />
                Delivery Information
              </h2>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--color-text))' }}>
                    Full Name <span style={{ color: 'rgb(var(--color-danger))' }}>*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'rgb(var(--color-text-secondary))' }} />
                    <input
                      type="text"
                      value={shippingInfo.fullName}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all"
                      style={{ 
                        backgroundColor: 'rgb(var(--color-background))',
                        borderColor: 'rgb(var(--color-border))',
                        color: 'rgb(var(--color-text))'
                      }}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                {/* Mobile and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--color-text))' }}>
                      Mobile Number <span style={{ color: 'rgb(var(--color-danger))' }}>*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'rgb(var(--color-text-secondary))' }} />
                      <input
                        type="tel"
                        value={shippingInfo.mobile}
                        onChange={(e) => setShippingInfo(prev => ({ ...prev, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                        className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all"
                        style={{ 
                          backgroundColor: 'rgb(var(--color-background))',
                          borderColor: 'rgb(var(--color-border))',
                          color: 'rgb(var(--color-text))'
                        }}
                        placeholder="9876543210"
                        maxLength="10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--color-text))' }}>
                      Email <span style={{ color: 'rgb(var(--color-danger))' }}>*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: 'rgb(var(--color-text-secondary))' }} />
                      <input
                        type="email"
                        value={shippingInfo.email}
                        onChange={(e) => setShippingInfo(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all"
                        style={{ 
                          backgroundColor: 'rgb(var(--color-background))',
                          borderColor: 'rgb(var(--color-border))',
                          color: 'rgb(var(--color-text))'
                        }}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--color-text))' }}>
                    Address <span style={{ color: 'rgb(var(--color-danger))' }}>*</span>
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 h-5 w-5" style={{ color: 'rgb(var(--color-text-secondary))' }} />
                    <textarea
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all"
                      style={{ 
                        backgroundColor: 'rgb(var(--color-background))',
                        borderColor: 'rgb(var(--color-border))',
                        color: 'rgb(var(--color-text))'
                      }}
                      placeholder="House No, Street, Area"
                      rows="3"
                      required
                    />
                  </div>
                </div>

                {/* City, State, Pincode */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--color-text))' }}>
                      City <span style={{ color: 'rgb(var(--color-danger))' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all"
                      style={{ 
                        backgroundColor: 'rgb(var(--color-background))',
                        borderColor: 'rgb(var(--color-border))',
                        color: 'rgb(var(--color-text))'
                      }}
                      placeholder="Mumbai"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--color-text))' }}>
                      State <span style={{ color: 'rgb(var(--color-danger))' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.state}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all"
                      style={{ 
                        backgroundColor: 'rgb(var(--color-background))',
                        borderColor: 'rgb(var(--color-border))',
                        color: 'rgb(var(--color-text))'
                      }}
                      placeholder="Maharashtra"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: 'rgb(var(--color-text))' }}>
                      Pincode <span style={{ color: 'rgb(var(--color-danger))' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.pincode}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all"
                      style={{ 
                        backgroundColor: 'rgb(var(--color-background))',
                        borderColor: 'rgb(var(--color-border))',
                        color: 'rgb(var(--color-text))'
                      }}
                      placeholder="400001"
                      maxLength="6"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'rgb(var(--color-text))' }}>
                <CreditCard className="h-5 w-5" />
                Payment Method
              </h2>

              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:opacity-80 transition-opacity" style={{ borderColor: paymentMethod === 'cod' ? 'rgb(var(--color-primary))' : 'rgb(var(--color-border))' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5"
                  />
                  <span className="ml-3 font-medium" style={{ color: 'rgb(var(--color-text))' }}>
                    Cash on Delivery (COD)
                  </span>
                </label>

                <label className="flex items-center p-4 border-2 rounded-lg cursor-not-allowed opacity-50" style={{ borderColor: 'rgb(var(--color-border))' }}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5"
                    disabled
                  />
                  <span className="ml-3 font-medium" style={{ color: 'rgb(var(--color-text))' }}>
                    Online Payment (Coming Soon)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="rounded-lg shadow p-6 sticky top-6" style={{ backgroundColor: 'rgb(var(--color-surface))' }}>
              <h2 className="text-xl font-bold mb-4" style={{ color: 'rgb(var(--color-text))' }}>
                Order Summary
              </h2>

              {/* Cart Items */}
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden" style={{ backgroundColor: 'rgb(var(--color-background))' }}>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6" style={{ color: 'rgb(var(--color-text-secondary))' }} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'rgb(var(--color-text))' }}>
                        {item.name}
                      </p>
                      <p className="text-xs" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                        Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-bold" style={{ color: 'rgb(var(--color-text))' }}>
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 border-t pt-4 mb-6" style={{ borderColor: 'rgb(var(--color-border))' }}>
                <div className="flex justify-between" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  <span>Subtotal</span>
                  <span className="font-semibold">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  <span>Platform Fee ({items.reduce((sum, item) => sum + item.quantity, 0)} items × ₹5)</span>
                  <span className="font-semibold">{formatPrice(platformFee || 0)}</span>
                </div>
                <div className="flex justify-between" style={{ color: 'rgb(var(--color-text-secondary))' }}>
                  <span>Shipping</span>
                  <span className="font-semibold">
                    {shipping === 0 ? (
                      <span style={{ color: 'rgb(var(--color-success))' }}>FREE</span>
                    ) : (
                      formatPrice(shipping)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-3" style={{ 
                  color: 'rgb(var(--color-text))',
                  borderColor: 'rgb(var(--color-border))'
                }}>
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={orderLoading}
                className="w-full btn btn-primary py-4 text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {orderLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    Place Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
