const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Order Model
const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'order_number',
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'customer_id',
  },
  resellerId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'reseller_id',
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'total_amount',
  },
  shippingFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'shipping_fee',
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
    field: 'discount_amount',
  },
  finalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'final_amount',
  },
  paymentMethod: {
    type: DataTypes.ENUM('razorpay', 'cod', 'upi', 'wallet'),
    allowNull: true,
    field: 'payment_method',
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'paid', 'failed', 'refunded'),
    defaultValue: 'pending',
    field: 'payment_status',
  },
  paymentId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'payment_id',
  },
  orderStatus: {
    type: DataTypes.ENUM('new', 'accepted', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'),
    defaultValue: 'new',
    field: 'order_status',
  },
  shippingAddress: {
    type: DataTypes.JSON,
    allowNull: false,
    field: 'shipping_address',
  },
  billingAddress: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'billing_address',
  },
  trackingNumber: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'tracking_number',
  },
  courierPartner: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'courier_partner',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  cancelledReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'cancelled_reason',
  },
  refundAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: 'refund_amount',
  },
  refundStatus: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'refund_status',
  },
  commissionPaid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'commission_paid',
  },
  orderedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'ordered_at',
  },
  shippedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'shipped_at',
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'delivered_at',
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'cancelled_at',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at',
  },
}, {
  tableName: 'orders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// OrderItem Model
const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'order_id',
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'product_id',
  },
  manufacturerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'manufacturer_id',
  },
  productName: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'product_name',
  },
  productSku: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'product_sku',
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  costPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'cost_price',
  },
  resellerMargin: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'reseller_margin',
  },
  skaarviMargin: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'skaarvi_margin',
  },
  sellingPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'selling_price',
  },
  itemTotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'item_total',
  },
  platformFee: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'platform_fee',
  },
  manufacturerAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'manufacturer_amount',
  },
  resellerCommission: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'reseller_commission',
  },
  skaarviRevenue: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'skaarvi_revenue',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
}, {
  tableName: 'order_items',
  timestamps: false,
});

// OrderStatusHistory Model
const OrderStatusHistory = sequelize.define('OrderStatusHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'order_id',
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  changedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'changed_by',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at',
  },
}, {
  tableName: 'order_status_history',
  timestamps: false,
});

// Define associations
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

Order.hasMany(OrderStatusHistory, { foreignKey: 'orderId', as: 'statusHistory' });
OrderStatusHistory.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });

module.exports = {
  Order,
  OrderItem,
  OrderStatusHistory,
};
