'use client';

import { useState } from 'react';
import { X, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import { COURIER_PARTNERS } from '@/lib/orderUtils';

export default function ShippingDetailsModal({ orderId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    courierPartner: '',
    trackingNumber: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.courierPartner) {
      newErrors.courierPartner = 'Please select a courier partner';
    }
    if (!formData.trackingNumber.trim()) {
      newErrors.trackingNumber = 'Tracking number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/orders/${orderId}/ship`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success('Order marked as shipped!');
        onSuccess();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Ship order error:', error);
      toast.error(error.message || 'Failed to mark order as shipped');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-label="Close shipping details"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div 
          className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-lg bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <Truck className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold">Shipping Details</h2>
            </div>
            <button
              onClick={onClose}
              className="flex h-11 w-11 flex-none items-center justify-center text-gray-400 transition-colors hover:text-gray-600"
              aria-label="Close shipping details"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 p-4 sm:p-6">
            {/* Courier Partner */}
            <div>
              <label htmlFor="courierPartner" className="block text-sm font-medium text-gray-700 mb-2">
                Courier Partner <span className="text-red-500">*</span>
              </label>
              <select
                id="courierPartner"
                name="courierPartner"
                value={formData.courierPartner}
                onChange={handleChange}
                className={`input w-full ${errors.courierPartner ? 'border-red-500' : ''}`}
              >
                <option value="">Select a courier partner</option>
                {COURIER_PARTNERS.map((courier) => (
                  <option key={courier.value} value={courier.value}>
                    {courier.label}
                  </option>
                ))}
              </select>
              {errors.courierPartner && (
                <p className="text-red-500 text-sm mt-1">{errors.courierPartner}</p>
              )}
            </div>

            {/* Tracking Number */}
            <div>
              <label htmlFor="trackingNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Tracking Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="trackingNumber"
                name="trackingNumber"
                value={formData.trackingNumber}
                onChange={handleChange}
                placeholder="Enter tracking number"
                className={`input w-full ${errors.trackingNumber ? 'border-red-500' : ''}`}
              />
              {errors.trackingNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.trackingNumber}</p>
              )}
            </div>

            {/* Notes (Optional) */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Add any additional notes..."
                className="input w-full resize-none"
              />
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-4 sm:flex sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline min-h-11 w-full sm:w-auto"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary min-h-11 w-full sm:w-auto"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4 mr-2" />
                    Mark as Shipped
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
