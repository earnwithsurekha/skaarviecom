'use client';

/**
 * Image URL utility functions
 * Handles both S3 URLs and legacy local paths during migration
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

/**
 * Get the full image URL
 * - If URL starts with http/https, return as-is (S3 URL)
 * - If URL starts with /, prepend backend URL (legacy local path)
 * - Otherwise, return null
 * 
 * @param {string} imagePath - Image path or URL from database
 * @returns {string|null} - Full image URL or null
 */
export function getImageUrl(imagePath) {
  if (!imagePath) {
    return null;
  }

  // Already a full URL (S3 URL)
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Legacy local path (starts with /)
  if (imagePath.startsWith('/')) {
    return `${BACKEND_URL}${imagePath}`;
  }

  // Invalid format
  console.warn('Invalid image path format:', imagePath);
  return null;
}

/**
 * Get image URLs for an array of images
 * 
 * @param {Array<Object|string>} images - Array of image objects or paths
 * @param {string} urlField - Field name containing the URL (default: 'imageUrl')
 * @returns {Array<string>} - Array of full image URLs
 */
export function getImageUrls(images, urlField = 'imageUrl') {
  if (!Array.isArray(images) || images.length === 0) {
    return [];
  }

  return images
    .map(img => {
      const path = typeof img === 'string' ? img : img[urlField];
      return getImageUrl(path);
    })
    .filter(url => url !== null);
}

/**
 * Check if a URL is an S3 URL
 * 
 * @param {string} url - URL to check
 * @returns {boolean} - True if S3 URL, false otherwise
 */
export function isS3Url(url) {
  if (!url) return false;
  return url.includes('.s3.') && url.startsWith('https://');
}

/**
 * Get the primary image URL from product data
 * 
 * @param {Object} product - Product object
 * @returns {string|null} - Primary image URL or null
 */
export function getPrimaryImageUrl(product) {
  if (!product) return null;

  // Check for primary image in images array
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const primaryImage = product.images.find(img => img.isPrimary) || product.images[0];
    return getImageUrl(primaryImage.imageUrl || primaryImage.image_url);
  }

  // Check for direct imageUrl field
  if (product.imageUrl) {
    return getImageUrl(product.imageUrl);
  }

  // Check for primary_image field
  if (product.primary_image) {
    return getImageUrl(product.primary_image);
  }

  return null;
}

/**
 * Get fallback image for when no image is available
 * 
 * @returns {string} - Fallback image URL
 */
export function getFallbackImageUrl() {
  return '/images/placeholder-product.png';
}

export default {
  getImageUrl,
  getImageUrls,
  isS3Url,
  getPrimaryImageUrl,
  getFallbackImageUrl
};
