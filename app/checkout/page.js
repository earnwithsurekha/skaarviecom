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
import { formatPrice } from '@/lib/cartUtils';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  
  const { items, total, subtotal, shipping, referralCode } = useSelector((state) => state.cart);
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('password'); // 'password' or 'otp'
  const [loading, setLoading] = useState(false);
  const [orderLoading, setOrderLoading] = useState(false);
  
  // Auth form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  
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
    if (isAuthenticated && user) {
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
  }, [items.length, isAuthenticated, user, orderLoading]);

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
    // Don't navigate away - let them continue as guest
  };

  const handleGuestCheckout = () => {
    setShowAuthModal(false);
    toast('Continuing as guest. You\'ll create an account after placing the order.');
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
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

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile,
          userType: 'customer',
          purpose: 'login',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('OTP sent successfully!');
        setOtpSent(true);
      } else {
        toast.error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile,
          otp,
          userType: 'customer',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const { user, token, refreshToken } = data.data;
        
        console.log('[Checkout OTP Login] User data received:', { 
          name: user.name, 
          fullName: user.fullName,
          email: user.email,
          mobile: user.mobile
        });
        
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        
        const { setCredentials } = await import('@/store/slices/authSlice');
        dispatch(setCredentials({ user, token, refreshToken }));
        
        toast.success('Login successful!');
        setShowAuthModal(false);
        
        // Pre-fill shipping info with all available name fields
        const userName = user.name || user.fullName || user.full_name || user.email?.split('@')[0] || '';
        console.log('[Checkout OTP Login] Using name:', userName);
        
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
      console.error('Verify OTP error:', error);
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

      // Prepare headers with optional authentication
      const headers = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if user is authenticated
      if (isAuthenticated) {
        const token = localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch('/api/customer/orders', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
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
                  <div key={item.productId} className="flex gap-3">
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
                        Qty: {item.quantity}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full p-4 sm:p-8 relative my-4 sm:my-8 max-h-[95vh] overflow-y-auto">
            <button
              onClick={handleAuthModalClose}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 z-10"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2 pr-8">
              Sign in to Continue
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6">
              Login to complete your purchase
            </p>

            {/* Auth Tabs */}
            <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <button
                onClick={() => setAuthMode('password')}
                className={`flex-1 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  authMode === 'password'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Lock className="w-3 h-3 sm:w-4 sm:h-4 inline-block mr-1 sm:mr-2" />
                Password
              </button>
              <button
                onClick={() => {
                  setAuthMode('otp');
                  setOtpSent(false);
                }}
                className={`flex-1 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  authMode === 'otp'
                    ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                <Key className="w-3 h-3 sm:w-4 sm:h-4 inline-block mr-1 sm:mr-2" />
                OTP
              </button>
            </div>

            {/* Password Login Form */}
            {authMode === 'password' && (
              <form onSubmit={handlePasswordLogin} className="space-y-3 sm:space-y-4">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Email or Mobile"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                  required
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3 text-sm sm:text-base rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            )}

            {/* OTP Login Form */}
            {authMode === 'otp' && (
              <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} className="space-y-3 sm:space-y-4">
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Mobile Number"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                  maxLength="10"
                  disabled={otpSent}
                  required
                />
                {otpSent && (
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                    maxLength="6"
                    autoFocus
                    required
                  />
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3 text-sm sm:text-base rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : otpSent ? 'Verify OTP' : 'Send OTP'}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="relative my-4 sm:my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-xs sm:text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">OR</span>
              </div>
            </div>

            {/* Guest Checkout Button */}
            <button
              onClick={handleGuestCheckout}
              className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 py-2 sm:py-3 text-sm sm:text-base rounded-lg font-semibold transition-colors"
            >
              Continue as Guest
            </button>

            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3 sm:mt-4">
              Don't have an account?{' '}
              <button
                onClick={() => router.push('/register/customer')}
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Sign Up
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
