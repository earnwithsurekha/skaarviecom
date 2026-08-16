const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { authMiddleware, manufacturerOnly, adminOnly } = require('../middleware/auth');
const settlementService = require('../services/settlementService');

// @route   GET /api/settlements
// @desc    Get settlement history for manufacturer
// @access  Private (Manufacturer)
router.get('/', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const manufacturerId = req.user.manufacturerId;
    const { page, limit, status, startDate, endDate } = req.query;

    if (!manufacturerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Manufacturer ID not found',
      });
    }

    const filters = { page, limit, status, startDate, endDate };
    const result = await settlementService.getSettlementHistory(manufacturerId, filters);

    res.status(200).json({
      status: 'success',
      message: 'Settlement history retrieved successfully',
      data: result,
    });
  } catch (error) {
    console.error('Get settlement history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get settlement history',
      error: error.message,
    });
  }
});

// @route   GET /api/settlements/pending-amount
// @desc    Get pending settlement amount
// @access  Private (Manufacturer)
router.get('/pending-amount', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const manufacturerId = req.user.manufacturerId;

    if (!manufacturerId) {
      return res.status(400).json({
        status: 'error',
        message: 'Manufacturer ID not found',
      });
    }

    const result = await settlementService.calculatePendingAmount(manufacturerId);

    res.status(200).json({
      status: 'success',
      message: 'Pending amount calculated successfully',
      data: result,
    });
  } catch (error) {
    console.error('Calculate pending amount error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to calculate pending amount',
      error: error.message,
    });
  }
});

// @route   GET /api/settlements/:id
// @desc    Get settlement detail with orders list
// @access  Private (Manufacturer)
router.get('/:id', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const manufacturerId = req.user.manufacturerId;
    const { ManufacturerSettlement } = require('../models');
    const sequelize = require('../config/database');

    const settlement = await ManufacturerSettlement.findByPk(id);

    if (!settlement) {
      return res.status(404).json({
        status: 'error',
        message: 'Settlement not found',
      });
    }

    // Verify settlement belongs to this manufacturer
    if (settlement.manufacturerId !== manufacturerId) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized access to this settlement',
      });
    }

    // Get orders in this settlement
    const orderIds = settlement.orderIds || [];
    let orders = [];

    if (orderIds.length > 0) {
      const [results] = await sequelize.query(`
        SELECT 
          o.id,
          o.order_number,
          o.final_amount,
          o.ordered_at,
          o.order_status,
          SUM(oi.manufacturer_amount) as manufacturerAmount
        FROM orders o
        INNER JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id IN (:orderIds)
          AND oi.manufacturer_id = :manufacturerId
        GROUP BY o.id, o.order_number, o.final_amount, o.ordered_at, o.order_status
      `, {
        replacements: { orderIds, manufacturerId },
        type: sequelize.QueryTypes.SELECT,
      });

      orders = results;
    }

    res.status(200).json({
      status: 'success',
      message: 'Settlement detail retrieved successfully',
      data: {
        settlement,
        orders,
      },
    });
  } catch (error) {
    console.error('Get settlement detail error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get settlement detail',
      error: error.message,
    });
  }
});

// @route   POST /api/settlements
// @desc    Create new settlement (Admin only)
// @access  Private (Admin)
router.post('/', [
  authMiddleware,
  adminOnly,
  body('manufacturerId').notEmpty().withMessage('Manufacturer ID is required'),
  body('orderIds').isArray({ min: 1 }).withMessage('At least one order ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const { manufacturerId, orderIds } = req.body;
    const createdBy = req.user.id;

    const settlement = await settlementService.createSettlement(manufacturerId, orderIds, createdBy);

    res.status(201).json({
      status: 'success',
      message: 'Settlement created successfully',
      data: { settlement },
    });
  } catch (error) {
    console.error('Create settlement error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create settlement',
    });
  }
});

// @route   PATCH /api/settlements/:id/process
// @desc    Mark settlement as processed (Admin only)
// @access  Private (Admin)
router.patch('/:id/process', [
  authMiddleware,
  adminOnly,
  body('paymentMethod').notEmpty().withMessage('Payment method is required'),
  body('paymentReference').optional(),
  body('notes').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const paymentDetails = {
      paymentMethod: req.body.paymentMethod,
      paymentReference: req.body.paymentReference,
      notes: req.body.notes,
    };
    const processedBy = req.user.id;

    const settlement = await settlementService.processSettlement(id, paymentDetails, processedBy);

    res.status(200).json({
      status: 'success',
      message: 'Settlement processed successfully',
      data: { settlement },
    });
  } catch (error) {
    console.error('Process settlement error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to process settlement',
    });
  }
});

// @route   PATCH /api/settlements/:id/paid
// @desc    Mark settlement as paid (Admin only)
// @access  Private (Admin)
router.patch('/:id/paid', [
  authMiddleware,
  adminOnly,
  body('paymentReference').notEmpty().withMessage('Payment reference is required'),
  body('paymentDate').optional(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: errors.array()[0].msg,
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { paymentReference, paymentDate } = req.body;

    const settlement = await settlementService.markSettlementPaid(
      id,
      paymentReference,
      paymentDate ? new Date(paymentDate) : null
    );

    res.status(200).json({
      status: 'success',
      message: 'Settlement marked as paid successfully',
      data: { settlement },
    });
  } catch (error) {
    console.error('Mark settlement paid error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to mark settlement as paid',
    });
  }
});

module.exports = router;
