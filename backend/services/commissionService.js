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
    // Update wallet pending balance
    await sequelize.query(
      `UPDATE wallets 
       SET pending_balance = pending_balance + ?,
           total_earned = total_earned + ?,
           updated_at = NOW()
       WHERE reseller_id = ?`,
      {
        replacements: [commissionAmount, commissionAmount, resellerId],
        type: QueryTypes.UPDATE,
        transaction
      }
    );

    // Create wallet transaction record
    await sequelize.query(
      `INSERT INTO wallet_transactions 
       (reseller_id, transaction_type, amount, order_id, reference_id, status, description, created_at, updated_at)
       VALUES (?, 'credit', ?, ?, ?, 'pending', ?, NOW(), NOW())`,
      {
        replacements: [
          resellerId,
          commissionAmount,
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
async function releaseCommission(orderId, sequelize) {
  const transaction = await sequelize.transaction();

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
      await transaction.rollback();
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
      await transaction.rollback();
      return;
    }

    const commissionAmount = parseFloat(walletTransaction.amount);

    // Move from pending_balance to current_balance
    await sequelize.query(
      `UPDATE wallets 
       SET pending_balance = pending_balance - ?,
           current_balance = current_balance + ?,
           updated_at = NOW()
       WHERE reseller_id = ?`,
      {
        replacements: [commissionAmount, commissionAmount, order.reseller_id],
        type: QueryTypes.UPDATE,
        transaction
      }
    );

    // Update wallet transaction status
    await sequelize.query(
      `UPDATE wallet_transactions 
       SET status = 'completed',
           updated_at = NOW()
       WHERE id = ?`,
      {
        replacements: [walletTransaction.id],
        type: QueryTypes.UPDATE,
        transaction
      }
    );

    await transaction.commit();
    console.log(`Commission of ₹${commissionAmount} released to reseller ${order.reseller_id}`);

  } catch (error) {
    await transaction.rollback();
    console.error('Error releasing commission:', error);
    throw error;
  }
}

/**
 * Cancel commission on order cancellation
 * @param {string} orderId - Order ID
 * @param {object} sequelize - Sequelize instance
 */
async function cancelCommission(orderId, sequelize) {
  const transaction = await sequelize.transaction();

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
      await transaction.rollback();
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
      await transaction.rollback();
      return;
    }

    const commissionAmount = parseFloat(walletTransaction.amount);

    // Deduct from pending balance and total earned
    await sequelize.query(
      `UPDATE wallets 
       SET pending_balance = pending_balance - ?,
           total_earned = total_earned - ?,
           updated_at = NOW()
       WHERE reseller_id = ?`,
      {
        replacements: [commissionAmount, commissionAmount, order.reseller_id],
        type: QueryTypes.UPDATE,
        transaction
      }
    );

    // Update wallet transaction status
    await sequelize.query(
      `UPDATE wallet_transactions 
       SET status = 'cancelled',
           updated_at = NOW()
       WHERE id = ?`,
      {
        replacements: [walletTransaction.id],
        type: QueryTypes.UPDATE,
        transaction
      }
    );

    await transaction.commit();
    console.log(`Commission of ₹${commissionAmount} cancelled for reseller ${order.reseller_id}`);

  } catch (error) {
    await transaction.rollback();
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
