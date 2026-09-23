const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { getWishlist } = require('../../controllers/wishlist');

// @route   GET /api/customer/wishlist
// @desc    Get the current customer's saved products
// @access  Private (Customer)
router.get('/wishlist', authMiddleware, getWishlist);

module.exports = router;