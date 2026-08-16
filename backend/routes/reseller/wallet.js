const express = require('express');
const router = express.Router();
const { sequelize } = require('../../models');

// @route   GET /api/reseller/wallet/balance
// @desc    Get wallet balance for reseller
// @access  Private (Reseller only)
router.get('/balance', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get reseller's actual ID
    const [resellerData] = await sequelize.query(`
      SELECT id FROM resellers WHERE user_id = :userId
    `, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!resellerData) {
      return res.status(404).json({
        status: 'error',
        message: 'Reseller not found'
      });
    }

    const resellerId = resellerData.id;

    const [wallet] = await sequelize.query(`
      SELECT 
        COALESCE(current_balance, 0) as current_balance,
        COALESCE(pending_balance, 0) as pending_balance,
        COALESCE(total_earned, 0) as total_earned,
        COALESCE(total_withdrawn, 0) as total_withdrawn,
        created_at,
        updated_at
      FROM wallets
      WHERE reseller_id = :resellerId
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!wallet) {
      // Initialize wallet if doesn't exist
      await sequelize.query(`
        INSERT INTO wallets (id, reseller_id, current_balance, pending_balance, total_earned, total_withdrawn, created_at, updated_at)
        VALUES (UUID(), :resellerId, 0, 0, 0, 0, NOW(), NOW())
      `, {
        replacements: { resellerId }
      });

      return res.json({
        status: 'success',
        data: {
          current_balance: 0,
          pending_balance: 0,
          total_earned: 0,
          total_withdrawn: 0
        }
      });
    }

    res.json({
      status: 'success',
      data: {
        current_balance: parseFloat(wallet.current_balance),
        pending_balance: parseFloat(wallet.pending_balance),
        total_earned: parseFloat(wallet.total_earned),
        total_withdrawn: parseFloat(wallet.total_withdrawn)
      }
    });

  } catch (error) {
    console.error('Wallet balance error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch wallet balance',
      error: error.message
    });
  }
});

// @route   GET /api/reseller/wallet/transactions
// @desc    Get wallet transaction history
// @access  Private (Reseller only)
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get reseller's actual ID
    const [resellerData] = await sequelize.query(`
      SELECT id FROM resellers WHERE user_id = :userId
    `, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!resellerData) {
      return res.status(404).json({
        status: 'error',
        message: 'Reseller not found'
      });
    }

    const resellerId = resellerData.id;

    let typeCondition = '';
    const replacements = { resellerId, limit: parseInt(limit), offset };

    if (type && ['credit', 'debit'].includes(type)) {
      typeCondition = 'AND wt.transaction_type = :type';
      replacements.type = type;
    }

    const transactions = await sequelize.query(`
      SELECT 
        wt.id,
        wt.transaction_type,
        wt.amount,
        wt.balance_before,
        wt.balance_after,
        wt.description,
        wt.reference_id,
        wt.order_id,
        wt.status,
        wt.created_at,
        o.order_number
      FROM wallet_transactions wt
      LEFT JOIN orders o ON wt.order_id = o.id
      WHERE wt.reseller_id = :resellerId ${typeCondition}
      ORDER BY wt.created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Get total count
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM wallet_transactions
      WHERE reseller_id = :resellerId ${typeCondition}
    `, {
      replacements,
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
          balance_before: parseFloat(t.balance_before),
          balance_after: parseFloat(t.balance_after)
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
    console.error('Transactions fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

module.exports = router;
