jest.mock('./notificationService', () => ({
  createNotification: jest.fn(),
  notifyNewOrder: jest.fn(),
}));
jest.mock('./orderEmailService', () => ({
  sendOrderLifecycleEmail: jest.fn(),
}));
jest.mock('./manufacturerOrderEmailService', () => ({
  loadManufacturerOrderContexts: jest.fn(),
  sendManufacturerNewOrderEmails: jest.fn(),
}));

const notificationService = require('./notificationService');
const { sendOrderLifecycleEmail } = require('./orderEmailService');
const {
  loadManufacturerOrderContexts,
  sendManufacturerNewOrderEmails,
} = require('./manufacturerOrderEmailService');
const { sendOrderLifecycleNotifications } = require('./orderLifecycleNotificationService');

const sequelize = {
  query: jest.fn(),
};

const manufacturerContexts = [
  {
    userId: 'manufacturer-user-1',
    manufacturerId: 'manufacturer-1',
    order: { order_number: 'ORD-100' },
    items: [
      { quantity: 2, manufacturer_amount: 200 },
      { quantity: 1, manufacturer_amount: 80 },
    ],
  },
  {
    userId: 'manufacturer-user-2',
    manufacturerId: 'manufacturer-2',
    order: { order_number: 'ORD-100' },
    items: [{ quantity: 3, manufacturer_amount: 150 }],
  },
];

describe('order lifecycle notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sequelize.query.mockResolvedValue([{
      id: 'order-1',
      order_number: 'ORD-100',
      customer_user_id: 'customer-user-1',
    }]);
    loadManufacturerOrderContexts.mockResolvedValue(manufacturerContexts);
    sendManufacturerNewOrderEmails.mockResolvedValue({ contexts: manufacturerContexts, results: [] });
    sendOrderLifecycleEmail.mockResolvedValue({ success: true });
    notificationService.createNotification.mockResolvedValue({ id: 'notification-1' });
    notificationService.notifyNewOrder.mockResolvedValue({ id: 'notification-2' });
  });

  test('notifies the customer and every manufacturer when an order is placed', async () => {
    const results = await sendOrderLifecycleNotifications({
      sequelize,
      orderId: 'order-1',
      event: 'placed',
    });

    expect(results.every((result) => result.status === 'fulfilled')).toBe(true);
    expect(sendOrderLifecycleEmail).toHaveBeenCalledWith({
      sequelize,
      orderId: 'order-1',
      event: 'placed',
      details: {},
    });
    expect(notificationService.createNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'customer-user-1',
      type: 'order_placed',
      data: expect.objectContaining({ url: '/customer/orders/order-1' }),
    }));
    expect(notificationService.notifyNewOrder).toHaveBeenCalledTimes(2);
    expect(notificationService.notifyNewOrder).toHaveBeenCalledWith(
      'manufacturer-user-1',
      expect.objectContaining({
        orderId: 'order-1',
        orderNumber: 'ORD-100',
        itemsCount: 3,
        totalAmount: '280.00',
        url: '/manufacturer/orders/order-1',
      })
    );
    expect(sendManufacturerNewOrderEmails).toHaveBeenCalledWith({ sequelize, orderId: 'order-1' });
  });

  test('sends customer status updates without repeating the new-order email', async () => {
    await sendOrderLifecycleNotifications({
      sequelize,
      orderId: 'order-1',
      event: 'shipped',
      details: { trackingNumber: 'TRACK-1' },
    });

    expect(notificationService.createNotification).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'customer-user-1',
      type: 'order_shipped',
      message: expect.stringContaining('TRACK-1'),
    }));
    expect(notificationService.notifyNewOrder).not.toHaveBeenCalled();
    expect(sendManufacturerNewOrderEmails).not.toHaveBeenCalled();
  });

  test('contains notification delivery failures after the order is committed', async () => {
    notificationService.createNotification.mockRejectedValue(new Error('FCM unavailable'));

    await expect(sendOrderLifecycleNotifications({
      sequelize,
      orderId: 'order-1',
      event: 'delivered',
    })).resolves.toEqual(expect.arrayContaining([
      expect.objectContaining({ status: 'rejected' }),
    ]));
  });
});
