const sharp = require('sharp');

/**
 * Validate image quality to prevent blurry or unclear images
 * @param {Buffer} buffer - Image file buffer
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} - Validation result with status and message
 */
async function validateImageQuality(buffer, options = {}) {
  const {
    minBlurScore = 100,        // Minimum Laplacian variance (lower = more blurry)
    minBrightness = 20,        // Minimum average brightness (0-255)
    maxBrightness = 245,       // Maximum average brightness (to detect overexposed)
    minContrast = 30,          // Minimum contrast between pixels
    minWidth = 300,            // Minimum image width
    minHeight = 300,           // Minimum image height
  } = options;

  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    const { width, height, format } = metadata;

    // Check image dimensions
    if (width < minWidth || height < minHeight) {
      return {
        valid: false,
        message: `Image dimensions too small. Minimum ${minWidth}x${minHeight}px required, got ${width}x${height}px`,
        details: { width, height, format }
      };
    }

    // Convert to grayscale for analysis
    const { data, info } = await sharp(buffer)
      .greyscale()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Calculate blur score using Laplacian variance
    const blurScore = calculateBlurScore(data, info.width, info.height);

    // Calculate brightness
    const brightness = calculateBrightness(data);

    // Calculate contrast
    const contrast = calculateContrast(data);

    // Validation checks
    const validations = {
      blur: {
        valid: blurScore >= minBlurScore,
        score: Math.round(blurScore),
        message: blurScore < minBlurScore 
          ? `Image is too blurry (score: ${Math.round(blurScore)}/${minBlurScore})`
          : 'Image sharpness OK'
      },
      brightness: {
        valid: brightness >= minBrightness && brightness <= maxBrightness,
        score: Math.round(brightness),
        message: brightness < minBrightness 
          ? `Image is too dark (brightness: ${Math.round(brightness)}/${minBrightness})`
          : brightness > maxBrightness
          ? `Image is overexposed (brightness: ${Math.round(brightness)}/${maxBrightness})`
          : 'Image brightness OK'
      },
      contrast: {
        valid: contrast >= minContrast,
        score: Math.round(contrast),
        message: contrast < minContrast
          ? `Image has low contrast (score: ${Math.round(contrast)}/${minContrast})`
          : 'Image contrast OK'
      }
    };

    // Check if all validations passed
    const allValid = Object.values(validations).every(v => v.valid);

    if (!allValid) {
      const failedChecks = Object.entries(validations)
        .filter(([_, v]) => !v.valid)
        .map(([key, v]) => v.message);

      return {
        valid: false,
        message: 'Image quality validation failed: ' + failedChecks.join('; '),
        details: {
          ...validations,
          dimensions: { width, height },
          format
        }
      };
    }

    return {
      valid: true,
      message: 'Image quality validation passed',
      details: {
        ...validations,
        dimensions: { width, height },
        format
      }
    };

  } catch (error) {
    console.error('Image validation error:', error);
    return {
      valid: false,
      message: 'Failed to validate image: ' + error.message,
      details: { error: error.message }
    };
  }
}

/**
 * Calculate blur score using Laplacian variance
 * Higher values = sharper image
 * @param {Buffer} data - Grayscale image data
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @returns {number} - Blur score
 */
function calculateBlurScore(data, width, height) {
  let sum = 0;
  let count = 0;

  // Apply Laplacian operator (simple edge detection)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      // Laplacian kernel: center pixel * 8 - sum of 8 neighbors
      const center = data[idx] * 8;
      const neighbors = 
        data[(y-1) * width + (x-1)] +
        data[(y-1) * width + x] +
        data[(y-1) * width + (x+1)] +
        data[y * width + (x-1)] +
        data[y * width + (x+1)] +
        data[(y+1) * width + (x-1)] +
        data[(y+1) * width + x] +
        data[(y+1) * width + (x+1)];
      
      const laplacian = Math.abs(center - neighbors);
      sum += laplacian * laplacian;
      count++;
    }
  }

  // Return variance (normalized)
  return count > 0 ? sum / count : 0;
}

/**
 * Calculate average brightness
 * @param {Buffer} data - Grayscale image data
 * @returns {number} - Average brightness (0-255)
 */
function calculateBrightness(data) {
  const sum = data.reduce((acc, val) => acc + val, 0);
  return sum / data.length;
}

/**
 * Calculate image contrast
 * @param {Buffer} data - Grayscale image data
 * @returns {number} - Standard deviation (contrast measure)
 */
function calculateContrast(data) {
  const mean = calculateBrightness(data);
  const variance = data.reduce((acc, val) => {
    const diff = val - mean;
    return acc + (diff * diff);
  }, 0) / data.length;
  
  return Math.sqrt(variance);
}

/**
 * Batch validate multiple images
 * @param {Array} files - Array of file buffers
 * @param {Object} options - Validation options
 * @returns {Promise<Object>} - Validation results
 */
async function validateImageBatch(files, options = {}) {
  const results = [];
  const failures = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await validateImageQuality(file.buffer, options);
    
    results.push({
      filename: file.originalname,
      index: i,
      ...result
    });

    if (!result.valid) {
      failures.push({
        filename: file.originalname,
        index: i,
        message: result.message
      });
    }
  }

  return {
    allValid: failures.length === 0,
    totalFiles: files.length,
    passedCount: results.filter(r => r.valid).length,
    failedCount: failures.length,
    results,
    failures
  };
}

module.exports = {
  validateImageQuality,
  validateImageBatch
};
