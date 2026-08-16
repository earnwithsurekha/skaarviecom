const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { ManufacturerSettlement } = require('../models');
const { createNotification } = require('./notificationService');

/**
 * Generate unique settlement ID
 * @returns {string} Settlement ID (e.g., SETT-2024-001)
 */
async function generateSettlementId() {
  const year = new Date().getFullYear();
  const prefix = `SETT-${year}-`;
  
  // Get last settlement ID for this year
  const lastSettlement = await ManufacturerSettlement.findOne({
    where: {
      settlementId: {
        [Op.like]: `${prefix}%`,
      },
    },
    order: [['createdAt', 'DESC']],
  });

  let sequence = 1;
  if (lastSettlement) {
    const lastSequence = parseInt(lastSettlement.settlementId.split('-').pop());
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(3, '0')}`;
}

/**
 * Create a new settlement for manufacturer
 * @param {string} manufacturerId - Manufacturer ID
 * @param {Array} orderIds - Array of order IDs to include
 * @param {string} createdBy - Admin user ID creating the settlement
 * @returns {Object} Created settlement
 */
async function createSettlement(manufacturerId, orderIds, createdBy) {
  try {
    // Validate orders belong to manufacturer and are eligible
    const [orders] = await sequelize.query(`
      SELECT 
        o.id,
        SUM(oi.item_total) as grossRevenue,
        SUM(oi.platform_fee) as platformFee,
        SUM(oi.manufacturer_amount) as netPayable
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id IN (:orderIds)
        AND oi.manufacturer_id = :manufacturerId
        AND o.payment_status = 'paid'
        AND o.order_status = 'delivered'
      GROUP BY o.id
    `, {
      replacements: { orderIds, manufacturerId },
      type: sequelize.QueryTypes.SELECT,
    });

    if (orders.length === 0) {
      throw new Error('No eligible orders found for settlement');
    }

    // Calculate totals
    const grossRevenue = orders.reduce((sum, o) => sum + parseFloat(o.grossRevenue), 0);
    const platformFeeTotal = orders.reduce((sum, o) => sum + parseFloat(o.platformFee), 0);
    const netPayable = orders.reduce((sum, o) => sum + parseFloat(o.netPayable), 0);

    // Generate settlement ID
    const settlementId = await generateSettlementId();

    // Create settlement
    const settlement = await ManufacturerSettlement.create({
      settlementId,
      manufacturerId,
      settlementDate: new Date(),
      ordersCount: orders.length,
      orderIds: orderIds,
      grossRevenue,
      platformFeeTotal,
      netPayable,
      status: 'pending',
    });

    // Get manufacturer user ID for notification
    const [manufacturer] = await sequelize.query(`
      SELECT user_id FROM manufacturers WHERE id = :manufacturerId
    `, {
      replacements: { manufacturerId },
      type: sequelize.QueryTypes.SELECT,
    });

    if (manufacturer && manufacturer.user_id) {
      await createNotification({
        userId: manufacturer.user_id,
        type: 'settlement_processed',
        title: 'Settlement Created',
        message: `A new settlement ${settlementId} for ₹${netPayable.toFixed(2)} has been created and is pending processing.`,
        data: {
          settlementId: settlement.id,
          settlementNumber: settlementId,
          amount: netPayable,
          ordersCount: orders.length,
        },
        priority: 'high',
      });
    }

    return settlement;
  } catch (error) {
    console.error('Create settlement error:', error);
    throw error;
  }
}

/**
 * Process a settlement (mark as processed with payment details)
 * @param {string} settlementId - Settlement ID
 * @param {Object} paymentDetails - Payment method, reference, notes
 * @param {string} processedBy - Admin user ID
 * @returns {Object} Updated settlement
 */
async function processSettlement(settlementId, paymentDetails, processedBy) {
  try {
    const settlement = await ManufacturerSettlement.findByPk(settlementId);
    
    if (!settlement) {
      throw new Error('Settlement not found');
    }

    if (settlement.status !== 'pending') {
      throw new Error('Settlement is not in pending status');
    }

    // Update settlement
    await settlement.update({
      status: 'processed',
      paymentMethod: paymentDetails.paymentMethod,
      paymentReference: paymentDetails.paymentReference,
      notes: paymentDetails.notes,
      processedBy,
      processedAt: new Date(),
    });

    // Notify manufacturer
    const [manufacturer] = await sequelize.query(`
      SELECT user_id FROM manufacturers WHERE id = :manufacturerId
    `, {
      replacements: { manufacturerId: settlement.manufacturerId },
      type: sequelize.QueryTypes.SELECT,
    });

    if (manufacturer && manufacturer.user_id) {
      await createNotification({
        userId: manufacturer.user_id,
        type: 'settlement_processed',
        title: 'Settlement Processed',
        message: `Your settlement ${settlement.settlementId} for ₹${settlement.netPayable} has been processed and payment is being initiated.`,
        data: {
          settlementId: settlement.id,
          settlementNumber: settlement.settlementId,
          amount: settlement.netPayable,
          paymentMethod: paymentDetails.paymentMethod,
        },
        priority: 'high',
      });
    }

    return settlement;
  } catch (error) {
    console.error('Process settlement error:', error);
    throw error;
  }
}

/**
 * Mark settlement as paid
 * @param {string} settlementId - Settlement ID
 * @param {string} paymentReference - Payment transaction reference
 * @param {Date} paymentDate - Date of payment
 * @returns {Object} Updated settlement
 */
async function markSettlementPaid(settlementId, paymentReference, paymentDate) {
  try {
    const settlement = await ManufacturerSettlement.findByPk(settlementId);
    
    if (!settlement) {
      throw new Error('Settlement not found');
    }

    if (settlement.status !== 'processed') {
      throw new Error('Settlement must be processed before marking as paid');
    }

    // Update settlement
    await settlement.update({
      status: 'paid',
      paymentReference,
      paymentDate: paymentDate || new Date(),
    });

    // Notify manufacturer
    const [manufacturer] = await sequelize.query(`
      SELECT user_id FROM manufacturers WHERE id = :manufacturerId
    `, {
      replacements: { manufacturerId: settlement.manufacturerId },
      type: sequelize.QueryTypes.SELECT,
    });

    if (manufacturer && manufacturer.user_id) {
      await createNotification({
        userId: manufacturer.user_id,
        type: 'settlement_paid',
        title: 'Payment Received!',
        message: `Your settlement ${settlement.settlementId} for ₹${settlement.netPayable} has been paid. Payment reference: ${paymentReference}`,
        data: {
          settlementId: settlement.id,
          settlementNumber: settlement.settlementId,
          amount: settlement.netPayable,
          paymentReference,
          paymentDate: paymentDate || new Date(),
        },
        priority: 'urgent',
      });
    }

    return settlement;
  } catch (error) {
    console.error('Mark settlement paid error:', error);
    throw error;
  }
}

/**
 * Get settlement history for manufacturer
 * @param {string} manufacturerId - Manufacturer ID
 * @param {Object} filters - Filters for status, date range, pagination
 * @returns {Object} Settlements list with pagination
 */
async function getSettlementHistory(manufacturerId, filters = {}) {
  try {
    const { page = 1, limit = 20, status, startDate, endDate } = filters;
    const offset = (page - 1) * limit;

    // Build where conditions
    const where = { manufacturerId };
    
    if (status) {
      where.status = status;
    }
    
    if (startDate && endDate) {
      where.settlementDate = {
        [Op.between]: [startDate, endDate],
      };
    }

    const { count, rows } = await ManufacturerSettlement.findAndCountAll({
      where,
      order: [['settlementDate', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return {
      settlements: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    };
  } catch (error) {
    console.error('Get settlement history error:', error);
    throw error;
  }
}

/**
 * Calculate pending settlement amount for manufacturer
 * @param {string} manufacturerId - Manufacturer ID
 * @returns {Object} Pending amount and eligible orders count
 */
async function calculatePendingAmount(manufacturerId) {
  try {
    // Get all paid settlements
    const [paidSettlements] = await sequelize.query(`
      SELECT JSON_ARRAYAGG(order_id) as settledOrderIds
      FROM manufacturer_settlements ms
      CROSS JOIN JSON_TABLE(ms.order_ids, '$[*]' COLUMNS (order_id CHAR(36) PATH '$')) as jt
      WHERE ms.manufacturer_id = :manufacturerId
        AND ms.status IN ('processed', 'paid')
    `, {
      replacements: { manufacturerId },
      type: sequelize.QueryTypes.SELECT,
    });

    const settledOrderIds = paidSettlements[0]?.settledOrderIds 
      ? JSON.parse(paidSettlements[0].settledOrderIds)
      : [];

    // Calculate pending amount from unsettled orders
    let excludeCondition = '';
    if (settledOrderIds.length > 0) {
      excludeCondition = `AND o.id NOT IN (${settledOrderIds.map(id => `'${id}'`).join(',')})`;
    }

    const [results] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT o.id) as eligibleOrders,
        COALESCE(SUM(oi.manufacturer_amount), 0) as pendingAmount
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      WHERE oi.manufacturer_id = :manufacturerId
        AND o.payment_status = 'paid'
        AND o.order_status = 'delivered'
        ${excludeCondition}
    `, {
      replacements: { manufacturerId },
      type: sequelize.QueryTypes.SELECT,
    });

    return {
      pendingAmount: parseFloat(results[0]?.pendingAmount || 0),
      eligibleOrders: parseInt(results[0]?.eligibleOrders || 0),
    };
  } catch (error) {
    console.error('Calculate pending amount error:', error);
    throw error;
  }
}

module.exports = {
  createSettlement,
  processSettlement,
  markSettlementPaid,
  getSettlementHistory,
  calculatePendingAmount,
  generateSettlementId,
};
