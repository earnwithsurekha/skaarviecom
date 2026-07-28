const express = require('express');
const router = express.Router();
const { sequelize } = require('../../models');
const bcrypt = require('bcryptjs');
const { validateImageQuality } = require('../../middleware/upload');
const { s3, bucket } = require('../../config/aws');
const multer = require('multer');
const path = require('node:path');
const { v4: uuidv4 } = require('uuid');

// Configure multer for profile photo upload - use memory storage for validation
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// Helper function to save profile photo to S3 after validation
const saveProfilePhoto = async (file) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = 'profile-' + uniqueSuffix + path.extname(file.originalname);
  const s3Key = `profiles/${filename}`;
  
  const params = {
    Bucket: bucket,
    Key: s3Key,
    Body: file.buffer,
    ContentType: file.mimetype
  };
  
  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    throw new Error(`Failed to upload profile photo to S3: ${error.message}`);
  }
};

// @route   GET /api/reseller/profile
// @desc    Get reseller profile details
// @access  Private (Reseller only)
router.get('/', async (req, res) => {
  try {
    const resellerId = req.user.id;

    const [profile] = await sequelize.query(`
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.mobile,
        u.profile_photo,
        u.created_at,
        u.is_active,
        u.is_verified,
        r.reseller_code,
        r.reseller_type,
        r.city,
        r.state,
        r.pincode,
        r.bank_account_number,
        r.bank_ifsc_code,
        r.bank_account_holder,
        r.upi_id,
        r.commission_rate,
        r.profile_photo_url
      FROM users u
      JOIN resellers r ON u.id = r.user_id
      WHERE u.id = :resellerId
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'Profile not found'
      });
    }

    res.json({
      status: 'success',
      data: profile
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// @route   PUT /api/reseller/profile/personal
// @desc    Update personal information
// @access  Private (Reseller only)
router.put('/personal', async (req, res) => {
  try {
    const resellerId = req.user.id;
    const { full_name, email, mobile, city, state, profile_photo } = req.body;

    // Update user table
    await sequelize.query(`
      UPDATE users
      SET full_name = :full_name,
          email = :email,
          mobile = :mobile,
          profile_photo = :profile_photo,
          updated_at = NOW()
      WHERE id = :resellerId
    `, {
      replacements: { 
        resellerId, 
        full_name, 
        email, 
        mobile, 
        profile_photo: profile_photo || null 
      }
    });

    // Update reseller table
    await sequelize.query(`
      UPDATE resellers
      SET city = :city,
          state = :state,
          updated_at = NOW()
      WHERE id = :resellerId
    `, {
      replacements: { resellerId, city, state }
    });

    res.json({
      status: 'success',
      message: 'Personal information updated successfully'
    });

  } catch (error) {
    console.error('Update personal info error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update personal information',
      error: error.message
    });
  }
});

// @route   PUT /api/reseller/profile/bank
// @desc    Update bank details
// @access  Private (Reseller only)
router.put('/bank', async (req, res) => {
  try {
    const resellerId = req.user.id;
    const { 
      bank_account_number, 
      bank_ifsc, 
      bank_account_holder, 
      upi_id 
    } = req.body;

    await sequelize.query(`
      UPDATE resellers
      SET bank_account_number = :bank_account_number,
          bank_ifsc = :bank_ifsc,
          bank_account_holder = :bank_account_holder,
          upi_id = :upi_id,
          updated_at = NOW()
      WHERE id = :resellerId
    `, {
      replacements: { 
        resellerId,
        bank_account_number,
        bank_ifsc,
        bank_account_holder,
        upi_id
      }
    });

    res.json({
      status: 'success',
      message: 'Bank details updated successfully'
    });

  } catch (error) {
    console.error('Update bank details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update bank details',
      error: error.message
    });
  }
});

// @route   PUT /api/reseller/profile/kyc
// @desc    Update KYC details
// @access  Private (Reseller only)
router.put('/kyc', async (req, res) => {
  try {
    const resellerId = req.user.id;
    const { aadhaar_number, pan_number } = req.body;

    await sequelize.query(`
      UPDATE resellers
      SET aadhaar_number = :aadhaar_number,
          pan_number = :pan_number,
          updated_at = NOW()
      WHERE id = :resellerId
    `, {
      replacements: { 
        resellerId,
        aadhaar_number: aadhaar_number || null,
        pan_number: pan_number || null
      }
    });

    res.json({
      status: 'success',
      message: 'KYC details updated successfully'
    });

  } catch (error) {
    console.error('Update KYC error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update KYC details',
      error: error.message
    });
  }
});

// @route   PUT /api/reseller/profile/password
// @desc    Change password
// @access  Private (Reseller only)
router.put('/password', async (req, res) => {
  try {
    const resellerId = req.user.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password and new password are required'
      });
    }

    // Get current password hash
    const [user] = await sequelize.query(`
      SELECT password_hash
      FROM users
      WHERE id = :resellerId
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(new_password, salt);

    // Update password
    await sequelize.query(`
      UPDATE users
      SET password_hash = :password_hash,
          updated_at = NOW()
      WHERE id = :resellerId
    `, {
      replacements: { resellerId, password_hash: newPasswordHash }
    });

    res.json({
      status: 'success',
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to change password',
      error: error.message
    });
  }
});

// @route   POST /api/reseller/profile/photo
// @desc    Upload profile photo
// @access  Private (Reseller only)
router.post('/photo', upload.single('photo'), validateImageQuality, async (req, res) => {
  try {
    const resellerId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No photo file uploaded'
      });
    }

    // Upload photo to S3 after validation
    const photoUrl = await saveProfilePhoto(req.file);

    // Update profile photo URL
    await sequelize.query(`
      UPDATE users
      SET profile_photo = :photoUrl,
          updated_at = NOW()
      WHERE id = :resellerId
    `, {
      replacements: { resellerId, photoUrl }
    });

    res.json({
      status: 'success',
      message: 'Profile photo uploaded successfully',
      data: { photo_url: photoUrl }
    });

  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload photo',
      error: error.message
    });
  }
});

// @route   PUT /api/reseller/profile/address
// @desc    Update address details
// @access  Private (Reseller only)
router.put('/address', async (req, res) => {
  try {
    const resellerId = req.user.id;
    const { address_line1, address_line2, city, state, pincode, country } = req.body;

    await sequelize.query(`
      UPDATE resellers
      SET address_line1 = :address_line1,
          address_line2 = :address_line2,
          city = :city,
          state = :state,
          pincode = :pincode,
          country = :country,
          updated_at = NOW()
      WHERE id = :resellerId
    `, {
      replacements: { 
        resellerId,
        address_line1: address_line1 || null,
        address_line2: address_line2 || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        country: country || 'India'
      }
    });

    res.json({
      status: 'success',
      message: 'Address updated successfully'
    });

  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update address',
      error: error.message
    });
  }
});

module.exports = router;
