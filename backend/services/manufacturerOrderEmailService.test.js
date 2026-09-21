jest.mock('../utils/email', () => ({
  sendEmail: jest.fn(),
}));

const { sendEmail } = require('../utils/email');
const { sendManufacturerNewOrderEmails } = require('./manufacturerOrderEmailService');

const order = {
  id: 'order-1',
  order_number: 'ORD-100',
  ordered_at: new Date('2026-09-20T10:00:00Z'),
};

const items = [
  {
    manufacturer_id: 'manufacturer-1',
    user_id: 'user-1',
    company_name: 'First Manufacturer',
    email: 'first@example.com',
    product_name: 'Red T Shirt',
    product_sku: 'TS-RED',
    selected_size: 'M',
    selected_color: 'Red',
    quantity: 2,
    manufacturer_amount: 200,
  },
  {
    manufacturer_id: 'manufacturer-2',
    user_id: 'user-2',
    company_name: 'Second Manufacturer',
    email: 'second@example.com',
    product_name: 'Blue Shoes',
    product_sku: 'SH-BLUE',
    selected_size: 'UK/India 8',
    selected_color: 'Blue',
    quantity: 1,
    manufacturer_amount: 150,
  },
];

describe('manufacturer new order email', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sendEmail.mockResolvedValue({ success: true, messageId: 'message-1' });
  });

  test('sends each manufacturer only their own order items', async () => {
    const sequelize = {
      query: jest.fn()
        .mockResolvedValueOnce([order])
        .mockResolvedValueOnce(items),
    };

    const result = await sendManufacturerNewOrderEmails({ sequelize, orderId: 'order-1' });

    expect(result.results).toHaveLength(2);
    expect(sendEmail).toHaveBeenCalledTimes(2);

    const firstEmail = sendEmail.mock.calls.find(([message]) => message.to === 'first@example.com')[0];
    const secondEmail = sendEmail.mock.calls.find(([message]) => message.to === 'second@example.com')[0];
    expect(firstEmail.subject).toBe('New order received - ORD-100');
    expect(firstEmail.html).toContain('Red T Shirt');
    expect(firstEmail.html).toContain('Red / M');
    expect(firstEmail.html).not.toContain('Blue Shoes');
    expect(secondEmail.html).toContain('Blue Shoes');
    expect(secondEmail.html).not.toContain('Red T Shirt');
  });

  test('contains one manufacturer email failure without blocking others', async () => {
    const sequelize = {
      query: jest.fn()
        .mockResolvedValueOnce([order])
        .mockResolvedValueOnce(items),
    };
    sendEmail
      .mockRejectedValueOnce(new Error('SMTP unavailable'))
      .mockResolvedValueOnce({ success: true, messageId: 'message-2' });

    const result = await sendManufacturerNewOrderEmails({ sequelize, orderId: 'order-1' });

    expect(result.results).toEqual(expect.arrayContaining([
      expect.objectContaining({ manufacturerId: 'manufacturer-1', success: false }),
      expect.objectContaining({ manufacturerId: 'manufacturer-2', success: true }),
    ]));
  });
});
