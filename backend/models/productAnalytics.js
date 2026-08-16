const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductAnalytics = sequelize.define('ProductAnalytics', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'product_id',
    references: {
      model: 'products',
      key: 'id',
    },
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'Date of the analytics data',
  },
  viewsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'views_count',
    comment: 'Number of product views',
  },
  savesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'saves_count',
    comment: 'Number of times product was saved/wishlisted',
  },
  sharesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'shares_count',
    comment: 'Number of times product was shared',
  },
  clicksCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'clicks_count',
    comment: 'Number of product link clicks',
  },
  ordersCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'orders_count',
    comment: 'Number of orders for this product',
  },
  revenue: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    comment: 'Revenue generated from this product',
  },
  periodType: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly'),
    defaultValue: 'daily',
    field: 'period_type',
    comment: 'Aggregation period type',
  },
}, {
  tableName: 'product_analytics',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['product_id'] },
    { fields: ['manufacturer_id'] },
    { fields: ['date'] },
    { fields: ['period_type'] },
    { unique: true, fields: ['product_id', 'date', 'period_type'] },
  ],
});

module.exports = ProductAnalytics;
