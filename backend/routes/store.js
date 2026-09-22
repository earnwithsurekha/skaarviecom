const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');

// @route   GET /api/store/:username
// @desc    Get public store page data
// @access  Public
router.get('/:username', async (req, res) => {
  try {
    const { username: storeIdentifier } = req.params;

    // Public store links use the stable reseller code.
    const [reseller] = await sequelize.query(`
      SELECT 
        r.id,
        r.user_id,
        r.full_name,
        u.email,
        u.mobile as phone_number,
        r.city,
        r.state,
        r.reseller_code,
        r.profile_photo_url as profile_photo,
        r.store_name,
        r.store_description,
        r.created_at
      FROM resellers r
      JOIN users u ON r.user_id = u.id
      WHERE r.reseller_code = :storeIdentifier
      AND u.is_active = TRUE
    `, {
      replacements: { storeIdentifier },
      type: sequelize.QueryTypes.SELECT
    });

    if (!reseller) {
      return res.status(404).json({
        status: 'error',
        message: 'Store not found'
      });
    }

    // Get store analytics
    const [analytics] = await sequelize.query(`
      SELECT 
        COALESCE((SELECT COUNT(*) FROM store_visits WHERE reseller_id = :resellerId), 0) as total_visitors,
        COALESCE((SELECT COUNT(DISTINCT visitor_ip) FROM store_visits WHERE reseller_id = :resellerId), 0) as unique_visitors,
        COALESCE((SELECT COUNT(*) FROM orders WHERE reseller_id = :resellerId AND order_status != 'cancelled'), 0) as total_orders
    `, {
      replacements: { resellerId: reseller.id },
      type: sequelize.QueryTypes.SELECT
    });

    // Get reseller's promoted products (products they've shared/saved)
    const products = await sequelize.query(`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.selling_price,
        p.stock_quantity,
        c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) as primary_image,
        CASE 
          WHEN p.stock_quantity > 10 THEN 'in_stock'
          WHEN p.stock_quantity > 0 THEN 'low_stock'
          ELSE 'out_of_stock'
        END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id IN (
        SELECT DISTINCT product_id 
        FROM product_saves 
        WHERE user_id = :userId
      )
      AND p.deleted_at IS NULL
      AND p.status = 'approved'
      ORDER BY p.created_at DESC
      LIMIT 50
    `, {
      replacements: { userId: reseller.user_id },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        store: {
          ...reseller,
          analytics
        },
        products
      }
    });

  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch store data',
      error: error.message
    });
  }
});

// @route   POST /api/store/visit/:username
// @desc    Track store visit
// @access  Public
router.post('/visit/:username', async (req, res) => {
  try {
    const { username: storeIdentifier } = req.params;
    const { ipAddress, referrer } = req.body;
    const visitorIp = ipAddress || req.ip || null;

    // Resolve the same reseller code used by the public store URL.
    const [reseller] = await sequelize.query(`
      SELECT r.id
      FROM resellers r
      JOIN users u ON r.user_id = u.id
      WHERE r.reseller_code = :storeIdentifier
      AND u.is_active = TRUE
    `, {
      replacements: { storeIdentifier },
      type: sequelize.QueryTypes.SELECT
    });

    if (!reseller) {
      return res.status(404).json({
        status: 'error',
        message: 'Store not found'
      });
    }

    // Check if this IP visited in the last hour (prevent duplicate counting)
    const [recentVisit] = await sequelize.query(`
      SELECT id FROM store_visits
      WHERE reseller_id = :resellerId
      AND visitor_ip = :ipAddress
      AND visited_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `, {
      replacements: { 
        resellerId: reseller.id,
        ipAddress: visitorIp
      },
      type: sequelize.QueryTypes.SELECT
    });

    if (!recentVisit) {
      // Insert new visit record
      await sequelize.query(`
        INSERT INTO store_visits 
        (id, reseller_id, visitor_ip, referrer, visited_at)
        VALUES 
        (UUID(), :resellerId, :ipAddress, :referrer, NOW())
      `, {
        replacements: {
          resellerId: reseller.id,
          ipAddress: visitorIp,
          referrer: referrer || null
        }
      });
    }

    res.json({
      status: 'success',
      message: 'Visit tracked'
    });

  } catch (error) {
    console.error('Track store visit error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to track visit',
      error: error.message
    });
  }
});

module.exports = router;
