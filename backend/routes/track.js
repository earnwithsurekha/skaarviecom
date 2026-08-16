const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');
const { v4: uuidv4 } = require('uuid');

// @route   POST /api/track/referral-click
// @desc    Track when someone clicks a referral link
// @access  Public
router.post('/referral-click', async (req, res) => {
  try {
    const { 
      referralCode, 
      productId, 
      sessionId,
      ipAddress,
      userAgent,
      referrerUrl,
      deviceType,
      browser
    } = req.body;

    if (!referralCode || !productId) {
      return res.status(400).json({
        status: 'error',
        message: 'Referral code and product ID are required'
      });
    }

    // Get reseller by code
    const [reseller] = await sequelize.query(`
      SELECT id FROM resellers
      WHERE reseller_code = :referralCode
      AND status = 'active'
    `, {
      replacements: { referralCode },
      type: sequelize.QueryTypes.SELECT
    });

    if (!reseller) {
      return res.status(404).json({
        status: 'error',
        message: 'Invalid referral code'
      });
    }

    // Check if this session already clicked this link (prevent duplicate tracking)
    const [existingClick] = await sequelize.query(`
      SELECT id FROM referral_clicks
      WHERE reseller_id = :resellerId
      AND product_id = :productId
      AND session_id = :sessionId
      AND clicked_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `, {
      replacements: { 
        resellerId: reseller.id, 
        productId,
        sessionId
      },
      type: sequelize.QueryTypes.SELECT
    });

    if (existingClick) {
      return res.json({
        status: 'success',
        message: 'Click already tracked',
        data: { clickId: existingClick.id }
      });
    }

    // Insert click record
    const clickId = uuidv4();
    await sequelize.query(`
      INSERT INTO referral_clicks 
      (id, reseller_id, product_id, ip_address, user_agent, referrer_url, 
       device_type, browser, session_id, clicked_at)
      VALUES 
      (:id, :resellerId, :productId, :ipAddress, :userAgent, :referrerUrl,
       :deviceType, :browser, :sessionId, NOW())
    `, {
      replacements: {
        id: clickId,
        resellerId: reseller.id,
        productId,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
        referrerUrl: referrerUrl || null,
        deviceType: deviceType || null,
        browser: browser || null,
        sessionId: sessionId || null
      }
    });

    res.json({
      status: 'success',
      message: 'Click tracked successfully',
      data: { clickId }
    });

  } catch (error) {
    console.error('Track referral click error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to track click',
      error: error.message
    });
  }
});

// @route   GET /api/track/click-stats/:referralCode
// @desc    Get click statistics for a referral code
// @access  Public (for reseller to view their stats)
router.get('/click-stats/:referralCode', async (req, res) => {
  try {
    const { referralCode } = req.params;

    // Get reseller by code
    const [reseller] = await sequelize.query(`
      SELECT id FROM resellers
      WHERE reseller_code = :referralCode
    `, {
      replacements: { referralCode },
      type: sequelize.QueryTypes.SELECT
    });

    if (!reseller) {
      return res.status(404).json({
        status: 'error',
        message: 'Invalid referral code'
      });
    }

    // Get click statistics
    const [stats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_clicks,
        COUNT(CASE WHEN converted = TRUE THEN 1 END) as converted_clicks,
        COUNT(DISTINCT product_id) as unique_products,
        COUNT(DISTINCT session_id) as unique_visitors
      FROM referral_clicks
      WHERE reseller_id = :resellerId
    `, {
      replacements: { resellerId: reseller.id },
      type: sequelize.QueryTypes.SELECT
    });

    // Get click breakdown by product
    const productBreakdown = await sequelize.query(`
      SELECT 
        p.id,
        p.name,
        COUNT(rc.id) as clicks,
        COUNT(CASE WHEN rc.converted = TRUE THEN 1 END) as conversions
      FROM referral_clicks rc
      JOIN products p ON rc.product_id = p.id
      WHERE rc.reseller_id = :resellerId
      GROUP BY p.id, p.name
      ORDER BY clicks DESC
      LIMIT 10
    `, {
      replacements: { resellerId: reseller.id },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        stats,
        productBreakdown
      }
    });

  } catch (error) {
    console.error('Get click stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch click statistics',
      error: error.message
    });
  }
});

module.exports = router;
