const express = require('express');
const router = express.Router();
const { sequelize } = require('../../models');

// @route   GET /api/reseller/dashboard/stats
// @desc    Get dashboard statistics for reseller
// @access  Private (Reseller only)
router.get('/stats', async (req, res) => {
  try {
    const resellerId = req.user.id;

    // Get wallet balance
    const [walletResult] = await sequelize.query(`
      SELECT 
        COALESCE(current_balance, 0) as current_balance,
        COALESCE(pending_balance, 0) as pending_balance,
        COALESCE(total_earned, 0) as total_earned,
        COALESCE(total_withdrawn, 0) as total_withdrawn
      FROM wallets
      WHERE reseller_id = :resellerId
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    const wallet = walletResult || {
      current_balance: 0,
      pending_balance: 0,
      total_earned: 0,
      total_withdrawn: 0
    };

    // Get total orders count
    const [ordersResult] = await sequelize.query(`
      SELECT COUNT(*) as total_orders
      FROM orders
      WHERE reseller_id = :resellerId
      AND order_status != 'cancelled'
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    // Get total sales value
    const [salesResult] = await sequelize.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total_sales
      FROM orders
      WHERE reseller_id = :resellerId
      AND order_status != 'cancelled'
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    // Get total clicks
    const [clicksResult] = await sequelize.query(`
      SELECT COUNT(*) as total_clicks
      FROM referral_clicks
      WHERE reseller_id = :resellerId
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    // Get conversion rate
    const totalOrders = parseInt(ordersResult.total_orders) || 0;
    const totalClicks = parseInt(clicksResult.total_clicks) || 0;
    const conversionRate = totalClicks > 0 ? ((totalOrders / totalClicks) * 100).toFixed(2) : 0;

    // Get average commission per order (Product Profit)
    const avgCommissionPerOrder = totalOrders > 0 
      ? (parseFloat(wallet.total_earned) / totalOrders).toFixed(2)
      : 0;

    // Get today's earnings
    const [todayEarningsResult] = await sequelize.query(`
      SELECT COALESCE(SUM(amount), 0) as today_earnings
      FROM wallet_transactions
      WHERE reseller_id = :resellerId
      AND transaction_type = 'credit'
      AND DATE(created_at) = CURDATE()
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    // Get this month's earnings
    const [monthEarningsResult] = await sequelize.query(`
      SELECT COALESCE(SUM(amount), 0) as month_earnings
      FROM wallet_transactions
      WHERE reseller_id = :resellerId
      AND transaction_type = 'credit'
      AND MONTH(created_at) = MONTH(CURDATE())
      AND YEAR(created_at) = YEAR(CURDATE())
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    // Get total referrals (users sponsored by this reseller)
    const [referralsResult] = await sequelize.query(`
      SELECT COUNT(*) as total_referrals
      FROM resellers
      WHERE sponsor_id = :resellerId
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    // Get recent orders (last 10)
    const recentOrders = await sequelize.query(`
      SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.order_status,
        o.created_at,
        COALESCE(SUM(oi.reseller_commission), 0) as commission_earned,
        (
          SELECT GROUP_CONCAT(p.name SEPARATOR ', ')
          FROM order_items oi2
          JOIN products p ON oi2.product_id = p.id
          WHERE oi2.order_id = o.id
          LIMIT 3
        ) as products
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.reseller_id = :resellerId
      GROUP BY o.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    // Get earnings trend (last 30 days)
    const earningsTrend = await sequelize.query(`
      SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(amount), 0) as earnings
      FROM wallet_transactions
      WHERE reseller_id = :resellerId
      AND transaction_type = 'credit'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        stats: {
          totalEarnings: parseFloat(wallet.total_earned) || 0,
          pendingEarnings: parseFloat(wallet.pending_balance) || 0,
          availableBalance: parseFloat(wallet.current_balance) || 0,
          withdrawnAmount: parseFloat(wallet.total_withdrawn) || 0,
          todayEarnings: parseFloat(todayEarningsResult.today_earnings) || 0,
          monthEarnings: parseFloat(monthEarningsResult.month_earnings) || 0,
          totalOrders: totalOrders,
          totalSalesValue: parseFloat(salesResult.total_sales) || 0,
          totalClicks: totalClicks,
          conversionRate: parseFloat(conversionRate),
          avgCommissionPerOrder: parseFloat(avgCommissionPerOrder),
          totalReferrals: parseInt(referralsResult.total_referrals) || 0
        },
        recentOrders,
        earningsTrend
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
});

module.exports = router;
