const express = require('express');
const router = express.Router();
const { authMiddleware, manufacturerOnly } = require('../middleware/auth');
const { Order, OrderItem, OrderStatusHistory } = require('../models/order');
const { ORDER_STATUS } = require('../config/constants');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { sendOrderLifecycleEmail } = require('../services/orderEmailService');

const ORDER_STATUS_EMAIL_EVENTS = {
  accepted: 'processing',
  processing: 'processing',
  shipped: 'shipped',
  delivered: 'delivered',
  cancelled: 'cancelled',
};

// @route   GET /api/orders
// @desc    Get all orders for manufacturer
// @access  Private (Manufacturer)
router.get('/', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, startDate, endDate } = req.query;
    const manufacturerId = req.user.manufacturerId;

    // Build where clause for filtering
    const where = {};
    
    if (status && status !== 'all') {
      where.orderStatus = status;
    }

    if (startDate || endDate) {
      where.orderedAt = {};
      if (startDate) {
        where.orderedAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.orderedAt[Op.lte] = new Date(endDate);
      }
    }

    if (search) {
      where[Op.or] = [
        { orderNumber: { [Op.like]: `%${search}%` } },
        { '$items.productName$': { [Op.like]: `%${search}%` } }
      ];
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Query orders with items filtered by manufacturer
    const { count, rows: orders } = await Order.findAndCountAll({
      where,
      include: [{
        model: OrderItem,
        as: 'items',
        where: { manufacturerId },
        required: true,
        attributes: ['id', 'productName', 'productSku', 'quantity', 'sellingPrice', 'itemTotal']
      }],
      limit: parseInt(limit),
      offset: offset,
      order: [['orderedAt', 'DESC']],
      distinct: true
    });

    // Format response
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      productName: order.items[0]?.productName || 'N/A',
      productSku: order.items[0]?.productSku,
      totalQuantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
      orderedAt: order.orderedAt,
      shippingAddress: order.shippingAddress,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      finalAmount: order.finalAmount,
      items: order.items,
      trackingNumber: order.trackingNumber,
      courierPartner: order.courierPartner
    }));

    res.status(200).json({
      status: 'success',
      data: {
        orders: formattedOrders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order details
// @access  Private (Manufacturer)
router.get('/:id', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const manufacturerId = req.user.manufacturerId;

    const order = await Order.findOne({
      where: { id },
      include: [
        {
          model: OrderItem,
          as: 'items',
          where: { manufacturerId },
          required: true
        },
        {
          model: OrderStatusHistory,
          as: 'statusHistory',
          order: [['changedAt', 'ASC']]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found or you do not have access to this order'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
});

// @route   PATCH /api/orders/:id/status
// @desc    Update order status
// @access  Private (Manufacturer)
router.patch('/:id/status', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const manufacturerId = req.user.manufacturerId;
    const userId = req.user.userId;

    // Validate status
    const validStatuses = Object.values(ORDER_STATUS);
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid order status'
      });
    }

    // Find order
    const order = await Order.findOne({
      where: { id },
      include: [{
        model: OrderItem,
        as: 'items',
        where: { manufacturerId },
        required: true
      }]
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found or you do not have access to this order'
      });
    }

    // Update order status
    await order.update({ orderStatus: status });

    // Create status history entry
    await OrderStatusHistory.create({
      orderId: order.id,
      status: status,
      changedBy: userId,
      notes: notes || null
    });

    const emailEvent = ORDER_STATUS_EMAIL_EVENTS[status];
    if (emailEvent) {
      await sendOrderLifecycleEmail({
        sequelize,
        orderId: order.id,
        event: emailEvent,
        details: { reason: notes },
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Order status updated successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
});

// @route   POST /api/orders/:id/accept
// @desc    Accept order
// @access  Private (Manufacturer)
router.post('/:id/accept', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const manufacturerId = req.user.manufacturerId;
    const userId = req.user.userId;

    const order = await Order.findOne({
      where: { id },
      include: [{
        model: OrderItem,
        as: 'items',
        where: { manufacturerId },
        required: true
      }]
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found or you do not have access to this order'
      });
    }

    if (order.orderStatus !== ORDER_STATUS.NEW) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot accept order with status: ${order.orderStatus}`
      });
    }

    await order.update({ orderStatus: ORDER_STATUS.PROCESSING });

    await OrderStatusHistory.create({
      orderId: order.id,
      status: ORDER_STATUS.PROCESSING,
      changedBy: userId,
      notes: 'Order accepted by manufacturer'
    });

    await sendOrderLifecycleEmail({
      sequelize,
      orderId: order.id,
      event: 'processing',
    });

    res.status(200).json({
      status: 'success',
      message: 'Order accepted successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
});

// @route   POST /api/orders/:id/ship
// @desc    Mark order as shipped with tracking
// @access  Private (Manufacturer)
router.post('/:id/ship', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { trackingNumber, courierPartner, notes } = req.body;
    const manufacturerId = req.user.manufacturerId;
    const userId = req.user.userId;

    if (!trackingNumber || !courierPartner) {
      return res.status(400).json({
        status: 'error',
        message: 'Tracking number and courier partner are required'
      });
    }

    const order = await Order.findOne({
      where: { id },
      include: [{
        model: OrderItem,
        as: 'items',
        where: { manufacturerId },
        required: true
      }]
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found or you do not have access to this order'
      });
    }

    if (order.orderStatus !== ORDER_STATUS.PROCESSING) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot ship order with status: ${order.orderStatus}`
      });
    }

    await order.update({
      orderStatus: ORDER_STATUS.SHIPPED,
      trackingNumber,
      courierPartner,
      shippedAt: new Date()
    });

    await OrderStatusHistory.create({
      orderId: order.id,
      status: ORDER_STATUS.SHIPPED,
      changedBy: userId,
      notes: notes || `Shipped via ${courierPartner}, Tracking: ${trackingNumber}`
    });

    await sendOrderLifecycleEmail({
      sequelize,
      orderId: order.id,
      event: 'shipped',
      details: { trackingNumber, courierPartner },
    });

    res.status(200).json({
      status: 'success',
      message: 'Order marked as shipped successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Ship order error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
});

// @route   POST /api/orders/:id/deliver
// @desc    Mark order as delivered
// @access  Private (Manufacturer)
router.post('/:id/deliver', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const manufacturerId = req.user.manufacturerId;
    const userId = req.user.userId;

    const order = await Order.findOne({
      where: { id },
      include: [{
        model: OrderItem,
        as: 'items',
        where: { manufacturerId },
        required: true
      }]
    });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found or you do not have access to this order'
      });
    }

    if (order.orderStatus !== ORDER_STATUS.SHIPPED) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot mark as delivered from status: ${order.orderStatus}`
      });
    }

    await order.update({
      orderStatus: ORDER_STATUS.DELIVERED,
      deliveredAt: new Date()
    });

    await OrderStatusHistory.create({
      orderId: order.id,
      status: ORDER_STATUS.DELIVERED,
      changedBy: userId,
      notes: notes || 'Order delivered successfully'
    });

    await sendOrderLifecycleEmail({
      sequelize,
      orderId: order.id,
      event: 'delivered',
    });

    res.status(200).json({
      status: 'success',
      message: 'Order marked as delivered successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Deliver order error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
});

module.exports = router;
