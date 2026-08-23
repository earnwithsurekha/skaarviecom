const express = require('express');
const router = express.Router();
const { sequelize } = require('../models');

// @route   GET /api/public/products/:slug
// @desc    Get product details by slug for public viewing
// @access  Public
router.get('/products/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Get product details by slug or ID
    const [product] = await sequelize.query(`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.description,
        p.cost_price,
        p.skaarvi_margin,
        p.reseller_margin,
        p.selling_price,
        p.stock_quantity,
        p.specifications,
        p.delivery_days,
        p.shipping_info,
        p.category_id,
        c.name as category_name,
        m.company_name as manufacturer_name,
        m.id as manufacturer_id,
        CASE 
          WHEN p.stock_quantity > 10 THEN 'in_stock'
          WHEN p.stock_quantity > 0 THEN 'low_stock'
          ELSE 'out_of_stock'
        END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      WHERE (p.slug = :slug OR p.id = :slug)
      AND p.deleted_at IS NULL 
      AND p.status = 'approved'
    `, {
      replacements: { slug },
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
      replacements: { productId: product.id },
      type: sequelize.QueryTypes.SELECT
    });

    // Get product videos
    const videos = await sequelize.query(`
      SELECT video_url, thumbnail_url, sort_order
      FROM product_videos
      WHERE product_id = :productId
      ORDER BY sort_order
    `, {
      replacements: { productId: product.id },
      type: sequelize.QueryTypes.SELECT
    });

    // Get related products (same category)
    const relatedProducts = await sequelize.query(`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.selling_price,
        p.reseller_margin,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) as primary_image
      FROM products p
      WHERE p.category_id = :categoryId
      AND p.id != :productId
      AND p.deleted_at IS NULL
      AND p.status = 'approved'
      ORDER BY RAND()
      LIMIT 4
    `, {
      replacements: { 
        categoryId: product.category_id,
        productId: product.id
      },
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        product: {
          ...product,
          reseller_profit: parseFloat(product.reseller_margin) || 0
        },
        images,
        videos,
        relatedProducts
      }
    });

  } catch (error) {
    console.error('Public product detail error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product details',
      error: error.message
    });
  }
});

// @route   GET /api/public/products
// @desc    Get products for public browsing (optional, for homepage)
// @access  Public
router.get('/products', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category = '',
      search = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereConditions = "p.deleted_at IS NULL AND p.status = 'approved'";
    const replacements = { limit: parseInt(limit), offset };

    if (search) {
      whereConditions += ' AND (p.name LIKE :search OR p.description LIKE :search)';
      replacements.search = `%${search}%`;
    }

    if (category) {
      console.log('[Public Products] Filtering by category:', category);
      whereConditions += ' AND p.category_id = :categoryId';
      replacements.categoryId = category;
    }

    const products = await sequelize.query(`
      SELECT 
        p.id,
        p.name,
        p.slug,
        p.selling_price,
        p.reseller_margin,
        p.stock_quantity,
        p.category_id,
        c.name as category_name,
        (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY sort_order LIMIT 1) as primary_image,
        CASE 
          WHEN p.stock_quantity > 10 THEN 'in_stock'
          WHEN p.stock_quantity > 0 THEN 'low_stock'
          ELSE 'out_of_stock'
        END as stock_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE ${whereConditions}
      ORDER BY p.created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    console.log('[Public Products] Query returned', products.length, 'products');
    if (category && products.length > 0) {
      console.log('[Public Products] Sample product category:', products[0].category_id, products[0].category_name);
    }

    const [countResult] = await sequelize.query(`
      SELECT COUNT(*) as total
      FROM products p
      WHERE ${whereConditions}
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: {
        products: products.map(p => ({
          ...p,
          reseller_profit: parseFloat(p.reseller_margin) || 0
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(countResult.total / parseInt(limit)),
          totalProducts: countResult.total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Public products list error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products',
      error: error.message
    });
  }
});

// @route   GET /api/public/categories
// @desc    Get all active categories for public viewing
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await sequelize.query(`
      SELECT 
        id,
        name,
        slug,
        description,
        parent_id as parentId,
        image_url as imageUrl,
        sort_order as sortOrder
      FROM categories
      WHERE is_active = 1
      ORDER BY sort_order ASC, name ASC
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    // Build category tree (parent-child structure)
    const categoryTree = categories
      .filter(cat => !cat.parentId)
      .map(parent => ({
        ...parent,
        children: categories.filter(child => child.parentId === parent.id)
      }));

    res.status(200).json({
      status: 'success',
      message: 'Categories retrieved successfully',
      data: {
        categories: categoryTree,
        allCategories: categories // Flat list for dropdowns
      }
    });
  } catch (error) {
    console.error('Get public categories error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve categories',
      error: error.message
    });
  }
});

module.exports = router;
