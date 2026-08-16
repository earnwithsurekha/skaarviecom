// Referral click tracking utility

/**
 * Track a referral click when a product is viewed via a referral link
 * @param {string} referralCode - The referral code from URL or storage
 * @param {string} productId - The product being viewed
 */
export const trackReferralClick = async (referralCode, productId = null) => {
  if (!referralCode) return null;

  try {
    // Generate or get session ID
    const sessionId = getOrCreateSessionId();

    const response = await fetch('/api/referrals/track-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        referralCode,
        productId,
        sessionId,
        userAgent: navigator.userAgent,
        referrer: document.referrer,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('[Referral Tracking] Click tracked successfully');
      return data;
    } else {
      console.error('[Referral Tracking] Failed to track click:', data.message);
      return null;
    }
  } catch (error) {
    console.error('[Referral Tracking] Error tracking click:', error);
    return null;
  }
};

/**
 * Validate a referral code
 * @param {string} referralCode - The referral code to validate
 * @returns {Promise<object|null>} - Reseller info if valid, null otherwise
 */
export const validateReferralCode = async (referralCode) => {
  if (!referralCode) return null;

  try {
    const response = await fetch(`/api/referrals/validate/${referralCode}`);
    const data = await response.json();

    if (response.ok && data.valid) {
      console.log('[Referral Validation] Valid code:', referralCode);
      return data.data;
    } else {
      console.error('[Referral Validation] Invalid code:', referralCode);
      return null;
    }
  } catch (error) {
    console.error('[Referral Validation] Error validating code:', error);
    return null;
  }
};

/**
 * Get or create a session ID for tracking
 * @returns {string} - Session ID
 */
function getOrCreateSessionId() {
  let sessionId = sessionStorage.getItem('skaarvi_session_id');
  
  if (!sessionId) {
    sessionId = generateSessionId();
    sessionStorage.setItem('skaarvi_session_id', sessionId);
  }
  
  return sessionId;
}

/**
 * Generate a unique session ID
 * @returns {string} - Generated session ID
 */
function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Track product view with referral attribution
 * This should be called when a product page loads with a referral code
 * @param {string} productId - The product ID
 * @param {string} referralCode - The referral code (from URL or storage)
 */
export const trackProductViewWithReferral = async (productId, referralCode) => {
  if (!referralCode || !productId) return;

  try {
    // Track the click
    await trackReferralClick(referralCode, productId);
  } catch (error) {
    console.error('[Referral Tracking] Error tracking product view:', error);
  }
};

export default {
  trackReferralClick,
  validateReferralCode,
  trackProductViewWithReferral,
};
