const express = require('express');
const router = express.Router();
const { QueryTypes } = require('sequelize');
const { calculateCommission, creditPendingCommission, cancelCommission } = require('../../services/commissionService');
const { sendOrderLifecycleNotifications } = require('../../services/orderLifecycleNotificationService');
const { resolveVariantSelection } = require('../../utils/productVariants');

// @route   POST /api/customer/orders
// @desc    Create a new order (guest or authenticated)
// @access  Public
router.post('/orders', async (req, res) => {
  const sequelize = require('../../config/database');
  const transaction = await sequelize.transaction();

  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      referralCode,
      totalAmount,
    } = req.body;

    console.log('[Customer Order] Creating order:', { items: items.length, totalAmount, referralCode });

    // Validate required fields
    if (!items || items.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Cart is empty',
      });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.mobile || !shippingAddress.email) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Complete shipping information is required',
      });
    }

    // Checkout requires an authenticated customer session.
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      await transaction.rollback();
      return res.status(401).json({
        status: 'error',
        message: 'Please sign in as a customer to place your order',
      });
    }

    let decoded;
    try {
      const { verifyToken } = require('../../utils/jwt');
      decoded = verifyToken(authHeader.substring(7));
    } catch {
      await transaction.rollback();
      return res.status(401).json({ status: 'error', message: 'Invalid or expired customer session' });
    }

    const userId = decoded.id || decoded.userId;
    const [customer] = await sequelize.query(
      'SELECT id FROM customers WHERE user_id = ?',
      {
        replacements: [userId],
        type: QueryTypes.SELECT,
        transaction
      }
    );
    if (!customer) {
      await transaction.rollback();
      return res.status(403).json({
        status: 'error',
        message: 'A customer account is required to place an order',
      });
    }
    const customerId = customer.id;

    // Find reseller from referral code
    const resolvedReferralCode = referralCode
      || items.find((item) => item.referralCode)?.referralCode
      || null;
    let resellerId = null;
    if (resolvedReferralCode) {
      const [reseller] = await sequelize.query(
        `SELECT r.id
         FROM resellers r
         JOIN users u ON r.user_id = u.id
         WHERE r.reseller_code = ? AND u.is_active = TRUE`,
        {
          replacements: [resolvedReferralCode],
          type: QueryTypes.SELECT,
          transaction
        }
      );
      
      if (reseller) {
        resellerId = reseller.id;
        console.log('[Customer Order] Referral code valid, reseller:', resellerId);
      } else {
        console.warn('[Customer Order] Invalid referral code:', resolvedReferralCode);
      }
    }

    // Preserve the first valid reseller attribution on the customer profile.
    if (resellerId) {
      await sequelize.query(
        `UPDATE customers
         SET referred_by_reseller = COALESCE(referred_by_reseller, ?),
             updated_at = NOW()
         WHERE id = ?`,
        {
          replacements: [resellerId, customerId],
          type: QueryTypes.UPDATE,
          transaction
        }
      );
    }

    // Generate order number
    const orderNumber = `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Calculate commission
    const { totalCommission } = await calculateCommission(items, resellerId, sequelize);
    
    console.log('[Customer Order] Commission calculated:', { totalCommission, resellerId });

    // Create order
    await sequelize.query(
      `INSERT INTO orders 
       (order_number, customer_id, reseller_id, total_amount, final_amount, 
        shipping_address, payment_method, payment_status, order_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'new', NOW(), NOW())`,
      {
        replacements: [
          orderNumber,
          customerId,
          resellerId || null,
          totalAmount,
          totalAmount,
          JSON.stringify(shippingAddress),
          paymentMethod
        ],
        type: QueryTypes.INSERT,
        transaction
      }
    );

    // Get created order ID
    const [order] = await sequelize.query(
      'SELECT id FROM orders WHERE order_number = ?',
      {
        replacements: [orderNumber],
        type: QueryTypes.SELECT,
        transaction
      }
    );
    const orderId = order.id;

    // Create order items with commission
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Get full product details for order item
      const [product] = await sequelize.query(
        `SELECT 
          p.id, p.name, p.sku, p.manufacturer_id,
          p.cost_price, p.reseller_margin, p.skaarvi_margin, p.selling_price,
          p.stock_quantity
         FROM products p
         WHERE p.id = ? AND p.deleted_at IS NULL
         FOR UPDATE`,
        {
          replacements: [item.productId],
          type: QueryTypes.SELECT,
          transaction
        }
      );

      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      // Calculate amounts
      const sellingPrice = parseFloat(product.selling_price) || 0;
      const resellerMargin = parseFloat(product.reseller_margin) || 0;
      const skaarviMargin = parseFloat(product.skaarvi_margin) || 0;
      const costPrice = parseFloat(product.cost_price) || 0;
      const quantity = parseInt(item.quantity) || 0;

      if (quantity < 1) {
        const quantityError = new Error(`Invalid quantity for ${product.name}`);
        quantityError.statusCode = 400;
        throw quantityError;
      }

      const productVariants = await sequelize.query(
        `SELECT id, size_label, color_name, stock_quantity
         FROM product_variants
         WHERE product_id = ?
         FOR UPDATE`,
        {
          replacements: [product.id],
          type: QueryTypes.SELECT,
          transaction
        }
      );
      const selectedSize = typeof item.selectedSize === 'string' ? item.selectedSize.trim() : '';
      const selectedColor = typeof item.selectedColor === 'string' ? item.selectedColor.trim() : '';
      const {
        selectedVariant,
        usesSizes: productUsesSizes,
        usesColors: productUsesColors,
      } = resolveVariantSelection(productVariants, selectedSize, selectedColor);

      if (productUsesSizes && !selectedSize) {
        const sizeError = new Error(`Please select a size for ${product.name}`);
        sizeError.statusCode = 400;
        throw sizeError;
      }
      if (productUsesColors && !selectedColor) {
        const colorError = new Error(`Please select a color for ${product.name}`);
        colorError.statusCode = 400;
        throw colorError;
      }
      if (productVariants.length > 0 && !selectedVariant) {
        const variantError = new Error(`The selected size and color combination is not available for ${product.name}`);
        variantError.statusCode = 400;
        throw variantError;
      }
      if (selectedVariant && selectedVariant.stock_quantity < quantity) {
        const variantDescription = [selectedVariant.color_name, selectedVariant.size_label]
          .filter(Boolean)
          .join(' / ');
        const stockError = new Error(`Only ${selectedVariant.stock_quantity} unit(s) of ${product.name} (${variantDescription}) are available`);
        stockError.statusCode = 409;
        throw stockError;
      }
      if (product.stock_quantity < quantity) {
        const stockError = new Error(`Only ${product.stock_quantity} unit(s) of ${product.name} are available`);
        stockError.statusCode = 409;
        throw stockError;
      }

      const itemTotal = sellingPrice * quantity;
      const resellerCommission = resellerMargin * quantity;
      const skaarviRevenue = skaarviMargin * quantity;
      const platformFee = resellerCommission + skaarviRevenue;
      const manufacturerAmount = itemTotal - platformFee;

      await sequelize.query(
        `INSERT INTO order_items 
         (order_id, product_id, manufacturer_id, product_name, product_sku,
          quantity, selected_size, selected_color, cost_price, reseller_margin, skaarvi_margin, selling_price,
          item_total, platform_fee, manufacturer_amount, reseller_commission, skaarvi_revenue,
          created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        {
          replacements: [
            orderId,
            product.id,
            product.manufacturer_id,
            product.name,
            product.sku || null,
            quantity,
            selectedVariant?.size_label || null,
            selectedVariant?.color_name || null,
            costPrice,
            resellerMargin,
            skaarviMargin,
            sellingPrice,
            itemTotal,
            platformFee,
            manufacturerAmount,
            resellerCommission,
            skaarviRevenue
          ],
          type: QueryTypes.INSERT,
          transaction
        }
      );

      if (selectedVariant) {
        await sequelize.query(
          `UPDATE product_variants
           SET stock_quantity = stock_quantity - ?
           WHERE id = ?`,
          {
            replacements: [quantity, selectedVariant.id],
            type: QueryTypes.UPDATE,
            transaction
          }
        );
      }

      // Update product stock
      await sequelize.query(
        `UPDATE products 
         SET stock_quantity = stock_quantity - ?,
             sales_count = sales_count + ?
         WHERE id = ?`,
        {
          replacements: [quantity, quantity, product.id],
          type: QueryTypes.UPDATE,
          transaction
        }
      );
    }

    // Credit pending commission to reseller wallet
    if (resellerId && totalCommission > 0) {
      await creditPendingCommission(orderId, orderNumber, resellerId, totalCommission, sequelize, transaction);
    }

    // Update customer total orders and spent
    await sequelize.query(
      `UPDATE customers 
       SET total_orders = total_orders + 1,
           total_spent = total_spent + ?,
           updated_at = NOW()
       WHERE id = ?`,
      {
        replacements: [totalAmount, customerId],
        type: QueryTypes.UPDATE,
        transaction
      }
    );

    await transaction.commit();

    console.log('[Customer Order] Order created successfully:', orderNumber);

    await sendOrderLifecycleNotifications({
      sequelize,
      orderId,
      event: 'placed',
    });

    res.status(201).json({
      status: 'success',
      message: 'Order placed successfully!',
      data: {
        orderId,
        orderNumber,
        totalAmount,
        isGuestOrder: false,
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('[Customer Order] Error creating order:', error);
    res.status(error.statusCode || 500).json({
      status: 'error',
      message: error.statusCode ? error.message : 'Failed to place order',
      error: error.message
    });
  }
});

// @route   GET /api/customer/orders
// @desc    Get customer orders (requires authentication)
// @access  Private (Customer)
router.get('/orders', async (req, res) => {
  const sequelize = require('../../config/database');

  try {
    // Get user ID from token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const token = authHeader.substring(7);
    const { verifyToken } = require('../../utils/jwt');
    const decoded = verifyToken(token);
    const userId = decoded.id;

    // Get customer ID
    const [customer] = await sequelize.query(
      'SELECT id FROM customers WHERE user_id = ?',
      {
        replacements: [userId],
        type: QueryTypes.SELECT
      }
    );

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found',
      });
    }

    // Get orders
    const orders = await sequelize.query(
      `SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.final_amount,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.created_at,
        COUNT(oi.id) as item_count
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.customer_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      {
        replacements: [customer.id],
        type: QueryTypes.SELECT
      }
    );

    res.json({
      status: 'success',
      data: {
        orders,
      }
    });

  } catch (error) {
    console.error('[Customer Orders] Error fetching orders:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// @route   GET /api/customer/orders/:id
// @desc    Get order details
// @access  Private (Customer)
router.get('/orders/:id', async (req, res) => {
  const sequelize = require('../../config/database');

  try {
    const { id } = req.params;

    // Get user ID from token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const token = authHeader.substring(7);
    const { verifyToken } = require('../../utils/jwt');
    const decoded = verifyToken(token);
    const userId = decoded.id;

    // Get customer ID
    const [customer] = await sequelize.query(
      'SELECT id FROM customers WHERE user_id = ?',
      {
        replacements: [userId],
        type: QueryTypes.SELECT
      }
    );

    if (!customer) {
      return res.status(404).json({
        status: 'error',
        message: 'Customer not found',
      });
    }

    // Get order details
    const [order] = await sequelize.query(
      `SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.final_amount,
        o.shipping_address,
        o.payment_method,
        o.payment_status,
        o.order_status,
        o.created_at,
        o.updated_at
       FROM orders o
       WHERE o.id = ? AND o.customer_id = ?`,
      {
        replacements: [id, customer.id],
        type: QueryTypes.SELECT
      }
    );

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }

    // Get order items
    const items = await sequelize.query(
      `SELECT 
        oi.id,
        oi.product_id,
        oi.product_name,
        oi.quantity,
        oi.selected_size,
        oi.selected_color,
        oi.selling_price as price,
        oi.item_total as subtotal,
        (SELECT image_url FROM product_images WHERE product_id = oi.product_id ORDER BY sort_order LIMIT 1) as product_image
       FROM order_items oi
       WHERE oi.order_id = ?`,
      {
        replacements: [id],
        type: QueryTypes.SELECT
      }
    );

    res.json({
      status: 'success',
      data: {
        order: {
          ...order,
          shipping_address: typeof order.shipping_address === 'string' 
            ? JSON.parse(order.shipping_address) 
            : order.shipping_address,
        },
        items,
      }
    });

  } catch (error) {
    console.error('[Customer Order Details] Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order details',
      error: error.message
    });
  }
});

// @route   POST /api/customer/orders/:id/cancel
// @desc    Cancel an order (only for new or processing status)
// @access  Private (Customer only)
router.post('/orders/:id/cancel', async (req, res) => {
  const sequelize = require('../../config/database');
  const transaction = await sequelize.transaction();

  try {
    const { id: orderId } = req.params;
    const { reason, details } = req.body;

    console.log('[Customer Order] Cancel request:', { orderId, reason });

    // Validate required fields
    if (!reason) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Cancellation reason is required',
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

    // Get customer ID
    const [customer] = await sequelize.query(
      'SELECT id FROM customers WHERE user_id = ?',
      {
        replacements: [userId],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (!customer) {
      await transaction.rollback();
      return res.status(403).json({
        status: 'error',
        message: 'Customer account not found',
      });
    }

    // Get order details
    const [order] = await sequelize.query(
      `SELECT 
        id, order_number, customer_id, reseller_id, order_status, 
        total_amount, commission_paid
      FROM orders 
      WHERE id = ? AND customer_id = ?`,
      {
        replacements: [orderId, customer.id],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Order not found or you do not have permission to cancel this order',
      });
    }

    // Check if order can be cancelled (only new or processing status)
    if (!['new', 'processing'].includes(order.order_status)) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: `Orders with status '${order.order_status}' cannot be cancelled`,
        code: 'INVALID_STATUS',
      });
    }

    // Update order status to cancelled
    const cancelledReason = details ? `${reason}: ${details}` : reason;
    await sequelize.query(
      `UPDATE orders 
       SET order_status = 'cancelled',
           cancelled_reason = ?,
           cancelled_at = NOW(),
           updated_at = NOW()
       WHERE id = ?`,
      {
        replacements: [cancelledReason, orderId],
        type: QueryTypes.UPDATE,
        transaction
      }
    );

    // Record status change in history
    await sequelize.query(
      `INSERT INTO order_status_history 
       (order_id, status, notes, changed_by, created_at)
       VALUES (?, 'cancelled', ?, ?, NOW())`,
      {
        replacements: [orderId, `Order cancelled by customer. Reason: ${cancelledReason}`, userId],
        type: QueryTypes.INSERT,
        transaction
      }
    );

    // Restore product stock for each order item
    const orderItems = await sequelize.query(
      'SELECT oi.product_id, oi.quantity, oi.manufacturer_id, oi.selected_size, oi.selected_color FROM order_items oi WHERE oi.order_id = ?',
      {
        replacements: [orderId],
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

      if (item.selected_size || item.selected_color) {
        await sequelize.query(
          `UPDATE product_variants
           SET stock_quantity = stock_quantity + ?
           WHERE product_id = ?
             AND (size_label = ? OR (size_label IS NULL AND ? IS NULL))
             AND (color_name = ? OR (color_name IS NULL AND ? IS NULL))`,
          {
            replacements: [
              item.quantity,
              item.product_id,
              item.selected_size,
              item.selected_size,
              item.selected_color,
              item.selected_color
            ],
            type: QueryTypes.UPDATE,
            transaction
          }
        );
      }

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
            `Stock restored due to order ${order.order_number} cancellation`,
            userId
          ],
          type: QueryTypes.INSERT,
          transaction
        }
      );
    }

    await cancelCommission(orderId, sequelize, transaction);

    await transaction.commit();

    console.log('[Customer Order] Order cancelled successfully:', order.order_number);

    await sendOrderLifecycleNotifications({
      sequelize,
      orderId,
      event: 'cancelled',
      details: { reason: cancelledReason },
    });

    res.status(200).json({
      status: 'success',
      message: 'Order cancelled successfully',
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        status: 'cancelled',
        cancelledReason: cancelledReason
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('[Customer Order] Cancel error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel order',
      error: error.message
    });
  }
});

// @route   POST /api/customer/orders/:id/return
// @desc    Request return for a delivered order (within 7 days)
// @access  Private (Customer only)
router.post('/orders/:id/return', async (req, res) => {
  const sequelize = require('../../config/database');
  const transaction = await sequelize.transaction();

  try {
    const { id: orderId } = req.params;
    const { reason, description, images, bankDetails } = req.body;

    console.log('[Customer Order] Return request:', { orderId, reason });

    // Validate required fields
    if (!reason || !description) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Return reason and description are required',
      });
    }

    if (description.length < 20) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a detailed description (at least 20 characters)',
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

    // Get customer ID
    const [customer] = await sequelize.query(
      'SELECT id FROM customers WHERE user_id = ?',
      {
        replacements: [userId],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (!customer) {
      await transaction.rollback();
      return res.status(403).json({
        status: 'error',
        message: 'Customer account not found',
      });
    }

    // Get order details
    const [order] = await sequelize.query(
      `SELECT 
        id, order_number, customer_id, reseller_id, order_status, 
        delivered_at, total_amount
      FROM orders 
      WHERE id = ? AND customer_id = ?`,
      {
        replacements: [orderId, customer.id],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        status: 'error',
        message: 'Order not found or you do not have permission to return this order',
      });
    }

    // Check if order is delivered
    if (order.order_status !== 'delivered') {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Only delivered orders can be returned',
        code: 'INVALID_STATUS',
      });
    }

    // Check if order is within 7-day return window
    if (!order.delivered_at) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Order delivery date not found',
      });
    }

    const [result] = await sequelize.query(
      'SELECT DATEDIFF(NOW(), ?) as days_from_delivery',
      {
        replacements: [order.delivered_at],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    const daysFromDelivery = result.days_from_delivery;
    if (daysFromDelivery > 7) {
      await transaction.rollback();
      return res.status(400).json({
        status: 'error',
        message: 'Return window has expired (7 days from delivery)',
        code: 'RETURN_WINDOW_EXPIRED',
        daysFromDelivery
      });
    }

    // Update order with return request
    const returnImagesJson = images ? JSON.stringify(images) : null;
    await sequelize.query(
      `UPDATE orders 
       SET return_requested_at = NOW(),
           return_reason = ?,
           return_status = 'pending',
           return_images = ?,
           updated_at = NOW()
       WHERE id = ?`,
      {
        replacements: [description, returnImagesJson, orderId],
        type: QueryTypes.UPDATE,
        transaction
      }
    );

    // Record status change in history
    await sequelize.query(
      `INSERT INTO order_status_history 
       (order_id, status, notes, changed_by, created_at)
       VALUES (?, 'return_requested', ?, ?, NOW())`,
      {
        replacements: [
          orderId,
          `Return requested by customer. Reason: ${reason} - ${description}`,
          userId
        ],
        type: QueryTypes.INSERT,
        transaction
      }
    );

    // Create notification for admin
    await sequelize.query(
      `INSERT INTO notifications 
       (user_id, type, title, message, reference_id, reference_type, created_at)
       SELECT id, 'return_request', 'New Return Request', ?, ?, 'order', NOW()
       FROM users WHERE role = 'admin' LIMIT 1`,
      {
        replacements: [
          `Customer has requested return for order ${order.order_number}. Reason: ${reason}`,
          orderId
        ],
        type: QueryTypes.INSERT,
        transaction
      }
    );

    await transaction.commit();

    console.log('[Customer Order] Return request submitted successfully:', order.order_number);

    await sendOrderLifecycleNotifications({
      sequelize,
      orderId,
      event: 'return_requested',
      details: { reason: `${reason}: ${description}` },
    });

    res.status(200).json({
      status: 'success',
      message: 'Return request submitted successfully. Our team will review it within 2-3 business days.',
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        returnStatus: 'pending',
        returnReason: reason,
        daysFromDelivery
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('[Customer Order] Return request error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to submit return request',
      error: error.message
    });
  }
});

// @route   GET /api/customer/returns
// @desc    Get all return requests for the authenticated customer
// @access  Private (Customer only)
router.get('/returns', async (req, res) => {
  const sequelize = require('../../config/database');

  try {
    // Get user ID from token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Get customer ID
    const [customer] = await sequelize.query(
      'SELECT id FROM customers WHERE user_id = ?',
      {
        replacements: [userId],
        type: QueryTypes.SELECT
      }
    );

    if (!customer) {
      return res.status(403).json({
        status: 'error',
        message: 'Customer account not found',
      });
    }

    // Get all return requests
    const returns = await sequelize.query(
      `SELECT 
        o.id,
        o.order_number,
        o.total_amount,
        o.return_requested_at,
        o.return_reason,
        o.return_status,
        o.return_approved_at,
        o.return_rejected_at,
        o.admin_notes,
        o.return_images,
        o.refund_amount,
        o.refund_status,
        o.delivered_at,
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
      WHERE o.customer_id = ? AND o.return_status IS NOT NULL
      ORDER BY o.return_requested_at DESC`,
      {
        replacements: [customer.id],
        type: QueryTypes.SELECT
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        returns: returns.map(r => ({
          ...r,
          return_images: r.return_images ? JSON.parse(r.return_images) : []
        }))
      }
    });

  } catch (error) {
    console.error('[Customer Returns] Fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch return requests',
      error: error.message
    });
  }
});

module.exports = router;
