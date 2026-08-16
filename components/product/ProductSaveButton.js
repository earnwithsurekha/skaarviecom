'use client';

import { useState, useEffect } from 'react';
import { Heart, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ProductSaveButton({ 
  productId, 
  initialSaved = false,
  source = 'product_page',
  onSaveChange 
}) {
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkSaveStatus();
  }, [productId]);

  const checkSaveStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCheckingStatus(false);
        return;
      }

      const response = await fetch(`/api/analytics/products/${productId}/save/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          setIsSaved(result.data.isSaved);
        }
      }
    } catch (error) {
      console.error('Check save status error:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleToggleSave = async (e) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to save products');
      return;
    }

    setLoading(true);
    try {
      const method = isSaved ? 'DELETE' : 'POST';
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      };

      // Add body only for POST requests
      if (!isSaved) {
        options.body = JSON.stringify({
          source,
          deviceType: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
        });
      }

      const response = await fetch(`/api/analytics/products/${productId}/save`, options);

      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        result = { status: 'error', message: 'Invalid server response' };
      }

      if (response.ok && result.status === 'success') {
        const newSavedState = !isSaved;
        setIsSaved(newSavedState);
        
        if (newSavedState) {
          toast.success('Product saved to wishlist');
        } else {
          toast.success('Removed from wishlist');
        }

        if (onSaveChange) {
          onSaveChange(newSavedState);
        }
      } else {
        throw new Error(result.message || `Failed to ${isSaved ? 'remove from' : 'save to'} wishlist`);
      }
    } catch (error) {
      console.error('Toggle save error:', error);
      toast.error(error.message || 'Failed to update wishlist');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <button
        disabled
        onClick={(e) => e.stopPropagation()}
        className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700"
      >
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleSave}
      disabled={loading}
      className={`p-1.5 rounded-full transition-all ${
        isSaved
          ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}
      title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart
          className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`}
        />
      )}
    </button>
  );
}
