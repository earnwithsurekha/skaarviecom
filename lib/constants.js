export const ROLES = {
  ADMIN: 'admin',
  MANUFACTURER: 'manufacturer',
  RESELLER: 'reseller',
  CUSTOMER: 'customer',
};

export const MANUFACTURER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const PRODUCT_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  INACTIVE: 'inactive',
};

export const ORDER_STATUS = {
  NEW: 'new',
  ACCEPTED: 'accepted',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const NOTIFICATION_TYPES = {
  ACCOUNT_APPROVED: 'account_approved',
  ACCOUNT_REJECTED: 'account_rejected',
  PRODUCT_APPROVED: 'product_approved',
  PRODUCT_REJECTED: 'product_rejected',
  NEW_ORDER: 'new_order',
  ORDER_SHIPPED: 'order_shipped',
  ORDER_DELIVERED: 'order_delivered',
  SETTLEMENT_PROCESSED: 'settlement_processed',
  LOW_STOCK_ALERT: 'low_stock_alert',
};

export const PLATFORM = {
  DEFAULT_FEE_PERCENTAGE: 5,
  DEFAULT_RESELLER_COMMISSION: 10,
  LOW_STOCK_THRESHOLD: 10,
  SETTLEMENT_HOLD_DAYS: 7,
};

export const CANCEL_REASONS = [
  'Changed my mind',
  'Found better price',
  'Ordered by mistake',
  'Delivery taking too long',
  'Product no longer needed',
  'Other',
];

export const RETURN_REASONS = [
  'Defective/damaged product',
  'Wrong item received',
  'Product not as described',
  'Quality issues',
  'Size/fit issues',
  'Missing parts/accessories',
  'Other',
];

export const RETURN_ELIGIBILITY_DAYS = 7;
