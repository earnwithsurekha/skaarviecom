const express = require('express');
const router = express.Router();
const { authMiddleware, manufacturerOnly } = require('../middleware/auth');
const earningsService = require('../services/earningsService');

// @route   GET /api/earnings/overview
// @desc    Get earnings overview
// @access  Private (Manufacturer)
router.get('/overview', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const manufacturerId = req.user.manufacturerId;

    if (!manufacturerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Manufacturer ID not found',
      });
    }

    const overview = await earningsService.getEarningsOverview(manufacturerId);

    res.status(200).json({
      status: 'success',
      message: 'Earnings overview retrieved successfully',
      data: overview,
    });
  } catch (error) {
    console.error('Get earnings overview error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get earnings overview',
      error: error.message,
    });
  }
});

// @route   GET /api/earnings/products
// @desc    Get product-wise earnings
// @access  Private (Manufacturer)
router.get('/products', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const manufacturerId = req.user.manufacturerId;
    const { page, limit, sortBy, sortOrder, search } = req.query;

    if (!manufacturerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Manufacturer ID not found',
      });
    }

    const filters = { page, limit, sortBy, sortOrder, search };
    const result = await earningsService.getProductWiseEarnings(manufacturerId, filters);

    res.status(200).json({
      status: 'success',
      message: 'Product earnings retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('Get product earnings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get product earnings',
      error: error.message,
    });
  }
});

// @route   GET /api/earnings/timeline
// @desc    Get earnings timeline (daily/weekly/monthly)
// @access  Private (Manufacturer)
router.get('/timeline', authMiddleware, manufacturerOnly, async (req, res) => {
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

    const timeline = await earningsService.aggregatePeriodEarnings(
      manufacturerId,
      period,
      start,
      end
    );

    res.status(200).json({
      status: 'success',
      message: 'Earnings timeline retrieved successfully',
      data: {
        period,
        startDate: start,
        endDate: end,
        timeline,
      },
    });
  } catch (error) {
    console.error('Get earnings timeline error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get earnings timeline',
      error: error.message,
    });
  }
});

module.exports = router;
