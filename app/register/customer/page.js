'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { ShoppingCart, User, Mail, Phone, Lock, MapPin, ArrowRight, Loader2, AlertCircle, Tag, Eye, EyeOff, ShieldCheck, PackageCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { setCredentials } from '@/store/slices/authSlice';
import RegistrationWorkspace from '@/components/RegistrationWorkspace';

const CUSTOMER_REQUIRED_FIELDS = ['name', 'email', 'phone', 'password', 'confirmPassword'];

const CUSTOMER_HIGHLIGHTS = [
  {
    label: 'One shopping account',
    description: 'Orders, returns, and saved products together',
    icon: ShoppingCart,
  },
  {
    label: 'Protected checkout',
    description: 'Secure account and payment access',
    icon: ShieldCheck,
  },
  {
    label: 'Referral ready',
    description: 'Connect an invited reseller code',
    icon: PackageCheck,
  },
];

export default function CustomerRegistrationPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    referral_code: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const completedFieldCount = CUSTOMER_REQUIRED_FIELDS.filter(field => Boolean(formData[field])).length;
  const completionPercentage = Math.round((completedFieldCount / CUSTOMER_REQUIRED_FIELDS.length) * 100);

  // Pre-fill referral code from URL
  useEffect(() => {
    const refCode = searchParams.get('ref') || searchParams.get('referral');
    if (refCode) {
      setFormData(prev => ({ ...prev, referral_code: refCode }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.name || formData.name.trim().length < 3) {
      setError('Name must be at least 3 characters');
      return false;
    }

    const email = formData.email.trim();
    const atIndex = email.indexOf('@');
    const lastDotIndex = email.lastIndexOf('.');
    if (atIndex <= 0 || lastDotIndex <= atIndex + 1 || lastDotIndex === email.length - 1) {
      setError('Please enter a valid email address');
      return false;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Phone number must be 10 digits');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    console.log('[Customer Registration] Starting registration');

    try {
      // Prepare data for API (exclude confirmPassword)
      const { confirmPassword, ...registrationData } = formData;

      const response = await fetch('/api/auth/register/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();
      console.log('[Customer Registration] Response:', response.status);

      if (!response.ok) {
        if (data.message?.includes('already registered')) {
          toast.error('This email or phone is already registered');
          setError(data.message);
          setTimeout(() => {
            router.push('/login/customer');
          }, 2000);
          return;
        }
        throw new Error(data.message || 'Registration failed');
      }

      const { user, token, refreshToken } = data.data;

      // Store tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      // Update Redux store
      dispatch(setCredentials({ user, token, refreshToken }));

      toast.success('Registration successful! Welcome to our store!');

      // Check if there's a redirect URL, otherwise go to homepage
      const redirectUrl = searchParams.get('redirect');
      setTimeout(() => {
        router.push(redirectUrl || '/');
      }, 1000);

    } catch (err) {
      console.error('[Customer Registration] Error:', err);
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegistrationWorkspace
      icon={ShoppingCart}
      networkLabel="Customer Marketplace"
      badgeLabel="Customer account"
      title="Shop with one account."
      description="Create your customer profile to save products, place orders, and manage every purchase in one place."
      highlights={CUSTOMER_HIGHLIGHTS}
      completion={completionPercentage}
      sectionEyebrow="Customer registration"
      sectionTitle="Create your account"
      sectionDescription="Your shopping profile and delivery details"
      footer={(
        <p>
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => router.push('/login/customer')}
            className="font-semibold text-blue-600 hover:text-purple-700 dark:text-blue-400"
          >
            Sign in
          </button>
        </p>
      )}
    >
      <div className="space-y-6">
        {error && (
            <div className="flex items-start gap-3 border border-red-200 bg-red-50 p-4">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 text-gray-900 placeholder:text-gray-400"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Email and Phone in a row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 text-gray-900 placeholder:text-gray-400"
                    disabled={loading}
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData(prev => ({ ...prev, phone: value }));
                    }}
                    placeholder="9876543210"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 text-gray-900 placeholder:text-gray-400"
                    disabled={loading}
                    required
                    maxLength="10"
                  />
                </div>
              </div>
            </div>

            {/* Password and Confirm Password in a row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 text-gray-900 placeholder:text-gray-400"
                    disabled={loading}
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(current => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-0 top-0 grid h-full w-12 place-items-center border-l border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 text-gray-900 placeholder:text-gray-400"
                    disabled={loading}
                    required
                    minLength="6"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(current => !current)}
                    aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                    title={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                    className="absolute right-0 top-0 grid h-full w-12 place-items-center border-l border-gray-200 text-gray-500 hover:bg-blue-50 hover:text-blue-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Address (Optional) */}
            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Address (Optional)
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="House no., Street, Area"
                  rows="2"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 text-gray-900 placeholder:text-gray-400 resize-none"
                  disabled={loading}
                />
              </div>
            </div>

            {/* City, State, Pincode in a row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City (Optional)
                </label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 text-gray-900 placeholder:text-gray-400"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State (Optional)
                </label>
                <input
                  id="state"
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Maharashtra"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 text-gray-900 placeholder:text-gray-400"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                  Pincode (Optional)
                </label>
                <input
                  id="pincode"
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setFormData(prev => ({ ...prev, pincode: value }));
                  }}
                  placeholder="400001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 text-gray-900 placeholder:text-gray-400"
                  disabled={loading}
                  maxLength="6"
                />
              </div>
            </div>

            {/* Referral Code */}
            <div className="space-y-2">
              <label htmlFor="referral_code" className="block text-sm font-medium text-gray-700">
                Referral Code (Optional)
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="referral_code"
                  type="text"
                  name="referral_code"
                  value={formData.referral_code}
                  onChange={handleChange}
                  placeholder="Enter reseller code if you have one"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 text-gray-900 placeholder:text-gray-400 uppercase"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500">
                If you were referred by a reseller, enter their code here
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 border border-blue-600 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white hover:-translate-y-0.5 hover:from-blue-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="border-t border-slate-200 pt-5">
            <div className="border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/40">
              <p className="text-sm text-gray-700 font-medium mb-2 text-center">
                Want to earn by reselling products instead?
              </p>
              <button
                onClick={() => router.push('/register/reseller')}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 border border-indigo-600 bg-white px-4 py-2 font-semibold text-indigo-700 hover:bg-indigo-600 hover:text-white dark:bg-slate-900 dark:text-indigo-300"
              >
                Register as Reseller
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
      </div>
    </RegistrationWorkspace>
  );
}
