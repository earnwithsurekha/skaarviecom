const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { authMiddleware, manufacturerOnly, adminOrManufacturer } = require('../middleware/auth');
const { uploadMiddleware, uploadProductFile, deleteFromS3, validateImageQuality } = require('../middleware/upload');
const { Product, ProductImage, ProductVideo, Category } = require('../models');
const { PAGINATION, PRODUCT_STATUS, PLATFORM } = require('../config/constants');
const sequelize = require('../config/database');

// Helper function to calculate selling price
const calculateSellingPrice = (costPrice, skaarviMargin, resellerMargin) => {
  const price = parseFloat(costPrice);
  const skaarvi = parseFloat(skaarviMargin) / 100;
  const reseller = parseFloat(resellerMargin) / 100;
  return price * (1 + skaarvi + reseller);
};

// Validation middleware for product creation
const validateProduct = [
  body('name').trim().notEmpty().withMessage('Product name is required')
    .isLength({ max: 500 }).withMessage('Product name must be less than 500 characters'),
  body('categoryId').notEmpty().withMessage('Category is required')
    .isUUID().withMessage('Invalid category ID'),
  body('sku').optional().trim()
    .isLength({ max: 100 }).withMessage('SKU must be less than 100 characters'),
  body('costPrice').notEmpty().withMessage('Manufacturer price is required')
    .isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('stockQuantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a positive number'),
  body('lowStockThreshold').optional().isInt({ min: 0 }).withMessage('Low stock threshold must be a positive number'),
  body('weight').optional().isFloat({ min: 0 }).withMessage('Weight must be a positive number'),
  body('deliveryDays').optional().isInt({ min: 0 }).withMessage('Delivery days must be a positive number'),
  body('shippingCharges').optional().isFloat({ min: 0 }).withMessage('Shipping charges must be a positive number'),
];

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

// @route   GET /api/products
// @desc    Get all products for manufacturer
// @access  Private (Manufacturer)
router.get('/', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const { 
      page = PAGINATION.DEFAULT_PAGE, 
      limit = PAGINATION.DEFAULT_LIMIT,
      status,
      category,
      search 
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = { manufacturerId: req.user.manufacturerId };

    // Add filters
    if (status) {
      whereClause.status = status;
    }
    if (category) {
      whereClause.categoryId = category;
    }
    if (search) {
      whereClause[sequelize.Op.or] = [
        { name: { [sequelize.Op.like]: `%${search}%` } },
        { description: { [sequelize.Op.like]: `%${search}%` } },
        { sku: { [sequelize.Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'imageUrl', 'thumbnailUrl', 'isPrimary', 'sortOrder'],
        },
        {
          model: ProductVideo,
          as: 'videos',
          attributes: ['id', 'videoUrl', 'thumbnailUrl', 'sortOrder'],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    // Format numeric fields to ensure they're proper numbers
    const formattedProducts = products.map(product => {
      const plainProduct = product.get({ plain: true });
      return {
        ...plainProduct,
        costPrice: plainProduct.costPrice ? parseFloat(plainProduct.costPrice) : 0,
        sellingPrice: plainProduct.sellingPrice ? parseFloat(plainProduct.sellingPrice) : 0,
        resellerMargin: plainProduct.resellerMargin ? parseFloat(plainProduct.resellerMargin) : 0,
        skaarviMargin: plainProduct.skaarviMargin ? parseFloat(plainProduct.skaarviMargin) : 0,
        stockQuantity: plainProduct.stockQuantity !== null ? parseInt(plainProduct.stockQuantity) : 0,
        lowStockThreshold: plainProduct.lowStockThreshold !== null ? parseInt(plainProduct.lowStockThreshold) : 10,
      };
    });

    res.status(200).json({
      status: 'success',
      message: 'Products retrieved successfully',
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
    console.error('Get products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve products',
      error: error.message,
    });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product
// @access  Private
router.get('/:id', authMiddleware, adminOrManufacturer, async (req, res) => {
  try {
    const product = await Product.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: ProductImage,
          as: 'images',
          order: [['sortOrder', 'ASC']],
        },
        {
          model: ProductVideo,
          as: 'videos',
          order: [['sortOrder', 'ASC']],
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    // Check if user has access to this product
    if (req.user.role === 'manufacturer' && product.manufacturerId !== req.user.manufacturerId) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have access to this product',
      });
    }

    // Format numeric fields
    const plainProduct = product.get({ plain: true });
    const formattedProduct = {
      ...plainProduct,
      costPrice: plainProduct.costPrice ? parseFloat(plainProduct.costPrice) : 0,
      sellingPrice: plainProduct.sellingPrice ? parseFloat(plainProduct.sellingPrice) : 0,
      resellerMargin: plainProduct.resellerMargin ? parseFloat(plainProduct.resellerMargin) : 0,
      skaarviMargin: plainProduct.skaarviMargin ? parseFloat(plainProduct.skaarviMargin) : 0,
      stockQuantity: plainProduct.stockQuantity !== null ? parseInt(plainProduct.stockQuantity) : 0,
      lowStockThreshold: plainProduct.lowStockThreshold !== null ? parseInt(plainProduct.lowStockThreshold) : 10,
    };

    res.status(200).json({
      status: 'success',
      message: 'Product retrieved successfully',
      data: { product: formattedProduct },
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve product',
      error: error.message,
    });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Manufacturer)
router.post('/', 
  authMiddleware, 
  manufacturerOnly, 
  uploadMiddleware.productMedia,
  validateImageQuality,
  validateProduct,
  handleValidationErrors,
  async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      console.log('=== Product Creation Request ===');
      console.log('Body:', req.body);
      console.log('Files:', req.files);
      console.log('User:', req.user);
      
      const {
        name,
        categoryId,
        brandName,
        description,
        specifications,
        sku,
        costPrice,
        stockQuantity = 0,
        lowStockThreshold = 10,
        weight,
        dimensions,
        deliveryDays,
        shippingCharges,
        shippingInfo,
        tags,
        status = PRODUCT_STATUS.PENDING_APPROVAL, // Submit for approval by default
      } = req.body;

      // Apply platform-controlled pricing margins (manufacturers cannot set these)
      const resellerMargin = PLATFORM.DEFAULT_RESELLER_COMMISSION;
      const skaarviMargin = PLATFORM.DEFAULT_SKAARVI_MARGIN;
      const sellingPrice = calculateSellingPrice(costPrice, skaarviMargin, resellerMargin);

      console.log('Pricing:', { costPrice, resellerMargin, skaarviMargin, sellingPrice });

      // Verify category exists
      const category = await Category.findByPk(categoryId);
      if (!category) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Category not found',
        });
      }

      // Check SKU uniqueness if provided
      if (sku) {
        const existingProduct = await Product.findOne({ where: { sku } });
        if (existingProduct) {
          await transaction.rollback();
          return res.status(400).json({
            status: 'error',
            message: 'SKU already exists. Please use a unique SKU code.',
          });
        }
      }

      // Parse JSON fields if they are strings
      let parsedSpecifications = specifications;
      let parsedDimensions = dimensions;
      let parsedTags = tags;

      try {
        if (typeof specifications === 'string' && specifications) {
          parsedSpecifications = JSON.parse(specifications);
        }
        if (typeof dimensions === 'string' && dimensions) {
          parsedDimensions = JSON.parse(dimensions);
        }
        if (typeof tags === 'string' && tags) {
          parsedTags = JSON.parse(tags);
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Invalid JSON format in specifications, dimensions, or tags',
          error: parseError.message,
        });
      }

      console.log('Creating product with data:', {
        manufacturerId: req.user.manufacturerId,
        categoryId,
        name,
        costPrice,
        sellingPrice,
        status,
      });

      // Create product
      const product = await Product.create({
        manufacturerId: req.user.manufacturerId,
        categoryId,
        name,
        brandName,
        description,
        specifications: parsedSpecifications,
        sku,
        costPrice: parseFloat(costPrice),
        resellerMargin,
        skaarviMargin,
        sellingPrice,
        stockQuantity: parseInt(stockQuantity),
        lowStockThreshold: parseInt(lowStockThreshold),
        weight: weight ? parseFloat(weight) : null,
        dimensions: parsedDimensions,
        deliveryDays: deliveryDays ? parseInt(deliveryDays) : null,
        shippingCharges: shippingCharges ? parseFloat(shippingCharges) : null,
        shippingInfo,
        tags: parsedTags,
        status,
      }, { transaction });

      console.log('Product created with ID:', product.id);

      // Handle image uploads - upload to S3
      if (req.files && req.files.images) {
        const imageFiles = req.files.images;
        console.log(`Processing ${imageFiles.length} images...`);
        
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const imageUrl = await uploadProductFile(file, req.user.manufacturerId, name, 'images');
          console.log(`Image ${i + 1} uploaded to S3:`, imageUrl);
          
          await ProductImage.create({
            productId: product.id,
            imageUrl,
            altText: name,
            sortOrder: i,
            isPrimary: i === 0, // First image is primary
            fileSize: file.size,
          }, { transaction });
        }
      }

      // Handle video uploads - upload to S3
      if (req.files && req.files.videos) {
        const videoFiles = req.files.videos;
        console.log(`Processing ${videoFiles.length} videos...`);
        
        for (let i = 0; i < videoFiles.length; i++) {
          const file = videoFiles[i];
          const videoUrl = await uploadProductFile(file, req.user.manufacturerId, name, 'videos');
          console.log(`Video ${i + 1} uploaded to S3:`, videoUrl);
          
          await ProductVideo.create({
            productId: product.id,
            videoUrl,
            sortOrder: i,
            fileSize: file.size,
          }, { transaction });
        }
      }

      // Handle catalog upload - upload to S3
      if (req.files && req.files.catalog && req.files.catalog[0]) {
        const catalogFile = req.files.catalog[0];
        console.log('Processing catalog file...');
        
        const catalogUrl = await uploadProductFile(catalogFile, req.user.manufacturerId, name, 'catalogs');
        console.log('Catalog uploaded to S3:', catalogUrl);
        
        product.catalogUrl = catalogUrl;
        await product.save({ transaction });
      }

      await transaction.commit();

      // Fetch the created product with associations
      const createdProduct = await Product.findOne({
        where: { id: product.id },
        include: [
          { model: Category, as: 'category' },
          { model: ProductImage, as: 'images' },
          { model: ProductVideo, as: 'videos' },
        ],
      });

      res.status(201).json({
        status: 'success',
        message: 'Product created successfully',
        data: { product: createdProduct },
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Create product error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to create product',
        error: error.message,
      });
    }
  }
);

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Manufacturer)
router.put('/:id', 
  authMiddleware, 
  manufacturerOnly, 
  uploadMiddleware.productMedia,
  validateImageQuality,
  async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const product = await Product.findByPk(req.params.id);

      if (!product) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Product not found',
        });
      }

      // Verify ownership
      if (product.manufacturerId !== req.user.manufacturerId) {
        await transaction.rollback();
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to update this product',
        });
      }

      const {
        name,
        categoryId,
        brandName,
        description,
        specifications,
        sku,
        costPrice,
        resellerMargin,
        skaarviMargin,
        stockQuantity,
        lowStockThreshold,
        weight,
        dimensions,
        deliveryDays,
        shippingCharges,
        shippingInfo,
        tags,
        status,
      } = req.body;

      // ADMIN-ONLY FIELDS: Reject if manufacturer tries to modify pricing margins
      if (resellerMargin !== undefined || skaarviMargin !== undefined) {
        await transaction.rollback();
        return res.status(403).json({
          status: 'error',
          message: 'Access denied: Only administrators can modify pricing margins (Skaarvi Margin, Reseller Commission). Please contact support if pricing adjustments are needed.',
        });
      }

      // Check SKU uniqueness if changed
      if (sku && sku !== product.sku) {
        const existingProduct = await Product.findOne({ where: { sku } });
        if (existingProduct) {
          await transaction.rollback();
          return res.status(400).json({
            status: 'error',
            message: 'SKU already exists. Please use a unique SKU code.',
          });
        }
      }

      // Parse JSON fields
      let parsedSpecifications = specifications;
      let parsedDimensions = dimensions;
      let parsedTags = tags;

      try {
        if (typeof specifications === 'string') {
          parsedSpecifications = JSON.parse(specifications);
        }
        if (typeof dimensions === 'string') {
          parsedDimensions = JSON.parse(dimensions);
        }
        if (typeof tags === 'string') {
          parsedTags = JSON.parse(tags);
        }
      } catch (parseError) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Invalid JSON format in specifications, dimensions, or tags',
        });
      }

      // Update product fields
      const updateData = {};
      if (name !== undefined) updateData.name = name;
      if (categoryId !== undefined) updateData.categoryId = categoryId;
      if (brandName !== undefined) updateData.brandName = brandName;
      if (description !== undefined) updateData.description = description;
      if (parsedSpecifications !== undefined) updateData.specifications = parsedSpecifications;
      if (sku !== undefined) updateData.sku = sku;
      if (costPrice !== undefined) {
        updateData.costPrice = parseFloat(costPrice);
        // Recalculate selling price when cost price changes
        updateData.sellingPrice = calculateSellingPrice(
          costPrice,
          product.skaarviMargin,
          product.resellerMargin
        );
      }
      // resellerMargin and skaarviMargin are admin-only (rejected above)
      if (stockQuantity !== undefined) updateData.stockQuantity = parseInt(stockQuantity);
      if (lowStockThreshold !== undefined) updateData.lowStockThreshold = parseInt(lowStockThreshold);
      if (weight !== undefined) updateData.weight = parseFloat(weight);
      if (parsedDimensions !== undefined) updateData.dimensions = parsedDimensions;
      if (deliveryDays !== undefined) updateData.deliveryDays = parseInt(deliveryDays);
      if (shippingCharges !== undefined) updateData.shippingCharges = parseFloat(shippingCharges);
      if (shippingInfo !== undefined) updateData.shippingInfo = shippingInfo;
      if (parsedTags !== undefined) updateData.tags = parsedTags;
      if (status !== undefined) updateData.status = status;

      await product.update(updateData, { transaction });

      // Handle new image uploads - upload to S3
      if (req.files && req.files.images) {
        // Delete old image records (old S3 files can be cleaned up via lifecycle policies)
        await ProductImage.destroy({ 
          where: { productId: product.id },
          transaction 
        });

        // Upload new images to S3
        const imageFiles = req.files.images;
        const productName = name || product.name;
        console.log(`Updating ${imageFiles.length} images for product: ${productName}`);
        
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const imageUrl = await uploadProductFile(file, req.user.manufacturerId, productName, 'images');
          console.log(`Image ${i + 1} uploaded to S3:`, imageUrl);
          
          await ProductImage.create({
            productId: product.id,
            imageUrl,
            altText: productName,
            sortOrder: i,
            isPrimary: i === 0,
            fileSize: file.size,
          }, { transaction });
        }
      }

      // Handle new video uploads - upload to S3
      if (req.files && req.files.videos) {
        // Delete old video records (old S3 files can be cleaned up via lifecycle policies)
        await ProductVideo.destroy({ 
          where: { productId: product.id },
          transaction 
        });

        // Upload new videos to S3
        const videoFiles = req.files.videos;
        const productName = name || product.name;
        console.log(`Updating ${videoFiles.length} videos for product: ${productName}`);
        
        for (let i = 0; i < videoFiles.length; i++) {
          const file = videoFiles[i];
          const videoUrl = await uploadProductFile(file, req.user.manufacturerId, productName, 'videos');
          console.log(`Video ${i + 1} uploaded to S3:`, videoUrl);
          
          await ProductVideo.create({
            productId: product.id,
            videoUrl,
            sortOrder: i,
            fileSize: file.size,
          }, { transaction });
        }
      }

      // Handle catalog upload - upload to S3
      if (req.files && req.files.catalog && req.files.catalog[0]) {
        const catalogFile = req.files.catalog[0];
        const productName = name || product.name;
        console.log('Processing catalog file for product update...');
        
        const catalogUrl = await uploadProductFile(catalogFile, req.user.manufacturerId, productName, 'catalogs');
        console.log('Catalog uploaded to S3:', catalogUrl);
        
        await product.update({ catalogUrl }, { transaction });
      }

      await transaction.commit();

      // Fetch updated product with associations
      const updatedProduct = await Product.findOne({
        where: { id: product.id },
        include: [
          { model: Category, as: 'category' },
          { model: ProductImage, as: 'images' },
          { model: ProductVideo, as: 'videos' },
        ],
      });

      res.status(200).json({
        status: 'success',
        message: 'Product updated successfully',
        data: { product: updatedProduct },
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Update product error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to update product',
        error: error.message,
      });
    }
  }
);

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Manufacturer)
router.delete('/:id', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: ProductImage, as: 'images' },
        { model: ProductVideo, as: 'videos' },
      ],
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    // Verify ownership
    if (product.manufacturerId !== req.user.manufacturerId) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to delete this product',
      });
    }

    // Delete all associated media from S3
    for (const image of product.images) {
      await deleteFromS3(image.imageUrl);
    }
    for (const video of product.videos) {
      await deleteFromS3(video.videoUrl);
    }
    if (product.catalogUrl) {
      await deleteFromS3(product.catalogUrl);
    }

    // Soft delete the product (paranoid mode)
    await product.destroy();

    res.status(200).json({
      status: 'success',
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete product',
      error: error.message,
    });
  }
});

// @route   PATCH /api/products/:id/stock
// @desc    Update product stock
// @access  Private (Manufacturer)
router.patch('/:id/stock', authMiddleware, manufacturerOnly, async (req, res) => {
  try {
    const { stockQuantity, lowStockThreshold } = req.body;

    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    // Verify ownership
    if (product.manufacturerId !== req.user.manufacturerId) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to update this product',
      });
    }

    const updateData = {};
    if (stockQuantity !== undefined) updateData.stockQuantity = parseInt(stockQuantity);
    if (lowStockThreshold !== undefined) updateData.lowStockThreshold = parseInt(lowStockThreshold);

    await product.update(updateData);

    res.status(200).json({
      status: 'success',
      message: 'Stock updated successfully',
      data: { 
        product: {
          id: product.id,
          stockQuantity: product.stockQuantity,
          lowStockThreshold: product.lowStockThreshold,
        }
      },
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update stock',
      error: error.message,
    });
  }
});

module.exports = router;
