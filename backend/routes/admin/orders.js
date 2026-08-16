const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../../middleware/auth');
const { sequelize } = require('../../models');
const { QueryTypes } = require('sequelize');

// @route   GET /api/admin/orders
// @desc    Get all orders with admin capabilities
// @access  Private (Admin)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { 
      status = 'all', 
      page = 1, 
      limit = 20,
      search = '',
      startDate,
      endDate 
    } = req.query;
    
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let statusFilter = '';
    let dateFilter = '';
    let searchFilter = '';
    
    const replacements = { limit: parseInt(limit), offset };

    if (status !== 'all') {
      statusFilter = 'AND o.order_status = :status';
      replacements.status = status;
    }

    if (startDate && endDate) {
      dateFilter = 'AND o.ordered_at BETWEEN :startDate AND :endDate';
      replacements.startDate = startDate;
      replacements.endDate = endDate;
    }

    if (search) {
      searchFilter = 'AND (o.order_number LIKE :search OR c.full_name LIKE :search)';
      replacements.search = `%${search}%`;
    }

    const orders = await sequelize.query(`
      SELECT 
        o.id as orderId,
        o.order_number as orderNumber,
        o.customer_id,
        o.reseller_id,
        o.total_amount as totalAmount,
        o.payment_status as paymentStatus,
        o.order_status as orderStatus,
        o.ordered_at as orderedAt,
        c.full_name as customerName,
        cu.email as customerEmail,
        cu.mobile as customerPhone,
        r.full_name as resellerName,
        COUNT(DISTINCT oi.id) as itemCount,
        GROUP_CONCAT(DISTINCT m.company_name SEPARATOR ', ') as manufacturerName,
        GROUP_CONCAT(DISTINCT oi.product_name SEPARATOR ', ') as productNames,
        COALESCE(SUM(oi.reseller_commission), 0) as totalCommission,
        COALESCE(SUM(oi.platform_fee), 0) as totalPlatformFee
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users cu ON c.user_id = cu.id
      LEFT JOIN resellers r ON o.reseller_id = r.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN manufacturers m ON oi.manufacturer_id = m.id
      WHERE 1=1 ${statusFilter} ${dateFilter} ${searchFilter}
      GROUP BY o.id
      ORDER BY o.ordered_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    const totalResult = await sequelize.query(`
      SELECT COUNT(DISTINCT o.id) as total
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users cu ON c.user_id = cu.id
      WHERE 1=1 ${statusFilter} ${dateFilter} ${searchFilter}
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        orders,
        pagination: {
          total: parseInt(totalResult[0]?.total || 0),
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil((totalResult[0]?.total || 0) / limit),
        },
      },
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/orders/:id
// @desc    Get single order details
// @access  Private (Admin)
router.get('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const orderResult = await sequelize.query(`
      SELECT 
        o.id as orderId,
        o.order_number as orderNumber,
        o.customer_id,
        o.reseller_id,
        o.total_amount as totalAmount,
        o.shipping_fee as shippingCharges,
        o.discount_amount as discountAmount,
        o.final_amount as finalAmount,
        o.payment_method as paymentMethod,
        o.payment_status as paymentStatus,
        o.payment_id as paymentId,
        o.order_status as orderStatus,
        o.shipping_address as shippingAddress,
        o.billing_address as billingAddress,
        o.tracking_number as trackingNumber,
        o.courier_partner as courierPartner,
        o.notes,
        o.cancelled_reason as cancelledReason,
        o.ordered_at as orderedAt,
        o.shipped_at as shippedAt,
        o.delivered_at as deliveredAt,
        o.cancelled_at as cancelledAt,
        c.full_name as customerName,
        cu.email as customerEmail,
        cu.mobile as customerPhone,
        r.full_name as resellerName,
        ru.email as resellerEmail
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users cu ON c.user_id = cu.id
      LEFT JOIN resellers r ON o.reseller_id = r.id
      LEFT JOIN users ru ON r.user_id = ru.id
      WHERE o.id = :id
    `, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    const order = orderResult[0];

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }

    // Get order items with full details
    const items = await sequelize.query(`
      SELECT 
        oi.*,
        p.name as productName,
        m.company_name as manufacturerName,
        m.brand_name as manufacturerBrand
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN manufacturers m ON oi.manufacturer_id = m.id
      WHERE oi.order_id = :id
    `, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    // Get status history (if table exists)
    const statusHistory = await sequelize.query(`
      SELECT *
      FROM order_status_history
      WHERE order_id = :id
      ORDER BY changed_at DESC
    `, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        order: {
          ...order,
          subtotal: order.totalAmount - (order.shippingCharges || 0)
        },
        items,
        statusHistory,
      },
    });
  } catch (error) {
    console.error('Order details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order details',
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/orders/:id/status
// @desc    Update order status
// @access  Private (Admin)
router.put('/:id/status', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks, trackingInfo } = req.body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid order status',
      });
    }

    // Update order status
    let updateQuery = `
      UPDATE orders 
      SET order_status = :status,
          updated_at = NOW()
    `;

    const replacements = { id, status, remarks, adminId: req.user.id };

    // Add tracking info if status is shipped
    if (status === 'shipped' && trackingInfo) {
      updateQuery += `,
          courier_partner = :courier,
          tracking_number = :trackingNumber,
          shipped_at = NOW()
      `;
      replacements.courier = trackingInfo.courier;
      replacements.trackingNumber = trackingInfo.trackingNumber;
    } else if (status === 'delivered') {
      updateQuery += `, delivered_at = NOW()`;
    } else if (status === 'cancelled') {
      updateQuery += `, cancelled_at = NOW()`;
    }

    updateQuery += ` WHERE id = :id`;

    await sequelize.query(updateQuery, {
      replacements,
      type: QueryTypes.UPDATE
    });

    // Log status change
    await sequelize.query(`
      INSERT INTO order_status_history (order_id, status, notes, changed_by, created_at)
      VALUES (:id, :status, :remarks, :adminId, NOW())
    `, {
      replacements,
      type: QueryTypes.INSERT
    });

    res.json({
      status: 'success',
      message: 'Order status updated successfully',
    });
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update order status',
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/orders/:id/cancel
// @desc    Force cancel an order
// @access  Private (Admin)
router.put('/:id/cancel', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await sequelize.query(`
      UPDATE orders 
      SET order_status = 'cancelled',
          cancelled_reason = :reason,
          cancelled_at = NOW(),
          updated_at = NOW()
      WHERE id = :id AND order_status NOT IN ('delivered', 'cancelled', 'returned')
    `, {
      replacements: { id, reason },
      type: QueryTypes.UPDATE
    });

    // Log status change
    await sequelize.query(`
      INSERT INTO order_status_history (order_id, status, remarks, changed_by, changed_at)
      VALUES (:id, 'cancelled', :reason, :adminId, NOW())
    `, {
      replacements: { id, reason, adminId: req.user.id },
      type: QueryTypes.INSERT
    });

    res.json({
      status: 'success',
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    console.error('Order cancellation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel order',
      error: error.message,
    });
  }
});

module.exports = router;
