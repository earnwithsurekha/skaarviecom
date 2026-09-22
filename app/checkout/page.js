'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { 
  ShoppingCart, 
  MapPin, 
  CreditCard, 
  ArrowLeft, 
  ArrowRight, 
  Package,
  Loader2,
  User,
  Phone,
  Mail,
  Home,
  X,
  Lock,
  Key
} from 'lucide-react';
import { clearCart } from '@/store/slices/cartSlice';
import { persistor } from '@/store';
import { formatPrice } from '@/lib/cartUtils';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  
  const { items, total, subtotal, shipping, referralCode } = useSelector((state) => state.cart);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const hasCustomerSession = isAuthenticated && (
    user?.role === 'customer' || Boolean(user?.customerId)
  );
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('email-password');
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  
  // Auth form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  let emailOtpSubmitLabel = 'Send OTP to Email';
  if (loading && otpSent) {
    emailOtpSubmitLabel = 'Verifying...';
  } else if (loading) {
    emailOtpSubmitLabel = 'Sending OTP...';
  } else if (otpSent) {
    emailOtpSubmitLabel = 'Verify OTP';
  }
  
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
    // Only redirect if cart is empty AND not currently processing an order
    if (items.length === 0 && !orderLoading) {
      toast.error('Your cart is empty');
      router.push('/products');
      return;
    }
    
    // Pre-fill user info if logged in
    if (hasCustomerSession && user) {
      console.log('[Checkout] User data:', { name: user.name, fullName: user.fullName, email: user.email, mobile: user.mobile });
      const userName = user.name || user.fullName || user.email?.split('@')[0] || '';
      console.log('[Checkout] Using name:', userName);
      setShippingInfo(prev => ({
        ...prev,
        fullName: userName,
        mobile: user.mobile || '',
        email: user.email || '',
      }));
    } else {
      // Show auth modal if not logged in
      setShowAuthModal(true);
    }
  }, [items.length, hasCustomerSession, user, orderLoading]);

  const handleAuthModalClose = () => {
    router.push('/cart');
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: email,
          password,
          userType: 'customer',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const { user, token, refreshToken } = data.data;
        
        console.log('[Checkout Login] User data received:', { 
          name: user.name, 
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile
        });
        
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        
        // Update Redux store
        const { setCredentials } = await import('@/store/slices/authSlice');
        dispatch(setCredentials({ user, token, refreshToken }));
        await persistor.flush();
        
        toast.success('Login successful!');
        setShowAuthModal(false);
        
        // Pre-fill shipping info with all available name fields
        const userName = user.name || user.fullName || user.full_name || user.email?.split('@')[0] || '';
        console.log('[Checkout Login] Using name:', userName);
        
        setShippingInfo(prev => ({
          ...prev,
          fullName: userName || prev.fullName,
          mobile: user.mobile || prev.mobile,
          email: user.email || prev.email,
        }));
      } else {
        toast.error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          userType: 'customer',
          purpose: 'login',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('OTP sent to your email!');
        setOtp('');
        setOtpSent(true);
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send email OTP error:', error);
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          otp,
          userType: 'customer',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const { user, token, refreshToken } = data.data;

        console.log('[Checkout Email OTP Login] User data received:', {
          name: user.name,
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile
        });

        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);

        const { setCredentials } = await import('@/store/slices/authSlice');
        dispatch(setCredentials({ user, token, refreshToken }));
        await persistor.flush();

        toast.success('Login successful!');
        setShowAuthModal(false);

        const userName = user.name || user.fullName || user.full_name || user.email?.split('@')[0] || '';
        setShippingInfo(prev => ({
          ...prev,
          fullName: userName || prev.fullName,
          mobile: user.mobile || prev.mobile,
          email: user.email || prev.email,
        }));
      } else {
        toast.error(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Verify email OTP error:', error);
      toast.error('Verification failed');
    } finally {
      setLoading(false);
    }
  };

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
    if (!hasCustomerSession) {
      setShowAuthModal(true);
      toast.error('Please sign in as a customer to place your order');
      return;
    }

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
          selectedSize: item.selectedSize || null,
          selectedColor: item.selectedColor || null,
        })),
        shippingAddress: shippingInfo,
        paymentMethod,
        referralCode: referralCode || items[0]?.referralCode,
        totalAmount: total,
      };

      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const response = await fetch('/api/customer/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (response.ok && (data.success || data.status === 'success')) {
        // Show success message
        toast.success('Order placed successfully!');
        
        // Store order ID before clearing cart
        const orderId = data.data?.orderId || data.data?.id;
        
        // Clear cart only after successful order creation
        dispatch(clearCart());
        
        // Small delay to ensure cart is cleared before navigation
        setTimeout(() => {
          // Redirect to order success page or order details
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/cart')}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <ShoppingCart className="h-8 w-8" />
                  Checkout
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Review your order and complete purchase
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Information
              </h2>

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={shippingInfo.fullName}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                {/* Mobile and Email */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        value={shippingInfo.mobile}
                        onChange={(e) => setShippingInfo(prev => ({ ...prev, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                        placeholder="9876543210"
                        maxLength="10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={shippingInfo.email}
                        onChange={(e) => setShippingInfo(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Delivery Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <textarea
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 resize-none"
                      placeholder="House no., Street, Area"
                      rows="2"
                      required
                    />
                  </div>
                </div>

                {/* City, State, Pincode */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.city}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                      placeholder="Mumbai"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      State <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.state}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, state: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                      placeholder="Maharashtra"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingInfo.pincode}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                      placeholder="400001"
                      maxLength="6"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </h2>

              <div className="space-y-3">
                <label className="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="ml-3 text-gray-900 dark:text-white font-medium">
                    Cash on Delivery (COD)
                  </span>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors opacity-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-5 h-5 text-blue-600"
                    disabled
                  />
                  <span className="ml-3 text-gray-900 dark:text-white font-medium">
                    Online Payment (Coming Soon)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Order Summary
              </h2>

              {/* Cart Items */}
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.cartItemId || `${item.productId}::${item.selectedSize || ''}::${item.selectedColor || ''}`} className="flex gap-3">
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.selectedColor ? `Color: ${item.selectedColor} · ` : ''}
                        {item.selectedSize ? `Size: ${item.selectedSize} · ` : ''}Qty: {item.quantity}
                      </p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal</span>
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
                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-3">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={orderLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {orderLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Processing Order...
                  </>
                ) : (
                  <>
                    Place Order
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
                By placing this order, you agree to our terms and conditions
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white dark:bg-gray-900 sm:flex sm:items-center sm:justify-center sm:bg-black/50 sm:p-4">
          <section
            className="relative min-h-[100dvh] w-full bg-white px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-[calc(5rem+env(safe-area-inset-top))] dark:bg-gray-800 sm:min-h-0 sm:max-h-[90vh] sm:max-w-md sm:overflow-y-auto sm:rounded-lg sm:p-8"
            aria-label="Customer sign in"
          >
            <div className="absolute left-5 top-[calc(1rem+env(safe-area-inset-top))] flex items-center gap-2 sm:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">SKAARVI</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Secure checkout</p>
              </div>
            </div>
            <button
              onClick={handleAuthModalClose}
              className="absolute right-3 top-[calc(.75rem+env(safe-area-inset-top))] z-10 flex h-11 w-11 items-center justify-center text-gray-500 hover:text-gray-700 sm:right-4 sm:top-4 dark:hover:text-gray-200"
              aria-label="Close sign in"
            >
              <X className="h-6 w-6" />
            </button>

            <h2 className="mb-1 pr-8 text-2xl font-bold text-gray-900 sm:mb-2 dark:text-white">
              Sign in to Continue
            </h2>
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
              Access your saved address, order history, and secure checkout.
            </p>

            {/* Auth Method Tabs */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('email-password');
                  setOtpSent(false);
                  setOtp('');
                }}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-md px-2 py-2 text-xs font-medium transition-colors sm:text-sm ${
                  authMode === 'email-password'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Lock className="h-4 w-4 flex-shrink-0" />
                <span>Email &amp; Password</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('email-otp');
                  setOtpSent(false);
                  setOtp('');
                }}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-md px-2 py-2 text-xs font-medium transition-colors sm:text-sm ${
                  authMode === 'email-otp'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Key className="h-4 w-4 flex-shrink-0" />
                <span>Email OTP</span>
              </button>
            </div>

            {/* Email and Password Login Form */}
            {authMode === 'email-password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="min-h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 transition-colors duration-200 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="min-h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 transition-colors duration-200 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-12 w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            )}

            {/* Email OTP Login Form */}
            {authMode === 'email-otp' && (
              <form
                onSubmit={otpSent ? handleVerifyEmailOTP : handleSendEmailOTP}
                className="space-y-4"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  className="min-h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 transition-colors duration-200 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  disabled={otpSent}
                  required
                />
                {otpSent && (
                  <input
                    type="text"
                    inputMode="numeric"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="min-h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 transition-colors duration-200 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    maxLength="6"
                    required
                  />
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-12 w-full rounded-lg bg-blue-600 py-3 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {emailOtpSubmitLabel}
                </button>
                {otpSent && (
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp('');
                    }}
                    className="w-full text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Change email address
                  </button>
                )}
              </form>
            )}

            <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              Don't have an account?{' '}
              <button
                onClick={() => {
                  const signupParams = new URLSearchParams({ redirect: '/checkout' });
                  const checkoutReferralCode = referralCode || items[0]?.referralCode;
                  if (checkoutReferralCode) signupParams.set('ref', checkoutReferralCode);
                  router.push(`/register/customer?${signupParams.toString()}`);
                }}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign Up
              </button>
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
