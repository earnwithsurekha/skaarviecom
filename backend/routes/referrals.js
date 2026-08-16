const express = require('express');
const router = express.Router();
const { QueryTypes } = require('sequelize');

// @route   POST /api/referrals/track-click
// @desc    Track referral click from URL
// @access  Public
router.post('/track-click', async (req, res) => {
  const sequelize = require('../config/database');
  
  try {
    const {
      referralCode,
      productId,
      sessionId,
      userAgent,
      referrer
    } = req.body;

    console.log('[Referral Tracking] Click tracked:', { referralCode, productId, sessionId });

    // Validate referral code
    if (!referralCode) {
      return res.status(400).json({
        status: 'error',
        message: 'Referral code is required',
      });
    }

    // Find reseller by code
    const [reseller] = await sequelize.query(
      'SELECT id FROM resellers WHERE reseller_code = ?',
      {
        replacements: [referralCode],
        type: QueryTypes.SELECT
      }
    );

    if (!reseller) {
      return res.status(404).json({
        status: 'error',
        message: 'Invalid referral code',
      });
    }

    const resellerId = reseller.id;

    // Get client IP address
    const ipAddress = req.headers['x-forwarded-for'] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress ||
                     req.socket.remoteAddress ||
                     'unknown';

    // Insert referral click
    await sequelize.query(
      `INSERT INTO referral_clicks 
       (reseller_id, product_id, session_id, ip_address, user_agent, referrer_url, clicked_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      {
        replacements: [
          resellerId,
          productId || null,
          sessionId || null,
          ipAddress.toString().substring(0, 45), // Limit IP length
          (userAgent || '').substring(0, 500), // Limit user agent length
          (referrer || '').substring(0, 500) // Limit referrer length
        ],
        type: QueryTypes.INSERT
      }
    );

    console.log('[Referral Tracking] Click recorded successfully for reseller:', resellerId);

    res.status(201).json({
      status: 'success',
      message: 'Referral click tracked successfully',
      data: {
        resellerId,
        referralCode,
      }
    });

  } catch (error) {
    console.error('[Referral Tracking] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to track referral click',
      error: error.message
    });
  }
});

// @route   GET /api/referrals/validate/:code
// @desc    Validate a referral code
// @access  Public
router.get('/validate/:code', async (req, res) => {
  const sequelize = require('../config/database');
  
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({
        status: 'error',
        message: 'Referral code is required',
      });
    }

    // Find reseller by code
    const [reseller] = await sequelize.query(
      `SELECT 
        r.id,
        r.reseller_code,
        r.full_name,
        r.city,
        r.state,
        u.status as user_status
       FROM resellers r
       JOIN users u ON r.user_id = u.id
       WHERE r.reseller_code = ?`,
      {
        replacements: [code],
        type: QueryTypes.SELECT
      }
    );

    if (!reseller) {
      return res.status(404).json({
        status: 'error',
        message: 'Invalid referral code',
        valid: false,
      });
    }

    // Check if reseller is active
    if (reseller.user_status !== 'approved') {
      return res.status(403).json({
        status: 'error',
        message: 'This referral code is not active',
        valid: false,
      });
    }

    res.json({
      status: 'success',
      message: 'Valid referral code',
      valid: true,
      data: {
        resellerId: reseller.id,
        resellerCode: reseller.reseller_code,
        resellerName: reseller.full_name,
        resellerLocation: `${reseller.city || ''}${reseller.city && reseller.state ? ', ' : ''}${reseller.state || ''}`.trim(),
      }
    });

  } catch (error) {
    console.error('[Referral Validation] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to validate referral code',
      error: error.message
    });
  }
});

// @route   GET /api/referrals/stats/:resellerId
// @desc    Get referral stats for a reseller (for internal use)
// @access  Private (reseller)
router.get('/stats/:resellerId', async (req, res) => {
  const sequelize = require('../config/database');
  
  try {
    const { resellerId } = req.params;

    // Get total clicks
    const [clickStats] = await sequelize.query(
      `SELECT 
        COUNT(*) as total_clicks,
        COUNT(DISTINCT product_id) as unique_products,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(DISTINCT ip_address) as unique_ips
       FROM referral_clicks
       WHERE reseller_id = ?`,
      {
        replacements: [resellerId],
        type: QueryTypes.SELECT
      }
    );

    // Get clicks by product
    const productClicks = await sequelize.query(
      `SELECT 
        p.id,
        p.name,
        COUNT(*) as click_count
       FROM referral_clicks rc
       JOIN products p ON rc.product_id = p.id
       WHERE rc.reseller_id = ?
       GROUP BY p.id, p.name
       ORDER BY click_count DESC
       LIMIT 10`,
      {
        replacements: [resellerId],
        type: QueryTypes.SELECT
      }
    );

    // Get recent clicks
    const recentClicks = await sequelize.query(
      `SELECT 
        rc.product_id,
        p.name as product_name,
        rc.clicked_at,
        rc.ip_address
       FROM referral_clicks rc
       LEFT JOIN products p ON rc.product_id = p.id
       WHERE rc.reseller_id = ?
       ORDER BY rc.clicked_at DESC
       LIMIT 20`,
      {
        replacements: [resellerId],
        type: QueryTypes.SELECT
      }
    );

    res.json({
      status: 'success',
      data: {
        summary: clickStats,
        topProducts: productClicks,
        recentClicks,
      }
    });

  } catch (error) {
    console.error('[Referral Stats] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch referral stats',
      error: error.message
    });
  }
});

module.exports = router;
