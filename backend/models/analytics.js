const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ProductSave Model - Track when resellers save/favorite products
const ProductSave = sequelize.define('ProductSave', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'product_id',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  // Metadata for additional tracking
  source: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Source where save was triggered (product_page, search_results, etc.)',
  },
  deviceType: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'device_type',
    comment: 'Device type: mobile, tablet, desktop',
  },
}, {
  tableName: 'product_saves',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['product_id'],
      name: 'idx_product_saves_product_id',
    },
    {
      fields: ['user_id'],
      name: 'idx_product_saves_user_id',
    },
    {
      fields: ['product_id', 'user_id'],
      unique: true,
      name: 'idx_product_saves_unique',
    },
    {
      fields: ['created_at'],
      name: 'idx_product_saves_created_at',
    },
  ],
});

// ProductShare Model - Track product shares
const ProductShare = sequelize.define('ProductShare', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'product_id',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true, // Allow anonymous shares
    field: 'user_id',
  },
  platform: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'Share platform: whatsapp, email, facebook, twitter, copy_link, qr_code',
  },
  source: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Source page where share was triggered',
  },
  sessionId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'session_id',
    comment: 'Session ID for anonymous tracking',
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'ip_address',
    comment: 'IP address for anonymous tracking',
  },
  deviceType: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'device_type',
  },
}, {
  tableName: 'product_shares',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['product_id'],
      name: 'idx_product_shares_product_id',
    },
    {
      fields: ['user_id'],
      name: 'idx_product_shares_user_id',
    },
    {
      fields: ['platform'],
      name: 'idx_product_shares_platform',
    },
    {
      fields: ['created_at'],
      name: 'idx_product_shares_created_at',
    },
  ],
});

// ProductClick Model - Track product link clicks
const ProductClick = sequelize.define('ProductClick', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'product_id',
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true, // Allow anonymous clicks
    field: 'user_id',
  },
  referrer: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'URL of the referring page',
  },
  source: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Source of the click (search, category, recommendation, share_link, etc.)',
  },
  sessionId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'session_id',
  },
  ipAddress: {
    type: DataTypes.STRING(45),
    allowNull: true,
    field: 'ip_address',
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'user_agent',
  },
  deviceType: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'device_type',
  },
  country: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Country from IP geolocation (optional)',
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'City from IP geolocation (optional)',
  },
}, {
  tableName: 'product_clicks',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['product_id'],
      name: 'idx_product_clicks_product_id',
    },
    {
      fields: ['user_id'],
      name: 'idx_product_clicks_user_id',
    },
    {
      fields: ['session_id'],
      name: 'idx_product_clicks_session_id',
    },
    {
      fields: ['created_at'],
      name: 'idx_product_clicks_created_at',
    },
    {
      fields: ['product_id', 'created_at'],
      name: 'idx_product_clicks_product_date',
    },
  ],
});

module.exports = {
  ProductSave,
  ProductShare,
  ProductClick,
};
