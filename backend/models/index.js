const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { ProductSave, ProductShare, ProductClick } = require('./analytics');
const StockLog = require('./stockLog');
const Notification = require('./notification');
const ManufacturerEarnings = require('./manufacturerEarnings');
const ManufacturerSettlement = require('./manufacturerSettlement');
const ProductAnalytics = require('./productAnalytics');
const { User, Manufacturer } = require('./user');
const Order = require('./order');

// Simple slug generator function
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
};

// Category Model
const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  parentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'parent_id',
  },
  imageUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'image_url',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sort_order',
  },
}, {
  tableName: 'categories',
  timestamps: true,
  underscored: true,
  hooks: {
    beforeValidate: (category) => {
      if (category.name && !category.slug) {
        category.slug = slugify(category.name);
      }
    },
  },
});

// Product Model
const Product = sequelize.define('Product', {
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
  categoryId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'category_id',
    references: {
      model: 'categories',
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
  slug: {
    type: DataTypes.STRING(500),
    allowNull: false,
    unique: true,
  },
  brandName: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'brand_name',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  specifications: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  sku: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
  },
  costPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: 'cost_price',
    validate: {
      min: 0,
    },
  },
  resellerMargin: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'reseller_margin',
  },
  skaarviMargin: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'skaarvi_margin',
  },
  sellingPrice: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: 'selling_price',
  },
  stockQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'stock_quantity',
  },
  lowStockThreshold: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
    field: 'low_stock_threshold',
  },
  weight: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    comment: 'Weight in kg',
  },
  dimensions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON: {length, width, height} in cm',
  },
  deliveryDays: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'delivery_days',
  },
  shippingCharges: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    field: 'shipping_charges',
  },
  shippingInfo: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'shipping_info',
  },
  catalogUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'catalog_url',
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('draft', 'pending_approval', 'approved', 'rejected', 'inactive'),
    defaultValue: 'draft',
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'rejection_reason',
  },
  approvedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'approved_by',
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'approved_at',
  },
  viewsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'views_count',
  },
  salesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sales_count',
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_featured',
  },
  isTrending: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_trending',
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at',
  },
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true,
  paranoid: true,
  hooks: {
    beforeValidate: (product) => {
      // Generate slug from name
      if (product.name && !product.slug) {
        const baseSlug = slugify(product.name);
        product.slug = `${baseSlug}-${Date.now()}`;
      }

      // Calculate selling price if margins are provided
      if (product.costPrice !== undefined) {
        const cost = parseFloat(product.costPrice) || 0;
        const resellerMargin = parseFloat(product.resellerMargin) || 0;
        const skaarviMargin = parseFloat(product.skaarviMargin) || 0;
        product.sellingPrice = cost + resellerMargin + skaarviMargin;
      }
    },
  },
});

// Product Image Model
const ProductImage = sequelize.define('ProductImage', {
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
  imageUrl: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'image_url',
  },
  thumbnailUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'thumbnail_url',
  },
  altText: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'alt_text',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sort_order',
  },
  isPrimary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_primary',
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'file_size',
  },
}, {
  tableName: 'product_images',
  timestamps: true,
  underscored: true,
  updatedAt: false,
});

// Product Video Model
const ProductVideo = sequelize.define('ProductVideo', {
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
  videoUrl: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'video_url',
  },
  thumbnailUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'thumbnail_url',
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Duration in seconds',
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'file_size',
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'sort_order',
  },
}, {
  tableName: 'product_videos',
  timestamps: true,
  underscored: true,
  updatedAt: false,
});

// Product Pricing History Model
const ProductPricingHistory = sequelize.define('ProductPricingHistory', {
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
  changedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'changed_by',
  },
  effectiveFrom: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'effective_from',
  },
  effectiveTo: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'effective_to',
  },
}, {
  tableName: 'product_pricing_history',
  timestamps: true,
  underscored: true,
  updatedAt: false,
});

// Define Associations
Category.hasMany(Category, { as: 'children', foreignKey: 'parent_id' });
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parent_id' });

Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Product.belongsTo(Manufacturer, { foreignKey: 'manufacturer_id', as: 'manufacturer' });
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images', onDelete: 'CASCADE' });
Product.hasMany(ProductVideo, { foreignKey: 'product_id', as: 'videos', onDelete: 'CASCADE' });
Product.hasMany(ProductPricingHistory, { foreignKey: 'product_id', as: 'priceHistory', onDelete: 'CASCADE' });

Manufacturer.hasMany(Product, { foreignKey: 'manufacturer_id', as: 'products' });

ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ProductVideo.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ProductPricingHistory.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Analytics associations
Product.hasMany(ProductSave, { foreignKey: 'product_id', as: 'saves', onDelete: 'CASCADE' });
Product.hasMany(ProductShare, { foreignKey: 'product_id', as: 'shares', onDelete: 'CASCADE' });
Product.hasMany(ProductClick, { foreignKey: 'product_id', as: 'clicks', onDelete: 'CASCADE' });

ProductSave.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ProductShare.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
ProductClick.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// StockLog associations
Product.hasMany(StockLog, { foreignKey: 'product_id', as: 'stockLogs', onDelete: 'CASCADE' });
StockLog.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// ProductAnalytics associations
Product.hasMany(ProductAnalytics, { foreignKey: 'product_id', as: 'analytics', onDelete: 'CASCADE' });
ProductAnalytics.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

module.exports = {
  sequelize,
  User,
  Manufacturer,
  Category,
  Product,
  ProductImage,
  ProductVideo,
  ProductPricingHistory,
  ProductSave,
  ProductShare,
  ProductClick,
  StockLog,
  Notification,
  ManufacturerEarnings,
  ManufacturerSettlement,
  ProductAnalytics,
  Order,
};
