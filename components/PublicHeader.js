'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import {
  ShoppingCart,
  User,
  LogIn,
  Lock,
  Key,
  Building2,
  ShoppingBag,
  Store,
  Loader2,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  Package,
  LogOut,
  Heart,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import { logout } from '@/store/slices/authSlice';

export default function PublicHeader() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { totalItems } = useSelector((state) => state.cart);
  const dropdownRef = useRef(null);

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userType, setUserType] = useState('customer'); // customer, reseller, manufacturer
  const [authMode, setAuthMode] = useState('email-password'); // email-password, email-otp, mobile-otp
  const [loading, setLoading] = useState(false);

  // Auth form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const userTypeConfig = {
    customer: {
      icon: ShoppingBag,
      label: 'Customer',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      description: 'Shop products and track orders',
      supportsOtp: true,
    },
    reseller: {
      icon: Store,
      label: 'Reseller',
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      description: 'Sell products and earn commissions',
      supportsOtp: true,
      isResellerFlow: true,
    },
    manufacturer: {
      icon: Building2,
      label: 'Manufacturer',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      description: 'Manage products and inventory',
      supportsOtp: true,
    },
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
          userType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const { user: userData, token, refreshToken } = data.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        
        const { setCredentials } = await import('@/store/slices/authSlice');
        dispatch(setCredentials({ user: userData, token, refreshToken }));
        
        toast.success('Login successful!');
        setShowLoginModal(false);
        
        console.log('[PublicHeader Password Login] userType:', userType, 'userData.role:', userData.role);
        
        // Redirect based on the login type selected, not the user's actual role
        // This allows customers-turned-resellers to access either portal
        if (userType === 'admin') {
          console.log('[PublicHeader] Redirecting to admin dashboard');
          router.push('/admin/dashboard');
        } else if (userType === 'manufacturer') {
          console.log('[PublicHeader] Redirecting to manufacturer products');
          router.push('/manufacturer/products');
        } else if (userType === 'reseller') {
          console.log('[PublicHeader] Redirecting to reseller dashboard');
          router.push('/reseller/dashboard');
        } else if (userType === 'customer') {
          console.log('[PublicHeader] Redirecting to customer portal');
          router.push('/customer');
        } else {
          console.log('[PublicHeader] No userType match, using fallback based on role');
          // Fallback to role-based redirect if no userType selected
          if (userData.role === 'admin') {
            router.push('/admin/dashboard');
          } else if (userData.role === 'manufacturer') {
            router.push('/manufacturer/products');
          } else if (userData.role === 'reseller') {
            console.log('[PublicHeader Fallback] Redirecting to reseller dashboard');
            router.push('/reseller/dashboard');
          } else if (userData.role === 'customer') {
            router.push('/customer');
          }
        }
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
      // Determine if sending email OTP or mobile OTP
      const requestBody = authMode === 'email-otp'
        ? { email, userType, purpose: 'login' }
        : { mobile, userType, purpose: 'login' };
      
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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
      // Determine if verifying email OTP or mobile OTP
      const requestBody = authMode === 'email-otp'
        ? { email, otp, userType }
        : { mobile, otp, userType };
      
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        const { user: userData, token, refreshToken } = data.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        
        const { setCredentials } = await import('@/store/slices/authSlice');
        dispatch(setCredentials({ user: userData, token, refreshToken }));
        
        toast.success('Login successful!');
        setShowLoginModal(false);
        
        console.log('[PublicHeader OTP Login] userType:', userType, 'userData.role:', userData.role);
        
        // Redirect based on the login type selected, not the user's actual role
        // This allows customers-turned-resellers to access either portal
        if (userType === 'admin') {
          console.log('[PublicHeader OTP] Redirecting to admin dashboard');
          router.push('/admin/dashboard');
        } else if (userType === 'manufacturer') {
          console.log('[PublicHeader OTP] Redirecting to manufacturer products');
          router.push('/manufacturer/products');
        } else if (userType === 'reseller') {
          console.log('[PublicHeader OTP] Redirecting to reseller dashboard');
          router.push('/reseller/dashboard');
        } else if (userType === 'customer') {
          console.log('[PublicHeader OTP] Redirecting to customer portal');
          router.push('/customer');
        } else {
          console.log('[PublicHeader OTP] No userType match, using fallback based on role');
          // Fallback to role-based redirect if no userType selected
          if (userData.role === 'admin') {
            router.push('/admin/dashboard');
          } else if (userData.role === 'manufacturer') {
            router.push('/manufacturer/products');
          } else if (userData.role === 'reseller') {
            console.log('[PublicHeader OTP Fallback] Redirecting to reseller dashboard');
            router.push('/reseller/dashboard');
          } else if (userData.role === 'customer') {
            router.push('/customer');
          }
        }
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

  const resetModalState = () => {
    setEmail('');
    setPassword('');
    setMobile('');
    setOtp('');
    setOtpSent(false);
    setAuthMode('email-password');
    setLoading(false);
  };

  const handleModalClose = () => {
    setShowLoginModal(false);
    resetModalState();
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
    resetModalState();
  };

  const handleLogout = () => {
    const userRole = user?.role;
    dispatch(logout());
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    toast.success('Logged out successfully');
    
    // Redirect to role-specific login page
    if (userRole === 'manufacturer') {
      router.push('/login/manufacturer');
    } else if (userRole === 'customer') {
      router.push('/login/customer');
    } else if (userRole === 'reseller') {
      router.push('/login');
    } else if (userRole === 'admin') {
      router.push('/login/admin');
    } else {
      router.push('/');
    }
    setShowDropdown(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    const role = user.role;
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'manufacturer') return '/manufacturer/products';
    if (role === 'reseller') return '/reseller/dashboard';
    if (role === 'customer') return '/customer';
    return '/';
  };

  return (
    <>
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 w-full">
            {/* Logo - Left Side */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 group flex-shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight whitespace-nowrap">SKAARVI</h1>
                <p className="hidden sm:block text-xs text-white/90 -mt-1 font-medium truncate">India's Premier B2B Reseller Marketplace</p>
              </div>
            </Link>

            {/* Right Actions */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Cart */}
              <Link
                href={isAuthenticated ? "/customer/cart" : "/cart"}
                className="relative p-2 sm:p-2.5 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300 transform hover:scale-110"
              >
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-lg animate-pulse">
                    {totalItems > 9 ? '9+' : totalItems}
                  </span>
                )}
              </Link>

              {/* User Menu Dropdown */}
              <div className="relative overflow-visible" ref={dropdownRef} style={{ zIndex: 100 }}>
                {isAuthenticated && user ? (
                  /* Authenticated User Menu */
                  <>
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center gap-2 px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                      aria-label="User menu"
                    >
                      <div className="flex items-center gap-2">
                        <div className="bg-white/20 backdrop-blur-md rounded-full p-2 ring-2 ring-white/30">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <div className="hidden md:flex flex-col items-start">
                          <span className="text-sm font-semibold text-white">
                            {user.name || user.full_name || user.email}
                          </span>
                          <span className="text-xs text-white/70 capitalize">
                            {user.role}
                          </span>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {/* Authenticated Dropdown */}
                    {showDropdown && (
                      <div 
                        className="absolute right-0 mt-3 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
                        style={{ 
                          zIndex: 10000,
                          position: 'absolute',
                          top: '100%',
                          right: 0
                        }}
                      >
                        <div className="p-2">
                          <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-xl mb-2">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">
                              {user.name || user.full_name || user.email}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">{user.email}</p>
                            <span className="inline-block mt-2 px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded-full capitalize">
                              {user.role}
                            </span>
                          </div>

                          {/* Dashboard Link */}
                          <Link
                            href={getDashboardLink()}
                            onClick={() => setShowDropdown(false)}
                            className="flex items-center gap-3 px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 group"
                          >
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
                              <LayoutDashboard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">Dashboard</span>
                          </Link>

                          {/* Orders/Products Link */}
                          {user.role === 'customer' && (
                            <>
                              <Link
                                href="/customer/orders"
                                onClick={() => setShowDropdown(false)}
                                className="flex items-center gap-3 px-4 py-3 text-left hover:bg-purple-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 group"
                              >
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:scale-110 transition-transform">
                                  <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">My Orders</span>
                              </Link>

                              <Link
                                href="/customer/wishlist"
                                onClick={() => setShowDropdown(false)}
                                className="flex items-center gap-3 px-4 py-3 text-left hover:bg-pink-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 group"
                              >
                                <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg group-hover:scale-110 transition-transform">
                                  <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">Wishlist</span>
                              </Link>

                              <Link
                                href="/customer/profile"
                                onClick={() => setShowDropdown(false)}
                                className="flex items-center gap-3 px-4 py-3 text-left hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 group"
                              >
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg group-hover:scale-110 transition-transform">
                                  <Settings className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white">Profile</span>
                              </Link>
                            </>
                          )}

                          {/* Logout */}
                          <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 group"
                            >
                              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:scale-110 transition-transform">
                                <LogOut className="h-5 w-5 text-red-600 dark:text-red-400" />
                              </div>
                              <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                                Logout
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* Guest User Menu */
                  <>
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center gap-2 px-3 py-2 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                      aria-label="User menu"
                    >
                      {showDropdown ? (
                        <X className="h-6 w-6" />
                      ) : (
                        <Menu className="h-6 w-6" />
                      )}
                    </button>

                    {/* Guest Dropdown Menu */}
                    {showDropdown && (
                  <div 
                    className="absolute right-0 mt-3 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700"
                    style={{ 
                      zIndex: 10000,
                      position: 'absolute',
                      top: '100%',
                      right: 0
                    }}
                  >
                    <div className="p-3">
                      <div className="px-3 py-2 mb-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-xl">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Login to Continue</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300">Choose your account type</p>
                      </div>
                      
                      {/* Customer Login */}
                      <button
                        onClick={() => {
                          console.log('[PublicHeader] User clicked Customer login option');
                          setUserType('customer');
                          setShowLoginModal(true);
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 group"
                      >
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:scale-110 transition-transform">
                          <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white">Customer</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Shop products</div>
                        </div>
                      </button>

                      {/* Reseller Login */}
                      <button
                        onClick={() => {
                          setUserType('reseller');
                          setShowLoginModal(true);
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-xl transition-all duration-200 group"
                      >
                        <div className="p-2.5 bg-pink-100 dark:bg-pink-900/30 rounded-lg group-hover:scale-110 transition-transform">
                          <Store className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white">Reseller</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Earn commissions</div>
                        </div>
                      </button>

                      {/* Manufacturer Login */}
                      <button
                        onClick={() => {
                          setUserType('manufacturer');
                          setShowLoginModal(true);
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all duration-200 group"
                      >
                        <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:scale-110 transition-transform">
                          <Building2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white">Manufacturer</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Manage products</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-[60] overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[98vh] sm:max-h-[90vh] overflow-y-auto my-2 sm:my-4">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 sm:p-6 flex items-center justify-between z-10">
              <div className="pr-8">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                  Sign in to Skaarvi
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Choose your account type to continue
                </p>
              </div>
              <button
                onClick={handleModalClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 absolute top-3 right-3 sm:relative sm:top-0 sm:right-0"
              >
                <X className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>
            </div>

            <div className="p-3 sm:p-6">
              {/* User Type Selection */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {Object.entries(userTypeConfig).map(([key, config]) => {
                  const Icon = config.icon;
                  const isActive = userType === key;

                  return (
                    <button
                      key={key}
                      onClick={() => handleUserTypeChange(key)}
                      className={`p-2 sm:p-4 rounded-lg border-2 transition-all ${
                        isActive
                          ? `${config.bgColor} border-current ${config.color}`
                          : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <Icon className={`h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 ${isActive ? config.color : ''}`} />
                      <p className="text-xs sm:text-sm font-semibold text-center">{config.label}</p>
                    </button>
                  );
                })}
              </div>

              {/* Description */}
              <div className={`${userTypeConfig[userType].bgColor} rounded-lg p-3 sm:p-4 mb-4 sm:mb-6`}>
                <p className={`text-xs sm:text-sm font-medium ${userTypeConfig[userType].color} text-center`}>
                  {userTypeConfig[userType].description}
                </p>
              </div>

              {/* Auth Mode Selection - Compact Tabs */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Choose Login Method
                </label>
                <div className="flex gap-1 p-0.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('email-password');
                      setOtpSent(false);
                    }}
                    className={`flex-1 py-2.5 px-2 rounded-md font-medium text-xs transition-all flex flex-col items-center gap-0.5 ${
                      authMode === 'email-password'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="Sign in with email and password"
                  >
                    <Lock className="w-4 h-4" />
                    <span className="text-[10px]">Password</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('email-otp');
                      setOtpSent(false);
                    }}
                    className={`flex-1 py-2.5 px-2 rounded-md font-medium text-xs transition-all flex flex-col items-center gap-0.5 ${
                      authMode === 'email-otp'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="Get OTP on your email"
                  >
                    <Key className="w-4 h-4" />
                    <span className="text-[10px]">Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('mobile-otp');
                      setOtpSent(false);
                    }}
                    className={`flex-1 py-2.5 px-2 rounded-md font-medium text-xs transition-all flex flex-col items-center gap-0.5 ${
                      authMode === 'mobile-otp'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                    title="Get OTP on your mobile"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-[10px]">Mobile</span>
                  </button>
                </div>
              </div>

              {/* Email + Password Login Form */}
              {authMode === 'email-password' && (
                <form onSubmit={handlePasswordLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white py-2 sm:py-3 text-sm sm:text-base rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
                        Sign In
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Email OTP Login Form */}
              {authMode === 'email-otp' && (
                <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                      disabled={otpSent}
                      required
                    />
                  </div>
                  {otpSent && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Enter OTP
                      </label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit OTP"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                        maxLength="6"
                        autoFocus
                        required
                      />
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white py-2 sm:py-3 text-sm sm:text-base rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        {otpSent ? 'Verifying...' : 'Sending OTP...'}
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4 sm:h-5 sm:w-5" />
                        {otpSent ? 'Verify OTP' : 'Send OTP to Email'}
                      </>
                    )}
                  </button>
                  {otpSent && (
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-full text-xs sm:text-sm text-green-600 dark:text-green-400 hover:underline"
                    >
                      Change email address
                    </button>
                  )}
                </form>
              )}

              {/* Mobile OTP Login Form */}
              {authMode === 'mobile-otp' && (
                <form onSubmit={otpSent ? handleVerifyOTP : handleSendOTP} className="space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="Enter 10-digit mobile number"
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                      maxLength="10"
                      disabled={otpSent}
                      required
                    />
                  </div>
                  {otpSent && (
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Enter OTP
                      </label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="Enter 6-digit OTP"
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 dark:focus:border-blue-400"
                        maxLength="6"
                        autoFocus
                        required
                      />
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800 text-white py-2 sm:py-3 text-sm sm:text-base rounded-lg font-semibold transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        {otpSent ? 'Verifying...' : 'Sending OTP...'}
                      </>
                    ) : (
                      <>
                        <User className="h-4 w-4 sm:h-5 sm:w-5" />
                        {otpSent ? 'Verify OTP' : 'Send OTP to Mobile'}
                      </>
                    )}
                  </button>
                  {otpSent && (
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-full text-xs sm:text-sm text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      Change mobile number
                    </button>
                  )}
                </form>
              )}

              {/* Sign Up Link */}
              <div className="mt-4 sm:mt-6 text-center">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <Link
                    href={
                      userType === 'customer' || userType === 'reseller'
                        ? '/register/customer'
                        : userType === 'manufacturer'
                        ? '/manufacturer/register'
                        : '#'
                    }
                    onClick={() => setShowLoginModal(false)}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    Sign Up
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
