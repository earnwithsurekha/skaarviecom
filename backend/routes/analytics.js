const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { ProductSave, ProductShare, ProductClick, Product } = require('../models');

// @route   POST /api/analytics/products/:id/save
// @desc    Save product to reseller's wishlist
// @access  Private (Reseller)
router.post('/products/:id/save', authMiddleware, async (req, res) => {
  try {
    const { id: productId } = req.params;
    const userId = req.user.id;
    const { source, deviceType } = req.body;

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    // Check if already saved
    const existingSave = await ProductSave.findOne({
      where: { productId, userId },
    });

    if (existingSave) {
      return res.status(200).json({
        status: 'success',
        message: 'Product already saved',
        data: { alreadySaved: true },
      });
    }

    // Create save record
    const save = await ProductSave.create({
      productId,
      userId,
      source: source || 'product_page',
      deviceType: deviceType || 'unknown',
    });

    res.status(201).json({
      status: 'success',
      message: 'Product saved successfully',
      data: { save },
    });
  } catch (error) {
    console.error('Save product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to save product',
    });
  }
});

// @route   DELETE /api/analytics/products/:id/save
// @desc    Remove product from reseller's wishlist
// @access  Private (Reseller)
router.delete('/products/:id/save', authMiddleware, async (req, res) => {
  try {
    const { id: productId } = req.params;
    const userId = req.user.id;

    const deleted = await ProductSave.destroy({
      where: { productId, userId },
    });

    if (deleted === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Save not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Product removed from wishlist',
    });
  } catch (error) {
    console.error('Remove save error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove product',
    });
  }
});

// @route   GET /api/analytics/products/:id/save/status
// @desc    Check if product is saved by current user
// @access  Private (Reseller)
router.get('/products/:id/save/status', authMiddleware, async (req, res) => {
  try {
    const { id: productId } = req.params;
    const userId = req.user.id;

    const save = await ProductSave.findOne({
      where: { productId, userId },
    });

    res.status(200).json({
      status: 'success',
      data: { isSaved: !!save },
    });
  } catch (error) {
    console.error('Check save status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check save status',
    });
  }
});

// @route   POST /api/analytics/products/:id/share
// @desc    Track product share
// @access  Public (Allow anonymous)
router.post('/products/:id/share', async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { platform, source, sessionId, deviceType } = req.body;

    // Validate platform
    const validPlatforms = ['whatsapp', 'email', 'facebook', 'twitter', 'copy_link', 'qr_code'];
    if (!platform || !validPlatforms.includes(platform)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or missing platform',
      });
    }

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    // Get user ID if authenticated
    const userId = req.user?.id || null;

    // Get IP address
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

    // Create share record
    const share = await ProductShare.create({
      productId,
      userId,
      platform,
      source: source || 'product_page',
      sessionId: sessionId || null,
      ipAddress,
      deviceType: deviceType || 'unknown',
    });

    res.status(201).json({
      status: 'success',
      message: 'Share tracked successfully',
      data: { share },
    });
  } catch (error) {
    console.error('Track share error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to track share',
    });
  }
});

// @route   POST /api/analytics/products/:id/click
// @desc    Track product link click
// @access  Public (Allow anonymous)
router.post('/products/:id/click', async (req, res) => {
  try {
    const { id: productId } = req.params;
    const { referrer, source, sessionId, deviceType } = req.body;

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    // Get user ID if authenticated
    const userId = req.user?.id || null;

    // Get request data
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Create click record
    const click = await ProductClick.create({
      productId,
      userId,
      referrer: referrer || req.headers.referer || null,
      source: source || 'direct',
      sessionId: sessionId || null,
      ipAddress,
      userAgent,
      deviceType: deviceType || 'unknown',
    });

    res.status(201).json({
      status: 'success',
      message: 'Click tracked successfully',
      data: { click },
    });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to track click',
    });
  }
});

module.exports = router;
