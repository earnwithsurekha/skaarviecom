const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authMiddleware, adminOnly } = require('../../middleware/auth');
const fs = require('fs').promises;
const path = require('path');

const SETTINGS_FILE = path.join(__dirname, '../../config/platformSettings.json');

// Helper function to load settings
const loadSettings = async () => {
  try {
    const data = await fs.readFile(SETTINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Return defaults if file doesn't exist
    const { PLATFORM } = require('../../config/constants');
    return {
      platformFeePercentage: PLATFORM.DEFAULT_FEE_PERCENTAGE,
      defaultSkaarviMargin: PLATFORM.DEFAULT_SKAARVI_MARGIN,
      defaultResellerCommission: PLATFORM.DEFAULT_RESELLER_COMMISSION,
      lowStockThreshold: PLATFORM.LOW_STOCK_THRESHOLD,
      settlementHoldDays: PLATFORM.SETTLEMENT_HOLD_DAYS
    };
  }
};

// Helper function to save settings
const saveSettings = async (settings) => {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
};

// Validation for error handling
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// @route   GET /api/admin/settings
// @desc    Get current platform settings
// @access  Private (Admin only)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const settings = await loadSettings();
    
    res.status(200).json({
      status: 'success',
      data: { settings }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
});

// @route   PUT /api/admin/settings
// @desc    Update platform settings
// @access  Private (Admin only)
router.put('/',
  authMiddleware,
  adminOnly,
  [
    body('platformFeePercentage').optional().isFloat({ min: 0, max: 50 })
      .withMessage('Platform fee must be between 0 and 50%'),
    body('defaultSkaarviMargin').optional().isFloat({ min: 0, max: 50 })
      .withMessage('Skaarvi margin must be between 0 and 50%'),
    body('defaultResellerCommission').optional().isFloat({ min: 0, max: 50 })
      .withMessage('Reseller commission must be between 0 and 50%'),
    body('lowStockThreshold').optional().isInt({ min: 0, max: 1000 })
      .withMessage('Low stock threshold must be between 0 and 1000'),
    body('settlementHoldDays').optional().isInt({ min: 0, max: 90 })
      .withMessage('Settlement hold days must be between 0 and 90')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        platformFeePercentage,
        defaultSkaarviMargin,
        defaultResellerCommission,
        lowStockThreshold,
        settlementHoldDays
      } = req.body;

      // Load current settings
      const currentSettings = await loadSettings();

      // Update only provided fields
      const updatedSettings = {
        ...currentSettings,
        ...(platformFeePercentage !== undefined && { platformFeePercentage: parseFloat(platformFeePercentage) }),
        ...(defaultSkaarviMargin !== undefined && { defaultSkaarviMargin: parseFloat(defaultSkaarviMargin) }),
        ...(defaultResellerCommission !== undefined && { defaultResellerCommission: parseFloat(defaultResellerCommission) }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold: parseInt(lowStockThreshold) }),
        ...(settlementHoldDays !== undefined && { settlementHoldDays: parseInt(settlementHoldDays) }),
        lastUpdated: new Date().toISOString(),
        updatedBy: req.user.userId
      };

      // Save to file
      await saveSettings(updatedSettings);

      // Update in-memory constants (hot reload)
      const constants = require('../../config/constants');
      if (platformFeePercentage !== undefined) {
        constants.PLATFORM.DEFAULT_FEE_PERCENTAGE = parseFloat(platformFeePercentage);
      }
      if (defaultSkaarviMargin !== undefined) {
        constants.PLATFORM.DEFAULT_SKAARVI_MARGIN = parseFloat(defaultSkaarviMargin);
      }
      if (defaultResellerCommission !== undefined) {
        constants.PLATFORM.DEFAULT_RESELLER_COMMISSION = parseFloat(defaultResellerCommission);
      }
      if (lowStockThreshold !== undefined) {
        constants.PLATFORM.LOW_STOCK_THRESHOLD = parseInt(lowStockThreshold);
      }
      if (settlementHoldDays !== undefined) {
        constants.PLATFORM.SETTLEMENT_HOLD_DAYS = parseInt(settlementHoldDays);
      }

      res.status(200).json({
        status: 'success',
        message: 'Platform settings updated successfully',
        data: { settings: updatedSettings }
      });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error'
      });
    }
  }
);

// @route   POST /api/admin/settings/reset
// @desc    Reset settings to defaults
// @access  Private (Admin only)
router.post('/reset',
  authMiddleware,
  adminOnly,
  async (req, res) => {
    try {
      const { PLATFORM } = require('../../config/constants');
      const defaultSettings = {
        platformFeePercentage: 5,
        defaultSkaarviMargin: 5,
        defaultResellerCommission: 10,
        lowStockThreshold: 10,
        settlementHoldDays: 7,
        lastUpdated: new Date().toISOString(),
        updatedBy: req.user.userId,
        resetToDefaults: true
      };

      await saveSettings(defaultSettings);

      // Update in-memory constants
      PLATFORM.DEFAULT_FEE_PERCENTAGE = 5;
      PLATFORM.DEFAULT_SKAARVI_MARGIN = 5;
      PLATFORM.DEFAULT_RESELLER_COMMISSION = 10;
      PLATFORM.LOW_STOCK_THRESHOLD = 10;
      PLATFORM.SETTLEMENT_HOLD_DAYS = 7;

      res.status(200).json({
        status: 'success',
        message: 'Settings reset to defaults successfully',
        data: { settings: defaultSettings }
      });
    } catch (error) {
      console.error('Reset settings error:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error'
      });
    }
  }
);

module.exports = router;
