const express = require('express');
const router = express.Router();
const { sequelize } = require('../../models');

// @route   GET /api/reseller/referrals
// @desc    Get referral list and stats
// @access  Private (Reseller only)
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get actual reseller_id from user_id
    const [resellerData] = await sequelize.query(`
      SELECT id FROM resellers WHERE user_id = :userId
    `, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!resellerData) {
      return res.status(404).json({
        status: 'error',
        message: 'Reseller not found'
      });
    }

    const resellerId = resellerData.id;

    // Get referral stats
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_referrals,
        SUM(CASE WHEN u.is_active = 1 AND u.is_verified = 1 THEN 1 ELSE 0 END) as active_referrals,
        SUM(CASE WHEN u.is_active = 0 OR u.is_verified = 0 THEN 1 ELSE 0 END) as pending_referrals
      FROM resellers r
      JOIN users u ON r.user_id = u.id
      WHERE r.sponsor_id = :resellerId
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    // Get referral list
    const referrals = await sequelize.query(`
      SELECT 
        r.id,
        u.full_name,
        u.email,
        u.mobile,
        u.is_active,
        u.is_verified,
        r.reseller_code,
        r.total_earnings,
        r.created_at,
        (SELECT COUNT(*) FROM orders WHERE reseller_id = r.id AND order_status != 'cancelled') as total_orders
      FROM resellers r
      JOIN users u ON r.user_id = u.id
      WHERE r.sponsor_id = :resellerId
      ORDER BY r.created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { resellerId, limit: parseInt(limit), offset },
      type: sequelize.QueryTypes.SELECT
    });

    // Get total count
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM resellers
      WHERE sponsor_id = :resellerId
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    const total = parseInt(countResult.total);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      status: 'success',
      data: {
        stats: {
          total_referrals: parseInt(stats.total_referrals) || 0,
          active_referrals: parseInt(stats.active_referrals) || 0,
          pending_referrals: parseInt(stats.pending_referrals) || 0
        },
        referrals: referrals.map(r => ({
          ...r,
          total_earnings: parseFloat(r.total_earnings) || 0
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      }
    });

  } catch (error) {
    console.error('Referrals fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch referrals',
      error: error.message
    });
  }
});

// @route   POST /api/reseller/referrals/generate-link
// @desc    Generate referral link for a product
// @access  Private (Reseller only)
router.post('/generate-link', async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    // Get reseller code
    const [reseller] = await sequelize.query(`
      SELECT reseller_code
      FROM resellers
      WHERE user_id = :userId
    `, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!reseller) {
      return res.status(404).json({
        status: 'error',
        message: 'Reseller not found'
      });
    }

    // Get product slug
    const [product] = await sequelize.query(`
      SELECT id, name, slug
      FROM products
      WHERE id = :productId AND deleted_at IS NULL
    `, {
      replacements: { productId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
    const slug = product.slug || `product-${product.id}`;
    const referralLink = `${baseUrl}/p/${slug}?ref=${reseller.reseller_code}`;

    res.json({
      status: 'success',
      data: {
        referralLink,
        resellerCode: reseller.reseller_code,
        product: {
          id: product.id,
          name: product.name
        }
      }
    });

  } catch (error) {
    console.error('Generate referral link error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate referral link',
      error: error.message
    });
  }
});

// @route   GET /api/reseller/referrals/my-code
// @desc    Get reseller's own referral code for registration
// @access  Private (Reseller only)
router.get('/my-code', async (req, res) => {
  try {
    const userId = req.user.id;

    const [reseller] = await sequelize.query(`
      SELECT reseller_code
      FROM resellers
      WHERE user_id = :userId
    `, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!reseller) {
      return res.status(404).json({
        status: 'error',
        message: 'Reseller not found'
      });
    }

    const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
    const registrationLink = `${baseUrl}/register/reseller?sponsor=${reseller.reseller_code}`;

    res.json({
      status: 'success',
      data: {
        resellerCode: reseller.reseller_code,
        registrationLink
      }
    });

  } catch (error) {
    console.error('Get referral code error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get referral code',
      error: error.message
    });
  }
});

module.exports = router;
