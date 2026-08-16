const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const sequelize = require('../../config/database');
const { QueryTypes } = require('sequelize');

// @route   GET /api/customer/check-access
// @desc    Check if user has access to customer portal
// @access  Private
router.get('/check-access', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log('[Customer Access] Checking access for user:', userId, 'role:', userRole);

    // Customers always have access
    if (userRole === 'customer') {
      return res.status(200).json({
        status: 'success',
        hasAccess: true,
        reason: 'customer'
      });
    }

    // Resellers have access only if they have a customer record
    // (meaning they were upgraded from customer)
    if (userRole === 'reseller') {
      const [customer] = await sequelize.query(
        'SELECT id FROM customers WHERE user_id = ?',
        {
          replacements: [userId],
          type: QueryTypes.SELECT
        }
      );

      const hasAccess = !!customer;
      
      console.log('[Customer Access] Reseller has customer record:', hasAccess);

      return res.status(200).json({
        status: 'success',
        hasAccess,
        reason: hasAccess ? 'upgraded_from_customer' : 'direct_reseller'
      });
    }

    // All other roles don't have access
    return res.status(200).json({
      status: 'success',
      hasAccess: false,
      reason: 'wrong_role'
    });

  } catch (error) {
    console.error('[Customer Access] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to check access',
      error: error.message
    });
  }
});

module.exports = router;
