const express = require('express');
const router = express.Router();
const { sequelize } = require('../../models');

// @route   GET /api/reseller/earnings/summary
// @desc    Get earnings summary by period
// @access  Private (Reseller only)
router.get('/summary', async (req, res) => {
  try {
    const resellerId = req.user.id;
    const { period = 'month' } = req.query;

    let dateFilter = '';
    switch (period) {
      case 'today':
        dateFilter = 'DATE(wt.created_at) = CURDATE()';
        break;
      case 'week':
        dateFilter = 'wt.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        break;
      case 'month':
        dateFilter = 'wt.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        break;
      case 'all':
        dateFilter = '1=1';
        break;
      default:
        dateFilter = 'wt.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    }

    const [summary] = await sequelize.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN ${dateFilter} THEN wt.amount ELSE 0 END), 0) as period_earnings,
        COALESCE((SELECT SUM(amount) FROM wallet_transactions WHERE reseller_id = :resellerId AND transaction_type = 'credit'), 0) as lifetime_earnings
      FROM wallet_transactions wt
      WHERE wt.reseller_id = :resellerId
      AND wt.transaction_type = 'credit'
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        period,
        period_earnings: parseFloat(summary.period_earnings) || 0,
        lifetime_earnings: parseFloat(summary.lifetime_earnings) || 0
      }
    });

  } catch (error) {
    console.error('Earnings summary error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch earnings summary',
      error: error.message
    });
  }
});

// @route   GET /api/reseller/earnings/by-product
// @desc    Get earnings breakdown by product
// @access  Private (Reseller only)
router.get('/by-product', async (req, res) => {
  try {
    const resellerId = req.user.id;
    const { limit = 10 } = req.query;

    const productEarnings = await sequelize.query(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        COUNT(DISTINCT o.id) as order_count,
        COALESCE(SUM(oi.reseller_commission), 0) as total_commission,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) as product_image
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.reseller_id = :resellerId
      AND o.order_status != 'cancelled'
      GROUP BY p.id, p.name
      ORDER BY total_commission DESC
      LIMIT :limit
    `, {
      replacements: { resellerId, limit: parseInt(limit) },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: productEarnings.map(pe => ({
        ...pe,
        total_commission: parseFloat(pe.total_commission) || 0
      }))
    });

  } catch (error) {
    console.error('Product earnings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product earnings',
      error: error.message
    });
  }
});

// @route   GET /api/reseller/earnings/transactions
// @desc    Get commission transaction logs
// @access  Private (Reseller only)
router.get('/transactions', async (req, res) => {
  try {
    const resellerId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const transactions = await sequelize.query(`
      SELECT 
        cl.id,
        cl.amount,
        cl.status,
        cl.created_at,
        cl.cleared_at,
        o.order_number,
        o.total_amount as order_value
      FROM commission_logs cl
      JOIN orders o ON cl.order_id = o.id
      WHERE cl.reseller_id = :resellerId
      ORDER BY cl.created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { resellerId, limit: parseInt(limit), offset },
      type: sequelize.QueryTypes.SELECT
    });

    // Get total count
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM commission_logs
      WHERE reseller_id = :resellerId
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    const total = parseInt(countResult.total);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      status: 'success',
      data: {
        transactions: transactions.map(t => ({
          ...t,
          amount: parseFloat(t.amount),
          order_value: parseFloat(t.order_value)
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      }
    });

  } catch (error) {
    console.error('Commission transactions error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch commission transactions',
      error: error.message
    });
  }
});

module.exports = router;
