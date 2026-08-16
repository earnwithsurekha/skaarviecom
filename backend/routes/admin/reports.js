const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../../middleware/auth');
const { sequelize } = require('../../models');
const { QueryTypes } = require('sequelize');

// @route   GET /api/admin/reports/revenue
// @desc    Get revenue reports
// @access  Private (Admin)
router.get('/revenue', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;

    let dateFormat;
    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        dateFormat = '%Y-%u';
        break;
      case 'monthly':
        dateFormat = '%Y-%m';
        break;
      case 'annual':
        dateFormat = '%Y';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    let dateFilter = '';
    const replacements = {};
    
    if (startDate && endDate) {
      dateFilter = 'AND o.ordered_at BETWEEN :startDate AND :endDate';
      replacements.startDate = startDate;
      replacements.endDate = endDate;
    }

    const [revenueData] = await sequelize.query(`
      SELECT 
        DATE_FORMAT(o.ordered_at, '${dateFormat}') as period,
        COUNT(DISTINCT o.id) as orderCount,
        SUM(o.total_amount) as totalRevenue,
        SUM(oi.manufacturer_amount * oi.quantity) as manufacturerRevenue,
        SUM(oi.platform_fee * oi.quantity) as platformFees,
        SUM(oi.skaarvi_margin * oi.quantity) as skaarviMargins,
        0 as gatewayCharges,
        SUM(oi.reseller_commission * oi.quantity) as resellerCommissions
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      WHERE o.order_status NOT IN ('cancelled', 'returned') 
        ${dateFilter}
      GROUP BY DATE_FORMAT(o.ordered_at, '${dateFormat}')
      ORDER BY period ASC
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: revenueData,
    });
  } catch (error) {
    console.error('Revenue report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate revenue report',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/reports/sales
// @desc    Get sales reports (product-wise, manufacturer-wise, reseller-wise)
// @access  Private (Admin)
router.get('/sales', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { groupBy = 'product', startDate, endDate, limit = 20 } = req.query;

    let dateFilter = '';
    const replacements = { limit: parseInt(limit) };
    
    if (startDate && endDate) {
      dateFilter = 'AND o.ordered_at BETWEEN :startDate AND :endDate';
      replacements.startDate = startDate;
      replacements.endDate = endDate;
    }

    let salesData = [];

    if (groupBy === 'product') {
      [salesData] = await sequelize.query(`
        SELECT 
          p.id as productId,
          p.name as productName,
          pi.image_url as productImage,
          COUNT(DISTINCT o.id) as orderCount,
          SUM(oi.quantity) as totalQuantity,
          SUM(oi.selling_price * oi.quantity) as totalRevenue,
          AVG(oi.selling_price) as avgPrice
        FROM products p
        JOIN order_items oi ON p.id = oi.product_id
        JOIN orders o ON oi.order_id = o.id
        LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
        WHERE p.deleted_at IS NULL 
          ${dateFilter}
        GROUP BY p.id, p.name, pi.image_url
        ORDER BY totalRevenue DESC
        LIMIT :limit
      `, {
        replacements,
        type: QueryTypes.SELECT
      });
    } else if (groupBy === 'manufacturer') {
      [salesData] = await sequelize.query(`
        SELECT 
          m.id as manufacturerId,
          m.company_name as companyName,
          m.brand_name as brandName,
          COUNT(DISTINCT o.id) as orderCount,
          SUM(oi.quantity) as totalQuantity,
          SUM(oi.manufacturer_amount * oi.quantity) as grossSales,
          SUM(oi.platform_fee * oi.quantity) as platformFees,
          (SUM(oi.manufacturer_amount * oi.quantity) - SUM(oi.platform_fee * oi.quantity)) as netRevenue
        FROM manufacturers m
        JOIN order_items oi ON m.id = oi.manufacturer_id
        JOIN orders o ON oi.order_id = o.id
        WHERE 1=1
          ${dateFilter}
        GROUP BY m.id, m.company_name, m.brand_name
        ORDER BY grossSales DESC
        LIMIT :limit
      `, {
        replacements,
        type: QueryTypes.SELECT
      });
    } else if (groupBy === 'reseller') {
      [salesData] = await sequelize.query(`
        SELECT 
          r.id as resellerId,
          u.email,
          u.mobile,
          COUNT(DISTINCT o.id) as orderCount,
          SUM(o.total_amount) as totalSales,
          SUM(oi.reseller_commission * oi.quantity) as totalEarnings,
          AVG(o.total_amount) as avgOrderValue
        FROM resellers r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN orders o ON r.id = o.reseller_id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE u.role = 'reseller' 
          ${dateFilter}
        GROUP BY r.id, u.email, u.mobile
        ORDER BY totalSales DESC
        LIMIT :limit
      `, {
        replacements,
        type: QueryTypes.SELECT
      });
    }

    res.json({
      status: 'success',
      data: salesData,
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate sales report',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/reports/growth
// @desc    Get growth reports
// @access  Private (Admin)
router.get('/growth', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;

    let dateFormat;
    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        dateFormat = '%Y-%u';
        break;
      case 'monthly':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m';
    }

    const [growthData] = await sequelize.query(`
      SELECT 
        DATE_FORMAT(date, '${dateFormat}') as period,
        SUM(newUsers) as newUsers,
        SUM(newManufacturers) as newManufacturers,
        SUM(newResellers) as newResellers,
        SUM(newOrders) as newOrders
      FROM (
        SELECT created_at as date, 1 as newUsers, 0 as newManufacturers, 0 as newResellers, 0 as newOrders
        FROM users 
        WHERE YEAR(created_at) = :year
        
        UNION ALL
        
        SELECT created_at as date, 0 as newUsers, 1 as newManufacturers, 0 as newResellers, 0 as newOrders
        FROM manufacturers 
        WHERE YEAR(created_at) = :year
        
        UNION ALL
        
        SELECT created_at as date, 0 as newUsers, 0 as newResellers, 1 as newResellers, 0 as newOrders
        FROM resellers 
        WHERE YEAR(created_at) = :year
        
        UNION ALL
        
        SELECT ordered_at as date, 0 as newUsers, 0 as newManufacturers, 0 as newResellers, 1 as newOrders
        FROM orders 
        WHERE YEAR(ordered_at) = :year
      ) as growth_data
      GROUP BY DATE_FORMAT(date, '${dateFormat}')
      ORDER BY period ASC
    `, {
      replacements: { year },
      type: QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: growthData,
    });
  } catch (error) {
    console.error('Growth report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate growth report',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/reports/product-demand
// @desc    Get product demand analytics
// @access  Private (Admin)
router.get('/product-demand', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const [demandData] = await sequelize.query(`
      SELECT 
        p.id as productId,
        p.name as productName,
        pi.image_url as productImage,
        COUNT(DISTINCT oi.order_id) as orderCount,
        COALESCE(SUM(oi.quantity), 0) as totalQuantitySold,
        COUNT(DISTINCT oi.order_id) as demandScore
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = TRUE
      WHERE p.deleted_at IS NULL AND p.status = 'approved'
      GROUP BY p.id, p.name, pi.image_url
      ORDER BY demandScore DESC, totalQuantitySold DESC
      LIMIT :limit
    `, {
      replacements: { limit: parseInt(limit) },
      type: QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: demandData,
    });
  } catch (error) {
    console.error('Product demand report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate product demand report',
      error: error.message,
    });
  }
});

module.exports = router;
