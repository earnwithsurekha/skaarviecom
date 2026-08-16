// Cart utility functions for localStorage and cookie management

/**
 * Save cart to localStorage (for guest users)
 */
export const saveCartToLocalStorage = (cartState) => {
  try {
    localStorage.setItem('skaarvi_guest_cart', JSON.stringify({
      items: cartState.items,
      referralCode: cartState.referralCode,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
};

/**
 * Load cart from localStorage (for guest users)
 */
export const loadCartFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem('skaarvi_guest_cart');
    if (!stored) return null;
    
    const data = JSON.parse(stored);
    
    // Check if cart is older than 7 days
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > sevenDaysInMs) {
      // Cart expired, clear it
      clearCartFromLocalStorage();
      return null;
    }
    
    return {
      items: data.items || [],
      referralCode: data.referralCode || null,
    };
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error);
    return null;
  }
};

/**
 * Clear cart from localStorage
 */
export const clearCartFromLocalStorage = () => {
  try {
    localStorage.removeItem('skaarvi_guest_cart');
  } catch (error) {
    console.error('Failed to clear cart from localStorage:', error);
  }
};

/**
 * Get referral code from URL parameter
 */
export const getReferralCodeFromURL = () => {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('ref') || urlParams.get('referral') || null;
};

/**
 * Save referral code to cookie (7-day expiry)
 */
export const saveReferralCodeToCookie = (referralCode) => {
  if (!referralCode) return;
  
  try {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 7 days from now
    
    document.cookie = `skaarvi_referral=${referralCode}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
    
    // Also save to localStorage as backup
    localStorage.setItem('skaarvi_referral_code', JSON.stringify({
      code: referralCode,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Failed to save referral code to cookie:', error);
  }
};

/**
 * Get referral code from cookie or localStorage
 */
export const getReferralCodeFromStorage = () => {
  try {
    // Try cookie first
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'skaarvi_referral') {
        return value;
      }
    }
    
    // Fallback to localStorage
    const stored = localStorage.getItem('skaarvi_referral_code');
    if (stored) {
      const data = JSON.parse(stored);
      
      // Check if referral is older than 7 days
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - data.timestamp < sevenDaysInMs) {
        return data.code;
      } else {
        localStorage.removeItem('skaarvi_referral_code');
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get referral code from storage:', error);
    return null;
  }
};

/**
 * Clear referral code from cookie and localStorage
 */
export const clearReferralCode = () => {
  try {
    // Clear cookie
    document.cookie = 'skaarvi_referral=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Clear localStorage
    localStorage.removeItem('skaarvi_referral_code');
  } catch (error) {
    console.error('Failed to clear referral code:', error);
  }
};

/**
 * Format price for display
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Calculate cart summary
 */
export const calculateCartSummary = (items) => {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Free shipping above ₹500
  const shipping = subtotal >= 500 ? 0 : 50;
  
  const total = subtotal + shipping;
  
  return {
    subtotal,
    totalItems,
    shipping,
    shippingFree: subtotal >= 500,
    total,
  };
};
