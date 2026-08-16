const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../../middleware/auth');
const { sequelize } = require('../../models');
const { QueryTypes } = require('sequelize');

// @route   GET /api/admin/referrals
// @desc    Get all referrals with stats
// @access  Private (Admin)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let searchFilter = '';
    const replacements = { limit: parseInt(limit), offset };

    if (search) {
      searchFilter = `AND (sponsor.full_name LIKE :search OR referral.full_name LIKE :search OR sponsor_user.email LIKE :search OR referral_user.email LIKE :search)`;
      replacements.search = `%${search}%`;
    }

    // Get referral relationships with stats
    const referrals = await sequelize.query(`
      SELECT 
        referral.id as resellerId,
        referral.full_name as referralName,
        referral_user.email as referralEmail,
        referral_user.mobile as referralMobile,
        referral.reseller_code as referralCode,
        referral.sponsor_id as sponsorId,
        sponsor.full_name as sponsorName,
        sponsor_user.email as sponsorEmail,
        sponsor.reseller_code as sponsorCode,
        referral.total_earnings as referralEarnings,
        referral.total_sales as referralSales,
        COALESCE(SUM(o.total_amount), 0) as referralRevenue,
        COUNT(DISTINCT o.id) as referralOrders,
        referral.created_at as joinedDate
      FROM resellers referral
      JOIN users referral_user ON referral.user_id = referral_user.id
      LEFT JOIN resellers sponsor ON referral.sponsor_id = sponsor.id
      LEFT JOIN users sponsor_user ON sponsor.user_id = sponsor_user.id
      LEFT JOIN orders o ON referral.id = o.reseller_id
      WHERE referral.sponsor_id IS NOT NULL ${searchFilter}
      GROUP BY referral.id, sponsor.id
      ORDER BY referral.created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    // Get total count
    const totalResult = await sequelize.query(`
      SELECT COUNT(DISTINCT referral.id) as total
      FROM resellers referral
      LEFT JOIN resellers sponsor ON referral.sponsor_id = sponsor.id
      LEFT JOIN users sponsor_user ON sponsor.user_id = sponsor_user.id
      LEFT JOIN users referral_user ON referral.user_id = referral_user.id
      WHERE referral.sponsor_id IS NOT NULL ${searchFilter}
    `, {
      replacements: search ? { search: `%${search}%` } : {},
      type: QueryTypes.SELECT
    });

    // Get overall stats
    const statsResult = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT referral.id) as totalReferrals,
        COUNT(DISTINCT sponsor.id) as activeSponsors,
        COALESCE(SUM(o.total_amount), 0) as totalReferralRevenue,
        COALESCE(SUM(referral.total_earnings), 0) as totalReferralEarnings
      FROM resellers referral
      LEFT JOIN resellers sponsor ON referral.sponsor_id = sponsor.id
      LEFT JOIN orders o ON referral.id = o.reseller_id
      WHERE referral.sponsor_id IS NOT NULL
    `, {
      type: QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        referrals,
        pagination: {
          total: parseInt(totalResult[0]?.total || 0),
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil((totalResult[0]?.total || 0) / limit),
        },
        stats: statsResult[0] || {
          totalReferrals: 0,
          activeSponsors: 0,
          totalReferralRevenue: 0,
          totalReferralEarnings: 0,
        },
      },
    });
  } catch (error) {
    console.error('Referrals fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch referrals',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/referrals/tree/:id
// @desc    Get complete referral tree for a sponsor
// @access  Private (Admin)
router.get('/tree/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // Get sponsor details
    const sponsor = await sequelize.query(`
      SELECT 
        r.id,
        r.full_name,
        r.reseller_code,
        u.email,
        u.mobile,
        r.total_earnings,
        r.total_sales
      FROM resellers r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = :id
    `, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    if (!sponsor || sponsor.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Sponsor not found',
      });
    }

    // Get direct referrals (Level 1)
    const level1 = await sequelize.query(`
      SELECT 
        r.id,
        r.full_name,
        r.reseller_code,
        u.email,
        u.mobile,
        r.total_earnings,
        r.total_sales,
        (SELECT COUNT(*) FROM resellers r2 WHERE r2.sponsor_id = r.id) as referralCount,
        COALESCE(SUM(o.total_amount), 0) as revenue,
        COUNT(DISTINCT o.id) as orderCount
      FROM resellers r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN orders o ON r.id = o.reseller_id
      WHERE r.sponsor_id = :id
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    // Get second level referrals (Level 2) for each Level 1
    const tree = {
      sponsor: sponsor[0],
      referrals: []
    };

    for (const referral of level1) {
      const level2 = await sequelize.query(`
        SELECT 
          r.id,
          r.full_name,
          r.reseller_code,
          u.email,
          u.mobile,
          r.total_earnings,
          r.total_sales,
          (SELECT COUNT(*) FROM resellers r2 WHERE r2.sponsor_id = r.id) as referralCount,
          COALESCE(SUM(o.total_amount), 0) as revenue,
          COUNT(DISTINCT o.id) as orderCount
        FROM resellers r
        JOIN users u ON r.user_id = u.id
        LEFT JOIN orders o ON r.id = o.reseller_id
        WHERE r.sponsor_id = :sponsorId
        GROUP BY r.id
        ORDER BY r.created_at DESC
      `, {
        replacements: { sponsorId: referral.id },
        type: QueryTypes.SELECT
      });

      tree.referrals.push({
        ...referral,
        subReferrals: level2
      });
    }

    res.json({
      status: 'success',
      data: tree,
    });
  } catch (error) {
    console.error('Referral tree fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch referral tree',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/referrals/top-sponsors
// @desc    Get top sponsors by referral count
// @access  Private (Admin)
router.get('/top-sponsors', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const topSponsors = await sequelize.query(`
      SELECT 
        sponsor.id,
        sponsor.full_name as sponsorName,
        sponsor.reseller_code,
        u.email,
        u.mobile,
        COUNT(DISTINCT referral.id) as totalReferrals,
        COALESCE(SUM(o.total_amount), 0) as totalRevenue,
        COALESCE(SUM(referral.total_earnings), 0) as totalEarnings,
        COUNT(DISTINCT o.id) as totalOrders
      FROM resellers sponsor
      JOIN users u ON sponsor.user_id = u.id
      LEFT JOIN resellers referral ON referral.sponsor_id = sponsor.id
      LEFT JOIN orders o ON referral.id = o.reseller_id
      GROUP BY sponsor.id
      HAVING totalReferrals > 0
      ORDER BY totalReferrals DESC, totalRevenue DESC
      LIMIT :limit
    `, {
      replacements: { limit: parseInt(limit) },
      type: QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: topSponsors,
    });
  } catch (error) {
    console.error('Top sponsors fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch top sponsors',
      error: error.message,
    });
  }
});

module.exports = router;
