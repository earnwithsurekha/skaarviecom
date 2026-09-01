const { QueryTypes } = require('sequelize');
const { getSenderEmail, sendEmail } = require('../utils/email');

const DEFAULT_APP_URL = process.env.NODE_ENV === 'production'
  ? 'https://skaarvi.shop'
  : 'http://localhost:3000';
const APP_URL = (
  process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL
).replace(/\/$/, '');
const SUPPORT_EMAIL = getSenderEmail();

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const parseJson = (value) => {
  if (!value) return {};
  if (Buffer.isBuffer(value)) return parseJson(value.toString('utf8'));
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('[Order Email] Could not parse shipping address:', error.message);
    return {};
  }
};

const formatAmount = (value) => Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatDate = (value) => {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });
};

const formatPaymentMethod = (value) => {
  const labels = {
    cod: 'Cash on Delivery',
    razorpay: 'Online payment',
    upi: 'UPI',
    wallet: 'Wallet',
  };
  return labels[value] || value || 'Not specified';
};

const getEventContent = (event, context, details) => {
  const { order, customerName } = context;
  const orderNumber = order.order_number;
  const trackingNumber = details.trackingNumber || order.tracking_number;
  const courierPartner = details.courierPartner || order.courier_partner;
  const cancellationReason = details.reason || order.cancelled_reason;
  const returnNotes = details.notes || details.reason;
  const cancellationDetail = cancellationReason ? ` Reason: ${cancellationReason}` : '';
  const returnRequestDetail = returnNotes ? ` Details: ${returnNotes}` : '';
  const returnApprovalDetail = returnNotes ? ` Note: ${returnNotes}` : '';
  const returnRejectionDetail = returnNotes ? ` Reason: ${returnNotes}` : '';

  const events = {
    placed: {
      subject: `Order confirmed - ${orderNumber}`,
      label: 'ORDER CONFIRMED',
      title: `Thank you for your order, ${customerName}`,
      message: `We have received order ${orderNumber} and will let you know as it moves through fulfillment.`,
      note: 'Please keep this email for your records. You will receive another update when your order ships.',
      accent: '#166534',
    },
    processing: {
      subject: `Your order ${orderNumber} is being prepared`,
      label: 'ORDER UPDATE',
      title: 'Your order is now being processed',
      message: `Our fulfillment team has started preparing order ${orderNumber}.`,
      note: 'We will email the courier and tracking details as soon as the order is dispatched.',
      accent: '#1d4ed8',
    },
    shipped: {
      subject: `Your order ${orderNumber} has shipped`,
      label: 'ORDER SHIPPED',
      title: 'Your package is on the way',
      message: courierPartner
        ? `Order ${orderNumber} has been handed to ${courierPartner}.`
        : `Order ${orderNumber} has been handed to the delivery partner.`,
      note: trackingNumber
        ? `Tracking number: ${trackingNumber}`
        : 'Tracking details will appear in My Orders when they are available.',
      accent: '#0369a1',
    },
    delivered: {
      subject: `Your order ${orderNumber} was delivered`,
      label: 'DELIVERED',
      title: 'Your order has been delivered',
      message: `Order ${orderNumber} has been marked as delivered. We hope everything arrived in good condition.`,
      note: 'If anything is not right, you can request a return from My Orders within 7 days of delivery.',
      accent: '#15803d',
    },
    cancelled: {
      subject: `Order ${orderNumber} has been cancelled`,
      label: 'ORDER CANCELLED',
      title: 'Your order has been cancelled',
      message: `Order ${orderNumber} will not be fulfilled.${cancellationDetail}`,
      note: order.payment_status === 'paid'
        ? 'If payment was captured, any applicable refund will be returned according to the original payment method.'
        : 'No payment action is required for this order.',
      accent: '#b91c1c',
    },
    return_requested: {
      subject: `Return request received - ${orderNumber}`,
      label: 'RETURN REQUESTED',
      title: 'We received your return request',
      message: `Your return request for order ${orderNumber} is now under review.${returnRequestDetail}`,
      note: 'Our team will review your request within 2-3 business days and email you when a decision is made.',
      accent: '#a16207',
    },
    return_approved: {
      subject: `Return approved - ${orderNumber}`,
      label: 'RETURN APPROVED',
      title: 'Your return request was approved',
      message: `The return request for order ${orderNumber} has been approved.${returnApprovalDetail}`,
      note: 'Your refund is now pending and is normally processed within 5-7 business days.',
      accent: '#15803d',
    },
    return_rejected: {
      subject: `Return request update - ${orderNumber}`,
      label: 'RETURN UPDATE',
      title: 'Your return request was not approved',
      message: `The return request for order ${orderNumber} could not be approved.${returnRejectionDetail}`,
      note: `If you need clarification, contact ${SUPPORT_EMAIL} and include your order number.`,
      accent: '#b91c1c',
    },
  };

  return events[event];
};

const loadOrderEmailContext = async (sequelize, orderId) => {
  const [order] = await sequelize.query(
    `SELECT
      o.id, o.order_number, o.total_amount, o.final_amount, o.shipping_address,
      o.payment_method, o.payment_status, o.order_status, o.tracking_number,
      o.courier_partner, o.cancelled_reason, o.refund_amount, o.refund_status,
      o.ordered_at, o.shipped_at, o.delivered_at,
      u.email AS customer_email, u.full_name AS customer_name
     FROM orders o
     LEFT JOIN customers c ON c.id = o.customer_id
     LEFT JOIN users u ON u.id = c.user_id
     WHERE o.id = ?`,
    {
      replacements: [orderId],
      type: QueryTypes.SELECT,
    }
  );

  if (!order) return null;

  const items = await sequelize.query(
    `SELECT product_name, product_sku, quantity, selling_price, item_total
     FROM order_items
     WHERE order_id = ?
     ORDER BY created_at ASC`,
    {
      replacements: [orderId],
      type: QueryTypes.SELECT,
    }
  );

  const shippingAddress = parseJson(order.shipping_address);

  return {
    order,
    items,
    shippingAddress,
    customerEmail: String(shippingAddress.email || order.customer_email || '').trim(),
    customerName: String(
      shippingAddress.fullName || shippingAddress.full_name || order.customer_name || 'Customer'
    ).trim(),
  };
};

const renderItemsHtml = (items) => items.map((item) => `
  <tr>
    <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
      <div style="font-weight:600;color:#111827;">${escapeHtml(item.product_name)}</div>
      ${item.product_sku ? `<div style="font-size:12px;color:#6b7280;margin-top:3px;">SKU: ${escapeHtml(item.product_sku)}</div>` : ''}
    </td>
    <td style="padding:12px 8px;border-bottom:1px solid #e5e7eb;text-align:center;color:#4b5563;">${escapeHtml(item.quantity)}</td>
    <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;text-align:right;color:#111827;">&#8377;${formatAmount(item.item_total)}</td>
  </tr>
`).join('');

const renderAddress = (address) => [
  address.fullName || address.full_name,
  address.address,
  address.city,
  address.state,
  address.pincode,
].filter(Boolean).map(escapeHtml).join(', ');

const buildHtml = (context, content) => {
  const { order, items, shippingAddress } = context;
  const orderUrl = `${APP_URL}/customer/orders/${encodeURIComponent(order.id)}`;
  const address = renderAddress(shippingAddress);

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;">${escapeHtml(content.message)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="background:#111827;padding:24px 32px;color:#ffffff;">
          <div style="font-size:24px;font-weight:700;">SKAARVI</div>
          <div style="font-size:12px;color:#d1d5db;margin-top:4px;">B2B Reseller Marketplace</div>
        </td></tr>
        <tr><td style="padding:32px;">
          <div style="font-size:12px;font-weight:700;letter-spacing:1px;color:${content.accent};">${escapeHtml(content.label)}</div>
          <h1 style="font-size:26px;line-height:1.25;margin:10px 0 12px;color:#111827;">${escapeHtml(content.title)}</h1>
          <p style="font-size:16px;line-height:1.6;color:#4b5563;margin:0 0 20px;">${escapeHtml(content.message)}</p>
          <div style="background:#f9fafb;border-left:4px solid ${content.accent};padding:14px 16px;color:#374151;line-height:1.5;margin-bottom:24px;">${escapeHtml(content.note)}</div>

          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;border-collapse:collapse;">
            <tr>
              <td style="padding:10px 0;color:#6b7280;">Order number</td>
              <td style="padding:10px 0;text-align:right;font-weight:700;">${escapeHtml(order.order_number)}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#6b7280;">Order date</td>
              <td style="padding:10px 0;text-align:right;">${escapeHtml(formatDate(order.ordered_at))}</td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#6b7280;">Payment method</td>
              <td style="padding:10px 0;text-align:right;">${escapeHtml(formatPaymentMethod(order.payment_method))}</td>
            </tr>
          </table>

          <h2 style="font-size:18px;margin:0 0 8px;">Order summary</h2>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            <tr style="font-size:12px;color:#6b7280;">
              <th align="left" style="padding:8px 0;border-bottom:2px solid #e5e7eb;">Item</th>
              <th align="center" style="padding:8px;border-bottom:2px solid #e5e7eb;">Qty</th>
              <th align="right" style="padding:8px 0;border-bottom:2px solid #e5e7eb;">Amount</th>
            </tr>
            ${renderItemsHtml(items)}
            <tr>
              <td colspan="2" style="padding:16px 8px 0 0;text-align:right;font-weight:700;">Order total</td>
              <td style="padding:16px 0 0;text-align:right;font-size:18px;font-weight:700;">&#8377;${formatAmount(order.final_amount || order.total_amount)}</td>
            </tr>
          </table>

          ${address ? `<div style="margin-top:28px;"><h2 style="font-size:18px;margin:0 0 8px;">Delivery address</h2><p style="margin:0;color:#4b5563;line-height:1.6;">${address}</p></div>` : ''}

          <div style="text-align:center;margin-top:30px;">
            <a href="${escapeHtml(orderUrl)}" style="display:inline-block;background:${content.accent};color:#ffffff;text-decoration:none;font-weight:700;padding:13px 22px;border-radius:6px;">View My Orders</a>
          </div>
        </td></tr>
        <tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;color:#6b7280;font-size:12px;line-height:1.6;">
          Need help? Contact <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color:#374151;">${escapeHtml(SUPPORT_EMAIL)}</a><br>
          This is an automated transactional email from Skaarvi.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

const buildText = (context, content) => {
  const { order, items, shippingAddress } = context;
  const itemLines = items.map((item) =>
    `- ${item.product_name} x ${item.quantity}: Rs. ${formatAmount(item.item_total)}`
  ).join('\n');
  const address = [
    shippingAddress.fullName || shippingAddress.full_name,
    shippingAddress.address,
    shippingAddress.city,
    shippingAddress.state,
    shippingAddress.pincode,
  ].filter(Boolean).join(', ');

  return `${content.label}

${content.title}

${content.message}
${content.note}

Order number: ${order.order_number}
Order date: ${formatDate(order.ordered_at)}
Payment method: ${formatPaymentMethod(order.payment_method)}

Order summary
${itemLines}
Order total: Rs. ${formatAmount(order.final_amount || order.total_amount)}
${address ? `\nDelivery address: ${address}` : ''}

View your orders: ${APP_URL}/customer/orders/${encodeURIComponent(order.id)}
Need help? Contact ${SUPPORT_EMAIL}

Skaarvi B2B Reseller Marketplace`;
};

const sendOrderLifecycleEmail = async ({ sequelize, orderId, event, details = {} }) => {
  try {
    const context = await loadOrderEmailContext(sequelize, orderId);
    if (!context) {
      console.warn(`[Order Email] Order ${orderId} was not found; skipping ${event} email`);
      return { success: false, skipped: true, reason: 'ORDER_NOT_FOUND' };
    }

    if (!context.customerEmail) {
      console.warn(`[Order Email] Order ${context.order.order_number} has no customer email; skipping ${event} email`);
      return { success: false, skipped: true, reason: 'EMAIL_MISSING' };
    }

    const content = getEventContent(event, context, details);
    if (!content) {
      console.warn(`[Order Email] Unsupported event ${event}; skipping email`);
      return { success: false, skipped: true, reason: 'UNSUPPORTED_EVENT' };
    }

    const result = await sendEmail({
      to: context.customerEmail,
      subject: content.subject,
      html: buildHtml(context, content),
      text: buildText(context, content),
    });

    console.log(`[Order Email] Sent ${event} email for ${context.order.order_number}`);
    return result;
  } catch (error) {
    console.error(`[Order Email] Failed to send ${event} email for order ${orderId}:`, error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOrderLifecycleEmail,
};