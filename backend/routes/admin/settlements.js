const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../../middleware/auth');
const { sequelize } = require('../../models');
const { QueryTypes } = require('sequelize');

// @route   GET /api/admin/settlements
// @desc    Get all manufacturer settlements
// @access  Private (Admin)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let statusFilter = '';
    let searchFilter = '';
    const replacements = { limit: parseInt(limit), offset };

    if (status !== 'all') {
      statusFilter = 'AND s.status = :status';
      replacements.status = status;
    }

    if (search) {
      searchFilter = 'AND (m.company_name LIKE :search OR m.brand_name LIKE :search OR u.email LIKE :search)';
      replacements.search = `%${search}%`;
    }

    const settlements = await sequelize.query(`
      SELECT 
        s.settlementId,
        s.manufacturerId,
        s.startDate,
        s.endDate,
        s.totalOrderValue as grossSales,
        s.platformFeeAmount as platformFee,
        s.amount as netPayable,
        s.orderCount,
        s.status,
        s.transactionId,
        s.transactionDetails,
        s.paidAt,
        s.createdAt,
        m.company_name as manufacturerName,
        m.brand_name as brandName,
        u.email as manufacturerEmail,
        u.mobile as manufacturerPhone
      FROM settlements s
      JOIN manufacturers m ON s.manufacturerId = m.id
      JOIN users u ON m.user_id = u.id
      WHERE 1=1 ${statusFilter} ${searchFilter}
      ORDER BY s.createdAt DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    const totalResult = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM settlements s
      JOIN manufacturers m ON s.manufacturerId = m.id
      JOIN users u ON m.user_id = u.id
      WHERE 1=1 ${statusFilter} ${searchFilter}
    `, {
      replacements: status !== 'all' || search ? { 
        ...(status !== 'all' && { status }), 
        ...(search && { search: `%${search}%` }) 
      } : {},
      type: QueryTypes.SELECT
    });

    // Get stats
    const statsResult = await sequelize.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pendingAmount,
        COALESCE(SUM(CASE WHEN MONTH(createdAt) = MONTH(CURDATE()) AND YEAR(createdAt) = YEAR(CURDATE()) THEN amount ELSE 0 END), 0) as settlementsThisMonth,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) as totalSettled
      FROM settlements
    `, {
      type: QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        settlements,
        pagination: {
          total: parseInt(totalResult[0]?.total || 0),
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil((totalResult[0]?.total || 0) / limit),
        },
        stats: statsResult[0] || { pendingAmount: 0, settlementsThisMonth: 0, totalSettled: 0 },
      },
    });
  } catch (error) {
    console.error('Settlements fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch settlements',
      error: error.message,
    });
  }
});

// @route   POST /api/admin/settlements/process
// @desc    Process settlement for a manufacturer
// @access  Private (Admin)
router.post('/process', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { manufacturerId, startDate, endDate } = req.body;

    if (!manufacturerId || !startDate || !endDate) {
      return res.status(400).json({
        status: 'error',
        message: 'Manufacturer ID, start date, and end date are required',
      });
    }

    // Calculate settlement amount from delivered orders
    const settlementData = await sequelize.query(`
      SELECT 
        SUM(oi.item_total) as totalOrderValue,
        SUM(oi.platform_fee) as platformFeeAmount,
        SUM(oi.manufacturer_amount) as netPayable,
        COUNT(DISTINCT o.id) as orderCount
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.manufacturer_id = :manufacturerId
        AND o.order_status = 'delivered'
        AND o.ordered_at BETWEEN :startDate AND :endDate
    `, {
      replacements: { manufacturerId, startDate, endDate },
      type: QueryTypes.SELECT
    });

    const data = settlementData[0];

    if (!data || !data.netPayable || data.netPayable <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No delivered orders found for settlement in this period',
      });
    }

    // Create settlement record
    const result = await sequelize.query(`
      INSERT INTO settlements (
        manufacturerId,
        startDate,
        endDate,
        totalOrderValue,
        platformFeeAmount,
        amount,
        orderCount,
        status,
        paidBy,
        createdAt,
        updatedAt
      ) VALUES (
        :manufacturerId,
        :startDate,
        :endDate,
        :totalOrderValue,
        :platformFeeAmount,
        :amount,
        :orderCount,
        'pending',
        :adminId,
        NOW(),
        NOW()
      )
    `, {
      replacements: {
        manufacturerId,
        startDate,
        endDate,
        totalOrderValue: data.totalOrderValue || 0,
        platformFeeAmount: data.platformFeeAmount || 0,
        amount: data.netPayable || 0,
        orderCount: data.orderCount || 0,
        adminId: req.user.id,
      },
      type: QueryTypes.INSERT
    });

    res.json({
      status: 'success',
      message: 'Settlement processed successfully',
      data: {
        settlementId: result[0],
        grossSales: data.totalOrderValue,
        platformFee: data.platformFeeAmount,
        netPayable: data.netPayable,
        orderCount: data.orderCount,
      },
    });
  } catch (error) {
    console.error('Settlement processing error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process settlement',
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/settlements/:id/mark-paid
// @desc    Mark settlement as paid
// @access  Private (Admin)
router.put('/:id/mark-paid', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, paymentMethod = 'bank_transfer', transactionDetails } = req.body;

    const result = await sequelize.query(`
      UPDATE settlements 
      SET status = 'paid',
          transactionId = :transactionId,
          transactionDetails = :transactionDetails,
          paidBy = :adminId,
          paidAt = NOW(),
          updatedAt = NOW()
      WHERE settlementId = :id AND status = 'pending'
    `, {
      replacements: { 
        id, 
        transactionId: transactionId || `TXN${Date.now()}`,
        transactionDetails: transactionDetails || '',
        adminId: req.user.id 
      },
      type: QueryTypes.UPDATE
    });

    if (result[1] === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Settlement not found or already paid',
      });
    }

    res.json({
      status: 'success',
      message: 'Settlement marked as paid successfully',
    });
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to mark settlement as paid',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/settlements/manufacturer/:id
// @desc    Get settlement history for a manufacturer
// @access  Private (Admin)
router.get('/manufacturer/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const settlements = await sequelize.query(`
      SELECT 
        s.*,
        m.company_name as companyName,
        m.brand_name as brandName
      FROM settlements s
      JOIN manufacturers m ON s.manufacturerId = m.id
      WHERE s.manufacturerId = :id
      ORDER BY s.createdAt DESC
    `, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: settlements,
    });
  } catch (error) {
    console.error('Settlement history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch settlement history',
      error: error.message,
    });
  }
});

module.exports = router;
