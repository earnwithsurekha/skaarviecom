'use client';

import { useState } from 'react';
import { X, Image, XCircle } from 'lucide-react';
import { RETURN_REASONS } from '@/lib/constants';

export default function ReturnOrderModal({ isOpen, onClose, order, daysRemaining, onConfirm, loading }) {
  const [selectedReason, setSelectedReason] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + images.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    // Validate file sizes (max 5MB each)
    const invalidFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setError('Each image must be less than 5MB');
      return;
    }

    // Create preview URLs
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
    setImages([...images, ...files]);
    setError('');
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedReason) {
      setError('Please select a return reason');
      return;
    }

    if (!description.trim()) {
      setError('Please provide a detailed description');
      return;
    }

    if (description.trim().length < 20) {
      setError('Description must be at least 20 characters');
      return;
    }

    if (images.length === 0) {
      setError('Please upload at least one image of the product');
      return;
    }

    // Upload images to S3
    setUploading(true);
    const imageUrls = [];

    try {
      for (const image of images) {
        const formData = new FormData();
        formData.append('file', image);
        formData.append('folder', 'returns');

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await response.json();
        imageUrls.push(data.url);
      }

      setUploading(false);
      onConfirm({
        reason: selectedReason,
        description: description.trim(),
        images: imageUrls,
      });
    } catch (err) {
      setUploading(false);
      setError('Failed to upload images. Please try again.');
      console.error('Image upload error:', err);
    }
  };

  const handleClose = () => {
    if (!loading && !uploading) {
      // Clean up preview URLs
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      
      setSelectedReason('');
      setDescription('');
      setImages([]);
      setImagePreviews([]);
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-white dark:bg-gray-800 pb-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Request Return
              </h3>
              {daysRemaining !== undefined && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining for return
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={loading || uploading}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Order Info */}
          {order && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Order: <span className="font-medium text-gray-900 dark:text-white">{order.order_number}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Amount: <span className="font-medium text-gray-900 dark:text-white">₹{order.total_amount}</span>
              </p>
            </div>
          )}

          {/* Info Message */}
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Return Policy:</strong> Once approved, we'll arrange a pickup and process your refund within 5-7 business days after receiving the product.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Reason Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for Return <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedReason}
                onChange={(e) => {
                  setSelectedReason(e.target.value);
                  setError('');
                }}
                disabled={loading || uploading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Select a reason</option>
                {RETURN_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setError('');
                }}
                disabled={loading || uploading}
                rows={4}
                placeholder="Please provide detailed information about the issue (minimum 20 characters)..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50
                         resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {description.length}/20 characters minimum
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Product Images <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Upload 1-5 clear images showing the issue (max 5MB each)
              </p>
              
              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        disabled={loading || uploading}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 
                                 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {images.length < 5 && (
                <label className={`
                  flex flex-col items-center justify-center w-full h-32 border-2 border-dashed 
                  rounded-lg cursor-pointer transition-colors
                  ${loading || uploading 
                    ? 'border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-50'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
                  }
                  bg-gray-50 dark:bg-gray-700
                `}>
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Image className="w-10 h-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      PNG, JPG up to 5MB
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    disabled={loading || uploading}
                  />
                </label>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading || uploading}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                         bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                         rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || uploading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg 
                         hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed 
                         transition-colors flex items-center gap-2"
              >
                {(loading || uploading) ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    {uploading ? 'Uploading Images...' : 'Submitting...'}
                  </>
                ) : (
                  'Submit Return Request'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
