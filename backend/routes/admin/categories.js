const express = require('express');
const router = express.Router();
const { authMiddleware, adminOnly } = require('../../middleware/auth');
const { sequelize } = require('../../models');
const { QueryTypes } = require('sequelize');

// @route   GET /api/admin/categories
// @desc    Get all categories
// @access  Private (Admin)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const categories = await sequelize.query(`
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        c.parent_id,
        c.image_url,
        c.is_active,
        c.sort_order,
        c.commission_override,
        c.created_at,
        c.updated_at,
        COUNT(DISTINCT p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.deleted_at IS NULL
      GROUP BY c.id
      ORDER BY c.name ASC
    `, {
      type: QueryTypes.SELECT
    });

    res.json({
      status: 'success',
      data: categories,
    });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
});

// @route   POST /api/admin/categories
// @desc    Create a new category
// @access  Private (Admin)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, description, imageUrl, parentId, isActive = true, sortOrder = 0 } = req.body;

    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Category name is required',
      });
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const [result] = await sequelize.query(`
      INSERT INTO categories (name, slug, description, parent_id, image_url, is_active, sort_order, created_at, updated_at)
      VALUES (:name, :slug, :description, :parentId, :imageUrl, :isActive, :sortOrder, NOW(), NOW())
    `, {
      replacements: { name, slug, description, parentId, imageUrl, isActive, sortOrder },
      type: QueryTypes.INSERT
    });

    res.status(201).json({
      status: 'success',
      message: 'Category created successfully',
      data: { id: result },
    });
  } catch (error) {
    console.error('Category creation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create category',
      error: error.message,
    });
  }
});

// @route   PUT /api/admin/categories/:id
// @desc    Update a category
// @access  Private (Admin)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, imageUrl, parentId, isActive, sortOrder } = req.body;

    // Generate slug from name if name is being updated
    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : null;

    const updates = [];
    const replacements = { id };

    if (name) {
      updates.push('name = :name', 'slug = :slug');
      replacements.name = name;
      replacements.slug = slug;
    }
    if (description !== undefined) {
      updates.push('description = :description');
      replacements.description = description;
    }
    if (imageUrl !== undefined) {
      updates.push('image_url = :imageUrl');
      replacements.imageUrl = imageUrl;
    }
    if (parentId !== undefined) {
      updates.push('parent_id = :parentId');
      replacements.parentId = parentId;
    }
    if (isActive !== undefined) {
      updates.push('is_active = :isActive');
      replacements.isActive = isActive;
    }
    if (sortOrder !== undefined) {
      updates.push('sort_order = :sortOrder');
      replacements.sortOrder = sortOrder;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No fields to update',
      });
    }

    updates.push('updated_at = NOW()');

    await sequelize.query(`
      UPDATE categories 
      SET ${updates.join(', ')}
      WHERE id = :id
    `, {
      replacements,
      type: QueryTypes.UPDATE
    });

    res.json({
      status: 'success',
      message: 'Category updated successfully',
    });
  } catch (error) {
    console.error('Category update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update category',
      error: error.message,
    });
  }
});

// @route   DELETE /api/admin/categories/:id
// @desc    Delete a category (soft delete)
// @access  Private (Admin)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category has products
    const productCountResult = await sequelize.query(`
      SELECT COUNT(*) as productCount
      FROM products
      WHERE category_id = :id AND deleted_at IS NULL
    `, {
      replacements: { id },
      type: QueryTypes.SELECT
    });

    const productCount = productCountResult[0]?.productCount || 0;

    if (productCount > 0) {
      return res.status(400).json({
        status: 'error',
        message: `Cannot delete category with ${productCount} active products`,
      });
    }

    // Mark category as inactive instead of deleting (categories table doesn't have deleted_at)
    await sequelize.query(`
      UPDATE categories 
      SET is_active = FALSE,
          updated_at = NOW()
      WHERE id = :id
    `, {
      replacements: { id },
      type: QueryTypes.UPDATE
    });

    res.json({
      status: 'success',
      message: 'Category deactivated successfully',
    });
  } catch (error) {
    console.error('Category deletion error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete category',
      error: error.message,
    });
  }
});

module.exports = router;
