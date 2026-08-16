'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Building2, ArrowRight, Loader2, Upload, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useSelector((state) => state.auth.user);
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Business Details, 3: Bank Details, 4: Documents (OTP bypassed)
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    // Pre-fill if user exists
    mobile: user?.mobile?.replace('+91', '') || '',
    email: user?.email || searchParams.get('email') || '',
    password: '',
    confirmPassword: '',
    // Step 1: Basic Information
    companyName: '',
    brandName: '',
    contactPersonName: '',
    gstNumber: '',
    panNumber: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    // Step 2: Business Details
    businessType: '',
    // Step 3: Bank Details
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    upiId: '',
    // Step 4: Documents
    gstCertificate: null,
    panCard: null,
    cancelledCheque: null,
    companyLogo: null,
  });

  // Validation functions
  const validateMobile = (mobile) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobile) return 'Mobile number is required';
    if (!mobileRegex.test(mobile)) return 'Mobile number must be 10 digits starting with 6-9';
    return '';
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePAN = (pan) => {
    if (!pan) return ''; // Optional field
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    if (!panRegex.test(pan.toUpperCase())) {
      return 'Invalid PAN format. Should be like: ABCDE1234F';
    }
    return '';
  };

  const validateGST = (gst) => {
    if (!gst) return ''; // Optional field
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(gst.toUpperCase())) {
      return 'Invalid GST format. Should be like: 22AAAAA0000A1Z5';
    }
    return '';
  };

  const validatePincode = (pincode) => {
    const pincodeRegex = /^[1-9][0-9]{5}$/;
    if (!pincode) return 'Pincode is required';
    if (!pincodeRegex.test(pincode)) return 'Pincode must be 6 digits';
    return '';
  };

  const validateIFSC = (ifsc) => {
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifsc) return 'IFSC code is required';
    if (!ifscRegex.test(ifsc.toUpperCase())) {
      return 'Invalid IFSC code. Should be like: SBIN0001234';
    }
    return '';
  };

  const validateAccountNumber = (accountNumber) => {
    const accountRegex = /^[0-9]{9,18}$/;
    if (!accountNumber) return 'Account number is required';
    if (!accountRegex.test(accountNumber)) {
      return 'Account number must be 9-18 digits';
    }
    return '';
  };

  const validateUPI = (upi) => {
    if (!upi) return ''; // Optional field
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    if (!upiRegex.test(upi)) {
      return 'Invalid UPI ID format. Should be like: username@bank';
    }
    return '';
  };

  const validatePassword = (password) => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const validateConfirmPassword = (confirmPassword, password) => {
    if (!confirmPassword) return 'Please confirm your password';
    if (confirmPassword !== password) return 'Passwords do not match';
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convert to uppercase for specific fields
    let processedValue = value;
    if (['gstNumber', 'panNumber', 'ifscCode'].includes(name)) {
      processedValue = value.toUpperCase();
    }
    
    // Update form data
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    // Validate field on change
    let error = '';
    switch (name) {
      case 'mobile':
        error = validateMobile(processedValue);
        break;
      case 'email':
        error = validateEmail(processedValue);
        break;
      case 'panNumber':
        error = validatePAN(processedValue);
        break;
      case 'gstNumber':
        error = validateGST(processedValue);
        break;
      case 'pincode':
        error = validatePincode(processedValue);
        break;
      case 'ifscCode':
        error = validateIFSC(processedValue);
        break;
      case 'accountNumber':
        error = validateAccountNumber(processedValue);
        break;
      case 'upiId':
        error = validateUPI(processedValue);
        break;
      case 'password':
        error = validatePassword(processedValue);
        // Re-validate confirmPassword if it exists
        if (formData.confirmPassword) {
          setErrors(prev => ({
            ...prev,
            confirmPassword: validateConfirmPassword(formData.confirmPassword, processedValue)
          }));
        }
        break;
      case 'confirmPassword':
        error = validateConfirmPassword(processedValue, formData.password);
        break;
      case 'companyName':
      case 'brandName':
      case 'contactPersonName':
        if (!processedValue.trim()) error = 'This field is required';
        else if (processedValue.trim().length < 2) error = 'Must be at least 2 characters';
        break;
      case 'address':
        if (!processedValue.trim()) error = 'Address is required';
        else if (processedValue.trim().length < 10) error = 'Please enter a complete address';
        break;
      case 'city':
      case 'state':
        if (!processedValue.trim()) error = 'This field is required';
        else if (!/^[a-zA-Z\s]+$/.test(processedValue)) error = 'Only letters are allowed';
        break;
      case 'accountHolderName':
      case 'bankName':
        if (!processedValue.trim()) error = 'This field is required';
        break;
      default:
        break;
    }
    
    // Update errors
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  // OTP verification bypassed - users start directly at registration
  useEffect(() => {
    // Automatically start at step 1
    setStep(1);
  }, []);

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error('File size should not exceed 5MB');
      return;
    }
    setFormData(prev => ({ ...prev, [fieldName]: file }));
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await authAPI.sendRegistrationOtp(formData.email);
      setOtpSent(true);
      toast.success('OTP sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error('Please enter valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOtp(formData.email, otp);
      
      // Store tokens
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      toast.success('Email verified! Now complete your registration');
      setStep(1); // Move to basic info step
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // Validate current step before proceeding
    let hasErrors = false;
    const newErrors = {};

    if (step === 1) {
      // Validate Basic Information
      const requiredFields = ['companyName', 'brandName', 'contactPersonName', 'mobile', 'email', 'password', 'confirmPassword', 'address', 'city', 'state', 'pincode'];
      
      requiredFields.forEach(field => {
        if (!formData[field] || !formData[field].toString().trim()) {
          newErrors[field] = 'This field is required';
          hasErrors = true;
        }
      });

      // Run specific validations
      const mobileError = validateMobile(formData.mobile);
      if (mobileError) {
        newErrors.mobile = mobileError;
        hasErrors = true;
      }

      const emailError = validateEmail(formData.email);
      if (emailError) {
        newErrors.email = emailError;
        hasErrors = true;
      }

      const pincodeError = validatePincode(formData.pincode);
      if (pincodeError) {
        newErrors.pincode = pincodeError;
        hasErrors = true;
      }

      // Optional fields validation if filled
      if (formData.panNumber) {
        const panError = validatePAN(formData.panNumber);
        if (panError) {
          newErrors.panNumber = panError;
          hasErrors = true;
        }
      }

      if (formData.gstNumber) {
        const gstError = validateGST(formData.gstNumber);
        if (gstError) {
          newErrors.gstNumber = gstError;
          hasErrors = true;
        }
      }
    } else if (step === 2) {
      // Validate Business Details
      if (!formData.businessType) {
        newErrors.businessType = 'Please select a business type';
        hasErrors = true;
      }
    } else if (step === 3) {
      // Validate Bank Details
      const requiredFields = ['accountHolderName', 'accountNumber', 'ifscCode', 'bankName'];
      
      requiredFields.forEach(field => {
        if (!formData[field] || !formData[field].toString().trim()) {
          newErrors[field] = 'This field is required';
          hasErrors = true;
        }
      });

      const accountError = validateAccountNumber(formData.accountNumber);
      if (accountError) {
        newErrors.accountNumber = accountError;
        hasErrors = true;
      }

      const ifscError = validateIFSC(formData.ifscCode);
      if (ifscError) {
        newErrors.ifscCode = ifscError;
        hasErrors = true;
      }

      // Optional UPI validation if filled
      if (formData.upiId) {
        const upiError = validateUPI(formData.upiId);
        if (upiError) {
          newErrors.upiId = upiError;
          hasErrors = true;
        }
      }
    }

    setErrors(newErrors);

    if (hasErrors) {
      toast.error('Please fix all errors before proceeding');
      return;
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log('=== Starting Registration Submission ===');

    // Validate required files
    if (!formData.panCard) {
      toast.error('Please upload PAN Card');
      setLoading(false);
      return;
    }
    if (!formData.cancelledCheque) {
      toast.error('Please upload Cancelled Cheque or Bank Proof');
      setLoading(false);
      return;
    }
    if (!formData.companyLogo) {
      toast.error('Please upload Company Logo');
      setLoading(false);
      return;
    }

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      
      // Append text fields
      Object.keys(formData).forEach(key => {
        if (formData[key] && typeof formData[key] !== 'object') {
          submitData.append(key, formData[key]);
          console.log(`Added field: ${key} = ${formData[key]}`);
        }
      });

      // Format mobile with country code
      submitData.set('mobile', `+91${formData.mobile}`);
      console.log('Mobile formatted:', `+91${formData.mobile}`);

      // Append files
      if (formData.gstCertificate) {
        submitData.append('gstCertificate', formData.gstCertificate);
        console.log('Added gstCertificate:', formData.gstCertificate.name);
      }
      if (formData.panCard) {
        submitData.append('panCard', formData.panCard);
        console.log('Added panCard:', formData.panCard.name);
      }
      if (formData.cancelledCheque) {
        submitData.append('cancelledCheque', formData.cancelledCheque);
        console.log('Added cancelledCheque:', formData.cancelledCheque.name);
      }
      if (formData.companyLogo) {
        submitData.append('companyLogo', formData.companyLogo);
        console.log('Added companyLogo:', formData.companyLogo.name);
      }

      console.log('Calling authAPI.register...');
      const response = await authAPI.register(submitData);
      console.log('Registration response:', response);
      
      toast.success(response.message || 'Registration submitted successfully!');
      
      // Clear localStorage and redirect to pending approval page
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // Redirect to pending approval page
      setTimeout(() => {
        router.push('/pending-approval');
      }, 1500);
    } catch (error) {
      console.error('=== Registration Error ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(errorMessage);
    } finally {
      console.log('=== Registration Submission Complete ===');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Manufacturer Registration
          </h1>
          <p className="text-gray-600">
            Join Skaarvi marketplace and grow your business
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {s}
                </div>
                {s < 4 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > s ? 'bg-primary-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Basic Info</span>
            <span>Business</span>
            <span>Bank Details</span>
            <span>Documents</span>
          </div>
        </div>

        {/* Registration Form */}
        <div className="card">
          <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="companyName" className="label">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      className={`input ${errors.companyName ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors.companyName && (
                      <p className="text-red-500 text-xs mt-1">{errors.companyName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="brandName" className="label">
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      id="brandName"
                      name="brandName"
                      value={formData.brandName}
                      onChange={handleChange}
                      className={`input ${errors.brandName ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors.brandName && (
                      <p className="text-red-500 text-xs mt-1">{errors.brandName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="contactPersonName" className="label">
                      Contact Person Name *
                    </label>
                    <input
                      type="text"
                      id="contactPersonName"
                      name="contactPersonName"
                      value={formData.contactPersonName}
                      onChange={handleChange}
                      className={`input ${errors.contactPersonName ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors.contactPersonName && (
                      <p className="text-red-500 text-xs mt-1">{errors.contactPersonName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="mobile" className="label">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      id="mobile"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="9876543210"
                      maxLength="10"
                      className={`input ${errors.mobile ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors.mobile && (
                      <p className="text-red-500 text-xs mt-1">{errors.mobile}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">10 digits starting with 6-9</p>
                  </div>

                  <div>
                    <label htmlFor="email" className="label">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`input ${errors.email ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="label">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={`input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">Minimum 6 characters</p>
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="label">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`input pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="gstNumber" className="label">
                      GST Number <span className="text-gray-500 text-sm">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      id="gstNumber"
                      name="gstNumber"
                      value={formData.gstNumber}
                      onChange={handleChange}
                      placeholder="22AAAAA0000A1Z5"
                      maxLength="15"
                      className={`input ${errors.gstNumber ? 'border-red-500' : ''}`}
                    />
                    {errors.gstNumber && (
                      <p className="text-red-500 text-xs mt-1">{errors.gstNumber}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">15 characters: 2 digits + state code + registration</p>
                  </div>

                  <div>
                    <label htmlFor="panNumber" className="label">
                      PAN Number <span className="text-gray-500 text-sm">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      id="panNumber"
                      name="panNumber"
                      value={formData.panNumber}
                      onChange={handleChange}
                      placeholder="ABCDE1234F"
                      maxLength="10"
                      className={`input ${errors.panNumber ? 'border-red-500' : ''}`}
                    />
                    {errors.panNumber && (
                      <p className="text-red-500 text-xs mt-1">{errors.panNumber}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">10 characters: 5 letters + 4 digits + 1 letter</p>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="address" className="label">
                      Address *
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="2"
                      className={`input ${errors.address ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors.address && (
                      <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="city" className="label">
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={`input ${errors.city ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors.city && (
                      <p className="text-red-500 text-xs mt-1">{errors.city}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="state" className="label">
                      State *
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={`input ${errors.state ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors.state && (
                      <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="pincode" className="label">
                      Pincode *
                    </label>
                    <input
                      type="text"
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="400001"
                      className={`input ${errors.pincode ? 'border-red-500' : ''}`}
                      maxLength="6"
                      required
                    />
                    {errors.pincode && (
                      <p className="text-red-500 text-xs mt-1">{errors.pincode}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">6 digits</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Business Details */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="businessType" className="label">
                      Business Type *
                    </label>
                    <select
                      id="businessType"
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleChange}
                      className={`input ${errors.businessType ? 'border-red-500' : ''}`}
                      required
                    >
                      <option value="">Select business type</option>
                      <option value="proprietorship">Proprietorship</option>
                      <option value="partnership">Partnership</option>
                      <option value="llp">LLP</option>
                      <option value="pvt_ltd">Private Limited</option>
                      <option value="public_ltd">Public Limited</option>
                    </select>
                    {errors.businessType && (
                      <p className="text-red-500 text-xs mt-1">{errors.businessType}</p>
                    )}
                  </div>

                  <div className="md:col-span-2 text-sm text-gray-600">
                    <p>Please ensure all the information provided in the previous step is accurate. You can go back to make changes if needed.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Bank Details */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Bank Details</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Provide your bank account details for payment settlements
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="accountHolderName" className="label">
                      Account Holder Name *
                    </label>
                    <input
                      type="text"
                      id="accountHolderName"
                      name="accountHolderName"
                      value={formData.accountHolderName}
                      onChange={handleChange}
                      placeholder="Enter account holder name"
                      className={`input ${errors.accountHolderName ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors.accountHolderName && (
                      <p className="text-red-500 text-xs mt-1">{errors.accountHolderName}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="accountNumber" className="label">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      id="accountNumber"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      placeholder="Enter account number"
                      className={`input ${errors.accountNumber ? 'border-red-500' : ''}`}
                      maxLength="18"
                      required
                    />
                    {errors.accountNumber && (
                      <p className="text-red-500 text-xs mt-1">{errors.accountNumber}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">9-18 digits</p>
                  </div>

                  <div>
                    <label htmlFor="ifscCode" className="label">
                      IFSC Code *
                    </label>
                    <input
                      type="text"
                      id="ifscCode"
                      name="ifscCode"
                      value={formData.ifscCode}
                      onChange={handleChange}
                      placeholder="e.g., SBIN0001234"
                      className={`input ${errors.ifscCode ? 'border-red-500' : ''}`}
                      maxLength="11"
                      required
                    />
                    {errors.ifscCode && (
                      <p className="text-red-500 text-xs mt-1">{errors.ifscCode}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">11 characters: 4 letters + 0 + 6 alphanumeric</p>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="bankName" className="label">
                      Bank Name *
                    </label>
                    <input
                      type="text"
                      id="bankName"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      placeholder="e.g., State Bank of India"
                      className={`input ${errors.bankName ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors.bankName && (
                      <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="upiId" className="label">
                      UPI ID <span className="text-gray-500 text-sm">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      id="upiId"
                      name="upiId"
                      value={formData.upiId}
                      onChange={handleChange}
                      placeholder="yourname@upi"
                      className={`input ${errors.upiId ? 'border-red-500' : ''}`}
                    />
                    {errors.upiId && (
                      <p className="text-red-500 text-xs mt-1">{errors.upiId}</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">Format: username@bankname</p>
                  </div>

                  <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> This bank account will be used for receiving payments from completed orders. Please ensure the details are accurate.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Documents */}
            {step === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Documents</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Please upload clear copies of the required documents
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="label">
                      GST Certificate <span className="text-gray-500 text-sm">(Optional)</span>
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, 'gstCertificate')}
                        className="hidden"
                        id="gstCertificate"
                      />
                      <label htmlFor="gstCertificate" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {formData.gstCertificate 
                            ? formData.gstCertificate.name 
                            : 'Click to upload GST Certificate'
                          }
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG or PNG (Max 5MB)</p>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="label">
                      PAN Card *
                    </label>
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer ${
                      formData.panCard ? 'border-green-400 bg-green-50' : 'border-gray-300'
                    }`}>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, 'panCard')}
                        className="hidden"
                        id="panCard"
                      />
                      <label htmlFor="panCard" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {formData.panCard 
                            ? `✓ ${formData.panCard.name}` 
                            : 'Click to upload PAN Card'
                          }
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG or PNG (Max 5MB)</p>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="label">
                      Cancelled Cheque / Bank Proof *
                    </label>
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer ${
                      formData.cancelledCheque ? 'border-green-400 bg-green-50' : 'border-gray-300'
                    }`}>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, 'cancelledCheque')}
                        className="hidden"
                        id="cancelledCheque"
                      />
                      <label htmlFor="cancelledCheque" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {formData.cancelledCheque 
                            ? `✓ ${formData.cancelledCheque.name}` 
                            : 'Click to upload Cancelled Cheque or Bank Statement'
                          }
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PDF, JPG or PNG (Max 5MB)</p>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="label">
                      Company Logo *
                    </label>
                    <div className={`border-2 border-dashed rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer ${
                      formData.companyLogo ? 'border-green-400 bg-green-50' : 'border-gray-300'
                    }`}>
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, 'companyLogo')}
                        className="hidden"
                        id="companyLogo"
                      />
                      <label htmlFor="companyLogo" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {formData.companyLogo 
                            ? `✓ ${formData.companyLogo.name}` 
                            : 'Click to upload Company Logo'
                          }
                        </p>
                        <p className="text-xs text-gray-500 mt-1">JPG or PNG (Max 5MB)</p>
                      </label>
                    </div>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> All uploaded documents will be verified by our team. Please ensure they are clear and readable.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn btn-secondary flex-1"
                  disabled={loading}
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {step === 0 ? (otpSent ? 'Verifying...' : 'Sending OTP...') : 
                     step === 4 ? 'Submitting...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    {step === 0 ? (otpSent ? 'Verify OTP' : 'Send OTP') :
                     step === 4 ? 'Submit Registration' : 'Next'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Already registered?{' '}
          <span className="text-gray-700">Please wait for admin approval or contact support.</span>
        </div>
      </div>
    </div>
  );
}
