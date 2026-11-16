const pincodes = require('./registrationPincodes.json');

const STATES = Object.keys(pincodes);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[6-9]\d{9}$/;
const MANUFACTURER_PHONE = /^(?:\+91)?[6-9]\d{9}$/;
const LOGIN_PHONE = /^(?:\+91)?\d{10}$/;
const PAN = /^[A-Z]{5}\d{4}[A-Z]$/;
const GST = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[A-Z0-9]$/;
const IFSC = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const UPI = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;

function validateLocation(state, pincode) {
  if (!STATES.includes(state)) return 'Select Andhra Pradesh or Telangana';
  if (typeof pincode !== 'string' || !/^\d{6}$/.test(pincode)) return 'Enter a 6-digit PIN code';
  if (!pincodes[state].includes(pincode)) return `Enter a valid PIN code for ${state}`;
  return '';
}

function validateRegistration(data, role) {
  const errors = {};
  const value = (key) => typeof data[key] === 'string' ? data[key].trim() : '';
  const required = (key, label, minLength = 1) => {
    if (value(key).length < minLength) {
      errors[key] = minLength > 1 ? `${label} must be at least ${minLength} characters` : `${label} is required`;
    }
  };
  const matches = (key, pattern, message, optional = false) => {
    const field = value(key);
    if ((!optional || field) && !pattern.test(field)) errors[key] = message;
  };

  if (role === 'manufacturer') {
    required('companyName', 'Company name', 2);
    required('brandName', 'Brand name', 2);
    required('contactPersonName', 'Contact person', 2);
    required('address', 'Address', 10);
    required('city', 'City');
    if (!['proprietorship', 'partnership', 'llp', 'pvt_ltd', 'public_ltd'].includes(value('businessType'))) {
      errors.businessType = 'Select a valid business type';
    }
    matches('mobile', MANUFACTURER_PHONE, 'Enter a valid 10-digit mobile number');
    required('accountHolderName', 'Account holder name');
    required('bankName', 'Bank name');
    matches('accountNumber', /^\d{9,18}$/, 'Account number must be 9-18 digits');
    matches('ifscCode', IFSC, 'Enter a valid IFSC code');
    matches('panNumber', PAN, 'Enter a valid PAN number', true);
    matches('gstNumber', GST, 'Enter a valid GST number', true);
    matches('upiId', UPI, 'Enter a valid UPI ID', true);
  } else {
    required('name', 'Name', 3);
    matches('phone', PHONE, 'Enter a valid 10-digit mobile number');
    if (role === 'reseller') {
      required('city', 'City');
      required('account_holder_name', 'Account holder name');
      required('bank_name', 'Bank name');
      matches('account_number', /^\d{9,18}$/, 'Account number must be 9-18 digits');
      matches('ifsc_code', IFSC, 'Enter a valid IFSC code');
      matches('pan_number', PAN, 'Enter a valid PAN number', true);
      matches('aadhar_number', /^\d{12}$/, 'Aadhaar number must be 12 digits', true);
      matches('gst_number', GST, 'Enter a valid GST number', true);
      matches('upi_id', UPI, 'Enter a valid UPI ID', true);
    }
  }

  matches('email', EMAIL, 'Enter a valid email address');
  if (typeof data.password !== 'string' || data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters';
  }
  if ('confirmPassword' in data) {
    if (!data.confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (data.confirmPassword !== data.password) errors.confirmPassword = 'Passwords do not match';
  }
  if (!STATES.includes(value('state'))) errors.state = 'Select Andhra Pradesh or Telangana';
  const locationError = validateLocation(value('state'), value('pincode'));
  if (locationError && !errors.state) errors.pincode = locationError;
  return errors;
}

function validateLoginIdentifier(identifier) {
  const value = typeof identifier === 'string' ? identifier.trim() : '';
  return EMAIL.test(value) || LOGIN_PHONE.test(value);
}

module.exports = { STATES, validateLocation, validateRegistration, validateLoginIdentifier };
