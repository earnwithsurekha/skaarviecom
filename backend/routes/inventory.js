const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { authMiddleware, manufacturerOnly } = require('../middleware/auth');
const { Product, StockLog } = require('../models');
const { PAGINATION } = require('../config/constants');
const notificationService = require('../services/notificationService');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array(),
    });
  }
  next();
};

// @route   GET /api/inventory
// @desc    Get inventory list with stock details for manufacturer
// @access  Private (Manufacturer)
router.get('/', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      low_stock_only,
      category,
      search,
      sort_by = 'name',
      sort_order = 'ASC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = { manufacturerId: req.user.manufacturerId };

    // Filter by low stock
    if (low_stock_only === 'true') {
      whereClause[Op.and] = sequelize.where(
        sequelize.col('stock_quantity'),
        Op.lte,
        sequelize.col('low_stock_threshold')
      );
    }

    // Filter by category
    if (category) {
      whereClause.categoryId = category;
    }

    // Search filter
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { sku: { [Op.like]: `%${search}%` } },
      ];
    }

    // Get products with stock data
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      attributes: [
        'id',
        'name',
        'sku',
        'stockQuantity',
        'lowStockThreshold',
        'salesCount',
        'costPrice',
        'updatedAt',
      ],
      limit: parseInt(limit),
      offset,
      order: [[sort_by, sort_order.toUpperCase()]],
    });

    // Calculate stock statistics
    const formattedProducts = products.map(product => {
      const availableStock = product.stockQuantity;
      const soldStock = product.salesCount || 0;
      
      let stockStatus = 'in_stock';
      if (availableStock === 0) {
        stockStatus = 'out_of_stock';
      } else if (availableStock <= product.lowStockThreshold) {
        stockStatus = 'low_stock';
      }

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        currentStock: product.stockQuantity,
        availableStock,
        reservedStock: 0, // TODO: Calculate from pending orders
        soldStock,
        lowStockThreshold: product.lowStockThreshold,
        stockStatus,
        stockValue: product.stockQuantity * product.costPrice,
        lastUpdated: product.updatedAt,
      };
    });

    res.status(200).json({
      status: 'success',
      message: 'Inventory retrieved successfully',
      data: {
        products: formattedProducts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve inventory',
      error: error.message,
    });
  }
});

// @route   GET /api/inventory/:productId
// @desc    Get stock details for single product
// @access  Private (Manufacturer)
router.get('/:productId', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.productId,
        manufacturerId: req.user.manufacturerId,
      },
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    const availableStock = product.stockQuantity;
    let stockStatus = 'in_stock';
    if (availableStock === 0) {
      stockStatus = 'out_of_stock';
    } else if (availableStock <= product.lowStockThreshold) {
      stockStatus = 'low_stock';
    }

    res.status(200).json({
      status: 'success',
      data: {
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          currentStock: product.stockQuantity,
          availableStock,
          reservedStock: 0,
          soldStock: product.salesCount || 0,
          lowStockThreshold: product.lowStockThreshold,
          stockStatus,
          stockValue: product.stockQuantity * product.costPrice,
        },
      },
    });
  } catch (error) {
    console.error('Get product stock error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve product stock',
      error: error.message,
    });
  }
});

// @route   GET /api/inventory/:productId/history
// @desc    Get stock change history for product
// @access  Private (Manufacturer)
router.get('/:productId/history', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      change_type,
      start_date,
      end_date,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Verify product belongs to manufacturer
    const product = await Product.findOne({
      where: {
        id: req.params.productId,
        manufacturerId: req.user.manufacturerId,
      },
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    const whereClause = { productId: req.params.productId };

    // Filter by change type
    if (change_type) {
      whereClause.changeType = change_type;
    }

    // Filter by date range
    if (start_date || end_date) {
      whereClause.changedAt = {};
      if (start_date) {
        whereClause.changedAt[Op.gte] = new Date(start_date);
      }
      if (end_date) {
        whereClause.changedAt[Op.lte] = new Date(end_date);
      }
    }

    const { count, rows: history } = await StockLog.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset,
      order: [['changedAt', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      message: 'Stock history retrieved successfully',
      data: {
        history,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get stock history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve stock history',
      error: error.message,
    });
  }
});

// @route   PATCH /api/inventory/:productId/increase
// @desc    Increase product stock
// @access  Private (Manufacturer)
router.patch(
  '/:productId/increase',
  authMiddleware,
  manufacturerOnly,
  [
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('reason').optional().trim().isLength({ max: 255 }),
    body('notes').optional().trim(),
  ],
  handleValidationErrors,
  async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { quantity, reason = 'Stock replenishment', notes } = req.body;

      const product = await Product.findOne({
        where: {
          id: req.params.productId,
          manufacturerId: req.user.manufacturerId,
        },
        transaction,
      });

      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Product not found',
        });
      }

      const previousStock = product.stockQuantity;
      const newStock = previousStock + parseInt(quantity);

      // Update product stock
      await product.update({ stockQuantity: newStock }, { transaction });

      // Create stock log
      await StockLog.create({
        productId: product.id,
        manufacturerId: req.user.manufacturerId,
        changeType: 'increase',
        quantityChange: parseInt(quantity),
        previousStock,
        newStock,
        reason,
        notes,
        changedBy: req.user.id,
      }, { transaction });

      await transaction.commit();

      res.status(200).json({
        status: 'success',
        message: 'Stock increased successfully',
        data: {
          productId: product.id,
          previousStock,
          newStock,
          quantityAdded: parseInt(quantity),
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Increase stock error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to increase stock',
        error: error.message,
      });
    }
  }
);

// @route   PATCH /api/inventory/:productId/decrease
// @desc    Decrease product stock
// @access  Private (Manufacturer)
router.patch(
  '/:productId/decrease',
  authMiddleware,
  manufacturerOnly,
  [
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('reason').optional().trim().isLength({ max: 255 }),
    body('notes').optional().trim(),
  ],
  handleValidationErrors,
  async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { quantity, reason = 'Manual reduction', notes } = req.body;

      const product = await Product.findOne({
        where: {
          id: req.params.productId,
          manufacturerId: req.user.manufacturerId,
        },
        transaction,
      });

      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Product not found',
        });
      }

      const previousStock = product.stockQuantity;
      
      // Validate sufficient stock
      if (parseInt(quantity) > previousStock) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: `Insufficient stock. Available: ${previousStock}, Requested: ${quantity}`,
        });
      }

      const newStock = previousStock - parseInt(quantity);

      // Update product stock
      await product.update({ stockQuantity: newStock }, { transaction });

      // Create stock log
      await StockLog.create({
        productId: product.id,
        manufacturerId: req.user.manufacturerId,
        changeType: 'decrease',
        quantityChange: -parseInt(quantity),
        previousStock,
        newStock,
        reason,
        notes,
        changedBy: req.user.id,
      }, { transaction });

      await transaction.commit();

      // Check if low stock alert should be created
      if (newStock <= product.lowStockThreshold) {
        try {
          await notificationService.createLowStockAlert(req.user.id, {
            productId: product.id,
            productName: product.name,
            currentStock: newStock,
            threshold: product.lowStockThreshold,
          });
        } catch (notifError) {
          console.error('Failed to create low stock notification:', notifError);
          // Don't fail the request if notification fails
        }
      }

      res.status(200).json({
        status: 'success',
        message: 'Stock decreased successfully',
        data: {
          productId: product.id,
          previousStock,
          newStock,
          quantityReduced: parseInt(quantity),
          lowStockAlert: newStock <= product.lowStockThreshold,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Decrease stock error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to decrease stock',
        error: error.message,
      });
    }
  }
);

// @route   PATCH /api/inventory/:productId/update
// @desc    Set specific stock level
// @access  Private (Manufacturer)
router.patch(
  '/:productId/update',
  authMiddleware,
  manufacturerOnly,
  [
    body('newStock').isInt({ min: 0 }).withMessage('Stock must be 0 or greater'),
    body('reason').optional().trim().isLength({ max: 255 }),
    body('notes').optional().trim(),
  ],
  handleValidationErrors,
  async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { newStock, reason = 'Stock adjustment', notes } = req.body;

      const product = await Product.findOne({
        where: {
          id: req.params.productId,
          manufacturerId: req.user.manufacturerId,
        },
        transaction,
      });

      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Product not found',
        });
      }

      const previousStock = product.stockQuantity;
      const quantityChange = parseInt(newStock) - previousStock;

      if (quantityChange === 0) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'New stock value is the same as current stock',
        });
      }

      // Update product stock
      await product.update({ stockQuantity: parseInt(newStock) }, { transaction });

      // Create stock log
      await StockLog.create({
        productId: product.id,
        manufacturerId: req.user.manufacturerId,
        changeType: 'update',
        quantityChange,
        previousStock,
        newStock: parseInt(newStock),
        reason,
        notes,
        changedBy: req.user.id,
      }, { transaction });

      await transaction.commit();

      // Check if low stock alert should be created
      if (parseInt(newStock) <= product.lowStockThreshold && previousStock > product.lowStockThreshold) {
        try {
          await notificationService.createLowStockAlert(req.user.id, {
            productId: product.id,
            productName: product.name,
            currentStock: parseInt(newStock),
            threshold: product.lowStockThreshold,
          });
        } catch (notifError) {
          console.error('Failed to create low stock notification:', notifError);
        }
      }

      res.status(200).json({
        status: 'success',
        message: 'Stock updated successfully',
        data: {
          productId: product.id,
          previousStock,
          newStock: parseInt(newStock),
          quantityChange,
          lowStockAlert: parseInt(newStock) <= product.lowStockThreshold,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Update stock error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update stock',
        error: error.message,
      });
    }
  }
);

// @route   PATCH /api/inventory/:productId/threshold
// @desc    Update low stock threshold
// @access  Private (Manufacturer)
router.patch(
  '/:productId/threshold',
  authMiddleware,
  manufacturerOnly,
  [
    body('threshold').isInt({ min: 0 }).withMessage('Threshold must be 0 or greater'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { threshold } = req.body;

      const product = await Product.findOne({
        where: {
          id: req.params.productId,
          manufacturerId: req.user.manufacturerId,
        },
      });

      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found',
        });
      }

      const oldThreshold = product.lowStockThreshold;
      await product.update({ lowStockThreshold: parseInt(threshold) });

      res.status(200).json({
        status: 'success',
        message: 'Low stock threshold updated successfully',
        data: {
          productId: product.id,
          oldThreshold,
          newThreshold: parseInt(threshold),
        },
      });
    } catch (error) {
      console.error('Update threshold error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update threshold',
        error: error.message,
      });
    }
  }
);

module.exports = router;
