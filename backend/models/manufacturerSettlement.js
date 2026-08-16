const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ManufacturerSettlement = sequelize.define('ManufacturerSettlement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  settlementId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'settlement_id',
    comment: 'Unique settlement identifier (e.g., SETT-2024-001)',
  },
  manufacturerId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'manufacturer_id',
    references: {
      model: 'manufacturers',
      key: 'id',
    },
  },
  settlementDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'settlement_date',
    comment: 'Date when settlement was created',
  },
  ordersCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'orders_count',
    comment: 'Number of orders included in this settlement',
  },
  orderIds: {
    type: DataTypes.JSON,
    allowNull: true,
    field: 'order_ids',
    comment: 'Array of order IDs included in settlement',
  },
  grossRevenue: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'gross_revenue',
    comment: 'Total revenue from all orders',
  },
  platformFeeTotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'platform_fee_total',
    comment: 'Total platform fee deducted',
  },
  netPayable: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'net_payable',
    comment: 'Net amount payable to manufacturer',
  },
  status: {
    type: DataTypes.ENUM('pending', 'processed', 'paid'),
    defaultValue: 'pending',
    allowNull: false,
    comment: 'Settlement status',
  },
  paymentReference: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'payment_reference',
    comment: 'Payment transaction reference/UTR number',
  },
  paymentMethod: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'payment_method',
    comment: 'Payment method used (bank_transfer, upi, etc.)',
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'payment_date',
    comment: 'Date when payment was completed',
  },
  processedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'processed_by',
    references: {
      model: 'users',
      key: 'id',
    },
    comment: 'Admin user who processed the settlement',
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'processed_at',
    comment: 'Timestamp when settlement was processed',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes or remarks',
  },
}, {
  tableName: 'manufacturer_settlements',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['manufacturer_id'] },
    { fields: ['status'] },
    { fields: ['settlement_date'] },
    { fields: ['payment_date'] },
  ],
});

module.exports = ManufacturerSettlement;
