'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
  Image as ImageIcon,
  CheckCircle,
  XCircle,
  Ban,
  Edit2,
  Package,
  DollarSign,
} from 'lucide-react';
import StatusBadge from '@/components/admin/StatusBadge';
import DocumentViewer from '@/components/admin/DocumentViewer';
import toast from 'react-hot-toast';

export default function ManufacturerDetailPage({ params }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [manufacturer, setManufacturer] = useState(null);
  const [showDocument, setShowDocument] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    if (params?.id) {
      fetchManufacturerDetails(params.id);
    }
  }, [params?.id]);

  const fetchManufacturerDetails = async (id) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch all manufacturers and find the one we need
      const response = await fetch('/api/manufacturers/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch manufacturer details');
      }

      const data = await response.json();
      const foundManufacturer = (data.data || []).find(m => m.id === id);
      
      if (!foundManufacturer) {
        toast.error('Manufacturer not found');
        router.push('/admin/manufacturers');
        return;
      }

      setManufacturer(foundManufacturer);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to load manufacturer details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `/api/manufacturers/${manufacturer.id}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve manufacturer');
      }

      toast.success('Manufacturer approved successfully!');
      router.push('/admin/manufacturers');
    } catch (error) {
      console.error('Approve error:', error);
      toast.error(error.message || 'Failed to approve manufacturer');
    } finally {
      setActionLoading(false);
      setShowApproveModal(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim() || rejectionReason.trim().length < 10) {
      toast.error('Please provide a reason (at least 10 characters)');
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `/api/manufacturers/${manufacturer.id}/reject`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject manufacturer');
      }

      toast.success('Manufacturer rejected successfully!');
      router.push('/admin/manufacturers');
    } catch (error) {
      console.error('Reject error:', error);
      toast.error(error.message || 'Failed to reject manufacturer');
    } finally {
      setActionLoading(false);
      setShowRejectModal(false);
    }
  };

  const handleSuspend = async () => {
    const isActive = manufacturer.isActive !== false;
    const action = isActive ? 'suspend' : 'activate';
    
    if (isActive && (!suspendReason.trim() || suspendReason.trim().length < 10)) {
      toast.error('Please provide a reason for suspension (at least 10 characters)');
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `/api/admin/manufacturers/${manufacturer.id}/${action}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: suspendReason }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${action} manufacturer`);
      }

      toast.success(`Manufacturer ${action}ed successfully!`);
      fetchManufacturerDetails(manufacturer.id);
      setShowSuspendModal(false);
      setSuspendReason('');
    } catch (error) {
      console.error(`${action} error:`, error);
      toast.error(error.message || `Failed to ${action} manufacturer`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `/api/admin/manufacturers/${manufacturer.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editFormData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update manufacturer');
      }

      toast.success('Manufacturer updated successfully!');
      fetchManufacturerDetails(manufacturer.id);
      setShowEditModal(false);
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update manufacturer');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = () => {
    setEditFormData({
      companyName: manufacturer.companyName,
      brandName: manufacturer.brandName,
      contactPerson: manufacturer.contactPerson,
      businessType: manufacturer.businessType,
      gstNumber: manufacturer.gstNumber,
      panNumber: manufacturer.panNumber,
      address: manufacturer.address,
      city: manufacturer.city,
      state: manufacturer.state,
      pincode: manufacturer.pincode,
      bankAccountHolder: manufacturer.bankAccountHolder,
      bankAccountNumber: manufacturer.bankAccountNumber,
      bankIfscCode: manufacturer.bankIfscCode,
      bankName: manufacturer.bankName,
      upiId: manufacturer.upiId,
    });
    setShowEditModal(true);
  };

  const openDocument = (url, title, type = 'image') => {
    if (!url) {
      toast.error('Document not available');
      return;
    }
    setShowDocument({ url, title, type });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'rgb(var(--color-primary))' }}></div>
      </div>
    );
  }

  if (!manufacturer) {
    return null;
  }

  const documents = [
    {
      title: 'Company Logo',
      url: manufacturer.companyLogoUrl,
      icon: ImageIcon,
      type: 'image',
    },
    {
      title: 'PAN Card',
      url: manufacturer.panCardUrl,
      icon: FileText,
      type: 'image',
    },
    {
      title: 'Cancelled Cheque',
      url: manufacturer.cancelledChequeUrl,
      icon: FileText,
      type: 'image',
    },
    {
      title: 'GST Certificate',
      url: manufacturer.gstCertificateUrl,
      icon: FileText,
      type: 'pdf',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/manufacturers')}
            className="p-2 rounded-lg transition-opacity hover:opacity-70"
            style={{ backgroundColor: 'rgb(var(--color-surface))' }}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: 'rgb(var(--color-text))' }} />
          </button>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>{manufacturer.companyName}</h1>
            <p className="mt-1" style={{ color: 'rgb(var(--color-text-secondary))' }}>Review manufacturer application</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-2 items-end">
            <StatusBadge status={manufacturer.approvalStatus} />
            {manufacturer.isActive === false && (
              <span className="px-3 py-1 text-sm font-medium rounded" style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'rgb(239, 68, 68)',
              }}>
                Account Suspended
              </span>
            )}
          </div>
          <button
            onClick={openEditModal}
            className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90 active:scale-95 flex items-center gap-2"
            style={{
              backgroundColor: 'rgb(var(--color-primary))',
              color: 'white'
            }}
          >
            <Edit2 className="w-4 h-4" />
            Edit Details
          </button>
          <button
            onClick={() => setShowSuspendModal(true)}
            className="px-4 py-2 rounded-lg font-medium transition-all hover:opacity-90 active:scale-95 flex items-center gap-2"
            style={{
              backgroundColor: manufacturer.isActive !== false ? '#ef4444' : '#10b981',
              color: 'white'
            }}
          >
            <Ban className="w-4 h-4" />
            {manufacturer.isActive !== false ? 'Suspend' : 'Activate'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(var(--color-primary), 0.1)' }}>
              <Package className="w-6 h-6" style={{ color: 'rgb(var(--color-primary))' }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>Total Products</p>
              <p className="text-2xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>{manufacturer.productCount || 0}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}>
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'rgb(var(--color-text-secondary))' }}>Total Sales</p>
              <p className="text-2xl font-bold" style={{ color: 'rgb(var(--color-text))' }}>
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  maximumFractionDigits: 0,
                }).format(manufacturer.totalSales || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Reason Alert */}
      {manufacturer.approvalStatus === 'rejected' && manufacturer.rejectionReason && (
        <div className="card p-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">Rejection Reason</h3>
              <p className="text-red-800">{manufacturer.rejectionReason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Company Information */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'rgb(var(--color-text))' }}>
          <Building2 className="w-5 h-5" />
          Company Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium" style={{ color: 'rgb(var(--color-text-secondary))' }}>Company Name</label>
            <p className="text-base mt-1" style={{ color: 'rgb(var(--color-text))' }}>{manufacturer.companyName}</p>
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: 'rgb(var(--color-text-secondary))' }}>Brand Name</label>
            <p className="text-base mt-1" style={{ color: 'rgb(var(--color-text))' }}>{manufacturer.brandName}</p>
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: 'rgb(var(--color-text-secondary))' }}>Contact Person</label>
            <p className="text-base mt-1" style={{ color: 'rgb(var(--color-text))' }}>{manufacturer.contactPerson}</p>
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: 'rgb(var(--color-text-secondary))' }}>Business Type</label>
            <p className="text-base mt-1" style={{ color: 'rgb(var(--color-text))' }}>{manufacturer.businessType || 'N/A'}</p>
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: 'rgb(var(--color-text-secondary))' }}>GST Number</label>
            <p className="text-base mt-1" style={{ color: 'rgb(var(--color-text))' }}>{manufacturer.gstNumber || 'Not provided'}</p>
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: 'rgb(var(--color-text-secondary))' }}>PAN Number</label>
            <p className="text-base mt-1" style={{ color: 'rgb(var(--color-text))' }}>{manufacturer.panNumber}</p>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium" style={{ color: 'rgb(var(--color-text-secondary))' }}>Address</label>
            <p className="text-base mt-1" style={{ color: 'rgb(var(--color-text))' }}>
              {manufacturer.address}, {manufacturer.city}, {manufacturer.state} - {manufacturer.pincode}
            </p>
          </div>
        </div>
      </div>

      {/* Banking Details */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'rgb(var(--color-text))' }}>
          <CreditCard className="w-5 h-5" />
          Banking Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium" style={{ color: 'rgb(var(--color-text-secondary))' }}>Account Holder Name</label>
            <p className="text-base mt-1" style={{ color: 'rgb(var(--color-text))' }}>{manufacturer.bankAccountHolder}</p>
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: 'rgb(var(--color-text-secondary))' }}>Account Number</label>
            <p className="text-base mt-1" style={{ color: 'rgb(var(--color-text))' }}>{manufacturer.bankAccountNumber}</p>
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: 'rgb(var(--color-text-secondary))' }}>IFSC Code</label>
            <p className="text-base mt-1" style={{ color: 'rgb(var(--color-text))' }}>{manufacturer.bankIfscCode}</p>
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: 'rgb(var(--color-text-secondary))' }}>Bank Name</label>
            <p className="text-base mt-1" style={{ color: 'rgb(var(--color-text))' }}>{manufacturer.bankName}</p>
          </div>
          <div>
            <label className="text-sm font-medium" style={{ color: 'rgb(var(--color-text-secondary))' }}>UPI ID</label>
            <p className="text-base mt-1" style={{ color: 'rgb(var(--color-text))' }}>{manufacturer.upiId || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ color: 'rgb(var(--color-text))' }}>
          <FileText className="w-5 h-5" />
          Uploaded Documents
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {documents.map((doc) => {
            const Icon = doc.icon;
            return (
              <div
                key={doc.title}
                onClick={() => doc.url && openDocument(doc.url, doc.title, doc.type)}
                className="border-2 border-dashed rounded-lg p-6 text-center transition-all"
                style={doc.url ? {
                  borderColor: 'rgb(var(--color-primary))',
                  backgroundColor: 'rgba(var(--color-primary), 0.05)',
                  cursor: 'pointer'
                } : {
                  borderColor: 'rgb(var(--color-border))',
                  backgroundColor: 'rgb(var(--color-surface))',
                  cursor: 'not-allowed'
                }}
              >
                <Icon className="w-12 h-12 mx-auto mb-3" style={{ color: doc.url ? 'rgb(var(--color-primary))' : 'rgb(var(--color-text-secondary))' }} />
                <p className="font-medium" style={{ color: doc.url ? 'rgb(var(--color-text))' : 'rgb(var(--color-text-secondary))' }}>
                  {doc.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {doc.url ? 'Click to view' : 'Not provided'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      {(manufacturer.approvalStatus === 'pending' || manufacturer.approvalStatus === 'rejected') && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex items-center justify-between gap-4 -mx-6 -mb-6">
          <button
            onClick={() => router.push('/admin/manufacturers')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Back to List
          </button>
          <div className="flex gap-4">
            {(manufacturer.approvalStatus === 'pending' || manufacturer.approvalStatus === 'approved') && (
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center gap-2"
              >
                <XCircle className="w-5 h-5" />
                Reject
              </button>
            )}
            <button
              onClick={() => setShowApproveModal(true)}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              {manufacturer.approvalStatus === 'rejected' ? 'Reapprove' : 'Approve'}
            </button>
          </div>
        </div>
      )}

      {/* Show reject button for approved manufacturers */}
      {manufacturer.approvalStatus === 'approved' && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 flex items-center justify-between gap-4 -mx-6 -mb-6">
          <button
            onClick={() => router.push('/admin/manufacturers')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Back to List
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            Reject
          </button>
        </div>
      )}

      {/* Document Viewer Modal */}
      {showDocument && (
        <DocumentViewer document={showDocument} onClose={() => setShowDocument(null)} />
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {manufacturer.approvalStatus === 'rejected' ? 'Reapprove Manufacturer?' : 'Approve Manufacturer?'}
            </h3>
            <p className="text-gray-600 mb-6">
              {manufacturer.approvalStatus === 'rejected' ? (
                <>
                  Are you sure you want to reapprove <strong>{manufacturer.companyName}</strong>? 
                  This will clear the previous rejection and allow them to access the manufacturer dashboard and add products.
                </>
              ) : (
                <>
                  Are you sure you want to approve <strong>{manufacturer.companyName}</strong>? 
                  They will be able to access the manufacturer dashboard and add products.
                </>
              )}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : manufacturer.approvalStatus === 'rejected' ? 'Confirm Reapproval' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Reject Manufacturer</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting <strong>{manufacturer.companyName}</strong>:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason (minimum 10 characters)..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              {rejectionReason.length}/10 characters minimum
            </p>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || rejectionReason.trim().length < 10}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend/Activate Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {manufacturer.isActive !== false ? 'Suspend Manufacturer?' : 'Activate Manufacturer?'}
            </h3>
            <p className="text-gray-600 mb-4">
              {manufacturer.isActive !== false ? (
                <>
                  Suspending <strong>{manufacturer.companyName}</strong> will prevent them from accessing their dashboard and managing products.
                </>
              ) : (
                <>
                  Activating <strong>{manufacturer.companyName}</strong> will restore their access to the manufacturer dashboard.
                </>
              )}
            </p>
            {manufacturer.isActive !== false && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Suspension <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Please provide a reason for suspension (minimum 10 characters)..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  rows="4"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {suspendReason.length}/10 characters minimum
                </p>
              </div>
            )}
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowSuspendModal(false);
                  setSuspendReason('');
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={actionLoading || (manufacturer.isActive !== false && suspendReason.trim().length < 10)}
                className="flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: manufacturer.isActive !== false ? '#ef4444' : '#10b981',
                }}
              >
                {actionLoading ? 'Processing...' : manufacturer.isActive !== false ? 'Confirm Suspend' : 'Confirm Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-8 max-w-3xl w-full mx-4 my-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Edit Manufacturer Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  value={editFormData.companyName || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, companyName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand Name</label>
                <input
                  type="text"
                  value={editFormData.brandName || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, brandName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Contact Person</label>
                <input
                  type="text"
                  value={editFormData.contactPerson || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, contactPerson: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                <input
                  type="text"
                  value={editFormData.businessType || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, businessType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
                <input
                  type="text"
                  value={editFormData.gstNumber || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, gstNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
                <input
                  type="text"
                  value={editFormData.panNumber || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, panNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  value={editFormData.address || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={editFormData.city || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={editFormData.state || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                <input
                  type="text"
                  value={editFormData.pincode || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, pincode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder</label>
                <input
                  type="text"
                  value={editFormData.bankAccountHolder || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, bankAccountHolder: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                <input
                  type="text"
                  value={editFormData.bankAccountNumber || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, bankAccountNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">IFSC Code</label>
                <input
                  type="text"
                  value={editFormData.bankIfscCode || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, bankIfscCode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                <input
                  type="text"
                  value={editFormData.bankName || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, bankName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                <input
                  type="text"
                  value={editFormData.upiId || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, upiId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
