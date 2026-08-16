const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../../middleware/auth');
const { sequelize } = require('../../models');
const { QueryTypes } = require('sequelize');

// @route   GET /api/admin/dashboard/overview
// @desc    Get comprehensive dashboard overview with all metrics
// @access  Private (Admin)
router.get('/overview', authMiddleware, adminOnly, async (req, res) => {
  try {
    console.log('Dashboard overview requested by user:', req.user);
    const { timeframe = '30days' } = req.query;
    
    // Calculate date range based on timeframe
    const now = new Date();
    let startDate;
    switch (timeframe) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case '7days':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30days':
        startDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case '90days':
        startDate = new Date(now.setDate(now.getDate() - 90));
        break;
      default:
        startDate = new Date(now.setDate(now.getDate() - 30));
    }

    // Initialize default values
    let businessOverview = {
      totalRevenue: 0,
      todaysRevenue: 0,
      monthlyRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalManufacturers: 0,
      totalResellers: 0,
      totalCustomers: 0
    };

    let financialOverview = {
      skaarviMarginEarned: 0,
      platformFeesEarned: 0,
      pendingSettlements: 0,
      pendingWithdrawals: 0,
      paymentGatewayCharges: 0
    };

    let growthMetrics = {
      newResellers: 0,
      newManufacturers: 0,
      newProducts: 0,
      newOrders: 0
    };

    let recentOrders = [];
    let topProducts = [];
    let statusDistribution = {
      pendingManufacturers: 0,
      approvedManufacturers: 0,
      rejectedManufacturers: 0,
      pendingProducts: 0,
      approvedProducts: 0,
      pendingOrders: 0,
      processingOrders: 0,
      shippedOrders: 0,
      deliveredOrders: 0
    };

    // Try to fetch business overview
    try {
      const result = await sequelize.query(`
        SELECT 
          (SELECT COUNT(*) FROM products WHERE deletedAt IS NULL) as totalProducts,
          (SELECT COUNT(*) FROM manufacturers WHERE deletedAt IS NULL) as totalManufacturers,
          (SELECT COUNT(*) FROM users WHERE userType = 'reseller' AND deletedAt IS NULL) as totalResellers
      `, { type: QueryTypes.SELECT });
      if (result && result.length > 0) {
        businessOverview.totalProducts = Number.parseInt(result[0].totalProducts || 0);
        businessOverview.totalManufacturers = Number.parseInt(result[0].totalManufacturers || 0);
        businessOverview.totalResellers = Number.parseInt(result[0].totalResellers || 0);
      }
    } catch (err) {
      console.error('Business overview error:', err.message);
    }

    // Try to fetch orders data if table exists
    try {
      const ordersResult = await sequelize.query(`
        SELECT 
          COUNT(*) as totalOrders,
          COALESCE(SUM(totalAmount), 0) as totalRevenue,
          COALESCE(SUM(CASE WHEN DATE(orderedAt) = CURDATE() THEN totalAmount ELSE 0 END), 0) as todaysRevenue,
          COALESCE(SUM(CASE WHEN MONTH(orderedAt) = MONTH(CURDATE()) AND YEAR(orderedAt) = YEAR(CURDATE()) THEN totalAmount ELSE 0 END), 0) as monthlyRevenue,
          COUNT(DISTINCT customerId) as totalCustomers
        FROM orders
        WHERE deletedAt IS NULL
      `, { type: QueryTypes.SELECT });
      if (ordersResult && ordersResult.length > 0) {
        businessOverview.totalOrders = Number.parseInt(ordersResult[0].totalOrders || 0);
        businessOverview.totalRevenue = Number.parseFloat(ordersResult[0].totalRevenue || 0);
        businessOverview.todaysRevenue = Number.parseFloat(ordersResult[0].todaysRevenue || 0);
        businessOverview.monthlyRevenue = Number.parseFloat(ordersResult[0].monthlyRevenue || 0);
        businessOverview.totalCustomers = Number.parseInt(ordersResult[0].totalCustomers || 0);
      }
    } catch (err) {
      console.error('Orders data error:', err.message);
    }

    // Calculate Net Profit
    const netProfit = (
      Number.parseFloat(financialOverview.skaarviMarginEarned || 0) +
      Number.parseFloat(financialOverview.platformFeesEarned || 0) -
      Number.parseFloat(financialOverview.paymentGatewayCharges || 0) -
      Number.parseFloat(financialOverview.pendingSettlements || 0)
    );

    // Try to fetch growth metrics
    try {
      const result = await sequelize.query(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE userType = 'reseller' AND createdAt >= :startDate AND deletedAt IS NULL) as newResellers,
          (SELECT COUNT(*) FROM manufacturers WHERE createdAt >= :startDate AND deletedAt IS NULL) as newManufacturers,
          (SELECT COUNT(*) FROM products WHERE createdAt >= :startDate AND deletedAt IS NULL) as newProducts
      `, { 
        replacements: { startDate },
        type: QueryTypes.SELECT 
      });
      if (result && result.length > 0) {
        growthMetrics.newResellers = Number.parseInt(result[0].newResellers || 0);
        growthMetrics.newManufacturers = Number.parseInt(result[0].newManufacturers || 0);
        growthMetrics.newProducts = Number.parseInt(result[0].newProducts || 0);
      }
    } catch (err) {
      console.error('Growth metrics error:', err.message);
    }

    // Try to fetch new orders count
    try {
      const result = await sequelize.query(`
        SELECT COUNT(*) as newOrders
        FROM orders
        WHERE orderedAt >= :startDate AND deletedAt IS NULL
      `, { 
        replacements: { startDate },
        type: QueryTypes.SELECT 
      });
      if (result && result.length > 0) {
        growthMetrics.newOrders = Number.parseInt(result[0].newOrders || 0);
      }
    } catch (err) {
      console.error('New orders error:', err.message);
    }

    // Try to fetch recent orders
    try {
      recentOrders = await sequelize.query(`
        SELECT 
          o.orderId,
          o.orderNumber,
          o.totalAmount,
          o.orderStatus,
          o.orderedAt,
          COALESCE(u.fullName, 'Guest') as customerName
        FROM orders o
        LEFT JOIN users u ON o.customerId = u.userId
        WHERE o.deletedAt IS NULL
        ORDER BY o.orderedAt DESC
        LIMIT 10
      `, { type: QueryTypes.SELECT });
    } catch (err) {
      console.error('Recent orders error:', err.message);
    }

    // Try to fetch status distribution
    try {
      const result = await sequelize.query(`
        SELECT 
          (SELECT COUNT(*) FROM manufacturers WHERE approvalStatus = 'pending' AND deletedAt IS NULL) as pendingManufacturers,
          (SELECT COUNT(*) FROM manufacturers WHERE approvalStatus = 'approved' AND deletedAt IS NULL) as approvedManufacturers,
          (SELECT COUNT(*) FROM manufacturers WHERE approvalStatus = 'rejected' AND deletedAt IS NULL) as rejectedManufacturers,
          (SELECT COUNT(*) FROM products WHERE productStatus = 'pending' AND deletedAt IS NULL) as pendingProducts,
          (SELECT COUNT(*) FROM products WHERE productStatus = 'approved' AND deletedAt IS NULL) as approvedProducts
      `, { type: QueryTypes.SELECT });
      if (result && result.length > 0) {
        statusDistribution = result[0];
      }
    } catch (err) {
      console.error('Status distribution error:', err.message);
    }

    // Try to fetch order status distribution
    try {
      const result = await sequelize.query(`
        SELECT 
          COUNT(CASE WHEN orderStatus = 'pending' THEN 1 END) as pendingOrders,
          COUNT(CASE WHEN orderStatus = 'processing' THEN 1 END) as processingOrders,
          COUNT(CASE WHEN orderStatus = 'shipped' THEN 1 END) as shippedOrders,
          COUNT(CASE WHEN orderStatus = 'delivered' THEN 1 END) as deliveredOrders
        FROM orders
        WHERE deletedAt IS NULL
      `, { type: QueryTypes.SELECT });
      if (result && result.length > 0) {
        statusDistribution = { ...statusDistribution, ...result[0] };
      }
    } catch (err) {
      console.error('Order status error:', err.message);
    }

    res.json({
      status: 'success',
      data: {
        businessOverview,
        financialOverview: {
          ...financialOverview,
          netProfit
        },
        growthMetrics,
        recentOrders,
        topProducts,
        statusDistribution,
      },
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard overview',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/dashboard/revenue-breakdown
// @desc    Get detailed revenue breakdown
// @access  Private (Admin)
router.get('/revenue-breakdown', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = '';
    const replacements = {};
    
    if (startDate && endDate) {
      dateFilter = 'AND o.orderedAt BETWEEN :startDate AND :endDate';
      replacements.startDate = startDate;
      replacements.endDate = endDate;
    }

    const [revenueBreakdown] = await sequelize.query(`
      SELECT 
        COALESCE(SUM(oi.manufacturerPrice * oi.quantity), 0) as manufacturerRevenue,
        COALESCE(SUM(oi.platformFee * oi.quantity), 0) as platformFees,
        COALESCE(SUM(oi.skaarviMargin * oi.quantity), 0) as skaarviMargins,
        COALESCE(SUM(oi.resellerCommission * oi.quantity), 0) as resellerCommissions,
        COALESCE(SUM(o.paymentGatewayCharges), 0) as paymentGatewayCharges,
        COALESCE(SUM(CASE WHEN o.orderStatus = 'cancelled' OR o.orderStatus = 'returned' THEN o.totalAmount ELSE 0 END), 0) as refunds,
        COALESCE(SUM(o.totalAmount), 0) as totalRevenue
      FROM order_items oi
      JOIN orders o ON oi.orderId = o.orderId
      WHERE oi.deletedAt IS NULL AND o.deletedAt IS NULL ${dateFilter}
    `, { 
      replacements,
      type: QueryTypes.SELECT 
    });

    // Calculate net profit
    const netProfit = (
      parseFloat(revenueBreakdown.platformFees || 0) +
      parseFloat(revenueBreakdown.skaarviMargins || 0) -
      parseFloat(revenueBreakdown.paymentGatewayCharges || 0) -
      parseFloat(revenueBreakdown.refunds || 0)
    );

    res.json({
      status: 'success',
      data: {
        ...revenueBreakdown,
        netProfit: parseFloat(netProfit),
      },
    });
  } catch (error) {
    console.error('Revenue breakdown error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch revenue breakdown',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/dashboard/trending-products
// @desc    Get trending products based on saves, shares, clicks
// @access  Private (Admin)
router.get('/trending-products', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const [trendingProducts] = await sequelize.query(`
      SELECT 
        p.productId,
        p.productName,
        p.productImage,
        p.sellingPrice,
        COUNT(DISTINCT ps.id) as saveCount,
        COUNT(DISTINCT psh.id) as shareCount,
        COUNT(DISTINCT pc.id) as clickCount,
        COUNT(DISTINCT oi.orderId) as orderCount,
        (
          COUNT(DISTINCT ps.id) * 1 +
          COUNT(DISTINCT psh.id) * 2 +
          COUNT(DISTINCT pc.id) * 0.5 +
          COUNT(DISTINCT oi.orderId) * 5
        ) as trendingScore
      FROM products p
      LEFT JOIN product_saves ps ON p.productId = ps.productId
      LEFT JOIN product_shares psh ON p.productId = psh.productId
      LEFT JOIN product_clicks pc ON p.productId = pc.productId
      LEFT JOIN order_items oi ON p.productId = oi.productId
      WHERE p.deletedAt IS NULL AND p.productStatus = 'approved'
      GROUP BY p.productId, p.productName, p.productImage, p.sellingPrice
      ORDER BY trendingScore DESC
      LIMIT :limit
    `, { 
      replacements: { limit: parseInt(limit) },
      type: QueryTypes.SELECT 
    });

    res.json({
      status: 'success',
      data: trendingProducts,
    });
  } catch (error) {
    console.error('Trending products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch trending products',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/dashboard/charts
// @desc    Get data for dashboard charts
// @access  Private (Admin)
router.get('/charts', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { type = 'revenue', period = '7days' } = req.query;
    
    let dateFormat, dateLimit;
    switch (period) {
      case '7days':
        dateFormat = '%Y-%m-%d';
        dateLimit = 'DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
        break;
      case '30days':
        dateFormat = '%Y-%m-%d';
        dateLimit = 'DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
        break;
      case '12months':
        dateFormat = '%Y-%m';
        dateLimit = 'DATE_SUB(CURDATE(), INTERVAL 12 MONTH)';
        break;
      default:
        dateFormat = '%Y-%m-%d';
        dateLimit = 'DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    }

    let chartData = [];

    if (type === 'revenue') {
      [chartData] = await sequelize.query(`
        SELECT 
          DATE_FORMAT(orderedAt, '${dateFormat}') as date,
          SUM(totalAmount) as value
        FROM orders
        WHERE deletedAt IS NULL AND orderedAt >= ${dateLimit}
        GROUP BY DATE_FORMAT(orderedAt, '${dateFormat}')
        ORDER BY date ASC
      `, { type: QueryTypes.SELECT });
    } else if (type === 'orders') {
      [chartData] = await sequelize.query(`
        SELECT 
          DATE_FORMAT(orderedAt, '${dateFormat}') as date,
          COUNT(*) as value
        FROM orders
        WHERE deletedAt IS NULL AND orderedAt >= ${dateLimit}
        GROUP BY DATE_FORMAT(orderedAt, '${dateFormat}')
        ORDER BY date ASC
      `, { type: QueryTypes.SELECT });
    }

    res.json({
      status: 'success',
      data: chartData,
    });
  } catch (error) {
    console.error('Charts data error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch chart data',
      error: error.message,
    });
  }
});

module.exports = router;
