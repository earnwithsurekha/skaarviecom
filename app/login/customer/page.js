'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { ShoppingCart, Mail, ArrowRight, Loader2, AlertCircle, ArrowLeft, UserPlus, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { setCredentials } from '@/store/slices/authSlice';

function CustomerLoginForm() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  
  // Password login state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password login handler
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier || !password) {
      setError('Please enter your email/mobile and password');
      return;
    }

    setLoading(true);
    console.log('[Customer Password Login] Attempting login with identifier:', identifier);
    
    try {
      const response = await fetch(`/api/auth/login/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          identifier, 
          password,
          userType: 'customer' 
        }),
      });
      
      console.log('[Customer Password Login] Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Customer Password Login] Error response:', errorData);
        
        if (errorData.code === 'USER_NOT_FOUND') {
          toast.error('Account not found. Please register first.');
          setTimeout(() => {
            router.push('/register/customer');
          }, 2000);
          return;
        }
        if (errorData.code === 'INVALID_PASSWORD') {
          toast.error('Invalid password. Please try again.');
          setError('Invalid password');
          return;
        }
        if (errorData.code === 'ROLE_MISMATCH') {
          toast.error('Please use the correct login page for your account type.');
          return;
        }
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      console.log('[Customer Password Login] Success, user role:', data.data?.user?.role);
      
      const { user, token, refreshToken } = data.data;

      // Allow customers and resellers with customer access
      // (The backend already validated they have customer access)
      if (user.role !== 'customer' && user.role !== 'reseller') {
        toast.error('Please use the correct login page for your account type.');
        return;
      }

      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      // Update Redux store
      dispatch(setCredentials({ user, token, refreshToken }));

      toast.success('Login successful!');
      
      // Always redirect to customer portal when logging in from customer login page
      const redirectUrl = searchParams.get('redirect');
      if (redirectUrl) {
        console.log('[Customer Password Login] Redirecting to:', redirectUrl);
        router.push(redirectUrl);
      } else {
        console.log('[Customer Password Login] Redirecting to /customer dashboard');
        router.push('/customer'); // Always go to customer dashboard
      }
    } catch (err) {
      console.error('[Customer Password Login] Caught error:', err);
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>

      <div className="relative w-full max-w-md">
        {/* Back to Home Button */}
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            {/* Icon */}
            <div className="inline-flex p-4 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl">
              <ShoppingCart className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customer Login</h1>
              <p className="text-gray-600 mt-2">Sign in to start shopping</p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Password Login Form */}
          <form onSubmit={handlePasswordLogin} className="space-y-4">
              {/* Email/Mobile Input */}
              <div className="space-y-2">
                <label htmlFor="identifier" className="block text-sm font-medium text-gray-700">
                  Email or Mobile Number
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="email@example.com or 9876543210"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 text-gray-900 placeholder:text-gray-400"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 text-gray-900 placeholder:text-gray-400"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-800 focus:ring-4 focus:ring-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
          </form>

          {/* Reseller CTA */}
          <div className="pt-4 border-t border-gray-200">
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-lg border border-pink-200">
              <p className="text-sm text-gray-700 font-medium mb-2">
                Want to earn by reselling products?
              </p>
              <button
                onClick={() => router.push('/register/reseller')}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-pink-700 hover:to-rose-700 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Become a Reseller
              </button>
            </div>
          </div>

          {/* Registration Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              New customer?{' '}
              <button
                onClick={() => router.push('/register/customer')}
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center">
        <div className="text-white text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    }>
      <CustomerLoginForm />
    </Suspense>
  );
}
