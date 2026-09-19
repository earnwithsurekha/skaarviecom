'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  Shield,
  Upload,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  BadgeIndianRupee,
  Check,
  Fingerprint,
  Landmark,
  Loader2,
  Store
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';

const STEPS = [
  {
    id: 1,
    label: 'Your profile',
    description: 'Identity and location',
    icon: User
  },
  {
    id: 2,
    label: 'Verification',
    description: 'Optional KYC details',
    icon: Fingerprint
  },
  {
    id: 3,
    label: 'Payout setup',
    description: 'Where earnings arrive',
    icon: Landmark
  }
];

const REQUIRED_FIELDS = [
  'name',
  'email',
  'phone',
  'password',
  'confirmPassword',
  'city',
  'state',
  'bank_name',
  'account_number',
  'ifsc_code',
  'account_holder_name'
];

export default function ResellerRegistrationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referralCode = searchParams.get('sponsor') || searchParams.get('ref');

  const [step, setStep] = useState(1);
  const [furthestStep, setFurthestStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePreview, setProfilePreview] = useState(null);

  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: '',
    state: '',
    address: '',
    pincode: '',
    profile_photo: null,
    
    // KYC Details (Optional)
    pan_number: '',
    aadhar_number: '',
    gst_number: '',
    
    // Payment Details
    bank_name: '',
    account_number: '',
    ifsc_code: '',
    account_holder_name: '',
    upi_id: '',
    
    // Referral
    sponsor_code: referralCode || ''
  });

  const activeStep = STEPS[step - 1];
  const completedFieldCount = REQUIRED_FIELDS.filter(field => Boolean(formData[field])).length;
  const completionPercentage = Math.round((completedFieldCount / REQUIRED_FIELDS.length) * 100);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should not exceed 5MB');
        return;
      }
      setFormData(prev => ({ ...prev, profile_photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep1 = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.city || !formData.state) {
      toast.error('Please fill all required fields');
      return false;
    }
    if (!formData.password || formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    const email = formData.email.trim();
    const atIndex = email.indexOf('@');
    const lastDotIndex = email.lastIndexOf('.');
    if (atIndex <= 0 || lastDotIndex <= atIndex + 1 || lastDotIndex === email.length - 1) {
      toast.error('Invalid email format');
      return false;
    }
    if (!/^\d{10}$/.test(formData.phone)) {
      toast.error('Phone number must be 10 digits');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.bank_name || !formData.account_number || !formData.ifsc_code || !formData.account_holder_name) {
      toast.error('Please fill all payment details');
      return false;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifsc_code)) {
      toast.error('Invalid IFSC code format');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 3 && !validateStep3()) return;
    const nextStep = Math.min(step + 1, STEPS.length);
    setStep(nextStep);
    setFurthestStep(current => Math.max(current, nextStep));
  };

  const handleBack = () => {
    setStep(current => Math.max(current - 1, 1));
  };

  const handleStepSelect = (nextStep) => {
    if (nextStep <= furthestStep && !loading) {
      setStep(nextStep);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!validateStep3()) return;

    try {
      setLoading(true);

      const submitData = new FormData();
      
      // Append all text fields
      Object.keys(formData).forEach(key => {
        if (key !== 'profile_photo' && key !== 'confirmPassword' && formData[key]) {
          submitData.append(key, formData[key]);
        }
      });

      // Append file if exists
      if (formData.profile_photo) {
        submitData.append('profile_photo', formData.profile_photo);
      }

      const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
      const registrationUrl = isLocalhost
        ? '/api/register/reseller'
        : '/api/auth/register/reseller';

      const response = await fetch(registrationUrl, {
        method: 'POST',
        body: submitData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      if (data.status === 'success') {
        toast.success('Registration successful! Please wait for admin approval.');
        setTimeout(() => {
          router.push('/pending-approval?type=reseller');
        }, 2000);
      } else {
        toast.error(data.message || 'Registration failed');
      }

    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Basic Information
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Full Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email ID *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Mobile Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="phone"
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              maxLength="10"
              pattern="[0-9]{10}"
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password *
          </label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full pl-10 pr-10 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirm Password *
          </label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="w-full pl-10 pr-10 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
              title={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            City *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="city"
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            State *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="state"
              type="text"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Pincode
          </label>
          <input
            id="pincode"
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleInputChange}
            maxLength="6"
            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Address
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            rows="2"
            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
          />
        </div>

        <div className="md:col-span-2">
          <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Profile Photo
          </p>
          <div className="flex items-center gap-4">
            {profilePreview && (
              <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                <Image src={profilePreview} alt="Profile preview" fill className="object-cover" />
              </div>
            )}
            <label htmlFor="profile_photo" className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <Upload className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {formData.profile_photo ? 'Change Photo' : 'Upload Photo'}
              </span>
              <input
                id="profile_photo"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Max size: 5MB (JPG, PNG, GIF)
          </p>
        </div>

        {referralCode && (
          <div className="md:col-span-2">
            <label htmlFor="sponsor_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sponsor/Referral Code
            </label>
            <input
              id="sponsor_code"
              type="text"
              name="sponsor_code"
              value={formData.sponsor_code}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              readOnly
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        KYC Details (Optional)
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Providing KYC details helps in faster verification and withdrawal processing
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="pan_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            PAN Number
          </label>
          <input
            id="pan_number"
            type="text"
            name="pan_number"
            value={formData.pan_number}
            onChange={(e) => handleInputChange({ target: { name: 'pan_number', value: e.target.value.toUpperCase() }})}
            maxLength="10"
            placeholder="ABCDE1234F"
            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
          />
        </div>

        <div>
          <label htmlFor="aadhar_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Aadhaar Number
          </label>
          <input
            id="aadhar_number"
            type="text"
            name="aadhar_number"
            value={formData.aadhar_number}
            onChange={handleInputChange}
            maxLength="12"
            placeholder="1234 5678 9012"
            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="gst_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            GST Number (Optional)
          </label>
          <input
            id="gst_number"
            type="text"
            name="gst_number"
            value={formData.gst_number}
            onChange={(e) => handleInputChange({ target: { name: 'gst_number', value: e.target.value.toUpperCase() }})}
            maxLength="15"
            placeholder="22AAAAA0000A1Z5"
            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Payment Details
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Required for receiving commission payments and withdrawals
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Bank Name *
          </label>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="bank_name"
              type="text"
              name="bank_name"
              value={formData.bank_name}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="account_holder_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Account Holder Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="account_holder_name"
              type="text"
              name="account_holder_name"
              value={formData.account_holder_name}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="account_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Account Number *
          </label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              id="account_number"
              type="text"
              name="account_number"
              value={formData.account_number}
              onChange={handleInputChange}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="ifsc_code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            IFSC Code *
          </label>
          <input
            id="ifsc_code"
            type="text"
            name="ifsc_code"
            value={formData.ifsc_code}
            onChange={(e) => handleInputChange({ target: { name: 'ifsc_code', value: e.target.value.toUpperCase() }})}
            maxLength="11"
            placeholder="SBIN0001234"
            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="upi_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            UPI ID (Optional)
          </label>
          <input
            id="upi_id"
            type="text"
            name="upi_id"
            value={formData.upi_id}
            onChange={handleInputChange}
            placeholder="yourname@upi"
            className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="registration-shell min-h-screen text-slate-900 dark:text-white">
      <header className="border-b border-slate-300 bg-white/95 dark:border-slate-700 dark:bg-slate-950/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              aria-label="Back to home"
              title="Back to home"
              className="grid h-10 w-10 flex-none place-items-center border border-slate-300 bg-white text-slate-700 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 flex-none place-items-center bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                <Store className="h-5 w-5" />
              </div>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-bold">SKAARVI</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">Reseller Network</p>
              </div>
            </div>
          </div>
          <div className="hidden items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 sm:flex">
            <span className="h-2 w-2 rounded-full bg-[#33a467]" />
            <span>Secure application</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid overflow-hidden border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900 lg:grid-cols-[350px_minmax(0,1fr)]">
          <aside className="flex flex-col bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 text-white sm:p-8 lg:min-h-[760px] lg:p-10">
            <div>
              <div className="mb-7 inline-flex items-center gap-2 border border-white/25 px-3 py-2 text-xs font-bold uppercase">
                <BadgeIndianRupee className="h-4 w-4 text-white" />
                Partner application
              </div>
              <h1 className="max-w-xs text-3xl font-bold leading-tight sm:text-4xl">
                Build your reseller business.
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-blue-100">
                Create your profile, add optional verification, and choose where your earnings should arrive.
              </p>
            </div>

            <nav aria-label="Registration progress" className="mt-8 grid grid-cols-3 gap-2 lg:block lg:space-y-3">
              {STEPS.map(item => {
                const Icon = item.icon;
                const isActive = item.id === step;
                const isComplete = item.id < furthestStep;
                const isAvailable = item.id <= furthestStep;
                let stateClassName = 'cursor-not-allowed border-white/10 text-white/35';

                if (isActive) {
                  stateClassName = 'border-white bg-white text-indigo-700';
                } else if (isAvailable) {
                  stateClassName = 'border-white/25 text-white hover:border-white/60 hover:bg-white/10';
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleStepSelect(item.id)}
                    disabled={!isAvailable}
                    aria-current={isActive ? 'step' : undefined}
                    className={`group flex min-h-[92px] w-full flex-col items-center justify-center gap-2 border p-3 text-center lg:min-h-0 lg:flex-row lg:justify-start lg:p-4 lg:text-left ${stateClassName}`}
                  >
                    <span className={`grid h-9 w-9 flex-none place-items-center border ${isActive ? 'border-indigo-300' : 'border-current'}`}>
                      {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-bold sm:text-sm">{item.label}</span>
                      <span className={`mt-0.5 hidden text-xs lg:block ${isActive ? 'text-indigo-500' : 'text-blue-100/70'}`}>
                        {item.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-8 border-t border-white/20 pt-6 lg:mt-auto">
              <div className="mb-3 flex items-center justify-between text-xs">
                <span className="text-blue-100">Application progress</span>
                <span className="font-bold text-white">{completionPercentage}%</span>
              </div>
              <div className="h-2 border border-white/30 p-px">
                <div
                  className="h-full bg-white transition-[width] duration-500 ease-out"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          </aside>

          <section id="registration-form" className="scroll-mt-20 bg-white dark:bg-slate-900">
            <div className="border-b border-slate-200 px-6 py-7 dark:border-slate-700 sm:px-10 lg:px-12">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">Step {step} of {STEPS.length}</p>
                {step === 2 && (
                  <span className="border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
                    Optional
                  </span>
                )}
              </div>
              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">{activeStep.label}</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{activeStep.description}</p>
            </div>

            <form onSubmit={handleSubmit} className="reseller-registration-form px-6 py-7 sm:px-10 sm:py-9 lg:px-12">
              <div key={step} className="registration-step-content" aria-live="polite">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
              </div>

              <div className="mt-9 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 dark:border-slate-700 sm:flex-row sm:justify-between">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading}
                    className="inline-flex min-h-12 items-center justify-center gap-2 border border-slate-300 bg-transparent px-6 font-semibold text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:bg-slate-800"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </button>
                ) : (
                  <span />
                )}

                {step < STEPS.length ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex min-h-12 items-center justify-center gap-3 border border-blue-600 bg-gradient-to-r from-blue-600 to-purple-600 px-7 font-bold text-white hover:-translate-x-0.5 hover:-translate-y-0.5 hover:from-blue-700 hover:to-purple-700 dark:border-indigo-400"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex min-h-12 items-center justify-center gap-3 border border-blue-600 bg-gradient-to-r from-blue-600 to-purple-600 px-7 font-bold text-white hover:-translate-x-0.5 hover:-translate-y-0.5 hover:from-blue-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-400"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending application
                      </>
                    ) : (
                      <>
                        Submit registration
                        <Check className="h-4 w-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            <div className="border-t border-slate-200 px-6 py-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:px-10 lg:px-12">
              Already submitted? Your application remains pending until an administrator reviews it.
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
