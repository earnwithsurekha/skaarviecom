const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { authMiddleware, manufacturerOnly } = require('../middleware/auth');
const { uploadToS3, uploadLocally, validateImageQuality } = require('../middleware/upload');
const { User, Manufacturer, OTP } = require('../models/user');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/email');

// ========================================
// OTP BYPASSED - Direct login endpoint
// ========================================
// @route   POST /api/auth/login-bypass
// @desc    Direct login without OTP (for development)
// @access  Public
router.post('/login-bypass', [
  body('email').isEmail().withMessage('Invalid email address'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: errors.array()[0].msg,
        errors: errors.array()
      });
    }

    const { email, userType } = req.body; // userType is optional (admin, manufacturer, customer)

    // Find user with email
    const user = await User.findOne({
      where: { email },
      include: [{
        model: Manufacturer,
        as: 'manufacturer',
      }],
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Email not registered. Please register first.',
        code: 'EMAIL_NOT_FOUND',
      });
    }

    // Validate role if userType is specified
    if (userType && user.role !== userType) {
      // Special case: Allow resellers to log in as customers if they have a customer record
      // (meaning they were upgraded from customer)
      if (userType === 'customer' && user.role === 'reseller') {
        const sequelize = require('../config/database');
        const { QueryTypes } = require('sequelize');
        
        const [customerRecord] = await sequelize.query(
          'SELECT id FROM customers WHERE user_id = ?',
          {
            replacements: [user.id],
            type: QueryTypes.SELECT
          }
        );

        // If no customer record exists, deny access
        if (!customerRecord) {
          return res.status(403).json({
            status: 'error',
            message: `This login is for ${userType}s only. Please use the correct login page.`,
            code: 'ROLE_MISMATCH',
            expectedRole: userType,
            actualRole: user.role,
          });
        }
        // If customer record exists, allow login (continue below)
      } else {
        // For all other role mismatches, deny access
        return res.status(403).json({
          status: 'error',
          message: `This login is for ${userType}s only. Please use the correct login page.`,
          code: 'ROLE_MISMATCH',
          expectedRole: userType,
          actualRole: user.role,
        });
      }
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Fetch reseller data if user is a reseller
    let resellerData = null;
    if (user.role === 'reseller') {
      const sequelize = require('../config/database');
      const { QueryTypes } = require('sequelize');
      
      const [result] = await sequelize.query(
        `SELECT r.*, u.status as user_status 
         FROM resellers r 
         JOIN users u ON r.user_id = u.id 
         WHERE r.user_id = ?`,
        {
          replacements: [user.id],
          type: QueryTypes.SELECT
        }
      );
      
      if (result) {
        resellerData = {
          id: result.id,
          resellerCode: result.reseller_code,
          fullName: result.full_name,
          city: result.city,
          state: result.state,
          approvalStatus: result.user_status || 'pending', // Get status from users table
        };
      }
    }

    // Generate tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      manufacturerId: user.manufacturer?.id || null,
      resellerId: resellerData?.id || null,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.status(200).json({
      status: 'success',
      message: 'Login successful (OTP bypassed)',
      data: {
        user: {
          id: user.id,
          email: user.email,
          mobile: user.mobile,
          role: user.role,
          isVerified: user.isVerified,
          manufacturer: user.manufacturer ? {
            id: user.manufacturer.id,
            companyName: user.manufacturer.companyName,
            brandName: user.manufacturer.brandName,
            approvalStatus: user.manufacturer.approvalStatus,
          } : null,
          reseller: resellerData,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login bypass error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login failed',
      error: error.message
    });
  }
});

// ========================================
// OTP LOGIC - COMMENTED OUT (can be re-enabled later)
// OTP endpoints: send-otp, send-registration-otp, verify-otp
// ========================================

// Setup multer for file uploads (still needed for registration)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// @route   POST /api/auth/register
// @desc    Complete manufacturer registration
// @access  Public (OTP bypassed for now)
router.post('/register', 
  upload.fields([
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'panCard', maxCount: 1 },
    { name: 'cancelledCheque', maxCount: 1 },
    { name: 'companyLogo', maxCount: 1 },
  ]),
  async (req, res) => {
    console.log('=== Registration Request Started ===');
    console.log('Body fields:', Object.keys(req.body));
    console.log('Files:', req.files ? Object.keys(req.files) : 'No files');
    
    const bcrypt = require('bcryptjs');
    
    try {
      const {
        mobile,
        email,
        password,
        companyName,
        brandName,
        contactPersonName,
        businessType,
        gstNumber,
        panNumber,
        address,
        city,
        state,
        pincode,
        accountHolderName,
        accountNumber,
        ifscCode,
        bankName,
        upiId,
      } = req.body;

      console.log('Email:', email);
      console.log('Company Name:', companyName);

      // Validate required fields
      if (!email || !companyName || !contactPersonName || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Required fields missing: email, companyName, contactPersonName, password',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Find or create user based on email
      let user = await User.findOne({ where: { email } });
      
      if (!user) {
        console.log('Creating new user for email:', email);
        // Create new user without OTP verification (bypassed)
        user = await User.create({
          email,
          mobile,
          password: hashedPassword,
          role: 'manufacturer',
          isVerified: true, // Auto-verified since OTP is bypassed
          lastLogin: new Date(),
        });
        console.log('User created with ID:', user.id);
      } else {
        console.log('Found existing user with ID:', user.id);
        // Update password if user already exists
        await user.update({ password: hashedPassword });
      }

      // Check if manufacturer already exists
      const existingManufacturer = await Manufacturer.findOne({
        where: { userId: user.id }
      });

      if (existingManufacturer) {
        return res.status(400).json({
          status: 'error',
          message: 'Manufacturer profile already exists for this email',
        });
      }

      // Check GST uniqueness only if GST is provided
      if (gstNumber) {
        const gstExists = await Manufacturer.findOne({ where: { gstNumber } });
        if (gstExists) {
          return res.status(400).json({
            status: 'error',
            message: 'GST number already registered',
          });
        }
      }

      // Upload documents to S3 with userId and email folder structure
      console.log('Starting file uploads to S3...');
      let gstCertificateUrl = null;
      let panCardUrl = null;
      let cancelledChequeUrl = null;
      let companyLogoUrl = null;

      const userId = user.id;
      const userEmail = user.email || email;

      if (req.files?.gstCertificate?.[0]) {
        console.log('Uploading GST certificate...');
        gstCertificateUrl = await uploadLocally(req.files.gstCertificate[0], userId, userEmail, 'gst');
      }
      if (req.files?.panCard?.[0]) {
        console.log('Uploading PAN card...');
        panCardUrl = await uploadLocally(req.files.panCard[0], userId, userEmail, 'pan');
      }
      if (req.files?.cancelledCheque?.[0]) {
        console.log('Uploading cancelled cheque...');
        cancelledChequeUrl = await uploadLocally(req.files.cancelledCheque[0], userId, userEmail, 'cheque');
      }
      if (req.files?.companyLogo?.[0]) {
        console.log('Uploading company logo...');
        companyLogoUrl = await uploadLocally(req.files.companyLogo[0], userId, userEmail, 'logo');
      }
      console.log('File uploads to S3 completed');

      // Create manufacturer profile
      console.log('Creating manufacturer profile...');
      const manufacturer = await Manufacturer.create({
        userId: user.id,
        companyName,
        brandName,
        contactPerson: contactPersonName,
        businessType,
        gstNumber: gstNumber || null, // Convert empty string to null
        panNumber: panNumber || null, // Convert empty string to null
        address,
        city,
        state,
        pincode,
        bankAccountNumber: accountNumber,
        bankIfscCode: ifscCode,
        bankAccountHolder: accountHolderName,
        bankName,
        upiId,
        companyLogoUrl,
        gstCertificateUrl,
        panCardUrl,
        cancelledChequeUrl,
        approvalStatus: 'pending',
      });
      console.log('Manufacturer created with ID:', manufacturer.id);

      // Update user mobile if provided
      if (mobile && mobile !== user.mobile) {
        await User.update({ mobile }, { where: { id: user.id } });
      }

      console.log('=== Registration Successful ===');
      res.status(201).json({
        status: 'success',
        message: 'Manufacturer registration submitted successfully. Pending admin approval.',
        data: { manufacturer },
      });
    } catch (error) {
      console.error('=== Registration Error ===');
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      res.status(500).json({
        status: 'error',
        message: 'Registration failed',
        error: error.message
      });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Manufacturer,
        as: 'manufacturer',
      }],
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Public
router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: errors.array()[0].msg,
      });
    }

    const { refreshToken } = req.body;
    const { verifyToken } = require('../utils/jwt');
    
    const decoded = verifyToken(refreshToken);
    
    // Generate new tokens
    const tokenPayload = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      manufacturerId: decoded.manufacturerId,
    };

    const newToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    res.status(200).json({
      status: 'success',
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid refresh token',
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    // In a production app, you'd add the token to a blacklist
    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Logout failed',
    });
  }
});

// ========================================
// RESELLER REGISTRATION
// ========================================
// @route   POST /api/auth/register/reseller
// @desc    Complete reseller registration
// @access  Public
router.post('/register/reseller',
  upload.single('profile_photo'),
  validateImageQuality,
  async (req, res) => {
    console.log('=== Reseller Registration Request Started ===');
    console.log('Body fields:', Object.keys(req.body));
    console.log('File:', req.file ? 'Yes' : 'No');

    const sequelize = require('../config/database');
    const { QueryTypes } = require('sequelize');
    const bcrypt = require('bcryptjs');

    const transaction = await sequelize.transaction();

    try {
      const {
        name,
        email,
        phone,
        password,
        city,
        state,
        address,
        pincode,
        pan_number,
        aadhar_number,
        gst_number,
        bank_name,
        account_number,
        ifsc_code,
        account_holder_name,
        upi_id,
        sponsor_code
      } = req.body;

      console.log('Email:', email);
      console.log('Name:', name);

      // Validate required fields
      if (!name || !email || !phone || !password || !city || !state || !bank_name || !account_number || !ifsc_code || !account_holder_name) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Required fields missing',
        });
      }

      // Check if user already exists
      const [existingUser] = await sequelize.query(
        'SELECT id FROM users WHERE email = ? OR mobile = ?',
        {
          replacements: [email, phone],
          type: QueryTypes.SELECT,
          transaction
        }
      );

      if (existingUser) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Email or phone already registered',
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Generate unique reseller code
      const generateResellerCode = () => {
        const prefix = 'RSL';
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}${random}`;
      };

      let resellerCode = generateResellerCode();
      
      // Ensure uniqueness
      let codeExists = true;
      while (codeExists) {
        const [existing] = await sequelize.query(
          'SELECT id FROM resellers WHERE reseller_code = ?',
          {
            replacements: [resellerCode],
            type: QueryTypes.SELECT,
            transaction
          }
        );
        if (!existing) {
          codeExists = false;
        } else {
          resellerCode = generateResellerCode();
        }
      }

      // Handle profile photo upload
      let profilePhotoUrl = null;
      if (req.file) {
        try {
          // Upload to S3 or save locally
          const uploadResult = await uploadToS3(req.file, 'reseller-profiles');
          profilePhotoUrl = uploadResult.url;
        } catch (uploadError) {
          console.error('Profile photo upload error:', uploadError);
          // Continue without profile photo if upload fails
        }
      }

      // Find sponsor if sponsor_code provided
      let sponsorId = null;
      if (sponsor_code) {
        const [sponsor] = await sequelize.query(
          'SELECT id FROM resellers WHERE reseller_code = ?',
          {
            replacements: [sponsor_code],
            type: QueryTypes.SELECT,
            transaction
          }
        );
        if (sponsor) {
          sponsorId = sponsor.id;
        }
      }

      // Create user
      await sequelize.query(
        `INSERT INTO users 
         (full_name, email, mobile, password, role, city, state, address, pincode, profile_photo, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'reseller', ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
        {
          replacements: [name, email, phone, hashedPassword, city, state, address || null, pincode || null, profilePhotoUrl],
          type: QueryTypes.INSERT,
          transaction
        }
      );

      // Get the created user's UUID
      const [user] = await sequelize.query(
        'SELECT id FROM users WHERE email = ? AND mobile = ?',
        {
          replacements: [email, phone],
          type: QueryTypes.SELECT,
          transaction
        }
      );

      const userId = user.id;
      console.log('User created with ID:', userId);

      // Create reseller record
      await sequelize.query(
        `INSERT INTO resellers 
         (user_id, full_name, reseller_code, city, state, pincode, sponsor_id, 
          pan_number, aadhar_number, gst_number, bank_name, bank_account_number, 
          bank_ifsc_code, bank_account_holder, upi_id, profile_photo_url, 
          created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        {
          replacements: [
            userId, 
            name,
            resellerCode, 
            city,
            state,
            pincode || null,
            sponsorId || null, 
            pan_number || null, 
            aadhar_number || null, 
            gst_number || null,
            bank_name, 
            account_number, 
            ifsc_code, 
            account_holder_name, 
            upi_id || null,
            profilePhotoUrl || null
          ],
          type: QueryTypes.INSERT,
          transaction
        }
      );

      // Get the created reseller's UUID
      const [reseller] = await sequelize.query(
        'SELECT id FROM resellers WHERE user_id = ?',
        {
          replacements: [userId],
          type: QueryTypes.SELECT,
          transaction
        }
      );

      const resellerId = reseller.id;
      console.log('Reseller created with ID:', resellerId);

      // Create wallet for reseller
      await sequelize.query(
        `INSERT INTO wallets 
         (reseller_id, current_balance, pending_balance, total_earned, total_withdrawn, created_at, updated_at)
         VALUES (?, 0, 0, 0, 0, NOW(), NOW())`,
        {
          replacements: [resellerId],
          type: QueryTypes.INSERT,
          transaction
        }
      );

      console.log('Wallet created for reseller');

      await transaction.commit();

      res.status(201).json({
        status: 'success',
        message: 'Registration successful! Your account is pending admin verification.',
        data: {
          userId,
          resellerId,
          resellerCode,
          email,
          name,
          status: 'pending'
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Reseller registration error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Registration failed',
        error: error.message
      });
    }
  }
);

// ========================================
// CUSTOMER AUTHENTICATION ENDPOINTS
// ========================================

// @route   POST /api/auth/register/customer
// @desc    Customer registration with password
// @access  Public
router.post('/register/customer', async (req, res) => {
  console.log('=== Customer Registration Request Started ===');
  console.log('Body fields:', Object.keys(req.body));

  const sequelize = require('../config/database');
  const { QueryTypes } = require('sequelize');
  const bcrypt = require('bcryptjs');

  const transaction = await sequelize.transaction();

  try {
    const {
      name,
      email,
      phone,
      password,
      address,
      city,
      state,
      pincode,
      referral_code // Optional: reseller referral code
    } = req.body;

    console.log('Email:', email);
    console.log('Name:', name);
    console.log('Referral code:', referral_code);

    // Validate required fields
    if (!name || !email || !phone || !password) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Required fields missing: name, email, phone, password',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format',
      });
    }

    // Validate phone format (10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Phone number must be 10 digits',
      });
    }

    // Check if user already exists
    const [existingUser] = await sequelize.query(
      'SELECT id FROM users WHERE email = ? OR mobile = ?',
      {
        replacements: [email, phone],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (existingUser) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Email or phone already registered',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find reseller if referral_code provided
    let referredByResellerId = null;
    if (referral_code) {
      const [reseller] = await sequelize.query(
        'SELECT id FROM resellers WHERE reseller_code = ?',
        {
          replacements: [referral_code],
          type: QueryTypes.SELECT,
          transaction
        }
      );
      if (reseller) {
        referredByResellerId = reseller.id;
        console.log('Referral code valid. Reseller ID:', referredByResellerId);
      } else {
        console.log('Referral code not found:', referral_code);
      }
    }

    // Create user with role='customer' and status='approved' (customers don't need approval)
    await sequelize.query(
      `INSERT INTO users 
       (full_name, email, mobile, password, role, city, state, address, pincode, status, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'customer', ?, ?, ?, ?, 'approved', 1, NOW(), NOW())`,
      {
        replacements: [name, email, phone, hashedPassword, city || null, state || null, address || null, pincode || null],
        type: QueryTypes.INSERT,
        transaction
      }
    );

    // Get the created user's UUID
    const [user] = await sequelize.query(
      'SELECT id FROM users WHERE email = ? AND mobile = ?',
      {
        replacements: [email, phone],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    const userId = user.id;
    console.log('User created with ID:', userId);

    // Create customer record
    await sequelize.query(
      `INSERT INTO customers 
       (user_id, full_name, address, city, state, pincode, referred_by_reseller, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      {
        replacements: [
          userId,
          name,
          address || null,
          city || null,
          state || null,
          pincode || null,
          referredByResellerId || null
        ],
        type: QueryTypes.INSERT,
        transaction
      }
    );

    // Get the created customer's UUID
    const [customer] = await sequelize.query(
      'SELECT id FROM customers WHERE user_id = ?',
      {
        replacements: [userId],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    const customerId = customer.id;
    console.log('Customer created with ID:', customerId);

    await transaction.commit();

    // Generate tokens for auto-login
    const tokenPayload = {
      id: userId,
      email: email,
      role: 'customer',
      customerId: customerId,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.status(201).json({
      status: 'success',
      message: 'Registration successful! You are now logged in.',
      data: {
        user: {
          id: userId,
          email: email,
          mobile: phone,
          name: name,
          role: 'customer',
          customerId: customerId,
          referredByReseller: referredByResellerId
        },
        token,
        refreshToken,
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Customer registration error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Registration failed',
      error: error.message
    });
  }
});

// ========================================
// OTP ENDPOINTS
// ========================================

// @route   POST /api/auth/send-otp
// @desc    Send OTP to email for login
// @access  Public
router.post('/send-otp', async (req, res) => {
  console.log('=== Send OTP Request Started ===');

  const sequelize = require('../config/database');
  const { QueryTypes } = require('sequelize');

  try {
    const { email, mobile, userType, purpose = 'login' } = req.body;

    if (mobile) {
      return res.status(400).json({
        status: 'error',
        message: 'Mobile OTP login is not supported',
        code: 'MOBILE_OTP_DISABLED',
      });
    }

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required',
      });
    }

    const identifier = email;
    console.log('Identifier:', identifier);
    console.log('User Type:', userType);
    console.log('Purpose:', purpose);

    // Find user by email
    const [user] = await sequelize.query(
      'SELECT id, email, mobile, role, status FROM users WHERE email = ?',
      {
        replacements: [identifier],
        type: QueryTypes.SELECT
      }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Email not registered. Please register first.',
        code: 'USER_NOT_FOUND',
      });
    }

    // Validate role if userType is specified
    if (userType && user.role !== userType) {
      // Special case: Allow resellers to log in as customers if they have a customer record
      if (userType === 'customer' && user.role === 'reseller') {
        const [customerRecord] = await sequelize.query(
          'SELECT id FROM customers WHERE user_id = ?',
          {
            replacements: [user.id],
            type: QueryTypes.SELECT
          }
        );

        if (!customerRecord) {
          return res.status(403).json({
            status: 'error',
            message: `This login is for ${userType}s only. Please use the correct login page.`,
            code: 'ROLE_MISMATCH',
          });
        }
      } else {
        return res.status(403).json({
          status: 'error',
          message: `This login is for ${userType}s only. Please use the correct login page.`,
          code: 'ROLE_MISMATCH',
        });
      }
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    // Save OTP to database
    await OTP.create({
      identifier, // Store identifier (email or mobile)
      otpCode,
      purpose,
      expiresAt,
      attempts: 0,
    });

    await sendOTPEmail(email, otpCode);
    console.log('✅ OTP sent to email:', email);

    res.status(200).json({
      status: 'success',
      message: 'OTP sent to your email',
    });

  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send OTP',
      error: error.message
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login
// @access  Public
router.post('/verify-otp', async (req, res) => {
  console.log('=== Verify OTP Request Started ===');

  const sequelize = require('../config/database');
  const { QueryTypes } = require('sequelize');

  try {
    const { email, mobile, otp, userType } = req.body;

    // Validate input
    if (!otp) {
      return res.status(400).json({
        status: 'error',
        message: 'OTP is required',
      });
    }

    if (mobile) {
      return res.status(400).json({
        status: 'error',
        message: 'Mobile OTP login is not supported',
        code: 'MOBILE_OTP_DISABLED',
      });
    }

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required',
      });
    }

    const identifier = email;
    console.log('Identifier:', identifier);
    console.log('OTP:', otp);

    // Find the most recent OTP for this identifier
    const otpRecord = await OTP.findOne({
      where: {
        identifier,
        otpCode: otp,
        isVerified: false,
      },
      order: [['createdAt', 'DESC']],
    });

    if (!otpRecord) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid OTP',
        code: 'INVALID_OTP',
      });
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({
        status: 'error',
        message: 'OTP has expired. Please request a new one.',
        code: 'OTP_EXPIRED',
      });
    }

    // Check attempts limit
    if (otpRecord.attempts >= 3) {
      return res.status(400).json({
        status: 'error',
        message: 'Maximum OTP verification attempts exceeded. Please request a new OTP.',
        code: 'MAX_ATTEMPTS_EXCEEDED',
      });
    }

    // Find user
    const [user] = await sequelize.query(
      'SELECT id, email, mobile, full_name, role, status FROM users WHERE email = ?',
      {
        replacements: [identifier],
        type: QueryTypes.SELECT
      }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    // Validate role if userType is specified
    let effectiveRole = user.role; // Default to actual role
    
    if (userType && user.role !== userType) {
      // Special case: Allow resellers to log in as customers if they have a customer record
      if (userType === 'customer' && user.role === 'reseller') {
        const [customerRecord] = await sequelize.query(
          'SELECT id FROM customers WHERE user_id = ?',
          {
            replacements: [user.id],
            type: QueryTypes.SELECT
          }
        );

        if (!customerRecord) {
          return res.status(403).json({
            status: 'error',
            message: `This login is for ${userType}s only.`,
            code: 'ROLE_MISMATCH',
          });
        }
        
        // Use customer role for this session
        effectiveRole = 'customer';
      } else {
        return res.status(403).json({
          status: 'error',
          message: `This login is for ${userType}s only.`,
          code: 'ROLE_MISMATCH',
        });
      }
    }

    // Mark OTP as verified
    await otpRecord.update({
      isVerified: true,
      verifiedAt: new Date(),
    });

    // Update last login
    await sequelize.query(
      'UPDATE users SET updated_at = NOW() WHERE id = ?',
      {
        replacements: [user.id],
        type: QueryTypes.UPDATE
      }
    );

    // Fetch role-specific data based on effective role
    let roleData = null;

    if (effectiveRole === 'customer') {
      const [customer] = await sequelize.query(
        'SELECT id, full_name, city, state, referred_by_reseller FROM customers WHERE user_id = ?',
        {
          replacements: [user.id],
          type: QueryTypes.SELECT
        }
      );

      if (customer) {
        roleData = {
          customerId: customer.id,
          fullName: customer.full_name,
          city: customer.city,
          state: customer.state,
          referredByReseller: customer.referred_by_reseller
        };
      }
    } else if (effectiveRole === 'reseller') {
      const [reseller] = await sequelize.query(
        'SELECT id, reseller_code, full_name, city, state FROM resellers WHERE user_id = ?',
        {
          replacements: [user.id],
          type: QueryTypes.SELECT
        }
      );

      if (reseller) {
        roleData = {
          resellerId: reseller.id,
          resellerCode: reseller.reseller_code,
          fullName: reseller.full_name,
          city: reseller.city,
          state: reseller.state,
          approvalStatus: user.status
        };
      }
    } else if (effectiveRole === 'manufacturer') {
      const [manufacturer] = await sequelize.query(
        'SELECT id, company_name, brand_name, contact_person, approval_status FROM manufacturers WHERE user_id = ?',
        {
          replacements: [user.id],
          type: QueryTypes.SELECT
        }
      );

      if (manufacturer) {
        roleData = {
          manufacturerId: manufacturer.id,
          companyName: manufacturer.company_name,
          brandName: manufacturer.brand_name,
          contactPerson: manufacturer.contact_person,
          approvalStatus: manufacturer.approval_status
        };
      }
    }

    // Generate tokens with effective role
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: effectiveRole,
      customerId: roleData?.customerId || null,
      resellerId: roleData?.resellerId || null,
      manufacturerId: roleData?.manufacturerId || null,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          mobile: user.mobile,
          name: user.full_name,
          role: effectiveRole,
          status: user.status,
          ...roleData
        },
        token,
        refreshToken,
      },
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      status: 'error',
      message: 'OTP verification failed',
      error: error.message
    });
  }
});

// @route   POST /api/auth/login/password
// @desc    Login with email/mobile and password (for customers and resellers)
// @access  Public
router.post('/login/password', async (req, res) => {
  console.log('=== Password Login Request Started ===');

  const sequelize = require('../config/database');
  const { QueryTypes } = require('sequelize');
  const bcrypt = require('bcryptjs');

  try {
    const { identifier, password, userType } = req.body; // identifier can be email or mobile

    console.log('Identifier:', identifier);
    console.log('User Type:', userType);

    // Validate required fields
    if (!identifier || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email/mobile and password are required',
      });
    }

    // Find user by email or mobile
    const [user] = await sequelize.query(
      'SELECT id, full_name, email, mobile, password, role, status, is_active FROM users WHERE email = ? OR mobile = ?',
      {
        replacements: [identifier, identifier],
        type: QueryTypes.SELECT
      }
    );

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Email/mobile not registered. Please register first.',
        code: 'USER_NOT_FOUND',
      });
    }

    // Validate role if userType is specified
    let effectiveRole = user.role; // Default to actual role
    console.log('[Password Login] Initial - userType:', userType, 'user.role:', user.role, 'effectiveRole:', effectiveRole);
    
    if (userType && user.role !== userType) {
      // Special case: Allow resellers to log in as customers if they have a customer record
      if (userType === 'customer' && user.role === 'reseller') {
        console.log('[Password Login] Checking for customer record...');
        const [customerRecord] = await sequelize.query(
          'SELECT id FROM customers WHERE user_id = ?',
          {
            replacements: [user.id],
            type: QueryTypes.SELECT
          }
        );

        if (!customerRecord) {
          return res.status(403).json({
            status: 'error',
            message: `This login is for ${userType}s only. Please use the correct login page.`,
            code: 'ROLE_MISMATCH',
            expectedRole: userType,
            actualRole: user.role,
          });
        }
        
        // Use customer role for this session
        effectiveRole = 'customer';
        console.log('[Password Login] Found customer record, set effectiveRole to:', effectiveRole);
      } else {
        return res.status(403).json({
          status: 'error',
          message: `This login is for ${userType}s only. Please use the correct login page.`,
          code: 'ROLE_MISMATCH',
          expectedRole: userType,
          actualRole: user.role,
        });
      }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid password',
        code: 'INVALID_PASSWORD',
      });
    }

    // Check if account is active (for resellers logging in as resellers)
    if (effectiveRole === 'reseller' && user.status === 'pending') {
      return res.status(403).json({
        status: 'error',
        message: 'Your account is pending admin approval',
        code: 'PENDING_APPROVAL',
      });
    }

    if (effectiveRole === 'reseller' && !user.is_active) {
      return res.status(403).json({
        status: 'error',
        message: 'Your account has been deactivated',
        code: 'ACCOUNT_INACTIVE',
      });
    }

    // Update last login
    await sequelize.query(
      'UPDATE users SET updated_at = NOW() WHERE id = ?',
      {
        replacements: [user.id],
        type: QueryTypes.UPDATE
      }
    );

    // Fetch role-specific data based on effective role
    let roleData = null;
    let additionalData = {}; // Store additional cross-role data
    console.log('[Password Login] Fetching role data for effectiveRole:', effectiveRole);

    if (effectiveRole === 'customer') {
      console.log('[Password Login] Fetching customer data...');
      const [customer] = await sequelize.query(
        'SELECT id, full_name, city, state, referred_by_reseller FROM customers WHERE user_id = ?',
        {
          replacements: [user.id],
          type: QueryTypes.SELECT
        }
      );

      if (customer) {
        console.log('[Password Login] Customer data found:', customer);
        roleData = {
          customerId: customer.id,
          fullName: customer.full_name,
          city: customer.city,
          state: customer.state,
          referredByReseller: customer.referred_by_reseller
        };
      }

      // If user is actually a reseller (logged in as customer), also fetch reseller data
      if (user.role === 'reseller') {
        console.log('[Password Login] User is reseller, also fetching reseller data...');
        const [reseller] = await sequelize.query(
          'SELECT id, reseller_code, full_name, city, state FROM resellers WHERE user_id = ?',
          {
            replacements: [user.id],
            type: QueryTypes.SELECT
          }
        );

        if (reseller) {
          console.log('[Password Login] Reseller data found (for customer login):', reseller);
          additionalData.resellerId = reseller.id;
          additionalData.resellerCode = reseller.reseller_code;
          additionalData.actualRole = 'reseller'; // Store actual role
        }
      }
    } else if (effectiveRole === 'reseller') {
      console.log('[Password Login] Fetching reseller data...');
      const [reseller] = await sequelize.query(
        'SELECT id, reseller_code, full_name, city, state FROM resellers WHERE user_id = ?',
        {
          replacements: [user.id],
          type: QueryTypes.SELECT
        }
      );

      if (reseller) {
        console.log('[Password Login] Reseller data found:', reseller);
        roleData = {
          resellerId: reseller.id,
          resellerCode: reseller.reseller_code,
          fullName: reseller.full_name,
          city: reseller.city,
          state: reseller.state,
          approvalStatus: user.status
        };
      }
    } else if (effectiveRole === 'manufacturer') {
      const [manufacturer] = await sequelize.query(
        'SELECT id, company_name, brand_name, contact_person, approval_status FROM manufacturers WHERE user_id = ?',
        {
          replacements: [user.id],
          type: QueryTypes.SELECT
        }
      );

      if (manufacturer) {
        roleData = {
          manufacturerId: manufacturer.id,
          companyName: manufacturer.company_name,
          brandName: manufacturer.brand_name,
          contactPerson: manufacturer.contact_person,
          approvalStatus: manufacturer.approval_status
        };
      }
    }

    // Generate tokens with effective role
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: effectiveRole,
      customerId: roleData?.customerId || null,
      resellerId: roleData?.resellerId || additionalData.resellerId || null,
      manufacturerId: roleData?.manufacturerId || null,
    };

    const token = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          mobile: user.mobile,
          name: user.full_name,
          role: effectiveRole,
          actualRole: additionalData.actualRole || effectiveRole, // Include actual role if different
          status: user.status,
          ...roleData,
          ...additionalData // Include additional cross-role data
        },
        token,
        refreshToken,
      },
    });

  } catch (error) {
    console.error('Password login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Login failed',
      error: error.message
    });
  }
});

module.exports = router;
