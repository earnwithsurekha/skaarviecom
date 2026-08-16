/**
 * Product Tracking Utilities
 * Handles click tracking for product links
 */

/**
 * Track product click
 * @param {string} productId - Product ID
 * @param {string} source - Source of click (e.g., 'product_listing', 'search_results', 'recommendations')
 * @param {string} referrer - Referring page/source
 */
export async function trackProductClick(productId, source = 'product_page', referrer = '') {
  try {
    const token = localStorage.getItem('token');
    const sessionId = getOrCreateSessionId();

    await fetch(`/api/analytics/products/${productId}/click`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        source,
        referrer: referrer || document.referrer || window.location.href,
        sessionId,
        deviceType: getDeviceType(),
      }),
    });
  } catch (error) {
    console.error('Track product click error:', error);
    // Fail silently - don't disrupt user experience
  }
}

/**
 * Get or create a session ID for anonymous tracking
 */
function getOrCreateSessionId() {
  let sessionId = localStorage.getItem('session_id');
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('session_id', sessionId);
  }
  
  return sessionId;
}

/**
 * Detect device type
 */
function getDeviceType() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  if (/Mobile|Android|iPhone|iPod/i.test(userAgent)) {
    return 'mobile';
  }
  if (/iPad|Tablet/i.test(userAgent)) {
    return 'tablet';
  }
  return 'desktop';
}

/**
 * Track multiple product views (for product listing pages)
 */
export async function trackProductImpressions(productIds, source = 'product_listing') {
  // Batch track impressions - you can implement this if needed
  // For now, we're focusing on click tracking
  console.log('Product impressions:', productIds, source);
}

/**
 * Create tracked product link
 * Returns a click handler that tracks before navigation
 */
export function createTrackedLink(productId, targetUrl, source = 'product_page') {
  return async (e) => {
    e.preventDefault();
    
    // Track the click
    await trackProductClick(productId, source);
    
    // Small delay to ensure tracking completes
    setTimeout(() => {
      window.location.href = targetUrl;
    }, 100);
  };
}
