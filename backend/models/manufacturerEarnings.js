const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ManufacturerEarnings = sequelize.define('ManufacturerEarnings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
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
  period: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
    allowNull: false,
    comment: 'Earnings aggregation period',
  },
  totalSales: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'total_sales',
    comment: 'Total sales amount for the period',
  },
  platformFee: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'platform_fee',
    comment: 'Platform fee deducted',
  },
  netEarnings: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'net_earnings',
    comment: 'Net earnings after platform fee',
  },
  ordersCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'orders_count',
    comment: 'Number of orders in the period',
  },
  productsSold: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'products_sold',
    comment: 'Total quantity of products sold',
  },
  periodStart: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'period_start',
    comment: 'Start date of the period',
  },
  periodEnd: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'period_end',
    comment: 'End date of the period',
  },
}, {
  tableName: 'manufacturer_earnings',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['manufacturer_id'] },
    { fields: ['period'] },
    { fields: ['period_start'] },
    { unique: true, fields: ['manufacturer_id', 'period', 'period_start'] },
  ],
});

module.exports = ManufacturerEarnings;
