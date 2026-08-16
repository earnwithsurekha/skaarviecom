const express = require('express');
const router = express.Router();
const { sequelize } = require('../../models');

// @route   GET /api/reseller/my-store
// @desc    Get reseller's own store information
// @access  Private (Reseller only)
router.get('/my-store', async (req, res) => {
  try {
    const resellerId = req.user.id;

    // Get reseller store info
    const [store] = await sequelize.query(`
      SELECT 
        r.id,
        r.reseller_code,
        r.full_name,
        r.store_name,
        r.store_description,
        u.email,
        u.mobile as phone_number,
        r.profile_photo_url as profile_photo,
        r.city,
        r.state,
        r.created_at
      FROM resellers r
      JOIN users u ON r.user_id = u.id
      WHERE r.user_id = :resellerId
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!store) {
      return res.status(404).json({
        status: 'error',
        message: 'Store not found'
      });
    }

    // Get reseller's actual ID from resellers table (req.user.id is the user_id)
    const [resellerData] = await sequelize.query(`
      SELECT id FROM resellers WHERE user_id = :userId
    `, {
      replacements: { userId: resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!resellerData) {
      return res.status(404).json({
        status: 'error',
        message: 'Reseller not found'
      });
    }

    const actualResellerId = resellerData.id;

    // Get store analytics
    const [analytics] = await sequelize.query(`
      SELECT 
        COALESCE((SELECT COUNT(*) FROM store_visits WHERE reseller_id = :actualResellerId), 0) as total_visitors,
        COALESCE((SELECT COUNT(DISTINCT visitor_ip) FROM store_visits WHERE reseller_id = :actualResellerId), 0) as unique_visitors,
        COALESCE((SELECT COUNT(*) FROM store_visits WHERE reseller_id = :actualResellerId AND visited_at > DATE_SUB(NOW(), INTERVAL 7 DAY)), 0) as visitors_last_7_days,
        COALESCE((SELECT COUNT(*) FROM store_visits WHERE reseller_id = :actualResellerId AND visited_at > DATE_SUB(NOW(), INTERVAL 30 DAY)), 0) as visitors_last_30_days,
        COALESCE((SELECT COUNT(*) FROM orders WHERE reseller_id = :actualResellerId AND order_status != 'cancelled'), 0) as total_orders,
        COALESCE((SELECT COUNT(*) FROM orders WHERE reseller_id = :actualResellerId AND order_status != 'cancelled' AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)), 0) as orders_last_30_days,
        COALESCE((SELECT SUM(oi.reseller_commission) FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.reseller_id = :actualResellerId AND o.order_status != 'cancelled'), 0) as total_earnings,
        COALESCE((SELECT SUM(oi.reseller_commission) FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.reseller_id = :actualResellerId AND o.order_status != 'cancelled' AND o.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)), 0) as earnings_last_30_days,
        COALESCE((SELECT COUNT(DISTINCT product_id) FROM product_saves WHERE user_id = :userId), 0) as total_products
    `, {
      replacements: { actualResellerId, userId: resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    // Get recent visitors (last 10)
    const recentVisitors = await sequelize.query(`
      SELECT 
        visited_at,
        visitor_ip,
        referrer
      FROM store_visits
      WHERE reseller_id = :actualResellerId
      ORDER BY visited_at DESC
      LIMIT 10
    `, {
      replacements: { actualResellerId },
      type: sequelize.QueryTypes.SELECT
    });

    // Get store URL
    const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
    const storeUrl = `${baseUrl}/store/${store.reseller_code}`;

    res.json({
      status: 'success',
      data: {
        store: {
          ...store,
          store_url: storeUrl
        },
        analytics,
        recentVisitors
      }
    });

  } catch (error) {
    console.error('Get my store error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch store data',
      error: error.message
    });
  }
});

// @route   PUT /api/reseller/my-store
// @desc    Update store information
// @access  Private (Reseller only)
router.put('/my-store', async (req, res) => {
  try {
    const resellerId = req.user.id;
    const { store_name, store_description } = req.body;

    await sequelize.query(`
      UPDATE resellers
      SET 
        store_name = :storeName,
        store_description = :storeDescription,
        updated_at = NOW()
      WHERE user_id = :resellerId
    `, {
      replacements: {
        resellerId,
        storeName: store_name || null,
        storeDescription: store_description || null
      }
    });

    res.json({
      status: 'success',
      message: 'Store updated successfully'
    });

  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update store',
      error: error.message
    });
  }
});

// @route   GET /api/reseller/store-analytics
// @desc    Get detailed store analytics
// @access  Private (Reseller only)
router.get('/store-analytics', async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query; // days

    // Get reseller's actual ID
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

    // Get visitor trends
    const visitorTrend = await sequelize.query(`
      SELECT 
        DATE(visited_at) as date,
        COUNT(*) as visitors
      FROM store_visits
      WHERE reseller_id = :resellerId
      AND visited_at > DATE_SUB(NOW(), INTERVAL :period DAY)
      GROUP BY DATE(visited_at)
      ORDER BY date DESC
    `, {
      replacements: { resellerId, period: parseInt(period) },
      type: sequelize.QueryTypes.SELECT
    });

    // Get top referrers
    const topReferrers = await sequelize.query(`
      SELECT 
        referrer,
        COUNT(*) as visits
      FROM store_visits
      WHERE reseller_id = :resellerId
      AND referrer IS NOT NULL
      AND referrer != ''
      GROUP BY referrer
      ORDER BY visits DESC
      LIMIT 10
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    // Get conversion rate (visits to orders)
    const [conversion] = await sequelize.query(`
      SELECT 
        COALESCE((SELECT COUNT(*) FROM store_visits WHERE reseller_id = :resellerId), 0) as total_visits,
        COALESCE((SELECT COUNT(*) FROM orders WHERE reseller_id = :resellerId AND order_status != 'cancelled'), 0) as total_orders
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    const conversionRate = conversion.total_visits > 0 
      ? ((conversion.total_orders / conversion.total_visits) * 100).toFixed(2)
      : 0;

    res.json({
      status: 'success',
      data: {
        visitorTrend,
        topReferrers,
        conversion: {
          ...conversion,
          conversion_rate: conversionRate
        }
      }
    });

  } catch (error) {
    console.error('Get store analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
});

module.exports = router;
