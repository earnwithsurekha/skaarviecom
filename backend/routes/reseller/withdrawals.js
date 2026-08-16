const express = require('express');
const router = express.Router();
const { sequelize } = require('../../models');
const { QueryTypes } = require('sequelize');

// Request withdrawal
router.post('/request', async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    // Get actual reseller_id and banking details from user_id
    const [resellerData] = await sequelize.query(
      `SELECT r.id, r.bank_account_number, r.bank_ifsc_code, r.bank_account_holder, r.upi_id
       FROM resellers r WHERE r.user_id = ?`,
      {
        replacements: [userId],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (!resellerData) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Reseller not found'
      });
    }

    const resellerId = resellerData.id;

    // Validate banking details
    if (!resellerData.bank_account_number || !resellerData.bank_ifsc_code) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Please update your banking details in profile before requesting withdrawal'
      });
    }

    // Validate amount
    if (!amount || amount < 500) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Minimum withdrawal amount is ₹500'
      });
    }

    // Get current wallet balance and wallet_id
    const [wallet] = await sequelize.query(
      `SELECT id, current_balance FROM wallets WHERE reseller_id = ?`,
      {
        replacements: [resellerId],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (!wallet || wallet.current_balance < amount) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient balance'
      });
    }

    // Create withdrawal request
    const [result] = await sequelize.query(
      `INSERT INTO withdrawal_requests 
       (reseller_id, wallet_id, amount, bank_account_number, bank_ifsc_code, bank_account_holder, upi_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      {
        replacements: [
          resellerId, 
          wallet.id,
          amount, 
          resellerData.bank_account_number,
          resellerData.bank_ifsc_code,
          resellerData.bank_account_holder || resellerData.bank_account_number,
          resellerData.upi_id || null
        ],
        type: QueryTypes.INSERT,
        transaction
      }
    );

    // Deduct from current balance
    await sequelize.query(
      `UPDATE wallets 
       SET current_balance = current_balance - ? 
       WHERE reseller_id = ?`,
      {
        replacements: [amount, resellerId],
        type: QueryTypes.UPDATE,
        transaction
      }
    );

    // Create wallet transaction
    await sequelize.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, transaction_type, amount, description, reference_number, balance_after, created_at)
       SELECT w.id, 'debit', ?, 'Withdrawal request', ?, w.current_balance, NOW()
       FROM wallets w WHERE w.reseller_id = ?`,
      {
        replacements: [amount, `WR-${result}`, resellerId],
        type: QueryTypes.INSERT,
        transaction
      }
    );

    await transaction.commit();

    res.json({
      status: 'success',
      message: 'Withdrawal request submitted successfully',
      data: {
        withdrawal_id: result,
        amount,
        status: 'pending'
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Withdrawal request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process withdrawal request',
      error: error.message
    });
  }
});

// Get withdrawal history
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get actual reseller_id from user_id
    const [resellerData] = await sequelize.query(
      `SELECT id FROM resellers WHERE user_id = ?`,
      {
        replacements: [userId],
        type: QueryTypes.SELECT
      }
    );

    if (!resellerData) {
      return res.status(404).json({
        status: 'error',
        message: 'Reseller not found'
      });
    }

    const resellerId = resellerData.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status;

    let whereClause = 'WHERE reseller_id = ?';
    let params = [resellerId];

    if (status && ['pending', 'approved', 'rejected', 'completed'].includes(status)) {
      whereClause += ' AND status = ?';
      params.push(status);
    }

    // Get total count
    const [{ total }] = await sequelize.query(
      `SELECT COUNT(*) as total FROM withdrawal_requests ${whereClause}`,
      {
        replacements: params,
        type: QueryTypes.SELECT
      }
    );

    // Get withdrawals
    const withdrawals = await sequelize.query(
      `SELECT 
        id,
        amount,
        bank_account_number,
        bank_ifsc_code,
        upi_id,
        status,
        created_at,
        approved_at,
        paid_at,
        rejection_reason,
        approved_by,
        payment_reference
       FROM withdrawal_requests
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      {
        replacements: [...params, limit, offset],
        type: QueryTypes.SELECT
      }
    );

    res.json({
      status: 'success',
      data: {
        withdrawals,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch withdrawals',
      error: error.message
    });
  }
});

// Get withdrawal by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const withdrawalId = req.params.id;

    // Get actual reseller_id from user_id
    const [resellerData] = await sequelize.query(
      `SELECT id FROM resellers WHERE user_id = ?`,
      {
        replacements: [userId],
        type: QueryTypes.SELECT
      }
    );

    if (!resellerData) {
      return res.status(404).json({
        status: 'error',
        message: 'Reseller not found'
      });
    }

    const resellerId = resellerData.id;

    const [withdrawal] = await sequelize.query(
      `SELECT 
        wr.*,
        u.full_name as approved_by_name
       FROM withdrawal_requests wr
       LEFT JOIN users u ON wr.approved_by = u.id
       WHERE wr.id = ? AND wr.reseller_id = ?`,
      {
        replacements: [withdrawalId, resellerId],
        type: QueryTypes.SELECT
      }
    );

    if (!withdrawal) {
      return res.status(404).json({
        status: 'error',
        message: 'Withdrawal request not found'
      });
    }

    res.json({
      status: 'success',
      data: withdrawal
    });

  } catch (error) {
    console.error('Get withdrawal error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch withdrawal',
      error: error.message
    });
  }
});

module.exports = router;
