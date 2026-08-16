const express = require('express');
const router = express.Router();
const { sequelize } = require('../../models');

// @route   GET /api/reseller/analytics/performance
// @desc    Get comprehensive performance analytics
// @access  Private (Reseller only)
router.get('/performance', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get actual reseller_id from user_id
    const resellerResult = await sequelize.query(`
      SELECT id FROM resellers WHERE user_id = :userId
    `, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!resellerResult || resellerResult.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Reseller not found'
      });
    }

    const resellerId = resellerResult[0].id;

    // Get total clicks
    const [clickStats] = await sequelize.query(`
      SELECT COUNT(*) as total_clicks
      FROM referral_clicks
      WHERE reseller_id = :resellerId
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    // Get total orders
    const [orderStats] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.final_amount), 0) as total_sales_value,
        COALESCE(SUM(oi.reseller_commission), 0) as total_commission
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.reseller_id = :resellerId
      AND o.order_status NOT IN ('cancelled', 'returned')
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    // Calculate conversion rate
    const totalClicks = clickStats ? Number.parseInt(clickStats.total_clicks, 10) || 0 : 0;
    const totalOrders = orderStats ? Number.parseInt(orderStats.total_orders, 10) || 0 : 0;
    const conversionRate = totalClicks > 0 ? (totalOrders / totalClicks) * 100 : 0;

    // Get top performing products (by orders)
    const topPerformingProducts = await sequelize.query(`
      SELECT 
        p.id,
        p.name as product_name,
        p.selling_price,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(oi.quantity), 0) as units_sold,
        COALESCE(SUM(oi.reseller_commission), 0) as total_commission,
        (SELECT COUNT(*) FROM referral_clicks WHERE product_id = p.id AND reseller_id = :resellerId) as total_clicks,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) as product_image
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.reseller_id = :resellerId AND o.order_status NOT IN ('cancelled', 'returned')
      WHERE EXISTS (
        SELECT 1 FROM orders o2
        JOIN order_items oi2 ON o2.id = oi2.order_id
        WHERE oi2.product_id = p.id 
        AND o2.reseller_id = :resellerId
        AND o2.order_status NOT IN ('cancelled', 'returned')
      )
      GROUP BY p.id, p.name, p.selling_price
      ORDER BY total_orders DESC, total_commission DESC
      LIMIT 10
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    // Get most shared products (by clicks)
    const mostSharedProducts = await sequelize.query(`
      SELECT 
        p.id,
        p.name as product_name,
        p.selling_price,
        COUNT(rc.id) as total_clicks,
        COUNT(DISTINCT rc.session_id) as unique_visitors,
        (SELECT COUNT(DISTINCT o.id) 
         FROM orders o 
         JOIN order_items oi ON o.id = oi.order_id 
         WHERE oi.product_id = p.id 
         AND o.reseller_id = :resellerId
         AND o.order_status NOT IN ('cancelled', 'returned')
        ) as total_orders,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) as product_image
      FROM referral_clicks rc
      JOIN products p ON rc.product_id = p.id
      WHERE rc.reseller_id = :resellerId
      GROUP BY p.id, p.name, p.selling_price
      ORDER BY total_clicks DESC, unique_visitors DESC
      LIMIT 10
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        overview: {
          total_clicks: totalClicks,
          total_orders: totalOrders,
          conversion_rate: Number.parseFloat(conversionRate.toFixed(2)),
          total_sales_value: orderStats ? Number.parseFloat(orderStats.total_sales_value || 0) : 0,
          total_commission: orderStats ? Number.parseFloat(orderStats.total_commission || 0) : 0,
          avg_order_value: totalOrders > 0 && orderStats
            ? Number.parseFloat((orderStats.total_sales_value / totalOrders).toFixed(2))
            : 0
        },
        top_performing_products: topPerformingProducts.map(p => ({
          ...p,
          total_commission: Number.parseFloat(p.total_commission || 0),
          selling_price: Number.parseFloat(p.selling_price),
          conversion_rate: p.total_clicks > 0 
            ? Number.parseFloat(((p.total_orders / p.total_clicks) * 100).toFixed(2))
            : 0
        })),
        most_shared_products: mostSharedProducts.map(p => ({
          ...p,
          selling_price: Number.parseFloat(p.selling_price),
          conversion_rate: p.total_clicks > 0 
            ? Number.parseFloat(((p.total_orders / p.total_clicks) * 100).toFixed(2))
            : 0
        }))
      }
    });

  } catch (error) {
    console.error('Performance analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch performance analytics',
      error: error.message
    });
  }
});

module.exports = router;
