'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  CreditCard,
  Smartphone,
  Shield,
  Camera,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    mobile: '',
    profile_photo: '',
    reseller_code: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    bank_account_number: '',
    bank_ifsc: '',
    bank_account_holder: '',
    upi_id: '',
    aadhaar_number: '',
    pan_number: ''
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch('/api/reseller/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch profile');

      const data = await response.json();
      
      if (data.status === 'success') {
        setProfile(data.data);
      }

    } catch (error) {
      console.error('Profile fetch error:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Only image files (JPEG, PNG, GIF, WebP) are allowed');
      return;
    }

    try {
      setUploadingPhoto(true);
      const token = localStorage.getItem('token');

      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch('/api/reseller/profile/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success('Profile photo updated successfully');
        setProfile({ ...profile, profile_photo: data.data.photo_url });
      } else {
        toast.error(data.message || 'Failed to upload photo');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSavePersonal = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/reseller/profile/personal', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: profile.full_name,
          email: profile.email,
          mobile: profile.mobile,
          city: profile.city,
          state: profile.state
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast.success('Personal information updated successfully');
      } else {
        toast.error(data.message || 'Failed to update');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update personal information');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/reseller/profile/address', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address_line1: profile.address_line1,
          address_line2: profile.address_line2,
          city: profile.city,
          state: profile.state,
          pincode: profile.pincode,
          country: profile.country
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast.success('Address updated successfully');
      } else {
        toast.error(data.message || 'Failed to update');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update address');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBank = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/reseller/profile/bank', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bank_account_number: profile.bank_account_number,
          bank_ifsc: profile.bank_ifsc,
          bank_account_holder: profile.bank_account_holder,
          upi_id: profile.upi_id
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast.success('Bank details updated successfully');
      } else {
        toast.error(data.message || 'Failed to update');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('Failed to update bank details');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/reseller/profile/password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: passwordData.current_password,
          new_password: passwordData.new_password
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success('Password changed successfully');
        setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Password change error:', error);
      toast.error('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'bank', label: 'Bank & UPI', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'rgb(var(--color-primary))' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <User className="h-8 w-8" style={{ color: 'rgb(var(--color-primary))' }} />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Profile Settings
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account information and settings
        </p>
      </div>

      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border-2 border-blue-200 dark:border-blue-900/30">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Profile Photo */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
              {profile.profile_photo ? (
                <img 
                  src={profile.profile_photo} 
                  alt={profile.full_name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="h-12 w-12 text-gray-400" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              style={{ color: 'rgb(var(--color-primary))' }}
            >
              {uploadingPhoto ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: 'rgb(var(--color-primary))' }}></div>
              ) : (
                <Camera className="h-5 w-5" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {profile.full_name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Reseller Code: <span className="font-mono font-semibold">{profile.reseller_code}</span>
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">{profile.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">{profile.mobile}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  style={activeTab === tab.id ? { backgroundColor: 'rgb(var(--color-primary))' } : {}}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {/* Personal Info Tab */}
            {activeTab === 'personal' && (
              <form onSubmit={handleSavePersonal} className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Personal Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="full_name" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <User className="h-4 w-4" />
                      Full Name *
                    </label>
                    <input
                      id="full_name"
                      type="text"
                      value={profile.full_name}
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Mail className="h-4 w-4" />
                      Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="mobile" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Phone className="h-4 w-4" />
                      Mobile Number *
                    </label>
                    <input
                      id="mobile"
                      type="tel"
                      value={profile.mobile}
                      onChange={(e) => setProfile({ ...profile, mobile: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: 'rgb(var(--color-primary))' }}
                  >
                    <Save className="h-5 w-5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Address Tab */}
            {activeTab === 'address' && (
              <form onSubmit={handleSaveAddress} className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Address Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="address_line1" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <MapPin className="h-4 w-4" />
                      Address Line 1 *
                    </label>
                    <input
                      id="address_line1"
                      type="text"
                      value={profile.address_line1}
                      onChange={(e) => setProfile({ ...profile, address_line1: e.target.value })}
                      placeholder="House/Flat No., Building Name"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="address_line2" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <MapPin className="h-4 w-4" />
                      Address Line 2
                    </label>
                    <input
                      id="address_line2"
                      type="text"
                      value={profile.address_line2}
                      onChange={(e) => setProfile({ ...profile, address_line2: e.target.value })}
                      placeholder="Street, Area, Locality"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <MapPin className="h-4 w-4" />
                        City *
                      </label>
                      <input
                        id="city"
                        type="text"
                        value={profile.city}
                        onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="state" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <MapPin className="h-4 w-4" />
                        State *
                      </label>
                      <input
                        id="state"
                        type="text"
                        value={profile.state}
                        onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="pincode" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <MapPin className="h-4 w-4" />
                        Pincode *
                      </label>
                      <input
                        id="pincode"
                        type="text"
                        value={profile.pincode}
                        onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                        maxLength="6"
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="country" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <MapPin className="h-4 w-4" />
                      Country *
                    </label>
                    <input
                      id="country"
                      type="text"
                      value={profile.country}
                      onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: 'rgb(var(--color-primary))' }}
                  >
                    <Save className="h-5 w-5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Bank Details Tab */}
            {activeTab === 'bank' && (
              <form onSubmit={handleSaveBank} className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Bank & Payment Details
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Add your bank account and UPI details for receiving payments
                  </p>
                </div>

                {/* Bank Account Section */}
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-md font-semibold text-gray-800 dark:text-gray-200">
                    <Building2 className="h-5 w-5" style={{ color: 'rgb(var(--color-primary))' }} />
                    Bank Account Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label htmlFor="bank_account_holder" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <User className="h-4 w-4" />
                        Account Holder Name
                      </label>
                      <input
                        id="bank_account_holder"
                        type="text"
                        value={profile.bank_account_holder}
                        onChange={(e) => setProfile({ ...profile, bank_account_holder: e.target.value })}
                        placeholder="As per bank records"
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                      />
                    </div>

                    <div>
                      <label htmlFor="bank_account_number" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <CreditCard className="h-4 w-4" />
                        Account Number
                      </label>
                      <input
                        id="bank_account_number"
                        type="text"
                        value={profile.bank_account_number}
                        onChange={(e) => setProfile({ ...profile, bank_account_number: e.target.value })}
                        placeholder="Enter account number"
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                      />
                    </div>

                    <div>
                      <label htmlFor="bank_ifsc" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Building2 className="h-4 w-4" />
                        IFSC Code
                      </label>
                      <input
                        id="bank_ifsc"
                        type="text"
                        value={profile.bank_ifsc}
                        onChange={(e) => setProfile({ ...profile, bank_ifsc: e.target.value.toUpperCase() })}
                        placeholder="SBIN0001234"
                        maxLength="11"
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200 uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700"></div>

                {/* UPI Section */}
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 text-md font-semibold text-gray-800 dark:text-gray-200">
                    <Smartphone className="h-5 w-5" style={{ color: 'rgb(var(--color-primary))' }} />
                    UPI Details (Optional)
                  </h3>
                  
                  <div>
                    <label htmlFor="upi_id" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Smartphone className="h-4 w-4" />
                      UPI ID
                    </label>
                    <input
                      id="upi_id"
                      type="text"
                      value={profile.upi_id}
                      onChange={(e) => setProfile({ ...profile, upi_id: e.target.value })}
                      placeholder="yourname@paytm / yourname@phonepe"
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Enter your UPI ID for quick payments
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: 'rgb(var(--color-primary))' }}
                  >
                    <Save className="h-5 w-5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Change Password
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password *
                    </label>
                    <div className="relative">
                      <input
                        id="current_password"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordData.current_password}
                        onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        id="new_password"
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <input
                        id="confirm_password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={passwordData.confirm_password}
                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors duration-200"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: 'rgb(var(--color-primary))' }}
                  >
                    <Save className="h-5 w-5" />
                    {saving ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
