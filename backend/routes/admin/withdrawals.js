const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../../middleware/auth');
const { sequelize } = require('../../models');
const { QueryTypes } = require('sequelize');

// @route   GET /api/admin/withdrawals
// @desc    Get all withdrawal requests
// @access  Private (Admin)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    const offset = (Number.parseInt(page) - 1) * Number.parseInt(limit);

    let statusFilter = '';
    if (status !== 'all') {
      statusFilter = 'AND w.status = :status';
    }

    const withdrawals = await sequelize.query(`
      SELECT 
        w.*,
        u.email as resellerEmail,
        u.mobile as resellerPhone,
        r.full_name as resellerName,
        r.reseller_code as resellerCode
      FROM withdrawals w
      JOIN users u ON w.userId = u.id
      LEFT JOIN resellers r ON u.id = r.user_id
      WHERE 1=1 ${statusFilter}
      ORDER BY w.createdAt DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { status, limit: Number.parseInt(limit), offset },
      type: QueryTypes.SELECT
    });

    const totalResult = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM withdrawals w
      WHERE 1=1 ${statusFilter}
    `, {
      replacements: { status },
      type: QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        withdrawals,
        pagination: {
          total: Number.parseInt(totalResult[0]?.total || 0),
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          totalPages: Math.ceil((totalResult[0]?.total || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Withdrawals fetch error:', error);
    
    // Handle case when table doesn't exist yet
    if (error.message?.includes('doesn\'t exist') || error.code === 'ER_NO_SUCH_TABLE') {
      return res.json({
        status: 'success',
        data: {
          withdrawals: [],
          pagination: {
            total: 0,
            page: Number.parseInt(page),
            limit: Number.parseInt(limit),
            totalPages: 0,
          },
        },
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch withdrawals',
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/withdrawals/:id/approve
// @desc    Approve a withdrawal request
// @access  Private (Admin)
router.put('/:id/approve', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, remarks } = req.body;

    await sequelize.query(`
      UPDATE withdrawals 
      SET status = 'approved',
          transactionId = :transactionId,
          remarks = :remarks,
          approvedBy = :adminId,
          approvedAt = NOW(),
          updatedAt = NOW()
      WHERE withdrawalId = :id AND status = 'pending'
    `, {
      replacements: { id, transactionId, remarks, adminId: req.user.id },
      type: QueryTypes.UPDATE
    });

    res.json({
      status: 'success',
      message: 'Withdrawal approved successfully',
    });
  } catch (error) {
    console.error('Withdrawal approval error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to approve withdrawal',
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/withdrawals/:id/reject
// @desc    Reject a withdrawal request
// @access  Private (Admin)
router.put('/:id/reject', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    await sequelize.query(`
      UPDATE withdrawals 
      SET status = 'rejected',
          remarks = :remarks,
          approvedBy = :adminId,
          rejectedAt = NOW(),
          updatedAt = NOW()
      WHERE withdrawalId = :id AND status = 'pending'
    `, {
      replacements: { id, remarks, adminId: req.user.id },
      type: QueryTypes.UPDATE
    });

    res.json({
      status: 'success',
      message: 'Withdrawal rejected successfully',
    });
  } catch (error) {
    console.error('Withdrawal rejection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject withdrawal',
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/withdrawals/:id/mark-paid
// @desc    Mark withdrawal as paid
// @access  Private (Admin)
router.put('/:id/mark-paid', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, remarks } = req.body;

    await sequelize.query(`
      UPDATE withdrawals 
      SET status = 'paid',
          transactionId = :transactionId,
          remarks = :remarks,
          paidAt = NOW(),
          updatedAt = NOW()
      WHERE withdrawalId = :id AND status = 'approved'
    `, {
      replacements: { id, transactionId, remarks },
      type: QueryTypes.UPDATE
    });

    res.json({
      status: 'success',
      message: 'Withdrawal marked as paid successfully',
    });
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark withdrawal as paid',
      error: error.message,
    });
  }
});

module.exports = router;
