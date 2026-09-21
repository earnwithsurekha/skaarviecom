const { QueryTypes } = require('sequelize');
const notificationService = require('./notificationService');
const { sendOrderLifecycleEmail } = require('./orderEmailService');
const {
  loadManufacturerOrderContexts,
  sendManufacturerNewOrderEmails,
} = require('./manufacturerOrderEmailService');

const CUSTOMER_EVENTS = {
  placed: ['Order Placed Successfully', 'Your order has been received.', 'normal'],
  processing: ['Order Processing', 'Your order is being prepared.', 'normal'],
  shipped: ['Order Shipped', 'Your order is on the way.', 'normal'],
  delivered: ['Order Delivered', 'Your order has been delivered.', 'normal'],
  cancelled: ['Order Cancelled', 'Your order has been cancelled.', 'high'],
  return_requested: ['Return Request Received', 'Your return request is under review.', 'normal'],
  return_approved: ['Return Approved', 'Your return request was approved.', 'normal'],
  return_rejected: ['Return Request Rejected', 'Your return request was not approved.', 'high'],
};

const MANUFACTURER_EVENTS = {
  cancelled: ['Order Cancelled', 'An order containing your products was cancelled.', 'high'],
  return_requested: ['Return Requested', 'A return was requested for an order containing your products.', 'high'],
  return_approved: ['Return Approved', 'A return involving your products was approved.', 'normal'],
  return_rejected: ['Return Rejected', 'A return involving your products was rejected.', 'normal'],
};

const loadOrderIdentity = async (sequelize, orderId) => {
  const [order] = await sequelize.query(
    `SELECT o.id, o.order_number, c.user_id AS customer_user_id
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     WHERE o.id = ?`,
    { replacements: [orderId], type: QueryTypes.SELECT }
  );
  return order;
};

const createCustomerNotification = async ({ sequelize, orderId, event, details }) => {
  const eventContent = CUSTOMER_EVENTS[event];
  if (!eventContent) return null;
  const order = await loadOrderIdentity(sequelize, orderId);
  if (!order?.customer_user_id) return null;

  const [title, baseMessage, priority] = eventContent;
  const tracking = details.trackingNumber ? ` Tracking: ${details.trackingNumber}.` : '';
  const reason = details.reason ? ` ${details.reason}` : '';
  return notificationService.createNotification({
    userId: order.customer_user_id,
    type: `order_${event}`,
    title,
    message: `${baseMessage} Order ${order.order_number}.${tracking}${reason}`,
    data: {
      orderId,
      orderNumber: order.order_number,
      event,
      url: `/customer/orders/${orderId}`,
    },
    priority,
  });
};

const createManufacturerNotifications = async ({ sequelize, orderId, event, details }) => {
  const contexts = await loadManufacturerOrderContexts(sequelize, orderId);

  if (event === 'placed') {
    return Promise.all(contexts.map((context) => {
      const itemsCount = context.items.reduce((total, item) => total + Number(item.quantity || 0), 0);
      const totalAmount = context.items.reduce((total, item) => total + Number(item.manufacturer_amount || 0), 0);
      return notificationService.notifyNewOrder(context.userId, {
        orderId,
        orderNumber: context.order.order_number,
        itemsCount,
        totalAmount: totalAmount.toFixed(2),
        url: `/manufacturer/orders/${orderId}`,
      });
    }));
  }

  const eventContent = MANUFACTURER_EVENTS[event];
  if (!eventContent) return [];
  const [title, message, priority] = eventContent;
  const eventReason = details.reason || details.notes;
  const eventReasonSuffix = eventReason ? ` ${eventReason}` : '';
  return Promise.all(contexts.map((context) => notificationService.createNotification({
    userId: context.userId,
    type: `order_${event}`,
    title,
    message: `${message} Order ${context.order.order_number}.${eventReasonSuffix}`,
    data: {
      orderId,
      orderNumber: context.order.order_number,
      event,
      url: `/manufacturer/orders/${orderId}`,
    },
    priority,
  })));
};

const sendOrderLifecycleNotifications = async ({ sequelize, orderId, event, details = {} }) => {
  const tasks = [
    sendOrderLifecycleEmail({ sequelize, orderId, event, details }),
    createCustomerNotification({ sequelize, orderId, event, details }),
    createManufacturerNotifications({ sequelize, orderId, event, details }),
  ];
  if (event === 'placed') {
    tasks.push(sendManufacturerNewOrderEmails({ sequelize, orderId }));
  }

  const results = await Promise.allSettled(tasks);
  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.error(`[Order Notifications] ${event} delivery failed:`, result.reason?.message || result.reason);
    }
  });
  return results;
};

module.exports = {
  sendOrderLifecycleNotifications,
};