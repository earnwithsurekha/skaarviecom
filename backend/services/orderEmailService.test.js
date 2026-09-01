jest.mock('../utils/email', () => ({
  getSenderEmail: jest.fn(() => 'sender@example.com'),
  sendEmail: jest.fn(),
}));

const { sendEmail } = require('../utils/email');
const { sendOrderLifecycleEmail } = require('./orderEmailService');

const order = {
  id: 'order-123',
  order_number: 'ORD123',
  total_amount: '1549.00',
  final_amount: '1549.00',
  shipping_address: JSON.stringify({
    fullName: 'Asha <script>alert(1)</script>',
    email: 'asha@example.com',
    address: '12 Market Road',
    city: 'Hyderabad',
    state: 'Telangana',
    pincode: '500001',
  }),
  payment_method: 'cod',
  payment_status: 'pending',
  order_status: 'new',
  tracking_number: null,
  courier_partner: null,
  cancelled_reason: null,
  ordered_at: '2026-09-01T08:00:00.000Z',
};

const items = [
  {
    product_name: 'Cotton Saree <Premium>',
    product_sku: 'SAR-001',
    quantity: 1,
    selling_price: '1549.00',
    item_total: '1549.00',
  },
];

const createSequelize = (overrides = {}) => ({
  query: jest.fn()
    .mockResolvedValueOnce([{ ...order, ...overrides }])
    .mockResolvedValueOnce(items),
});

describe('sendOrderLifecycleEmail', () => {
  beforeEach(() => {
    sendEmail.mockReset();
    sendEmail.mockResolvedValue({ success: true, messageId: 'message-123' });
  });

  it('sends an escaped order confirmation to the shipping email', async () => {
    const sequelize = createSequelize();

    const result = await sendOrderLifecycleEmail({
      sequelize,
      orderId: order.id,
      event: 'placed',
    });

    expect(result).toEqual({ success: true, messageId: 'message-123' });
    expect(sendEmail).toHaveBeenCalledTimes(1);

    const message = sendEmail.mock.calls[0][0];
    expect(message.to).toBe('asha@example.com');
    expect(message.subject).toBe('Order confirmed - ORD123');
    expect(message.html).toContain('Cotton Saree &lt;Premium&gt;');
    expect(message.html).toContain('Asha &lt;script&gt;alert(1)&lt;/script&gt;');
    expect(message.html).not.toContain('<script>alert(1)</script>');
    expect(message.html).toContain('&#8377;1,549.00');
    expect(message.html).toContain('mailto:sender@example.com');
    expect(message.text).toContain('Order number: ORD123');
    expect(message.text).toContain('Need help? Contact sender@example.com');
  });

  it('includes courier and tracking details in a shipped email', async () => {
    const sequelize = createSequelize();

    await sendOrderLifecycleEmail({
      sequelize,
      orderId: order.id,
      event: 'shipped',
      details: {
        courierPartner: 'Blue Dart',
        trackingNumber: 'BD123456',
      },
    });

    const message = sendEmail.mock.calls[0][0];
    expect(message.subject).toBe('Your order ORD123 has shipped');
    expect(message.html).toContain('Blue Dart');
    expect(message.html).toContain('Tracking number: BD123456');
    expect(message.text).toContain('Tracking number: BD123456');
  });

  it.each([
    ['processing', 'Your order ORD123 is being prepared'],
    ['delivered', 'Your order ORD123 was delivered'],
    ['cancelled', 'Order ORD123 has been cancelled'],
    ['return_requested', 'Return request received - ORD123'],
    ['return_approved', 'Return approved - ORD123'],
    ['return_rejected', 'Return request update - ORD123'],
  ])('builds the expected subject for %s', async (event, subject) => {
    const sequelize = createSequelize();

    await sendOrderLifecycleEmail({
      sequelize,
      orderId: order.id,
      event,
      details: { reason: 'Customer request', notes: 'Reviewed by support' },
    });

    expect(sendEmail.mock.calls[0][0].subject).toBe(subject);
  });

  it('skips an order that has no customer email', async () => {
    const sequelize = createSequelize({
      shipping_address: JSON.stringify({ fullName: 'Asha' }),
    });

    const result = await sendOrderLifecycleEmail({
      sequelize,
      orderId: order.id,
      event: 'placed',
    });

    expect(result).toMatchObject({ success: false, skipped: true, reason: 'EMAIL_MISSING' });
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it('falls back to the customer account email for older orders', async () => {
    const sequelize = createSequelize({
      shipping_address: JSON.stringify({ fullName: 'Asha' }),
      customer_email: 'account@example.com',
    });

    await sendOrderLifecycleEmail({
      sequelize,
      orderId: order.id,
      event: 'placed',
    });

    expect(sendEmail.mock.calls[0][0].to).toBe('account@example.com');
  });

  it('returns a failure instead of throwing when SMTP fails', async () => {
    const sequelize = createSequelize();
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    sendEmail.mockRejectedValue(new Error('SMTP unavailable'));

    const result = await sendOrderLifecycleEmail({
      sequelize,
      orderId: order.id,
      event: 'placed',
    });

    expect(result).toEqual({ success: false, error: 'SMTP unavailable' });
    consoleError.mockRestore();
  });
});