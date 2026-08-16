const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../../middleware/auth');
const { sequelize } = require('../../models');
const { QueryTypes } = require('sequelize');

// @route   GET /api/admin/manufacturers
// @desc    Get all manufacturers with filtering
// @access  Private (Admin)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20, search = '' } = req.query;
    const offset = (Number.parseInt(page) - 1) * Number.parseInt(limit);

    let statusFilter = '';
    let searchFilter = '';
    const replacements = { limit: Number.parseInt(limit), offset };

    if (status !== 'all') {
      statusFilter = 'AND m.approvalStatus = :status';
      replacements.status = status;
    }

    if (search) {
      searchFilter = 'AND (m.companyName LIKE :search OR m.brandName LIKE :search OR u.email LIKE :search)';
      replacements.search = `%${search}%`;
    }

    const manufacturers = await sequelize.query(`
      SELECT 
        m.*,
        u.email,
        u.mobile as phoneNumber,
        u.is_active as isActive,
        m.contact_person as contactPerson,
        COUNT(DISTINCT p.id) as productCount,
        COALESCE(SUM(oi.manufacturer_amount), 0) as totalSales
      FROM manufacturers m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN products p ON m.id = p.manufacturer_id AND p.deleted_at IS NULL
      LEFT JOIN order_items oi ON p.id = oi.product_id
      WHERE 1=1 ${statusFilter} ${searchFilter}
      GROUP BY m.id
      ORDER BY m.created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    const totalResult = await sequelize.query(`
      SELECT COUNT(DISTINCT m.id) as total
      FROM manufacturers m
      JOIN users u ON m.user_id = u.id
      WHERE 1=1 ${statusFilter} ${searchFilter}
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        manufacturers,
        pagination: {
          total: Number.parseInt(totalResult[0]?.total || 0),
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          totalPages: Math.ceil((totalResult[0]?.total || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Manufacturers fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch manufacturers',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/manufacturers/:id
// @desc    Get manufacturer details
// @access  Private (Admin)
router.get('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await sequelize.query(`
      SELECT 
        m.*,
        u.email,
        u.mobile as phoneNumber,
        m.contact_person as contactPerson,
        m.is_active as isActive,
        m.suspension_reason as suspensionReason,
        COUNT(DISTINCT p.id) as productCount,
        COALESCE(SUM(oi.manufacturer_amount), 0) as totalSales,
        COALESCE(SUM(CASE WHEN s.status = 'pending' THEN s.amount ELSE 0 END), 0) as pendingSettlements,
        COALESCE(SUM(CASE WHEN s.status = 'paid' THEN s.amount ELSE 0 END), 0) as paidSettlements
      FROM manufacturers m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN products p ON m.id = p.manufacturer_id AND p.deleted_at IS NULL
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN settlements s ON m.id = s.manufacturer_id
      WHERE m.id = :id
      GROUP BY m.id
    `, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    const manufacturer = result[0];

    if (!manufacturer) {
      return res.status(404).json({
        status: 'error',
        message: 'Manufacturer not found',
      });
    }

    res.json({
      status: 'success',
      data: manufacturer,
    });
  } catch (error) {
    console.error('Manufacturer details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch manufacturer details',
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/manufacturers/:id/approve
// @desc    Approve a manufacturer
// @access  Private (Admin)
router.put('/:id/approve', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    await sequelize.query(`
      UPDATE manufacturers 
      SET approval_status = 'approved',
          approved_by = :adminId,
          approved_at = NOW(),
          updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: { id, remarks, adminId: req.user.id },
      type: QueryTypes.UPDATE
    });

    res.json({
      status: 'success',
      message: 'Manufacturer approved successfully',
    });
  } catch (error) {
    console.error('Manufacturer approval error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to approve manufacturer',
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/manufacturers/:id/reject
// @desc    Reject a manufacturer
// @access  Private (Admin)
router.put('/:id/reject', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { remarks } = req.body;

    await sequelize.query(`
      UPDATE manufacturers 
      SET approval_status = 'rejected',
          rejection_reason = :remarks,
          updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: { id, remarks, adminId: req.user.id },
      type: QueryTypes.UPDATE
    });

    res.json({
      status: 'success',
      message: 'Manufacturer rejected successfully',
    });
  } catch (error) {
    console.error('Manufacturer rejection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject manufacturer',
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/manufacturers/:id/suspend
// @desc    Suspend a manufacturer
// @access  Private (Admin)
router.put('/:id/suspend', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Update manufacturer to suspended status (is_active = 0)
    await sequelize.query(`
      UPDATE manufacturers 
      SET is_active = 0,
          suspension_reason = :reason,
          updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: { id, reason },
      type: QueryTypes.UPDATE
    });

    // Also update associated user account
    await sequelize.query(`
      UPDATE users
      SET is_active = 0,
          updated_at = NOW()
      WHERE id = (SELECT user_id FROM manufacturers WHERE id = :id)
    `, {
      replacements: { id },
      type: QueryTypes.UPDATE
    });

    res.json({
      status: 'success',
      message: 'Manufacturer suspended successfully',
    });
  } catch (error) {
    console.error('Manufacturer suspension error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to suspend manufacturer',
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/manufacturers/:id/activate
// @desc    Activate a suspended manufacturer
// @access  Private (Admin)
router.put('/:id/activate', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // Update manufacturer to active status (is_active = 1)
    await sequelize.query(`
      UPDATE manufacturers 
      SET is_active = 1,
          suspension_reason = NULL,
          updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: { id },
      type: QueryTypes.UPDATE
    });

    // Also activate associated user account
    await sequelize.query(`
      UPDATE users
      SET is_active = 1,
          updated_at = NOW()
      WHERE id = (SELECT user_id FROM manufacturers WHERE id = :id)
    `, {
      replacements: { id },
      type: QueryTypes.UPDATE
    });

    res.json({
      status: 'success',
      message: 'Manufacturer activated successfully',
    });
  } catch (error) {
    console.error('Manufacturer activation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to activate manufacturer',
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/manufacturers/:id
// @desc    Update manufacturer details
// @access  Private (Admin)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build SET clause dynamically
    const allowedFields = {
      'companyName': 'company_name',
      'brandName': 'brand_name',
      'contactPerson': 'contact_person',
      'businessType': 'business_type',
      'gstNumber': 'gst_number',
      'panNumber': 'pan_number',
      'address': 'address',
      'city': 'city',
      'state': 'state',
      'pincode': 'pincode',
      'bankAccountHolder': 'bank_account_holder',
      'bankAccountNumber': 'bank_account_number',
      'bankIfscCode': 'bank_ifsc_code',
      'bankName': 'bank_name',
      'upiId': 'upi_id',
    };
    
    const setClauses = [];
    const replacements = { id };

    Object.keys(updates).forEach(key => {
      if (allowedFields[key] && updates[key] !== undefined) {
        const dbColumn = allowedFields[key];
        setClauses.push(`${dbColumn} = :${key}`);
        replacements[key] = updates[key];
      }
    });

    if (setClauses.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No valid fields to update',
      });
    }

    await sequelize.query(`
      UPDATE manufacturers 
      SET ${setClauses.join(', ')},
          updated_at = NOW()
      WHERE id = :id
    `, {
      replacements,
      type: QueryTypes.UPDATE
    });

    res.json({
      status: 'success',
      message: 'Manufacturer updated successfully',
    });
  } catch (error) {
    console.error('Manufacturer update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update manufacturer',
      error: error.message,
    });
  }
});

module.exports = router;
