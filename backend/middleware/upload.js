const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { s3, bucket } = require('../config/aws');
const { UPLOAD_LIMITS } = require('../config/constants');
const { validateImageBatch } = require('../utils/imageValidation');

// Memory storage for multer (used for both S3 and local)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|webp|gif/;
  const allowedVideoTypes = /mp4|mov|avi/;
  const allowedDocTypes = /pdf/;

  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  if (file.fieldname === 'images') {
    const isValidImage = allowedImageTypes.test(extname) && mimetype.startsWith('image/');
    if (isValidImage) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, WEBP, GIF) are allowed'));
    }
  } else if (file.fieldname === 'videos') {
    const isValidVideo = allowedVideoTypes.test(extname) && mimetype.startsWith('video/');
    if (isValidVideo) {
      cb(null, true);
    } else {
      cb(new Error('Only video files (MP4, MOV, AVI) are allowed'));
    }
  } else if (file.fieldname === 'catalog') {
    const isValidDoc = allowedDocTypes.test(extname) && mimetype === 'application/pdf';
    if (isValidDoc) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed for catalog'));
    }
  } else {
    cb(null, true);
  }
};

// Multer upload configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: UPLOAD_LIMITS.MAX_FILE_SIZE
  },
  fileFilter: fileFilter
});

// Upload file to S3 with user folder structure
const uploadLocally = async (file, userId, email, subfolder = 'documents') => {
  const fileExtension = path.extname(file.originalname);
  const fileName = `${uuidv4()}${fileExtension}`;
  
  // Create S3 folder structure: documents/{userId}/{email}/{subfolder}
  const s3Key = `documents/${userId}/${email}/${subfolder}/${fileName}`;
  
  const params = {
    Bucket: bucket,
    Key: s3Key,
    Body: file.buffer,
    ContentType: file.mimetype
  };
  
  try {
    const result = await s3.upload(params).promise();
    // Return S3 URL
    return result.Location;
  } catch (error) {
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

// Upload product file to S3 with unique structure
const uploadProductFile = async (file, userId, productName, subfolder = 'images') => {
  const fileExtension = path.extname(file.originalname);
  const timestamp = Date.now();
  const uniqueId = uuidv4().split('-')[0]; // Use first part of UUID for brevity
  const fileName = `${timestamp}_${uniqueId}${fileExtension}`;
  
  // Create S3 folder structure: products/{userId}/{sanitized-product-name}/{subfolder}
  const sanitizedProductName = productName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dashes
    .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
    .substring(0, 50); // Limit length
  
  const s3Key = `products/${userId}/${sanitizedProductName}/${subfolder}/${fileName}`;
  
  const params = {
    Bucket: bucket,
    Key: s3Key,
    Body: file.buffer,
    ContentType: file.mimetype
  };
  
  try {
    const result = await s3.upload(params).promise();
    // Return S3 URL
    return result.Location;
  } catch (error) {
    throw new Error(`Failed to upload product file to S3: ${error.message}`);
  }
};

// Upload file to S3
const uploadToS3 = async (file, folder = 'products') => {
  const fileExtension = path.extname(file.originalname);
  const fileName = `${folder}/${uuidv4()}${fileExtension}`;

  const params = {
    Bucket: bucket,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

// Delete file from S3
const deleteFromS3 = async (fileUrl) => {
  try {
    const key = fileUrl.split('.com/')[1];
    await s3.deleteObject({ Bucket: bucket, Key: key }).promise();
    return true;
  } catch (error) {
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};

// Middleware for handling multiple file uploads
const uploadMiddleware = {
  single: upload.single('file'),
  multiple: upload.array('files', 10),
  productImages: upload.array('images', UPLOAD_LIMITS.MAX_IMAGES_PER_PRODUCT),
  productVideos: upload.array('videos', UPLOAD_LIMITS.MAX_VIDEOS_PER_PRODUCT),
  productMedia: upload.fields([
    { name: 'images', maxCount: UPLOAD_LIMITS.MAX_IMAGES_PER_PRODUCT },
    { name: 'videos', maxCount: UPLOAD_LIMITS.MAX_VIDEOS_PER_PRODUCT },
    { name: 'catalog', maxCount: 1 }
  ])
};

/**
 * Middleware to validate image quality after upload
 * Checks for blur, brightness, and contrast
 */
const validateImageQuality = async (req, res, next) => {
  try {
    // Check if there are image files to validate
    const imageFiles = [];
    
    // Handle different file upload patterns
    if (req.files) {
      // For fields upload (product media)
      if (req.files.images) {
        imageFiles.push(...req.files.images);
      }
      
      // For single field array upload
      if (Array.isArray(req.files)) {
        // Filter only image files
        const images = req.files.filter(file => file.mimetype.startsWith('image/'));
        imageFiles.push(...images);
      }
    } else if (req.file && req.file.mimetype.startsWith('image/')) {
      // For single file upload
      imageFiles.push(req.file);
    }

    // If no images to validate, skip
    if (imageFiles.length === 0) {
      return next();
    }

    console.log(`Validating ${imageFiles.length} image(s) for quality...`);

    // Validate all images
    const validationResult = await validateImageBatch(imageFiles, {
      minBlurScore: 100,      // Adjust based on your requirements
      minBrightness: 20,      // Image should not be too dark
      maxBrightness: 245,     // Image should not be overexposed
      minContrast: 30,        // Image should have reasonable contrast
      minWidth: 300,          // Minimum 300px width
      minHeight: 300,         // Minimum 300px height
    });

    // If validation fails, reject the upload
    if (!validationResult.allValid) {
      console.log('Image quality validation failed:', validationResult.failures);
      
      return res.status(400).json({
        status: 'error',
        message: 'One or more images failed quality validation',
        failures: validationResult.failures.map(f => ({
          filename: f.filename,
          message: f.message
        }))
      });
    }

    console.log(`All ${imageFiles.length} image(s) passed quality validation`);
    next();

  } catch (error) {
    console.error('Image validation middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to validate image quality',
      error: error.message
    });
  }
};

module.exports = {
  uploadMiddleware,
  uploadLocally,
  uploadProductFile,
  uploadToS3,
  deleteFromS3,
  validateImageQuality
};
