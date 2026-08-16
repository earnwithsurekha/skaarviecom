const express = require('express');
const router = express.Router();
const { sequelize } = require('../../models');
const { Op } = require('sequelize');

// @route   GET /api/reseller/products
// @desc    Browse products with filters for resellers
// @access  Private (Reseller only)
router.get('/', async (req, res) => {
  try {
    const resellerId = req.user.id;
    const {
      page = 1,
      limit = 20,
      search = '',
      category = '',
      minPrice = 0,
      maxPrice = 999999,
      minProfit = 0,
      sortBy = 'created_at',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where conditions
    let whereConditions = "p.deleted_at IS NULL AND p.status = 'approved'";
    const replacements = { resellerId, limit: parseInt(limit), offset };

    if (search) {
      whereConditions += ' AND (p.name LIKE :search OR p.description LIKE :search)';
      replacements.search = `%${search}%`;
    }

    if (category) {
      whereConditions += ' AND p.category_id = :categoryId';
      replacements.categoryId = category;
    }

    // Parse price filters with validation
    const parsedMinPrice = parseFloat(minPrice) || 0;
    const parsedMaxPrice = parseFloat(maxPrice) || 999999;
    
    whereConditions += ' AND p.selling_price BETWEEN :minPrice AND :maxPrice';
    replacements.minPrice = parsedMinPrice;
    replacements.maxPrice = parsedMaxPrice;

    // Add profit filter (reseller_margin)
    const parsedMinProfit = parseFloat(minProfit) || 0;
    if (parsedMinProfit > 0) {
      whereConditions += ' AND p.reseller_margin >= :minProfit';
      replacements.minProfit = parsedMinProfit;
    }

    // Sort mapping
    const sortMapping = {
      'profit_desc': 'p.reseller_margin DESC',
      'profit_asc': 'p.reseller_margin ASC',
      'price_desc': 'p.selling_price DESC',
      'price_asc': 'p.selling_price ASC',
      'name': 'p.name ASC',
      'created_at': 'p.created_at DESC'
    };

    const orderBy = sortMapping[sortBy] || 'p.created_at DESC';

    // Get products with profit calculation
    const products = await sequelize.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.selling_price,
        p.cost_price,
        p.reseller_margin,
        p.stock_quantity,
        p.category_id,
        p.created_at,
        c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) as primary_image,
        (SELECT COUNT(*) FROM product_saves WHERE product_id = p.id AND user_id = :resellerId) as is_saved,
        CASE 
          WHEN p.stock_quantity > 10 THEN 'in_stock'
          WHEN p.stock_quantity > 0 THEN 'low_stock'
          ELSE 'out_of_stock'
        END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereConditions}
      ORDER BY ${orderBy}
      LIMIT :limit OFFSET :offset
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    // Get total count
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM products p
      WHERE ${whereConditions}
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    const total = parseInt(countResult.total);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      status: 'success',
      data: {
        products: products.map(p => ({
          ...p,
          is_saved: p.is_saved > 0,
          reseller_profit: parseFloat(p.reseller_margin) || 0
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      }
    });

  } catch (error) {
    console.error('Products fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// @route   GET /api/reseller/products/:id
// @desc    Get product details for reseller
// @access  Private (Reseller only)
router.get('/:id', async (req, res) => {
  try {
    const resellerId = req.user.id;
    const { id } = req.params;

    // Get product details
    const [product] = await sequelize.query(`
      SELECT 
        p.*,
        c.name as category_name,
        m.company_name as manufacturer_name,
        (SELECT COUNT(*) FROM product_saves WHERE product_id = p.id AND user_id = :resellerId) as is_saved
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      WHERE p.id = :productId AND p.deleted_at IS NULL
    `, {
      replacements: { productId: id, resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Get product images
    const images = await sequelize.query(`
      SELECT image_url, sort_order, alt_text
      FROM product_images
      WHERE product_id = :productId
      ORDER BY sort_order
    `, {
      replacements: { productId: id },
      type: sequelize.QueryTypes.SELECT
    });

    // Get product videos
    const videos = await sequelize.query(`
      SELECT video_url, thumbnail_url, sort_order
      FROM product_videos
      WHERE product_id = :productId
      ORDER BY sort_order
    `, {
      replacements: { productId: id },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        product: {
          ...product,
          is_saved: product.is_saved > 0,
          reseller_profit: parseFloat(product.reseller_margin) || 0
        },
        images,
        videos
      }
    });

  } catch (error) {
    console.error('Product detail error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product details',
      error: error.message
    });
  }
});

// @route   POST /api/reseller/products/:id/save
// @desc    Save/bookmark a product
// @access  Private (Reseller only)
router.post('/:id/save', async (req, res) => {
  try {
    const resellerId = req.user.id;
    const { id } = req.params;

    // Check if already saved
    const [existing] = await sequelize.query(`
      SELECT id FROM product_saves 
      WHERE product_id = :productId AND user_id = :resellerId
    `, {
      replacements: { productId: id, resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: 'Product already saved'
      });
    }

    // Save product
    await sequelize.query(`
      INSERT INTO product_saves (id, product_id, user_id, created_at, updated_at)
      VALUES (UUID(), :productId, :resellerId, NOW(), NOW())
    `, {
      replacements: { productId: id, resellerId }
    });

    res.json({
      status: 'success',
      message: 'Product saved successfully'
    });

  } catch (error) {
    console.error('Save product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to save product',
      error: error.message
    });
  }
});

// @route   DELETE /api/reseller/products/:id/save
// @desc    Remove saved product
// @access  Private (Reseller only)
router.delete('/:id/save', async (req, res) => {
  try {
    const resellerId = req.user.id;
    const { id } = req.params;

    await sequelize.query(`
      DELETE FROM product_saves 
      WHERE product_id = :productId AND user_id = :resellerId
    `, {
      replacements: { productId: id, resellerId }
    });

    res.json({
      status: 'success',
      message: 'Product removed from saved items'
    });

  } catch (error) {
    console.error('Unsave product error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove saved product',
      error: error.message
    });
  }
});

// @route   GET /api/reseller/products/saved/list
// @desc    Get all saved products for reseller
// @access  Private (Reseller only)
router.get('/saved/list', async (req, res) => {
  try {
    const resellerId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const savedProducts = await sequelize.query(`
      SELECT 
        p.id,
        p.name,
        p.description,
        p.selling_price,
        p.reseller_margin,
        p.stock_quantity,
        c.name as category_name,
        ps.created_at as saved_at,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) as primary_image
      FROM product_saves ps
      JOIN products p ON ps.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ps.user_id = :resellerId AND p.deleted_at IS NULL
      ORDER BY ps.created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { resellerId, limit: parseInt(limit), offset },
      type: sequelize.QueryTypes.SELECT
    });

    // Get total count
    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM product_saves ps
      JOIN products p ON ps.product_id = p.id
      WHERE ps.user_id = :resellerId AND p.deleted_at IS NULL
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    const total = parseInt(countResult.total);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      status: 'success',
      data: {
        products: savedProducts.map(p => ({
          ...p,
          reseller_profit: parseFloat(p.reseller_margin) || 0
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages
        }
      }
    });

  } catch (error) {
    console.error('Saved products error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch saved products',
      error: error.message
    });
  }
});

module.exports = router;
