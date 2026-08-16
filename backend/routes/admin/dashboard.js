const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../../middleware/auth');
const { sequelize } = require('../../models');
const { QueryTypes } = require('sequelize');

// Simple in-memory cache with 1-minute TTL
const cache = new Map();
const CACHE_TTL = 60 * 1000; // 1 minute

function getCached(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// @route   GET /api/admin/dashboard/overview
// @desc    Get comprehensive dashboard overview with all metrics - OPTIMIZED
// @access  Private (Admin)
router.get('/overview', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { timeframe = '30days' } = req.query;
    const cacheKey = `dashboard_${timeframe}_${req.user.id}`;
    
    // Check cache first
    const cached = getCached(cacheKey);
    if (cached) {
      return res.json({ status: 'success', data: cached, cached: true });
    }

    // Calculate date range
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

    // Run all queries in parallel for maximum speed
    const [
      businessResult,
      ordersResult,
      growthResult,
      statusResult,
      recentOrdersResult,
      financialResult
    ] = await Promise.allSettled([
      // Business overview - basic counts
      sequelize.query(`
        SELECT 
          (SELECT COUNT(*) FROM products WHERE deleted_at IS NULL) as totalProducts,
          (SELECT COUNT(*) FROM manufacturers) as totalManufacturers,
          (SELECT COUNT(*) FROM resellers) as totalResellers
      `, { type: QueryTypes.SELECT }),
      
      // Orders data - revenue and counts
      sequelize.query(`
        SELECT 
          COUNT(*) as totalOrders,
          COALESCE(SUM(total_amount), 0) as totalRevenue,
          COALESCE(SUM(CASE WHEN DATE(ordered_at) = CURDATE() THEN total_amount ELSE 0 END), 0) as todaysRevenue,
          COALESCE(SUM(CASE WHEN MONTH(ordered_at) = MONTH(CURDATE()) THEN total_amount ELSE 0 END), 0) as monthlyRevenue,
          COUNT(DISTINCT customer_id) as totalCustomers
        FROM orders
      `, { type: QueryTypes.SELECT }),
      
      // Growth metrics
      sequelize.query(`
        SELECT 
          (SELECT COUNT(*) FROM resellers WHERE created_at >= ?) as newResellers,
          (SELECT COUNT(*) FROM manufacturers WHERE created_at >= ?) as newManufacturers,
          (SELECT COUNT(*) FROM products WHERE created_at >= ? AND deleted_at IS NULL) as newProducts,
          (SELECT COUNT(*) FROM orders WHERE ordered_at >= ?) as newOrders
      `, { 
        replacements: [startDate, startDate, startDate, startDate],
        type: QueryTypes.SELECT 
      }),
      
      // Status distribution
      sequelize.query(`
        SELECT 
          (SELECT COUNT(*) FROM manufacturers WHERE approval_status = 'pending') as pendingManufacturers,
          (SELECT COUNT(*) FROM manufacturers WHERE approval_status = 'approved') as approvedManufacturers,
          (SELECT COUNT(*) FROM products WHERE status = 'pending_approval') as pendingProducts,
          (SELECT COUNT(*) FROM orders WHERE order_status = 'new') as pendingOrders,
          (SELECT COUNT(*) FROM orders WHERE order_status = 'processing') as processingOrders,
          (SELECT COUNT(*) FROM orders WHERE order_status = 'shipped') as shippedOrders,
          (SELECT COUNT(*) FROM orders WHERE order_status = 'delivered') as deliveredOrders
      `, { type: QueryTypes.SELECT }),
      
      // Recent orders (limit to 10 for speed)
      sequelize.query(`
        SELECT 
          o.id,
          o.order_number as orderNumber,
          o.total_amount as totalAmount,
          o.order_status as orderStatus,
          o.ordered_at as orderedAt,
          c.full_name as customerName
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        ORDER BY o.ordered_at DESC
        LIMIT 10
      `, { type: QueryTypes.SELECT }),
      
      // Financial data - all financial metrics
      sequelize.query(`
        SELECT 
          COALESCE(SUM(oi.skaarvi_revenue), 0) as skaarviMarginEarned,
          COALESCE(SUM(oi.platform_fee), 0) as platformFeesEarned,
          (SELECT COALESCE(SUM(amount), 0) FROM settlements WHERE status = 'pending') as pendingSettlements,
          (SELECT COALESCE(SUM(amount), 0) FROM withdrawals WHERE status = 'pending') as pendingWithdrawals
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.payment_status = 'paid'
      `, { type: QueryTypes.SELECT })
    ]);

    // Extract data with defaults
    const businessData = businessResult.status === 'fulfilled' && businessResult.value[0] 
      ? businessResult.value[0] 
      : { totalProducts: 0, totalManufacturers: 0, totalResellers: 0 };

    const ordersData = ordersResult.status === 'fulfilled' && ordersResult.value[0]
      ? ordersResult.value[0]
      : { totalOrders: 0, totalRevenue: 0, todaysRevenue: 0, monthlyRevenue: 0, totalCustomers: 0 };

    const growthData = growthResult.status === 'fulfilled' && growthResult.value[0]
      ? growthResult.value[0]
      : { newResellers: 0, newManufacturers: 0, newProducts: 0, newOrders: 0 };

    const statusData = statusResult.status === 'fulfilled' && statusResult.value[0]
      ? statusResult.value[0]
      : { pendingManufacturers: 0, approvedManufacturers: 0, pendingProducts: 0, pendingOrders: 0, processingOrders: 0, shippedOrders: 0, deliveredOrders: 0 };

    const recentOrders = recentOrdersResult.status === 'fulfilled' && recentOrdersResult.value
      ? recentOrdersResult.value
      : [];

    const financialData = financialResult.status === 'fulfilled' && financialResult.value[0]
      ? financialResult.value[0]
      : { skaarviMarginEarned: 0, platformFeesEarned: 0, pendingSettlements: 0, pendingWithdrawals: 0 };

    // Calculate payment gateway charges (assuming 2% of paid orders)
    const paymentGatewayCharges = parseFloat(ordersData.totalRevenue || 0) * 0.02;

    // Calculate net profit: Skaarvi Revenue + Platform Fees - Payment Gateway Charges
    const netProfit = parseFloat(financialData.skaarviMarginEarned || 0) 
                    + parseFloat(financialData.platformFeesEarned || 0) 
                    - paymentGatewayCharges;

    // Prepare response data
    const responseData = {
      businessOverview: {
        totalRevenue: parseFloat(ordersData.totalRevenue || 0),
        todaysRevenue: parseFloat(ordersData.todaysRevenue || 0),
        monthlyRevenue: parseFloat(ordersData.monthlyRevenue || 0),
        totalOrders: parseInt(ordersData.totalOrders || 0),
        totalProducts: parseInt(businessData.totalProducts || 0),
        totalManufacturers: parseInt(businessData.totalManufacturers || 0),
        totalResellers: parseInt(businessData.totalResellers || 0),
        totalCustomers: parseInt(ordersData.totalCustomers || 0)
      },
      financialOverview: {
        skaarviMarginEarned: parseFloat(financialData.skaarviMarginEarned || 0),
        platformFeesEarned: parseFloat(financialData.platformFeesEarned || 0),
        pendingSettlements: parseFloat(financialData.pendingSettlements || 0),
        pendingWithdrawals: parseFloat(financialData.pendingWithdrawals || 0),
        paymentGatewayCharges: parseFloat(paymentGatewayCharges.toFixed(2)),
        netProfit: parseFloat(netProfit.toFixed(2))
      },
      growthMetrics: {
        newResellers: parseInt(growthData.newResellers || 0),
        newManufacturers: parseInt(growthData.newManufacturers || 0),
        newProducts: parseInt(growthData.newProducts || 0),
        newOrders: parseInt(growthData.newOrders || 0)
      },
      recentOrders,
      topProducts: [],
      statusDistribution: statusData
    };

    // Cache the result
    setCache(cacheKey, responseData);

    res.json({
      status: 'success',
      data: responseData,
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    // Return default data instead of error for better UX
    res.json({
      status: 'success',
      data: {
        businessOverview: {
          totalRevenue: 0,
          todaysRevenue: 0,
          monthlyRevenue: 0,
          totalOrders: 0,
          totalProducts: 0,
          totalManufacturers: 0,
          totalResellers: 0,
          totalCustomers: 0
        },
        financialOverview: {
          skaarviMarginEarned: 0,
          platformFeesEarned: 0,
          pendingSettlements: 0,
          pendingWithdrawals: 0,
          paymentGatewayCharges: 0,
          netProfit: 0
        },
        growthMetrics: {
          newResellers: 0,
          newManufacturers: 0,
          newProducts: 0,
          newOrders: 0
        },
        recentOrders: [],
        topProducts: [],
        statusDistribution: {}
      },
      error: error.message
    });
  }
});

module.exports = router;
