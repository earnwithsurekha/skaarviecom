const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const sequelize = require('../../config/database');
const { QueryTypes } = require('sequelize');

// ========================================
// CUSTOMER ENDPOINTS
// ========================================

// @route   POST /api/customer/request-reseller-upgrade
// @desc    Customer requests to upgrade to reseller
// @access  Private (Customer only)
router.post('/request-reseller-upgrade', authMiddleware, async (req, res) => {
  console.log('=== Reseller Upgrade Request ===');

  try {
    const userId = req.user.id;
    const { requestReason, businessDetails } = req.body;

    // Check if user is a customer
    const [user] = await sequelize.query(
      'SELECT id, role, full_name, email FROM users WHERE id = ?',
      {
        replacements: [userId],
        type: QueryTypes.SELECT
      }
    );

    if (!user || user.role !== 'customer') {
      return res.status(403).json({
        status: 'error',
        message: 'Only customers can request reseller upgrade',
      });
    }

    // Check if there's already a pending request
    const [existingRequest] = await sequelize.query(
      'SELECT id, status FROM reseller_upgrade_requests WHERE user_id = ? AND status = ?',
      {
        replacements: [userId, 'pending'],
        type: QueryTypes.SELECT
      }
    );

    if (existingRequest) {
      return res.status(400).json({
        status: 'error',
        message: 'You already have a pending reseller upgrade request',
      });
    }

    // Check if user is already a reseller
    const [existingReseller] = await sequelize.query(
      'SELECT id FROM resellers WHERE user_id = ?',
      {
        replacements: [userId],
        type: QueryTypes.SELECT
      }
    );

    if (existingReseller) {
      return res.status(400).json({
        status: 'error',
        message: 'You are already registered as a reseller',
      });
    }

    // Create the upgrade request
    await sequelize.query(
      `INSERT INTO reseller_upgrade_requests 
       (user_id, request_reason, business_details, status, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', NOW(), NOW())`,
      {
        replacements: [userId, requestReason || null, JSON.stringify(businessDetails || {})],
        type: QueryTypes.INSERT
      }
    );

    console.log('✅ Reseller upgrade request created for user:', userId);

    res.status(201).json({
      status: 'success',
      message: 'Reseller upgrade request submitted successfully. Admin will review your request.',
    });

  } catch (error) {
    console.error('Reseller upgrade request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit upgrade request',
      error: error.message
    });
  }
});

// @route   GET /api/customer/reseller-upgrade-status
// @desc    Check status of upgrade request
// @access  Private (Customer only)
router.get('/reseller-upgrade-status', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const [request] = await sequelize.query(
      `SELECT id, status, request_reason, reviewed_at, rejection_reason, created_at
       FROM reseller_upgrade_requests
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      {
        replacements: [userId],
        type: QueryTypes.SELECT
      }
    );

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'No upgrade request found',
      });
    }

    res.status(200).json({
      status: 'success',
      data: request
    });

  } catch (error) {
    console.error('Check upgrade status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check upgrade status',
      error: error.message
    });
  }
});

module.exports = router;
