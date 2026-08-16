const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../../middleware/auth');
const { sequelize } = require('../../models');
const { QueryTypes } = require('sequelize');

// @route   GET /api/admin/wallets/overview
// @desc    Get wallet overview for resellers and manufacturers
// @access  Private (Admin)
router.get('/overview', authMiddleware, adminOnly, async (req, res) => {
  try {
    // Get reseller wallet aggregates
    const resellerWalletData = await sequelize.query(`
      SELECT 
        COALESCE(SUM(r.total_earnings), 0) as totalEarnings,
        COALESCE(SUM(r.pending_earnings), 0) as pendingEarnings,
        COALESCE(SUM(r.withdrawn_amount), 0) as withdrawnEarnings,
        COALESCE(SUM(r.total_earnings - r.withdrawn_amount), 0) as approvedEarnings
      FROM resellers r
    `, {
      type: QueryTypes.SELECT
    });

    // Get manufacturer wallet aggregates from order_items
    const manufacturerWalletData = await sequelize.query(`
      SELECT 
        COALESCE(SUM(oi.manufacturer_amount), 0) as totalSales,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' AND o.order_status != 'delivered' THEN oi.manufacturer_amount ELSE 0 END), 0) as pendingSettlements,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' AND o.order_status = 'delivered' THEN oi.manufacturer_amount ELSE 0 END), 0) as paidSettlements
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
    `, {
      type: QueryTypes.SELECT
    });

    // Get platform revenue aggregates
    const platformRevenueData = await sequelize.query(`
      SELECT 
        COALESCE(SUM(oi.platform_fee), 0) as totalPlatformFee,
        COALESCE(SUM(oi.skaarvi_revenue), 0) as totalSkaarviRevenue,
        COALESCE(SUM(oi.reseller_commission), 0) as totalResellerCommissions
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.payment_status = 'paid'
    `, {
      type: QueryTypes.SELECT
    });

    // Get recent withdrawal requests
    const recentWithdrawals = await sequelize.query(`
      SELECT 
        wr.id,
        wr.amount,
        wr.status,
        wr.created_at as createdAt,
        r.full_name as resellerName,
        u.email as resellerEmail
      FROM withdrawal_requests wr
      JOIN resellers r ON wr.reseller_id = r.id
      JOIN users u ON r.user_id = u.id
      WHERE wr.status = 'pending'
      ORDER BY wr.created_at DESC
      LIMIT 5
    `, {
      type: QueryTypes.SELECT
    }).catch(() => []); // Handle if table doesn't exist

    // Get top resellers by earnings
    const topResellers = await sequelize.query(`
      SELECT 
        r.id,
        r.full_name as fullName,
        r.reseller_code as resellerCode,
        r.total_earnings as totalEarnings,
        r.pending_earnings as pendingEarnings,
        r.withdrawn_amount as withdrawnAmount,
        u.email,
        u.mobile
      FROM resellers r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.total_earnings DESC
      LIMIT 10
    `, {
      type: QueryTypes.SELECT
    });

    // Get top manufacturers by sales
    const topManufacturers = await sequelize.query(`
      SELECT 
        m.id,
        m.company_name as companyName,
        m.brand_name as brandName,
        u.email,
        u.mobile,
        COALESCE(SUM(oi.manufacturer_amount), 0) as totalSales,
        COUNT(DISTINCT o.id) as totalOrders
      FROM manufacturers m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN order_items oi ON m.id = oi.manufacturer_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
      GROUP BY m.id
      ORDER BY totalSales DESC
      LIMIT 10
    `, {
      type: QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        resellerWallet: resellerWalletData[0],
        manufacturerWallet: manufacturerWalletData[0],
        platformRevenue: platformRevenueData[0],
        recentWithdrawals: recentWithdrawals || [],
        topResellers: topResellers || [],
        topManufacturers: topManufacturers || [],
      },
    });
  } catch (error) {
    console.error('Wallet overview error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch wallet overview',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/wallets/resellers
// @desc    Get detailed reseller wallets
// @access  Private (Admin)
router.get('/resellers', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let searchFilter = '';
    const replacements = { limit: parseInt(limit), offset };

    if (search) {
      searchFilter = 'AND (r.full_name LIKE :search OR u.email LIKE :search OR r.reseller_code LIKE :search)';
      replacements.search = `%${search}%`;
    }

    const resellers = await sequelize.query(`
      SELECT 
        r.id,
        r.full_name as fullName,
        r.reseller_code as resellerCode,
        r.reseller_type as resellerType,
        r.total_earnings as totalEarnings,
        r.pending_earnings as pendingEarnings,
        r.withdrawn_amount as withdrawnAmount,
        (r.total_earnings - r.withdrawn_amount) as approvedEarnings,
        r.total_sales as totalOrders,
        u.email,
        u.mobile,
        u.is_active as isActive
      FROM resellers r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1 ${searchFilter}
      ORDER BY r.total_earnings DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    const totalResult = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM resellers r
      JOIN users u ON r.user_id = u.id
      WHERE 1=1 ${searchFilter}
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        resellers,
        pagination: {
          total: parseInt(totalResult[0]?.total || 0),
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil((totalResult[0]?.total || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Reseller wallets error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch reseller wallets',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/wallets/manufacturers
// @desc    Get detailed manufacturer wallets
// @access  Private (Admin)
router.get('/manufacturers', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let searchFilter = '';
    const replacements = { limit: parseInt(limit), offset };

    if (search) {
      searchFilter = 'AND (m.company_name LIKE :search OR u.email LIKE :search OR m.brand_name LIKE :search)';
      replacements.search = `%${search}%`;
    }

    const manufacturers = await sequelize.query(`
      SELECT 
        m.id,
        m.company_name as companyName,
        m.brand_name as brandName,
        u.email,
        u.mobile,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' THEN oi.manufacturer_amount ELSE 0 END), 0) as totalSales,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' AND o.order_status != 'delivered' THEN oi.manufacturer_amount ELSE 0 END), 0) as pendingSettlements,
        COALESCE(SUM(CASE WHEN o.payment_status = 'paid' AND o.order_status = 'delivered' THEN oi.manufacturer_amount ELSE 0 END), 0) as paidSettlements,
        COUNT(DISTINCT o.id) as totalOrders
      FROM manufacturers m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN order_items oi ON m.id = oi.manufacturer_id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE 1=1 ${searchFilter}
      GROUP BY m.id
      ORDER BY totalSales DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    const totalResult = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM manufacturers m
      WHERE 1=1 ${searchFilter}
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        manufacturers,
        pagination: {
          total: parseInt(totalResult[0]?.total || 0),
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil((totalResult[0]?.total || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Manufacturer wallets error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch manufacturer wallets',
      error: error.message,
    });
  }
});

module.exports = router;
