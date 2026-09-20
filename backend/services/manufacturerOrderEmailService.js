const { QueryTypes } = require('sequelize');
const { sendEmail } = require('../utils/email');

const APP_URL = (
  process.env.FRONTEND_URL
  || process.env.NEXT_PUBLIC_APP_URL
  || (process.env.NODE_ENV === 'production' ? 'https://skaarvi.shop' : 'http://localhost:3000')
).replace(/\/$/, '');

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const formatAmount = (value) => Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const loadManufacturerOrderContexts = async (sequelize, orderId) => {
  const [order] = await sequelize.query(
    `SELECT id, order_number, ordered_at
     FROM orders
     WHERE id = ?`,
    { replacements: [orderId], type: QueryTypes.SELECT }
  );
  if (!order) return [];

  const items = await sequelize.query(
    `SELECT
       oi.manufacturer_id,
       m.user_id,
       m.company_name,
       u.email,
       oi.product_name,
       oi.product_sku,
       oi.selected_size,
       oi.selected_color,
       oi.quantity,
       oi.manufacturer_amount
     FROM order_items oi
     JOIN manufacturers m ON m.id = oi.manufacturer_id
     JOIN users u ON u.id = m.user_id
     WHERE oi.order_id = ?
       AND u.is_active = 1
     ORDER BY oi.created_at ASC`,
    { replacements: [orderId], type: QueryTypes.SELECT }
  );

  const contexts = new Map();
  for (const item of items) {
    if (!contexts.has(item.manufacturer_id)) {
      contexts.set(item.manufacturer_id, {
        order,
        manufacturerId: item.manufacturer_id,
        userId: item.user_id,
        companyName: item.company_name,
        email: item.email,
        items: [],
      });
    }
    contexts.get(item.manufacturer_id).items.push(item);
  }

  return [...contexts.values()];
};

const renderItems = (items) => items.map((item) => {
  const variant = [item.selected_color, item.selected_size].filter(Boolean).join(' / ');
  return `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
      <strong>${escapeHtml(item.product_name)}</strong>
      ${item.product_sku ? `<div style="font-size:12px;color:#6b7280;">SKU: ${escapeHtml(item.product_sku)}</div>` : ''}
      ${variant ? `<div style="font-size:12px;color:#6b7280;">${escapeHtml(variant)}</div>` : ''}
    </td>
    <td style="padding:10px;text-align:center;border-bottom:1px solid #e5e7eb;">${escapeHtml(item.quantity)}</td>
    <td style="padding:10px 0;text-align:right;border-bottom:1px solid #e5e7eb;">&#8377;${formatAmount(item.manufacturer_amount)}</td>
  </tr>`;
}).join('');

const sendManufacturerNewOrderEmails = async ({ sequelize, orderId }) => {
  const contexts = await loadManufacturerOrderContexts(sequelize, orderId);
  const results = [];

  for (const context of contexts) {
    if (!context.email) continue;
    const quantity = context.items.reduce((total, item) => total + Number(item.quantity || 0), 0);
    const total = context.items.reduce((sum, item) => sum + Number(item.manufacturer_amount || 0), 0);
    const orderUrl = `${APP_URL}/manufacturer/orders/${encodeURIComponent(orderId)}`;

    try {
      const result = await sendEmail({
        to: context.email,
        subject: `New order received - ${context.order.order_number}`,
        html: `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;"><tr><td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border:1px solid #e5e7eb;">
              <tr><td style="background:#111827;padding:24px 32px;color:#fff;font-size:24px;font-weight:700;">SKAARVI</td></tr>
              <tr><td style="padding:32px;">
                <div style="font-size:12px;font-weight:700;color:#1d4ed8;letter-spacing:1px;">NEW ORDER</div>
                <h1 style="font-size:24px;margin:10px 0;">New order received</h1>
                <p>Hello ${escapeHtml(context.companyName || 'Manufacturer')}, you received ${quantity} item(s) in order <strong>${escapeHtml(context.order.order_number)}</strong>.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;margin:20px 0;">
                  <tr><th align="left">Item</th><th>Qty</th><th align="right">Your amount</th></tr>
                  ${renderItems(context.items)}
                  <tr><td colspan="2" style="padding-top:14px;text-align:right;font-weight:700;">Total</td><td style="padding-top:14px;text-align:right;font-weight:700;">&#8377;${formatAmount(total)}</td></tr>
                </table>
                <div style="text-align:center;"><a href="${escapeHtml(orderUrl)}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 20px;font-weight:700;">View Order</a></div>
              </td></tr>
            </table>
          </td></tr></table>
        </body></html>`,
        text: `New order received\n\nOrder: ${context.order.order_number}\nItems: ${quantity}\nYour amount: Rs. ${formatAmount(total)}\n\nView order: ${orderUrl}`,
      });
      results.push({ manufacturerId: context.manufacturerId, success: true, ...result });
    } catch (error) {
      console.error(`[Manufacturer Email] Failed for ${context.manufacturerId}:`, error.message);
      results.push({ manufacturerId: context.manufacturerId, success: false, error: error.message });
    }
  }

  return { contexts, results };
};

module.exports = {
  loadManufacturerOrderContexts,
  sendManufacturerNewOrderEmails,
};