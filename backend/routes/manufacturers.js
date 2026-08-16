const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { authMiddleware, manufacturerOnly, adminOnly } = require('../middleware/auth');
const { User, Manufacturer } = require('../models/user');
const { Product, ProductSave, ProductShare, ProductClick } = require('../models');
const { Order, OrderItem } = require('../models/order');
const sequelize = require('../config/database');

// @route   GET /api/manufacturers/dashboard
// @desc    Get manufacturer dashboard summary
// @access  Private (Manufacturer)
router.get('/dashboard', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const manufacturerId = req.user.manufacturerId;

    if (!manufacturerId) {
      return res.status(404).json({
        status: 'error',
        message: 'Manufacturer profile not found',
      });
    }

    // Get product statistics
    const productStats = await Product.findAll({
      where: { manufacturerId },
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    // Calculate product totals
    let totalProducts = 0;
    let activeProducts = 0;
    let pendingProducts = 0;

    productStats.forEach(stat => {
      totalProducts += parseInt(stat.count);
      if (stat.status === 'approved') activeProducts += parseInt(stat.count);
      if (stat.status === 'pending_approval') pendingProducts += parseInt(stat.count);
    });

    // Get order statistics for this manufacturer
    const orderStats = await OrderItem.findAll({
      where: { manufacturerId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('order_id'))), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('item_total')), 'totalSales'],
        [sequelize.fn('SUM', sequelize.col('manufacturer_amount')), 'totalEarnings'],
      ],
      raw: true,
    });

    const totalOrders = parseInt(orderStats[0]?.totalOrders || 0);
    const totalSales = parseFloat(orderStats[0]?.totalSales || 0);
    const totalEarnings = parseFloat(orderStats[0]?.totalEarnings || 0);

    // Calculate pending settlements (orders that are delivered but commission not paid)
    const pendingSettlementsData = await OrderItem.findAll({
      where: { manufacturerId },
      include: [{
        model: Order,
        as: 'order',
        where: {
          orderStatus: 'delivered',
          commissionPaid: false,
        },
        attributes: [],
      }],
      attributes: [
        [sequelize.fn('SUM', sequelize.col('manufacturer_amount')), 'pendingAmount'],
      ],
      raw: true,
    });

    const pendingSettlements = parseFloat(pendingSettlementsData[0]?.pendingAmount || 0);

    // Get recent orders with details
    const recentOrders = await OrderItem.findAll({
      where: { manufacturerId },
      include: [{
        model: Order,
        as: 'order',
        attributes: ['orderNumber', 'orderStatus', 'orderedAt'],
      }],
      order: [['created_at', 'DESC']],
      limit: 5,
      raw: true,
      nest: true,
    });

    res.status(200).json({
      status: 'success',
      data: {
        totalProducts,
        activeProducts,
        pendingProducts,
        totalOrders,
        totalSales,
        totalEarnings,
        pendingSettlements,
        recentOrders: recentOrders.map(item => ({
          id: item.order.orderNumber,
          product: item.productName,
          quantity: item.quantity,
          amount: parseFloat(item.itemTotal),
          status: item.order.orderStatus,
          orderedAt: item.order.orderedAt,
        })),
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

// @route   GET /api/manufacturers/profile
// @desc    Get manufacturer profile
// @access  Private (Manufacturer)
router.get('/profile', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Manufacturer,
        as: 'manufacturer',
      }],
      attributes: { exclude: ['password'] },
    });

    if (!user || !user.manufacturer) {
      return res.status(404).json({
        status: 'error',
        message: 'Manufacturer profile not found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user,
        manufacturer: user.manufacturer,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
});

// @route   PUT /api/manufacturers/profile
// @desc    Update manufacturer profile
// @access  Private (Manufacturer)
router.put('/profile', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findOne({
      where: { userId: req.user.id }
    });

    if (!manufacturer) {
      return res.status(404).json({
        status: 'error',
        message: 'Manufacturer profile not found',
      });
    }

    const {
      companyName,
      brandName,
      contactPerson,
      businessType,
      address,
      city,
      state,
      pincode,
      bankAccountNumber,
      bankIfscCode,
      bankAccountHolder,
      bankName,
      upiId,
    } = req.body;

    await manufacturer.update({
      companyName,
      brandName,
      contactPerson,
      businessType,
      address,
      city,
      state,
      pincode,
      bankAccountNumber,
      bankIfscCode,
      bankAccountHolder,
      bankName,
      upiId,
    });

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { manufacturer },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

// @route   GET /api/manufacturers/pending
// @desc    Get all pending manufacturers for approval
// @access  Private (Admin)
// @route   GET /api/manufacturers/pending
// @desc    Get all manufacturers (not just pending - for admin dashboard)
// @access  Private (Admin)
router.get('/pending', authMiddleware, adminOnly, async (req, res) => {
  try {
    // Get ALL manufacturers, not just pending
    const manufacturers = await Manufacturer.findAll({
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'mobile', 'email'],
      }],
      order: [['created_at', 'DESC']], // Newest first
    });

    res.status(200).json({
      status: 'success',
      data: manufacturers, // Return array directly, not nested
    });
  } catch (error) {
    console.error('Get manufacturers error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch manufacturers',
      error: error.message
    });
  }
});

// @route   POST /api/manufacturers/:id/approve
// @desc    Approve manufacturer
// @access  Private (Admin)
router.post('/:id/approve', authMiddleware, adminOnly, async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findByPk(req.params.id);
    
    if (!manufacturer) {
      return res.status(404).json({
        status: 'error',
        message: 'Manufacturer not found',
      });
    }

    // Allow approval for both pending and rejected manufacturers (for reapproval)
    if (manufacturer.approvalStatus !== 'pending' && 
        manufacturer.approvalStatus !== 'rejected') {
      return res.status(400).json({
        status: 'error',
        message: 'Only pending or rejected manufacturers can be approved',
      });
    }

    await manufacturer.update({
      approvalStatus: 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      rejectionReason: null, // Clear rejection reason when approving
    });

    res.status(200).json({
      status: 'success',
      message: 'Manufacturer approved successfully',
      data: { manufacturer },
    });
  } catch (error) {
    console.error('Approve manufacturer error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to approve manufacturer',
      error: error.message
    });
  }
});

// @route   POST /api/manufacturers/:id/reject
// @desc    Reject manufacturer
// @access  Private (Admin)
router.post('/:id/reject', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    
    const manufacturer = await Manufacturer.findByPk(req.params.id);
    
    if (!manufacturer) {
      return res.status(404).json({
        status: 'error',
        message: 'Manufacturer not found',
      });
    }

    // Allow rejection for both pending and approved manufacturers
    if (manufacturer.approvalStatus !== 'pending' && 
        manufacturer.approvalStatus !== 'approved') {
      return res.status(400).json({
        status: 'error',
        message: 'Only pending or approved manufacturers can be rejected',
      });
    }

    await manufacturer.update({
      approvalStatus: 'rejected',
      rejectionReason: reason,
      approvedBy: req.user.id,
      approvedAt: new Date(),
    });

    res.status(200).json({
      status: 'success',
      message: 'Manufacturer rejected',
      data: { manufacturer },
    });
  } catch (error) {
    console.error('Reject manufacturer error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject manufacturer',
      error: error.message
    });
  }
});

// @route   GET /api/manufacturers/products/:id/analytics
// @desc    Get analytics for a specific product
// @access  Private (Manufacturer)
router.get('/products/:id/analytics', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const manufacturerId = req.user.manufacturerId;
    const { id: productId } = req.params;
    const { startDate, endDate } = req.query;

    // Verify product belongs to manufacturer
    const product = await Product.findOne({
      where: { id: productId, manufacturerId },
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found or access denied',
      });
    }

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.createdAt = { ...dateFilter.createdAt, [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      dateFilter.createdAt = { ...dateFilter.createdAt, [Op.lte]: new Date(endDate) };
    }

    // Get saves count and unique users
    const savesData = await ProductSave.findAll({
      where: { productId, ...dateFilter },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalSaves'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('user_id'))), 'uniqueUsers'],
      ],
      raw: true,
    });

    // Get shares count
    const sharesData = await ProductShare.findAll({
      where: { productId, ...dateFilter },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalShares'],
        'platform',
      ],
      group: ['platform'],
      raw: true,
    });

    // Get clicks count
    const clicksData = await ProductClick.findOne({
      where: { productId, ...dateFilter },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalClicks'],
      ],
      raw: true,
    });

    // Get orders data from OrderItems
    const ordersData = await OrderItem.findAll({
      where: { productId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('order_id'))), 'totalOrders'],
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalUnitsSold'],
        [sequelize.fn('SUM', sequelize.col('item_total')), 'totalRevenue'],
      ],
      raw: true,
    });

    const totalSaves = parseInt(savesData[0]?.totalSaves || 0);
    const uniqueResellers = parseInt(savesData[0]?.uniqueUsers || 0);
    const totalShares = sharesData.reduce((sum, item) => sum + parseInt(item.totalShares || 0), 0);
    const totalClicks = parseInt(clicksData?.totalClicks || 0);
    const totalOrders = parseInt(ordersData[0]?.totalOrders || 0);
    const totalUnitsSold = parseInt(ordersData[0]?.totalUnitsSold || 0);
    const totalRevenue = parseFloat(ordersData[0]?.totalRevenue || 0);

    // Calculate conversion rate
    const conversionRate = totalClicks > 0 ? ((totalOrders / totalClicks) * 100).toFixed(2) : 0;

    // Format shares by platform
    const sharesByPlatform = {};
    sharesData.forEach(item => {
      sharesByPlatform[item.platform] = parseInt(item.totalShares);
    });

    res.status(200).json({
      status: 'success',
      data: {
        productId,
        productName: product.name,
        totalSaves,
        uniqueResellers,
        totalShares,
        sharesByPlatform,
        totalClicks,
        totalOrders,
        totalUnitsSold,
        totalRevenue,
        conversionRate: parseFloat(conversionRate),
      },
    });
  } catch (error) {
    console.error('Product analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product analytics',
      error: error.message,
    });
  }
});

// @route   GET /api/manufacturers/analytics/overview
// @desc    Get analytics overview for all manufacturer's products
// @access  Private (Manufacturer)
router.get('/analytics/overview', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const manufacturerId = req.user.manufacturerId;
    const { startDate, endDate, sortBy = 'saves', limit = 20 } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.createdAt = { ...dateFilter.createdAt, [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      dateFilter.createdAt = { ...dateFilter.createdAt, [Op.lte]: new Date(endDate) };
    }

    // Get all products for this manufacturer
    const products = await Product.findAll({
      where: { manufacturerId },
      attributes: ['id', 'name', 'sku', 'status'],
    });

    const productIds = products.map(p => p.id);

    if (productIds.length === 0) {
      return res.status(200).json({
        status: 'success',
        data: { products: [], summary: {} },
      });
    }

    // Get aggregated analytics for all products
    const analyticsPromises = productIds.map(async (productId) => {
      const product = products.find(p => p.id === productId);

      // Get saves
      const saves = await ProductSave.count({
        where: { productId, ...dateFilter },
      });

      // Get shares
      const shares = await ProductShare.count({
        where: { productId, ...dateFilter },
      });

      // Get clicks
      const clicks = await ProductClick.count({
        where: { productId, ...dateFilter },
      });

      // Get orders
      const ordersData = await OrderItem.findOne({
        where: { productId },
        attributes: [
          [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('order_id'))), 'totalOrders'],
          [sequelize.fn('SUM', sequelize.col('quantity')), 'totalUnitsSold'],
        ],
        raw: true,
      });

      const totalOrders = parseInt(ordersData?.totalOrders || 0);
      const totalUnitsSold = parseInt(ordersData?.totalUnitsSold || 0);
      const conversionRate = clicks > 0 ? ((totalOrders / clicks) * 100).toFixed(2) : 0;

      return {
        productId,
        productName: product.name,
        sku: product.sku,
        status: product.status,
        saves,
        shares,
        clicks,
        orders: totalOrders,
        unitsSold: totalUnitsSold,
        conversionRate: parseFloat(conversionRate),
      };
    });

    let productsAnalytics = await Promise.all(analyticsPromises);

    // Sort products
    const sortField = sortBy === 'saves' ? 'saves' :
                      sortBy === 'shares' ? 'shares' :
                      sortBy === 'clicks' ? 'clicks' :
                      sortBy === 'orders' ? 'orders' :
                      sortBy === 'conversion' ? 'conversionRate' : 'saves';

    productsAnalytics.sort((a, b) => b[sortField] - a[sortField]);

    // Limit results
    const limitedResults = productsAnalytics.slice(0, parseInt(limit));

    // Calculate summary totals
    const summary = {
      totalProducts: productsAnalytics.length,
      totalSaves: productsAnalytics.reduce((sum, p) => sum + p.saves, 0),
      totalShares: productsAnalytics.reduce((sum, p) => sum + p.shares, 0),
      totalClicks: productsAnalytics.reduce((sum, p) => sum + p.clicks, 0),
      totalOrders: productsAnalytics.reduce((sum, p) => sum + p.orders, 0),
      totalUnitsSold: productsAnalytics.reduce((sum, p) => sum + p.unitsSold, 0),
      averageConversionRate: (productsAnalytics.reduce((sum, p) => sum + p.conversionRate, 0) / productsAnalytics.length).toFixed(2),
    };

    res.status(200).json({
      status: 'success',
      data: {
        products: limitedResults,
        summary,
        pagination: {
          total: productsAnalytics.length,
          showing: limitedResults.length,
          sortedBy: sortBy,
        },
      },
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch analytics overview',
      error: error.message,
    });
  }
});

module.exports = router;
