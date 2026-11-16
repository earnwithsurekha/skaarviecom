'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { Building2, ArrowRight, Loader2, Upload, Eye, EyeOff, Briefcase, Landmark, FileCheck2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '@/lib/api';
import RegistrationWorkspace from '@/components/RegistrationWorkspace';
import { STATES, validateRegistration } from '@/backend/utils/registrationValidation';

const MANUFACTURER_STEPS = [
  {
    id: 1,
    label: 'Business profile',
    description: 'Company and contact details',
    icon: Building2,
  },
  {
    id: 2,
    label: 'Business type',
    description: 'Company structure',
    icon: Briefcase,
  },
  {
    id: 3,
    label: 'Settlement',
    description: 'Bank and payout details',
    icon: Landmark,
  },
  {
    id: 4,
    label: 'Documents',
    description: 'Files for verification',
    icon: FileCheck2,
  },
];

const MANUFACTURER_REQUIRED_FIELDS = [
  'companyName',
  'brandName',
  'contactPersonName',
  'mobile',
  'email',
  'password',
  'confirmPassword',
  'address',
  'city',
  'state',
  'pincode',
  'businessType',
  'accountHolderName',
  'accountNumber',
  'ifscCode',
  'bankName',
  'panCard',
  'cancelledCheque',
  'companyLogo',
];

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useSelector((state) => state.auth.user);
  const [step, setStep] = useState(1); // 1: Basic Info, 2: Business Details, 3: Bank Details, 4: Documents (OTP bypassed)
  const [furthestStep, setFurthestStep] = useState(1);
  const [loading, setLoading] = useState(false);
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
  const activeStep = MANUFACTURER_STEPS[step - 1];
  const completedFieldCount = MANUFACTURER_REQUIRED_FIELDS.filter(field => Boolean(formData[field])).length;
  const completionPercentage = Math.round((completedFieldCount / MANUFACTURER_REQUIRED_FIELDS.length) * 100);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue = ['gstNumber', 'panNumber', 'ifscCode'].includes(name) ? value.toUpperCase() : value;
    const updated = { ...formData, [name]: processedValue };
    const validationErrors = validateRegistration(updated, 'manufacturer');
    setFormData(updated);
    setErrors(prev => ({
      ...prev,
      [name]: validationErrors[name] || '',
      ...(name === 'state' && formData.pincode ? { pincode: validationErrors.pincode || '' } : {}),
      ...(name === 'password' && formData.confirmPassword ? { confirmPassword: validationErrors.confirmPassword || '' } : {}),
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
      e.target.value = '';
      return;
    }
    const types = fieldName === 'companyLogo' ? ['image/jpeg', 'image/png'] : ['image/jpeg', 'image/png', 'application/pdf'];
    if (file && !types.includes(file.type)) {
      toast.error(fieldName === 'companyLogo' ? 'Please select a JPG or PNG image' : 'Please select a PDF, JPG or PNG file');
      e.target.value = '';
      return;
    }
    setFormData(prev => ({ ...prev, [fieldName]: file }));
  };

  const validateStep = (stepNumber) => {
    const fields = {
      1: ['companyName', 'brandName', 'contactPersonName', 'mobile', 'email', 'password', 'confirmPassword', 'address', 'city', 'state', 'pincode', 'panNumber', 'gstNumber'],
      2: ['businessType'],
      3: ['accountHolderName', 'accountNumber', 'ifscCode', 'bankName', 'upiId'],
    };
    const allErrors = validateRegistration(formData, 'manufacturer');
    const newErrors = Object.fromEntries(fields[stepNumber].filter(field => allErrors[field]).map(field => [field, allErrors[field]]));
    setErrors(newErrors);
    if (Object.keys(newErrors).length) {
      toast.error('Please fix all errors before proceeding');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    const nextStep = Math.min(step + 1, MANUFACTURER_STEPS.length);
    setStep(nextStep);
    setFurthestStep(current => Math.max(current, nextStep));
  };

  const handleBack = () => {
    if (step === 1) {
      router.push('/');
      return;
    }

    setStep((currentStep) => currentStep - 1);
  };

  const handleStepSelect = (nextStep) => {
    if (nextStep <= furthestStep && !loading) {
      setStep(nextStep);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (const stepNumber of [1, 2, 3]) {
      if (!validateStep(stepNumber)) {
        setStep(stepNumber);
        return;
      }
    }
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
        }
      });

      // Format mobile with country code
      submitData.set('mobile', `+91${formData.mobile}`);

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
        router.push('/pending-approval?type=manufacturer');
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
    <RegistrationWorkspace
      icon={Building2}
      networkLabel="Manufacturer Network"
      badgeLabel="Manufacturer application"
      title="Bring your products to more buyers."
      description="Set up your business profile, settlement account, and verification documents for marketplace review."
      steps={MANUFACTURER_STEPS}
      currentStep={step}
      availableStep={furthestStep}
      onStepSelect={handleStepSelect}
      completion={completionPercentage}
      sectionEyebrow={`Step ${step} of ${MANUFACTURER_STEPS.length}`}
      sectionTitle={activeStep.label}
      sectionDescription={activeStep.description}
      footer="Submitted applications remain pending until an administrator completes the review."
    >
      <form onSubmit={step === 4 ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
        <div key={step} className="registration-step-content">
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
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        title={showPassword ? 'Hide password' : 'Show password'}
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
                        aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
                        title={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}
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
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={`input ${errors.state ? 'border-red-500' : ''}`}
                      required
                    >
                      <option value="">Select state</option>
                      {STATES.map(state => <option key={state} value={state}>{state}</option>)}
                    </select>
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
                      placeholder="6-digit PIN code"
                      className={`input ${errors.pincode ? 'border-red-500' : ''}`}
                      maxLength="6"
                      inputMode="numeric"
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
                    <p className="label">
                      GST Certificate <span className="text-gray-500 text-sm">(Optional)</span>
                    </p>
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
                    <p className="label">
                      PAN Card *
                    </p>
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
                    <p className="label">
                      Cancelled Cheque / Bank Proof *
                    </p>
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
                    <p className="label">
                      Company Logo *
                    </p>
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
        </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row dark:border-slate-700">
              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex min-h-12 flex-1 items-center justify-center border border-slate-300 px-6 font-semibold text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-600 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:bg-slate-800"
                  disabled={loading}
                >
                  Previous
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 border border-blue-600 bg-gradient-to-r from-blue-600 to-purple-600 px-6 font-semibold text-white hover:-translate-y-0.5 hover:from-blue-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-indigo-400"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {step === 4 ? 'Submitting...' : 'Processing...'}
                  </>
                ) : (
                  <>
                    {step === 4 ? 'Submit Registration' : 'Next'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
      </form>
    </RegistrationWorkspace>
  );
}
