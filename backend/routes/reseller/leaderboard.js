const express = require('express');
const router = express.Router();
const { sequelize } = require('../../models');

// @route   GET /api/reseller/leaderboard
// @desc    Get reseller leaderboard (monthly and all-time)
// @access  Private (Reseller only)
router.get('/', async (req, res) => {
  try {
    const { period = 'all' } = req.query; // 'monthly' or 'all'
    const userId = req.user.id;

    // Get actual reseller_id from user_id
    const resellerResult = await sequelize.query(`
      SELECT id FROM resellers WHERE user_id = :userId
    `, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!resellerResult || resellerResult.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Reseller not found'
      });
    }

    const currentResellerId = resellerResult[0].id;

    // Build date condition for monthly leaderboard
    const dateCondition = period === 'monthly'
      ? `AND DATE_FORMAT(o.created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')`
      : '';

    // Get leaderboard data
    const leaderboard = await sequelize.query(`
      SELECT 
        r.id,
        r.reseller_code,
        r.full_name,
        u.email,
        r.profile_photo_url,
        r.created_at as joined_date,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.final_amount), 0) as total_sales,
        COALESCE(SUM(oi.reseller_commission), 0) as total_earnings,
        COALESCE(AVG(oi.reseller_commission), 0) as avg_commission_per_order,
        (SELECT COUNT(*) FROM referral_clicks WHERE reseller_id = r.id ${dateCondition}) as total_clicks
      FROM resellers r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN orders o ON r.id = o.reseller_id 
        AND o.order_status NOT IN ('cancelled', 'returned')
        ${dateCondition}
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE u.is_active = 1 AND u.status = 'approved'
      GROUP BY r.id, r.reseller_code, r.full_name, u.email, r.profile_photo_url, r.created_at
      HAVING total_earnings > 0
      ORDER BY total_earnings DESC, total_sales DESC
      LIMIT 100
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    // Add rankings
    const rankedLeaderboard = leaderboard.map((reseller, index) => ({
      rank: index + 1,
      id: reseller.id,
      reseller_code: reseller.reseller_code,
      full_name: reseller.full_name,
      email: reseller.email,
      profile_photo: reseller.profile_photo_url,
      joined_date: reseller.joined_date,
      total_orders: Number.parseInt(reseller.total_orders, 10) || 0,
      total_sales: Number.parseFloat(reseller.total_sales || 0),
      total_earnings: Number.parseFloat(reseller.total_earnings || 0),
      avg_commission_per_order: Number.parseFloat(reseller.avg_commission_per_order || 0),
      total_clicks: Number.parseInt(reseller.total_clicks, 10) || 0,
      is_current_user: reseller.id === currentResellerId
    }));

    // Find current user's position
    const currentUserRank = rankedLeaderboard.find(r => r.is_current_user);
    
    // If current user is not in top 100, get their position separately
    let currentUserPosition = null;
    if (!currentUserRank) {
      const [userStats] = await sequelize.query(`
        SELECT 
          r.id,
          r.reseller_code,
          r.full_name,
          u.email,
          r.profile_photo_url,
          COUNT(DISTINCT o.id) as total_orders,
          COALESCE(SUM(o.final_amount), 0) as total_sales,
          COALESCE(SUM(oi.reseller_commission), 0) as total_earnings,
          COALESCE(AVG(oi.reseller_commission), 0) as avg_commission_per_order,
          (SELECT COUNT(*) FROM referral_clicks WHERE reseller_id = r.id ${dateCondition}) as total_clicks,
          (
            SELECT COUNT(*) + 1
            FROM (
              SELECT o2.reseller_id, COALESCE(SUM(oi2.reseller_commission), 0) as earnings
              FROM orders o2
              JOIN order_items oi2 ON o2.id = oi2.order_id
              WHERE o2.order_status NOT IN ('cancelled', 'returned')
              ${dateCondition}
              GROUP BY o2.reseller_id
              HAVING earnings > COALESCE((
                SELECT SUM(oi3.reseller_commission)
                FROM orders o3
                JOIN order_items oi3 ON o3.id = oi3.order_id
                WHERE o3.reseller_id = :currentResellerId
                AND o3.order_status NOT IN ('cancelled', 'returned')
                ${dateCondition}
              ), 0)
            ) as ranked
          ) as user_rank
        FROM resellers r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN orders o ON r.id = o.reseller_id 
          AND o.order_status NOT IN ('cancelled', 'returned')
          ${dateCondition}
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE r.id = :currentResellerId
        GROUP BY r.id, r.reseller_code, r.full_name, u.email, r.profile_photo_url
      `, {
        replacements: { currentResellerId },
        type: sequelize.QueryTypes.SELECT
      });

      if (userStats) {
        currentUserPosition = {
          rank: Number.parseInt(userStats.user_rank, 10) || 0,
          id: userStats.id,
          reseller_code: userStats.reseller_code,
          full_name: userStats.full_name,
          email: userStats.email,
          profile_photo: userStats.profile_photo_url,
          total_orders: Number.parseInt(userStats.total_orders, 10) || 0,
          total_sales: Number.parseFloat(userStats.total_sales || 0),
          total_earnings: Number.parseFloat(userStats.total_earnings || 0),
          avg_commission_per_order: Number.parseFloat(userStats.avg_commission_per_order || 0),
          total_clicks: Number.parseInt(userStats.total_clicks, 10) || 0,
          is_current_user: true
        };
      }
    }

    // Get top 3 for highlights
    const topThree = rankedLeaderboard.slice(0, 3);

    res.json({
      status: 'success',
      data: {
        period,
        leaderboard: rankedLeaderboard,
        top_three: topThree,
        current_user_position: currentUserRank || currentUserPosition,
        total_resellers: rankedLeaderboard.length
      }
    });

  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch leaderboard',
      error: error.message
    });
  }
});

module.exports = router;
