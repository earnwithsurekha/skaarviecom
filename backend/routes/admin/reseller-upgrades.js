const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const sequelize = require('../../config/database');
const { QueryTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// ========================================
// ADMIN ENDPOINTS FOR RESELLER UPGRADES
// ========================================

// @route   GET /api/admin/reseller-upgrade-requests
// @desc    Get all reseller upgrade requests
// @access  Private (Admin only)
router.get('/reseller-upgrade-requests', authMiddleware, async (req, res) => {
  console.log('=== Fetching Reseller Upgrade Requests ===');

  try {
    // Verify admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required',
      });
    }

    const { status = 'all', page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Build status filter
    let statusCondition = '';
    if (status !== 'all') {
      statusCondition = `AND rur.status = '${status}'`;
    }

    // Get requests with user details
    const requests = await sequelize.query(
      `SELECT 
        rur.id,
        rur.user_id,
        rur.request_reason,
        rur.business_details,
        rur.status,
        rur.reviewed_by,
        rur.reviewed_at,
        rur.rejection_reason,
        rur.created_at,
        u.full_name as customer_name,
        u.email as customer_email,
        u.mobile as customer_mobile,
        u.city,
        u.state,
        reviewer.full_name as reviewed_by_name
       FROM reseller_upgrade_requests rur
       JOIN users u ON rur.user_id = u.id
       LEFT JOIN users reviewer ON rur.reviewed_by = reviewer.id
       WHERE 1=1 ${statusCondition}
       ORDER BY rur.created_at DESC
       LIMIT ? OFFSET ?`,
      {
        replacements: [parseInt(limit), parseInt(offset)],
        type: QueryTypes.SELECT
      }
    );

    // Get total count
    const [countResult] = await sequelize.query(
      `SELECT COUNT(*) as total
       FROM reseller_upgrade_requests rur
       WHERE 1=1 ${statusCondition}`,
      { type: QueryTypes.SELECT }
    );

    res.status(200).json({
      status: 'success',
      data: {
        requests,
        pagination: {
          total: countResult.total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult.total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Fetch upgrade requests error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch upgrade requests',
      error: error.message
    });
  }
});

// @route   POST /api/admin/reseller-upgrade-requests/:id/approve
// @desc    Approve reseller upgrade request and create reseller account
// @access  Private (Admin only)
router.post('/reseller-upgrade-requests/:id/approve', authMiddleware, async (req, res) => {
  console.log('=== Approving Reseller Upgrade Request ===');

  const transaction = await sequelize.transaction();

  try {
    // Verify admin
    if (req.user.role !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required',
      });
    }

    const requestId = req.params.id;
    const adminId = req.user.id;

    // Get the upgrade request
    const [request] = await sequelize.query(
      `SELECT rur.*, u.full_name, u.email, u.mobile, u.city, u.state, u.pincode, u.address
       FROM reseller_upgrade_requests rur
       JOIN users u ON rur.user_id = u.id
       WHERE rur.id = ?`,
      {
        replacements: [requestId],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (!request) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Upgrade request not found',
      });
    }

    if (request.status !== 'pending') {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: `Request already ${request.status}`,
      });
    }

    // Generate unique reseller code
    const generateResellerCode = () => {
      const prefix = 'RSL';
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `${prefix}${random}`;
    };

    let resellerCode = generateResellerCode();
    
    // Ensure uniqueness
    let codeExists = true;
    while (codeExists) {
      const [existing] = await sequelize.query(
        'SELECT id FROM resellers WHERE reseller_code = ?',
        {
          replacements: [resellerCode],
          type: QueryTypes.SELECT,
          transaction
        }
      );
      if (!existing) {
        codeExists = false;
      } else {
        resellerCode = generateResellerCode();
      }
    }

    // Update user role to reseller
    await sequelize.query(
      `UPDATE users 
       SET role = 'reseller', status = 'approved', updated_at = NOW()
       WHERE id = ?`,
      {
        replacements: [request.user_id],
        type: QueryTypes.UPDATE,
        transaction
      }
    );

    // Create reseller record
    await sequelize.query(
      `INSERT INTO resellers 
       (user_id, full_name, reseller_code, city, state, pincode, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      {
        replacements: [
          request.user_id,
          request.full_name,
          resellerCode,
          request.city || 'N/A',
          request.state || 'N/A',
          request.pincode || '000000'
        ],
        type: QueryTypes.INSERT,
        transaction
      }
    );

    // Get the created reseller's ID
    const [reseller] = await sequelize.query(
      'SELECT id FROM resellers WHERE user_id = ?',
      {
        replacements: [request.user_id],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    // Create wallet for reseller
    await sequelize.query(
      `INSERT INTO wallets 
       (reseller_id, current_balance, pending_balance, total_earned, total_withdrawn, created_at, updated_at)
       VALUES (?, 0, 0, 0, 0, NOW(), NOW())`,
      {
        replacements: [reseller.id],
        type: QueryTypes.INSERT,
        transaction
      }
    );

    // Update upgrade request status
    await sequelize.query(
      `UPDATE reseller_upgrade_requests 
       SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      {
        replacements: [adminId, requestId],
        type: QueryTypes.UPDATE,
        transaction
      }
    );

    await transaction.commit();

    console.log('✅ Reseller upgrade approved for user:', request.user_id);

    res.status(200).json({
      status: 'success',
      message: 'Reseller upgrade approved successfully',
      data: {
        userId: request.user_id,
        resellerCode,
        email: request.email
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Approve upgrade error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to approve upgrade request',
      error: error.message
    });
  }
});

// @route   POST /api/admin/reseller-upgrade-requests/:id/reject
// @desc    Reject reseller upgrade request
// @access  Private (Admin only)
router.post('/reseller-upgrade-requests/:id/reject', authMiddleware, async (req, res) => {
  console.log('=== Rejecting Reseller Upgrade Request ===');

  try {
    // Verify admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Admin access required',
      });
    }

    const requestId = req.params.id;
    const adminId = req.user.id;
    const { rejectionReason } = req.body;

    // Get the upgrade request
    const [request] = await sequelize.query(
      'SELECT id, user_id, status FROM reseller_upgrade_requests WHERE id = ?',
      {
        replacements: [requestId],
        type: QueryTypes.SELECT
      }
    );

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Upgrade request not found',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: `Request already ${request.status}`,
      });
    }

    // Update request status
    await sequelize.query(
      `UPDATE reseller_upgrade_requests 
       SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), 
           rejection_reason = ?, updated_at = NOW()
       WHERE id = ?`,
      {
        replacements: [adminId, rejectionReason || 'Not approved', requestId],
        type: QueryTypes.UPDATE
      }
    );

    console.log('✅ Reseller upgrade rejected for request:', requestId);

    res.status(200).json({
      status: 'success',
      message: 'Reseller upgrade request rejected',
    });

  } catch (error) {
    console.error('Reject upgrade error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject upgrade request',
      error: error.message
    });
  }
});

module.exports = router;
