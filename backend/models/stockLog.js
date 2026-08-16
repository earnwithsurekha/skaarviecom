const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const StockLog = sequelize.define('StockLog', {
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
  changeType: {
    type: DataTypes.ENUM('increase', 'decrease', 'update', 'order_placed', 'order_cancelled', 'adjustment'),
    allowNull: false,
    field: 'change_type',
  },
  quantityChange: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'quantity_change',
    comment: 'Positive for increase, negative for decrease',
  },
  previousStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'previous_stock',
  },
  newStock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'new_stock',
  },
  reason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Reason for stock change',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Additional notes',
  },
  changedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'changed_by',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  changedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'changed_at',
  },
}, {
  tableName: 'stock_logs',
  timestamps: false,
  indexes: [
    {
      fields: ['product_id'],
    },
    {
      fields: ['manufacturer_id'],
    },
    {
      fields: ['changed_at'],
    },
    {
      fields: ['change_type'],
    },
  ],
});

module.exports = StockLog;
