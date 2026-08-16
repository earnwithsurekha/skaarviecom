'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { Shield, Mail, ArrowRight, Loader2, AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { setCredentials } from '@/store/slices/authSlice';

export default function AdminLoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    console.log('[Admin Login] Attempting login with email:', email);
    
    try {
      const response = await fetch(`/api/auth/login-bypass`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userType: 'admin' }),
      });
      
      console.log('[Admin Login] Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Admin Login] Error response:', errorData);
        
        if (errorData.code === 'EMAIL_NOT_FOUND') {
          toast.error('Email not registered');
          return;
        }
        if (errorData.code === 'ROLE_MISMATCH') {
          toast.error('This login is for administrators only. Please use the correct login page.');
          return;
        }
        if (errorData.code === 'PROXY_ERROR') {
          toast.error('Connection error. Please check if the backend server is running.');
          setError(errorData.details || 'Backend connection failed');
          return;
        }
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      console.log('[Admin Login] Success, user role:', data.data?.user?.role);
      
      const { user, token, refreshToken } = data.data;

      // Verify user is admin
      if (user.role !== 'admin') {
        toast.error('This login is for administrators only. Please use the correct login page.');
        return;
      }

      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      // Update Redux store
      dispatch(setCredentials({ user, token, refreshToken }));

      toast.success('Welcome, Admin!');
      router.push('/admin/dashboard');
    } catch (err) {
      console.error('[Admin Login] Caught error:', err);
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzRjMWQ5NSIgc3Ryb2tlLXdpZHRoPSIxIiBvcGFjaXR5PSIwLjIiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>

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
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            {/* Icon */}
            <div className="inline-flex p-4 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl">
              <Shield className="w-10 h-10 text-white" />
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
              <p className="text-gray-600 mt-2">Secure access for platform administrators</p>
            </div>

            {/* Security Badge */}
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-sm">
              <Lock className="w-4 h-4" />
              <span className="font-medium">Secure Login</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Admin Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your admin email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-gray-900 placeholder:text-gray-400"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-indigo-900 focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="animate-pulse">Authenticating...</span>
                </>
              ) : (
                <>
                  Login as Administrator
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Info Notice */}
          <div className="pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              This login is restricted to platform administrators only. Unauthorized access attempts are logged and monitored.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
