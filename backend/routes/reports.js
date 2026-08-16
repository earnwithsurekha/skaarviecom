const express = require('express');
const router = express.Router();
const { authMiddleware, manufacturerOnly } = require('../middleware/auth');
const reportsService = require('../services/reportsService');

// @route   GET /api/reports/sales
// @desc    Get sales report (daily/weekly/monthly)
// @access  Private (Manufacturer)
router.get('/sales', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const manufacturerId = req.user.manufacturerId;
    const { period = 'daily', startDate, endDate } = req.query;

    if (!manufacturerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Manufacturer ID not found',
      });
    }

    // Set default date range if not provided (last 30 days)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const salesData = await reportsService.getSalesReport(manufacturerId, period, start, end);

    res.status(200).json({
      status: 'success',
      message: 'Sales report retrieved successfully',
      data: {
        period,
        startDate: start,
        endDate: end,
        sales: salesData,
      },
    });
  } catch (error) {
    console.error('Get sales report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get sales report',
      error: error.message,
    });
  }
});

// @route   GET /api/reports/products
// @desc    Get product report (best/least/saved/shared)
// @access  Private (Manufacturer)
router.get('/products', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const manufacturerId = req.user.manufacturerId;
    const { type = 'best', limit = 10 } = req.query;

    if (!manufacturerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Manufacturer ID not found',
      });
    }

    const validTypes = ['best', 'least', 'saved', 'shared'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    const products = await reportsService.getProductReport(manufacturerId, type, parseInt(limit));

    res.status(200).json({
      status: 'success',
      message: 'Product report retrieved successfully',
      data: {
        type,
        products,
      },
    });
  } catch (error) {
    console.error('Get product report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get product report',
      error: error.message,
    });
  }
});

// @route   GET /api/reports/reseller-demand
// @desc    Get reseller demand report (saves/shares/clicks/conversion)
// @access  Private (Manufacturer)
router.get('/reseller-demand', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const manufacturerId = req.user.manufacturerId;
    const { limit = 10 } = req.query;

    if (!manufacturerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Manufacturer ID not found',
      });
    }

    const demandReport = await reportsService.getResellerDemandReport(manufacturerId, parseInt(limit));

    res.status(200).json({
      status: 'success',
      message: 'Reseller demand report retrieved successfully',
      data: demandReport,
    });
  } catch (error) {
    console.error('Get reseller demand report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get reseller demand report',
      error: error.message,
    });
  }
});

// @route   GET /api/reports/revenue
// @desc    Get revenue report with breakdown
// @access  Private (Manufacturer)
router.get('/revenue', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const manufacturerId = req.user.manufacturerId;
    const { groupBy = 'day', startDate, endDate } = req.query;

    if (!manufacturerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Manufacturer ID not found',
      });
    }

    // Set default date range if not provided (last 30 days)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const validGroupBy = ['day', 'week', 'month'];
    const group = validGroupBy.includes(groupBy) ? groupBy : 'day';

    const revenueReport = await reportsService.getRevenueReport(manufacturerId, start, end, group);

    res.status(200).json({
      status: 'success',
      message: 'Revenue report retrieved successfully',
      data: {
        startDate: start,
        endDate: end,
        groupBy: group,
        ...revenueReport,
      },
    });
  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get revenue report',
      error: error.message,
    });
  }
});

module.exports = router;
