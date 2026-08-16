const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const { authMiddleware, adminOnly } = require('../../middleware/auth');
const { Product, ProductImage, Category, Manufacturer, User } = require('../../models');
const { PAGINATION, PRODUCT_STATUS } = require('../../config/constants');

// Helper function to calculate selling price
const calculateSellingPrice = (costPrice, skaarviMargin, resellerMargin) => {
  const price = parseFloat(costPrice);
  const skaarvi = parseFloat(skaarviMargin) / 100;
  const reseller = parseFloat(resellerMargin) / 100;
  return price * (1 + skaarvi + reseller);
};

// Validation for error handling
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// @route   GET /api/admin/products
// @desc    Get all products with pricing details (admin view)
// @access  Private (Admin only)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_LIMIT,
      search,
      categoryId,
      manufacturerId,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};
    if (search) {
      where.name = { [require('sequelize').Op.like]: `%${search}%` };
    }
    if (categoryId) where.categoryId = categoryId;
    if (manufacturerId) where.manufacturerId = manufacturerId;
    if (status) where.status = status;

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: Manufacturer,
          attributes: ['id', 'companyName', 'brandName'],
          as: 'manufacturer',
          include: [{
            model: User,
            attributes: ['id', 'email', 'mobile', 'role'],
            as: 'user'
          }]
        },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'sortOrder'],
          limit: 1,
          separate: true,
          order: [['sortOrder', 'ASC']]
        }
      ],
      limit: parseInt(limit),
      offset,
      order: [[sortBy, sortOrder]],
      distinct: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / parseInt(limit)),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin get products error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal server error'
    });
  }
});

// @route   GET /api/admin/products/:id
// @desc    Get single product with full pricing details
// @access  Private (Admin only)
router.get('/:id', 
  authMiddleware, 
  adminOnly,
  param('id').isUUID().withMessage('Invalid product ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id, {
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          },
          {
            model: Manufacturer,
            as: 'manufacturer',
            attributes: ['id', 'companyName', 'brandName'],
            include: [{
              model: User,
              as: 'user',
              attributes: ['id', 'email', 'mobile']
            }]
          },
          {
            model: ProductImage,
            as: 'images',
            attributes: ['id', 'imageUrl', 'displayOrder'],
            order: [['displayOrder', 'ASC']]
          }
        ]
      });

      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }

      res.status(200).json({
        status: 'success',
        data: { product }
      });
    } catch (error) {
      console.error('Admin get product error:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error'
      });
    }
  }
);

// @route   PUT /api/admin/products/:id/pricing
// @desc    Update product pricing margins (admin only)
// @access  Private (Admin only)
router.put('/:id/pricing',
  authMiddleware,
  adminOnly,
  [
    param('id').isUUID().withMessage('Invalid product ID'),
    body('skaarviMargin')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Skaarvi margin must be between 0 and 100')
      .toFloat(),
    body('resellerMargin')
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage('Reseller margin must be between 0 and 100')
      .toFloat(),
    body('platformFeeOverride')
      .optional({ nullable: true, checkFalsy: true })
      .isFloat({ min: 0, max: 100 })
      .withMessage('Platform fee override must be between 0 and 100')
      .toFloat()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { skaarviMargin, resellerMargin, platformFeeOverride } = req.body;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }

      // Store old pricing for history
      const oldPricing = {
        costPrice: product.costPrice,
        skaarviMargin: product.skaarviMargin,
        resellerMargin: product.resellerMargin,
        sellingPrice: product.sellingPrice
      };

      // Update pricing fields
      const updateData = {};
      if (skaarviMargin !== undefined) {
        updateData.skaarviMargin = parseFloat(skaarviMargin);
      }
      if (resellerMargin !== undefined) {
        updateData.resellerMargin = parseFloat(resellerMargin);
      }
      if (platformFeeOverride !== undefined) {
        updateData.platformFeeOverride = parseFloat(platformFeeOverride);
      }

      // Recalculate selling price
      const newSkaarviMargin = skaarviMargin !== undefined ? parseFloat(skaarviMargin) : product.skaarviMargin;
      const newResellerMargin = resellerMargin !== undefined ? parseFloat(resellerMargin) : product.resellerMargin;
      updateData.sellingPrice = calculateSellingPrice(
        product.costPrice,
        newSkaarviMargin,
        newResellerMargin
      );

      await product.update(updateData);

      // Log to pricing history (if table exists)
      try {
        const { ProductPricingHistory } = require('../../models');
        if (ProductPricingHistory) {
          await ProductPricingHistory.create({
            productId: product.id,
            oldCostPrice: oldPricing.costPrice,
            newCostPrice: product.costPrice,
            oldSkaarviMargin: oldPricing.skaarviMargin,
            newSkaarviMargin: product.skaarviMargin,
            oldResellerMargin: oldPricing.resellerMargin,
            newResellerMargin: product.resellerMargin,
            oldSellingPrice: oldPricing.sellingPrice,
            newSellingPrice: product.sellingPrice,
            changedBy: req.user.userId,
            changeReason: 'Admin pricing adjustment'
          });
        }
      } catch (historyError) {
        // Non-critical error, log and continue
        console.log('Pricing history logging skipped:', historyError.message);
      }

      // Reload with associations
      await product.reload({
        include: [
          { model: Category, as: 'category', attributes: ['id', 'name'] },
          { model: Manufacturer, as: 'manufacturer', attributes: ['id', 'companyName', 'brandName'] }
        ]
      });

      res.status(200).json({
        status: 'success',
        message: 'Product pricing updated successfully',
        data: { product }
      });
    } catch (error) {
      console.error('Admin update pricing error:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error'
      });
    }
  }
);

// @route   PATCH /api/admin/products/:id/approve
// @desc    Approve product (admin only)
// @access  Private (Admin only)
router.patch('/:id/approve',
  authMiddleware,
  adminOnly,
  param('id').isUUID().withMessage('Invalid product ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }

      // Allow approval for both pending and rejected products (for reapproval)
      if (product.status !== PRODUCT_STATUS.PENDING_APPROVAL && 
          product.status !== PRODUCT_STATUS.REJECTED) {
        return res.status(400).json({
          status: 'error',
          message: 'Only products pending approval or rejected can be approved'
        });
      }

      // Clear rejection reason when approving
      await product.update({ 
        status: PRODUCT_STATUS.APPROVED,
        rejectionReason: null
      });

      // Send notification to manufacturer
      try {
        const notificationService = require('../../services/notificationService');
        await notificationService.createNotification({
          userId: product.manufacturerId,
          type: 'product_approved',
          title: 'Product Approved',
          message: `Your product "${product.name}" has been approved and is now live.`,
          relatedId: product.id,
          relatedType: 'product'
        });
      } catch (notifError) {
        console.log('Notification sending failed:', notifError.message);
      }

      res.status(200).json({
        status: 'success',
        message: 'Product approved successfully',
        data: { product }
      });
    } catch (error) {
      console.error('Admin approve product error:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error'
      });
    }
  }
);

// @route   PATCH /api/admin/products/:id/reject
// @desc    Reject product (admin only)
// @access  Private (Admin only)
router.patch('/:id/reject',
  authMiddleware,
  adminOnly,
  [
    param('id').isUUID().withMessage('Invalid product ID'),
    body('reason').optional().trim().isLength({ max: 500 })
      .withMessage('Rejection reason must be less than 500 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }

      // Allow rejection for pending and approved products
      if (product.status !== PRODUCT_STATUS.PENDING_APPROVAL && 
          product.status !== PRODUCT_STATUS.APPROVED) {
        return res.status(400).json({
          status: 'error',
          message: 'Only products pending approval or approved can be rejected'
        });
      }

      await product.update({ 
        status: PRODUCT_STATUS.REJECTED,
        rejectionReason: reason || 'Product does not meet platform standards'
      });

      // Send notification to manufacturer
      try {
        const notificationService = require('../../services/notificationService');
        await notificationService.createNotification({
          userId: product.manufacturerId,
          type: 'product_rejected',
          title: 'Product Rejected',
          message: `Your product "${product.name}" has been rejected. Reason: ${reason || 'Not specified'}`,
          relatedId: product.id,
          relatedType: 'product'
        });
      } catch (notifError) {
        console.log('Notification sending failed:', notifError.message);
      }

      res.status(200).json({
        status: 'success',
        message: 'Product rejected',
        data: { product }
      });
    } catch (error) {
      console.error('Admin reject product error:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error'
      });
    }
  }
);

// @route   DELETE /api/admin/products/:id
// @desc    Delete product (admin only)
// @access  Private (Admin only)
router.delete('/:id',
  authMiddleware,
  adminOnly,
  param('id').isUUID().withMessage('Invalid product ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      const product = await Product.findByPk(id, {
        include: [
          {
            model: ProductImage,
            as: 'images'
          }
        ]
      });

      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }

      // Check if product has any orders
      const { Order } = require('../../models');
      const orderCount = await Order.count({
        where: { productId: id }
      });

      if (orderCount > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete product with existing orders. Consider marking it as inactive instead.'
        });
      }

      // Delete product images
      if (product.images && product.images.length > 0) {
        await ProductImage.destroy({ where: { productId: id } });
      }

      // Delete the product
      await product.destroy();

      // Send notification to manufacturer
      try {
        const notificationService = require('../../services/notificationService');
        await notificationService.createNotification({
          userId: product.manufacturerId,
          type: 'product_deleted',
          title: 'Product Deleted',
          message: `Your product "${product.name}" has been deleted by admin.`,
          relatedId: product.id,
          relatedType: 'product'
        });
      } catch (notifError) {
        console.log('Notification sending failed:', notifError.message);
      }

      res.status(200).json({
        status: 'success',
        message: 'Product deleted successfully'
      });
    } catch (error) {
      console.error('Admin delete product error:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error'
      });
    }
  }
);

// @route   PATCH /api/admin/products/:id/featured
// @desc    Toggle product featured status (admin only)
// @access  Private (Admin only)
router.patch('/:id/featured',
  authMiddleware,
  adminOnly,
  [
    param('id').isUUID().withMessage('Invalid product ID'),
    body('isFeatured').isBoolean().withMessage('isFeatured must be a boolean')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { isFeatured } = req.body;

      const product = await Product.findByPk(id);
      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'Product not found'
        });
      }

      // Only approved products can be featured
      if (isFeatured && product.status !== PRODUCT_STATUS.APPROVED) {
        return res.status(400).json({
          status: 'error',
          message: 'Only approved products can be featured'
        });
      }

      await product.update({ isFeatured });

      // Send notification to manufacturer if featured
      if (isFeatured) {
        try {
          const notificationService = require('../../services/notificationService');
          await notificationService.createNotification({
            userId: product.manufacturerId,
            type: 'product_featured',
            title: 'Product Featured',
            message: `Your product "${product.name}" has been featured on the platform!`,
            relatedId: product.id,
            relatedType: 'product'
          });
        } catch (notifError) {
          console.log('Notification sending failed:', notifError.message);
        }
      }

      res.status(200).json({
        status: 'success',
        message: `Product ${isFeatured ? 'featured' : 'unfeatured'} successfully`,
        data: { product }
      });
    } catch (error) {
      console.error('Admin toggle featured product error:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Internal server error'
      });
    }
  }
);

module.exports = router;
