const { QueryTypes } = require('sequelize');

/**
 * Calculate commission for order items
 * @param {Array} orderItems - Array of {productId, quantity, price}
 * @param {string} resellerId - Reseller ID for commission attribution
 * @param {object} sequelize - Sequelize instance
 * @returns {Promise<{totalCommission: number, itemCommissions: Array}>}
 */
async function calculateCommission(orderItems, resellerId, sequelize) {
  const itemCommissions = [];
  let totalCommission = 0;

  for (const item of orderItems) {
    try {
      // Get product details including reseller margin
      const [product] = await sequelize.query(
        `SELECT 
          id,
          name,
          reseller_margin,
          selling_price
         FROM products
         WHERE id = ? AND status = 'approved' AND deleted_at IS NULL`,
        {
          replacements: [item.productId],
          type: QueryTypes.SELECT
        }
      );

      if (!product) {
        console.warn(`Product ${item.productId} not found or inactive`);
        itemCommissions.push({
          productId: item.productId,
          quantity: item.quantity,
          commission: 0,
        });
        continue;
      }

      // Calculate commission based on reseller_margin
      const commissionPerUnit = parseFloat(product.reseller_margin) || 0;
      const itemCommission = commissionPerUnit * item.quantity;

      itemCommissions.push({
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: item.price,
        commissionPerUnit,
        totalCommission: itemCommission,
      });

      totalCommission += itemCommission;

    } catch (error) {
      console.error(`Error calculating commission for product ${item.productId}:`, error);
      itemCommissions.push({
        productId: item.productId,
        quantity: item.quantity,
        commission: 0,
        error: error.message,
      });
    }
  }

  return {
    totalCommission,
    itemCommissions,
  };
}

/**
 * Credit pending commission to reseller wallet
 * @param {string} orderId - Order ID
 * @param {string} orderNumber - Order number for reference
 * @param {string} resellerId - Reseller ID
 * @param {number} commissionAmount - Total commission amount
 * @param {object} sequelize - Sequelize instance
 * @param {object} transaction - Database transaction
 */
async function creditPendingCommission(orderId, orderNumber, resellerId, commissionAmount, sequelize, transaction) {
  if (!resellerId || commissionAmount <= 0) {
    console.log('Skipping commission credit: No reseller or zero amount');
    return;
  }

  try {
    const [existingTransaction] = await sequelize.query(
      `SELECT id
       FROM wallet_transactions
       WHERE order_id = ?
         AND reseller_id = ?
         AND transaction_type = 'credit'
       LIMIT 1`,
      {
        replacements: [orderId, resellerId],
        type: QueryTypes.SELECT,
        transaction
      }
    );
    if (existingTransaction) return;

    await sequelize.query(
      `INSERT INTO wallets
       (id, reseller_id, current_balance, pending_balance, total_earned, total_withdrawn, created_at, updated_at)
       VALUES (UUID(), ?, 0, 0, 0, 0, NOW(), NOW())
       ON DUPLICATE KEY UPDATE reseller_id = VALUES(reseller_id)`,
      {
        replacements: [resellerId],
        type: QueryTypes.INSERT,
        transaction
      }
    );

    const [wallet] = await sequelize.query(
      `SELECT id, pending_balance
       FROM wallets
       WHERE reseller_id = ?
       FOR UPDATE`,
      {
        replacements: [resellerId],
        type: QueryTypes.SELECT,
        transaction
      }
    );
    if (!wallet) throw new Error('Unable to initialize reseller wallet');

    const balanceBefore = Number.parseFloat(wallet.pending_balance) || 0;
    const balanceAfter = balanceBefore + commissionAmount;

    await sequelize.query(
      `UPDATE wallets 
       SET pending_balance = ?,
           total_earned = total_earned + ?,
           last_transaction_at = NOW(),
           updated_at = NOW()
       WHERE reseller_id = ?`,
      {
        replacements: [balanceAfter, commissionAmount, resellerId],
        type: QueryTypes.UPDATE,
        transaction
      }
    );

    await sequelize.query(
      `INSERT INTO wallet_transactions 
       (wallet_id, reseller_id, transaction_type, amount, balance_before, balance_after,
        order_id, reference_id, status, description, created_at)
       VALUES (?, ?, 'credit', ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
      {
        replacements: [
          wallet.id,
          resellerId,
          commissionAmount,
          balanceBefore,
          balanceAfter,
          orderId,
          orderNumber,
          `Commission for order #${orderNumber}`
        ],
        type: QueryTypes.INSERT,
        transaction
      }
    );

    console.log(`Pending commission of ₹${commissionAmount} credited to reseller ${resellerId}`);

  } catch (error) {
    console.error('Error crediting pending commission:', error);
    throw error;
  }
}

/**
 * Release commission from pending to available balance
 * Called when order status changes to 'delivered'
 * @param {string} orderId - Order ID
 * @param {object} sequelize - Sequelize instance
 */
async function releaseCommission(orderId, sequelize, existingTransaction = null) {
  const ownsTransaction = !existingTransaction;
  const transaction = existingTransaction || await sequelize.transaction();

  try {
    // Get order details
    const [order] = await sequelize.query(
      `SELECT 
        id,
        order_number,
        reseller_id
       FROM orders
       WHERE id = ? AND reseller_id IS NOT NULL`,
      {
        replacements: [orderId],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (!order || !order.reseller_id) {
      console.log('No reseller associated with this order, skipping commission release');
      if (ownsTransaction) await transaction.rollback();
      return;
    }

    // Get pending commission amount from wallet transactions
    const [walletTransaction] = await sequelize.query(
      `SELECT 
        id,
        amount
       FROM wallet_transactions
       WHERE order_id = ? 
         AND reseller_id = ?
         AND transaction_type = 'credit'
         AND status = 'pending'
       LIMIT 1`,
      {
        replacements: [orderId, order.reseller_id],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (!walletTransaction) {
      console.log('No pending commission found for this order');
      if (ownsTransaction) await transaction.rollback();
      return;
    }

    const commissionAmount = Number.parseFloat(walletTransaction.amount);

    const [wallet] = await sequelize.query(
      `SELECT current_balance, pending_balance
       FROM wallets
       WHERE reseller_id = ?
       FOR UPDATE`,
      {
        replacements: [order.reseller_id],
        type: QueryTypes.SELECT,
        transaction
      }
    );
    if (!wallet) throw new Error('Reseller wallet not found');

    const balanceBefore = Number.parseFloat(wallet.current_balance) || 0;
    const balanceAfter = balanceBefore + commissionAmount;

    // Move from pending_balance to current_balance
    await sequelize.query(
      `UPDATE wallets 
       SET pending_balance = GREATEST(pending_balance - ?, 0),
           current_balance = ?,
           last_transaction_at = NOW(),
           updated_at = NOW()
       WHERE reseller_id = ?`,
      {
        replacements: [commissionAmount, balanceAfter, order.reseller_id],
        type: QueryTypes.UPDATE,
        transaction
      }
    );

    // Update wallet transaction status
    await sequelize.query(
      `UPDATE wallet_transactions 
       SET status = 'completed',
           balance_before = ?,
           balance_after = ?
       WHERE id = ?`,
      {
        replacements: [balanceBefore, balanceAfter, walletTransaction.id],
        type: QueryTypes.UPDATE,
        transaction
      }
    );

    if (ownsTransaction) await transaction.commit();
    console.log(`Commission of ₹${commissionAmount} released to reseller ${order.reseller_id}`);

  } catch (error) {
    if (ownsTransaction) await transaction.rollback();
    console.error('Error releasing commission:', error);
    throw error;
  }
}

/**
 * Cancel commission on order cancellation
 * @param {string} orderId - Order ID
 * @param {object} sequelize - Sequelize instance
 */
async function cancelCommission(orderId, sequelize, existingTransaction = null) {
  const ownsTransaction = !existingTransaction;
  const transaction = existingTransaction || await sequelize.transaction();

  try {
    // Get order details
    const [order] = await sequelize.query(
      `SELECT 
        id,
        reseller_id
       FROM orders
       WHERE id = ? AND reseller_id IS NOT NULL`,
      {
        replacements: [orderId],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (!order || !order.reseller_id) {
      if (ownsTransaction) await transaction.rollback();
      return;
    }

    // Get pending commission
    const [walletTransaction] = await sequelize.query(
      `SELECT 
        id,
        amount
       FROM wallet_transactions
       WHERE order_id = ? 
         AND reseller_id = ?
         AND transaction_type = 'credit'
         AND status = 'pending'
       LIMIT 1`,
      {
        replacements: [orderId, order.reseller_id],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (!walletTransaction) {
      if (ownsTransaction) await transaction.rollback();
      return;
    }

    const commissionAmount = Number.parseFloat(walletTransaction.amount);

    const [wallet] = await sequelize.query(
      `SELECT pending_balance
       FROM wallets
       WHERE reseller_id = ?
       FOR UPDATE`,
      {
        replacements: [order.reseller_id],
        type: QueryTypes.SELECT,
        transaction
      }
    );
    if (!wallet) throw new Error('Reseller wallet not found');

    const balanceBefore = Number.parseFloat(wallet.pending_balance) || 0;
    const balanceAfter = Math.max(balanceBefore - commissionAmount, 0);

    // Deduct from pending balance and total earned
    await sequelize.query(
      `UPDATE wallets 
       SET pending_balance = ?,
           total_earned = GREATEST(total_earned - ?, 0),
           last_transaction_at = NOW(),
           updated_at = NOW()
       WHERE reseller_id = ?`,
      {
        replacements: [balanceAfter, commissionAmount, order.reseller_id],
        type: QueryTypes.UPDATE,
        transaction
      }
    );

    // Update wallet transaction status
    await sequelize.query(
      `UPDATE wallet_transactions 
         SET status = 'reversed',
           balance_before = ?,
           balance_after = ?
       WHERE id = ?`,
      {
        replacements: [balanceBefore, balanceAfter, walletTransaction.id],
        type: QueryTypes.UPDATE,
        transaction
      }
    );

    if (ownsTransaction) await transaction.commit();
    console.log(`Commission of ₹${commissionAmount} cancelled for reseller ${order.reseller_id}`);

  } catch (error) {
    if (ownsTransaction) await transaction.rollback();
    console.error('Error cancelling commission:', error);
    throw error;
  }
}

module.exports = {
  calculateCommission,
  creditPendingCommission,
  releaseCommission,
  cancelCommission,
};
