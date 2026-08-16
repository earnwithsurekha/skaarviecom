const express = require('express');
const router = express.Router();
const { QueryTypes } = require('sequelize');

// @route   GET /api/admin/returns
// @desc    Get all return requests (with optional filtering)
// @access  Private (Admin only)
router.get('/returns', async (req, res) => {
  const sequelize = require('../../config/database');

  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    let whereClause = 'o.return_status IS NOT NULL';
    const replacements = [];

    if (status && status !== 'all') {
      whereClause += ' AND o.return_status = ?';
      replacements.push(status);
    }

    // Get total count
    const [countResult] = await sequelize.query(
      `SELECT COUNT(*) as total
       FROM orders o
       WHERE ${whereClause}`,
      {
        replacements,
        type: QueryTypes.SELECT
      }
    );

    // Get return requests
    const returns = await sequelize.query(
      `SELECT 
        o.id,
        o.order_number,
        o.customer_id,
        o.reseller_id,
        o.total_amount,
        o.return_requested_at,
        o.return_reason,
        o.return_status,
        o.return_approved_at,
        o.return_rejected_at,
        o.return_images,
        o.admin_notes,
        o.delivered_at,
        o.refund_amount,
        o.refund_status,
        c.full_name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        (SELECT GROUP_CONCAT(
          CONCAT(p.name, ' (Qty: ', oi.quantity, ')')
          SEPARATOR ', '
        )
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = o.id
        LIMIT 3) as products,
        (SELECT image_url 
         FROM order_items oi
         JOIN product_images pi ON pi.product_id = oi.product_id
         WHERE oi.order_id = o.id
         ORDER BY pi.sort_order
         LIMIT 1) as product_image
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      WHERE ${whereClause}
      ORDER BY o.return_requested_at DESC
      LIMIT ? OFFSET ?`,
      {
        replacements: [...replacements, parseInt(limit), offset],
        type: QueryTypes.SELECT
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        returns: returns.map(r => ({
          ...r,
          return_images: r.return_images ? JSON.parse(r.return_images) : []
        })),
        pagination: {
          total: countResult.total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult.total / limit)
        }
      }
    });

  } catch (error) {
    console.error('[Admin Returns] Fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch return requests',
      error: error.message
    });
  }
});

// @route   GET /api/admin/returns/:id
// @desc    Get single return request details
// @access  Private (Admin only)
router.get('/returns/:id', async (req, res) => {
  const sequelize = require('../../config/database');

  try {
    const { id } = req.params;

    const [returnRequest] = await sequelize.query(
      `SELECT 
        o.*,
        c.full_name as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        c.address as customer_address,
        r.business_name as reseller_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN resellers r ON o.reseller_id = r.id
      WHERE o.id = ? AND o.return_status IS NOT NULL`,
      {
        replacements: [id],
        type: QueryTypes.SELECT
      }
    );

    if (!returnRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Return request not found'
      });
    }

    // Get order items
    const items = await sequelize.query(
      `SELECT 
        oi.*,
        p.name as product_name,
        p.sku as product_sku,
        (SELECT image_url 
         FROM product_images pi
         WHERE pi.product_id = oi.product_id
         ORDER BY pi.sort_order
         LIMIT 1) as product_image
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?`,
      {
        replacements: [id],
        type: QueryTypes.SELECT
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        return: {
          ...returnRequest,
          return_images: returnRequest.return_images ? JSON.parse(returnRequest.return_images) : [],
          shipping_address: returnRequest.shipping_address ? JSON.parse(returnRequest.shipping_address) : null
        },
        items
      }
    });

  } catch (error) {
    console.error('[Admin Returns] Fetch details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch return request details',
      error: error.message
    });
  }
});

// @route   POST /api/admin/returns/:id/approve
// @desc    Approve a return request
// @access  Private (Admin only)
router.post('/returns/:id/approve', async (req, res) => {
  const sequelize = require('../../config/database');
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    // Get user ID from token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await transaction.rollback();
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Get order details
    const [order] = await sequelize.query(
      `SELECT 
        id, order_number, customer_id, reseller_id, return_status, 
        total_amount, commission_paid
      FROM orders 
      WHERE id = ? AND return_status = 'pending'`,
      {
        replacements: [id],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Return request not found or already processed',
      });
    }

    // Update order with approval
    await sequelize.query(
      `UPDATE orders 
       SET return_status = 'approved',
           return_approved_at = NOW(),
           admin_notes = ?,
           order_status = 'returned',
           refund_amount = total_amount,
           refund_status = 'pending',
           updated_at = NOW()
       WHERE id = ?`,
      {
        replacements: [adminNotes || 'Return request approved', id],
        type: QueryTypes.UPDATE,
        transaction
      }
    );

    // Record status change in history
    await sequelize.query(
      `INSERT INTO order_status_history 
       (order_id, status, notes, changed_by, created_at)
       VALUES (?, 'returned', ?, ?, NOW())`,
      {
        replacements: [
          id,
          `Return approved by admin. ${adminNotes || ''}`,
          userId
        ],
        type: QueryTypes.INSERT,
        transaction
      }
    );

    // Restore product stock for each order item
    const orderItems = await sequelize.query(
      'SELECT oi.product_id, oi.quantity, oi.manufacturer_id FROM order_items oi WHERE oi.order_id = ?',
      {
        replacements: [id],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    for (const item of orderItems) {
      // Get current stock before update
      const [productStock] = await sequelize.query(
        'SELECT stock_quantity FROM products WHERE id = ?',
        {
          replacements: [item.product_id],
          type: QueryTypes.SELECT,
          transaction
        }
      );

      const previousStock = productStock ? productStock.stock_quantity : 0;
      const newStock = previousStock + item.quantity;

      // Restore stock
      await sequelize.query(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
        {
          replacements: [item.quantity, item.product_id],
          type: QueryTypes.UPDATE,
          transaction
        }
      );

      // Add stock log entry
      await sequelize.query(
        `INSERT INTO stock_logs 
         (product_id, manufacturer_id, change_type, quantity_change, previous_stock, new_stock, reason, changed_by, changed_at)
         VALUES (?, ?, 'order_cancelled', ?, ?, ?, ?, ?, NOW())`,
        {
          replacements: [
            item.product_id,
            item.manufacturer_id,
            item.quantity,
            previousStock,
            newStock,
            `Stock restored due to order ${order.order_number} return approval`,
            userId
          ],
          type: QueryTypes.INSERT,
          transaction
        }
      );
    }

    // Reverse commission if it was paid
    if (order.reseller_id && order.commission_paid) {
      console.log('[Admin Returns] Reversing paid commission for reseller:', order.reseller_id);
      
      // Find the original commission transaction
      const [commissionTx] = await sequelize.query(
        `SELECT id, amount FROM wallet_transactions 
         WHERE order_id = ? AND transaction_type = 'credit' AND status = 'completed'`,
        {
          replacements: [id],
          type: QueryTypes.SELECT,
          transaction
        }
      );

      if (commissionTx) {
        // Create reversal transaction
        await sequelize.query(
          `INSERT INTO wallet_transactions 
           (reseller_id, order_id, transaction_type, amount, status, description, created_at)
           VALUES (?, ?, 'debit', ?, 'completed', ?, NOW())`,
          {
            replacements: [
              order.reseller_id,
              id,
              commissionTx.amount,
              `Commission reversal - Order ${order.order_number} returned`
            ],
            type: QueryTypes.INSERT,
            transaction
          }
        );

        // Deduct from reseller's current balance
        await sequelize.query(
          `UPDATE wallets 
           SET current_balance = current_balance - ?,
               updated_at = NOW()
           WHERE reseller_id = ?`,
          {
            replacements: [commissionTx.amount, order.reseller_id],
            type: QueryTypes.UPDATE,
            transaction
          }
        );
      }
    }

    // Create notification for customer
    const [customer] = await sequelize.query(
      'SELECT user_id FROM customers WHERE id = ?',
      {
        replacements: [order.customer_id],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (customer && customer.user_id) {
      await sequelize.query(
        `INSERT INTO notifications 
         (user_id, type, title, message, reference_id, reference_type, created_at)
         VALUES (?, 'return_approved', 'Return Request Approved', ?, ?, 'order', NOW())`,
        {
          replacements: [
            customer.user_id,
            `Your return request for order ${order.order_number} has been approved. Refund will be processed within 5-7 business days.`,
            id
          ],
          type: QueryTypes.INSERT,
          transaction
        }
      );
    }

    await transaction.commit();

    console.log('[Admin Returns] Return approved successfully:', order.order_number);

    res.status(200).json({
      status: 'success',
      message: 'Return request approved successfully',
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        returnStatus: 'approved'
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('[Admin Returns] Approve error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to approve return request',
      error: error.message
    });
  }
});

// @route   POST /api/admin/returns/:id/reject
// @desc    Reject a return request
// @access  Private (Admin only)
router.post('/returns/:id/reject', async (req, res) => {
  const sequelize = require('../../config/database');
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { adminNotes } = req.body;

    if (!adminNotes || adminNotes.trim().length < 10) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a detailed reason for rejection (minimum 10 characters)',
      });
    }

    // Get user ID from token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      await transaction.rollback();
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Get order details
    const [order] = await sequelize.query(
      `SELECT 
        id, order_number, customer_id, return_status
      FROM orders 
      WHERE id = ? AND return_status = 'pending'`,
      {
        replacements: [id],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Return request not found or already processed',
      });
    }

    // Update order with rejection
    await sequelize.query(
      `UPDATE orders 
       SET return_status = 'rejected',
           return_rejected_at = NOW(),
           admin_notes = ?,
           updated_at = NOW()
       WHERE id = ?`,
      {
        replacements: [adminNotes, id],
        type: QueryTypes.UPDATE,
        transaction
      }
    );

    // Record status change in history
    await sequelize.query(
      `INSERT INTO order_status_history 
       (order_id, status, notes, changed_by, created_at)
       VALUES (?, 'return_rejected', ?, ?, NOW())`,
      {
        replacements: [
          id,
          `Return rejected by admin. Reason: ${adminNotes}`,
          userId
        ],
        type: QueryTypes.INSERT,
        transaction
      }
    );

    // Create notification for customer
    const [customer] = await sequelize.query(
      'SELECT user_id FROM customers WHERE id = ?',
      {
        replacements: [order.customer_id],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (customer && customer.user_id) {
      await sequelize.query(
        `INSERT INTO notifications 
         (user_id, type, title, message, reference_id, reference_type, created_at)
         VALUES (?, 'return_rejected', 'Return Request Rejected', ?, ?, 'order', NOW())`,
        {
          replacements: [
            customer.user_id,
            `Your return request for order ${order.order_number} has been rejected. Reason: ${adminNotes}`,
            id
          ],
          type: QueryTypes.INSERT,
          transaction
        }
      );
    }

    await transaction.commit();

    console.log('[Admin Returns] Return rejected:', order.order_number);

    res.status(200).json({
      status: 'success',
      message: 'Return request rejected',
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        returnStatus: 'rejected'
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('[Admin Returns] Reject error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to reject return request',
      error: error.message
    });
  }
});

module.exports = router;
