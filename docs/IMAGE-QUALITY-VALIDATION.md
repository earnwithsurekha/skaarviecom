# Image Quality Validation

## Overview
The platform now includes automatic image quality validation to ensure all uploaded images meet minimum quality standards. This prevents blurry, dark, overexposed, or low-quality images from being uploaded.

## Features

### 1. **Blur Detection**
- Uses Laplacian variance algorithm to detect image sharpness
- Minimum blur score: **100** (higher = sharper)
- Rejects images that are too blurry to display product details clearly

### 2. **Brightness Validation**
- Checks average image brightness on a 0-255 scale
- Minimum brightness: **20** (prevents too-dark images)
- Maximum brightness: **245** (prevents overexposed images)
- Ensures products are clearly visible

### 3. **Contrast Detection**
- Measures contrast using standard deviation
- Minimum contrast: **30**
- Rejects images with poor contrast that make details hard to see

### 4. **Dimension Requirements**
- Minimum width: **300 pixels**
- Minimum height: **300 pixels**
- Ensures images are large enough to display product details

## Where Validation Applies

Image quality validation is enforced for:

1. **Product Images** (Manufacturer)
   - All product images during creation
   - All product images during updates
   - Maximum 10 images per product

2. **Banner Images** (Admin)
   - Homepage banners
   - Promotional banners
   - Category banners

3. **Profile Photos**
   - Reseller profile photos
   - Manufacturer profile photos (during registration)

## Error Messages

When an image fails validation, you'll see specific error messages:

### Examples:
- `"Image is too blurry (score: 85/100)"`
- `"Image is too dark (brightness: 15/20)"`
- `"Image is overexposed (brightness: 250/245)"`
- `"Image has low contrast (score: 22/30)"`
- `"Image dimensions too small. Minimum 300x300px required, got 250x200px"`

### Batch Upload Errors:
When uploading multiple images, the response will include:
```json
{
  "status": "error",
  "message": "One or more images failed quality validation",
  "failures": [
    {
      "filename": "product1.jpg",
      "message": "Image is too blurry (score: 75/100)"
    },
    {
      "filename": "product2.jpg",
      "message": "Image is too dark (brightness: 12/20)"
    }
  ]
}
```

## Best Practices

### For Product Photography:

1. **Lighting**
   - Use bright, even lighting
   - Avoid harsh shadows
   - Natural light works best
   - Use diffused lighting for indoor shots

2. **Focus**
   - Ensure product is in sharp focus
   - Use tripod to prevent camera shake
   - Take multiple shots and select the best

3. **Background**
   - Use clean, plain backgrounds
   - White or light gray backgrounds work best
   - Ensure good contrast between product and background

4. **Camera Settings**
   - Use highest quality setting
   - Disable digital zoom (use optical zoom only)
   - Set appropriate ISO (100-400 for good lighting)
   - Use burst mode and select sharpest image

5. **Image Format**
   - JPEG, PNG, WEBP, or GIF accepted
   - Maximum file size: **5MB** per image
   - Minimum resolution: **300x300 pixels**
   - Recommended: **1000x1000 pixels** or higher

### For Mobile Photography:

1. Clean your camera lens
2. Use HDR mode for better exposure
3. Tap on the product to focus
4. Hold steady or use timer mode
5. Avoid using flash (use natural light)
6. Don't use digital zoom
7. Edit in good photo editing apps if needed

## Technical Details

### Validation Algorithm:
1. Image is converted to grayscale for analysis
2. Laplacian operator applied for edge detection
3. Variance calculated to determine sharpness
4. Brightness calculated as average pixel value
5. Contrast measured using standard deviation
6. Results compared against minimum thresholds

### Processing Flow:
```
Upload → File Type Check → Size Check → Quality Validation → Save to Disk
```

If quality validation fails, the image is rejected before being saved, ensuring only high-quality images reach your platform.

## Adjusting Validation Settings

Validation thresholds can be adjusted in the backend code if needed:

**File:** `backend/middleware/upload.js`

```javascript
const validationResult = await validateImageBatch(imageFiles, {
  minBlurScore: 100,      // Lower = more lenient for blur
  minBrightness: 20,      // Lower = accept darker images
  maxBrightness: 245,     // Higher = accept brighter images
  minContrast: 30,        // Lower = accept lower contrast
  minWidth: 300,          // Minimum width in pixels
  minHeight: 300,         // Minimum height in pixels
});
```

## Troubleshooting

### "Image is too blurry"
- Retake photo with better focus
- Use tripod or stabilize camera
- Ensure adequate lighting
- Clean camera lens

### "Image is too dark"
- Add more lighting
- Adjust camera exposure settings
- Move closer to light source
- Use photo editing to increase brightness (moderately)

### "Image is overexposed"
- Reduce lighting intensity
- Adjust camera exposure compensation
- Move away from direct light
- Use diffused lighting

### "Image has low contrast"
- Use contrasting background
- Improve lighting setup
- Ensure product stands out from background
- Adjust camera settings

## Future Enhancements

Planned improvements:
- AI-based image quality scoring
- Automatic image enhancement
- Background removal suggestion
- Composition guidelines overlay
- Real-time quality feedback during upload

---

**Note:** If you believe an image was incorrectly rejected, please contact technical support with the specific image and error message for review.
