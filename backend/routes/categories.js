const express = require('express');
const router = express.Router();
const { Category } = require('../models');

// @route   GET /api/categories
// @desc    Get all active categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'slug', 'description', 'parentId', 'imageUrl', 'sortOrder'],
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
    });

    // Build category tree (parent-child structure)
    const categoryTree = categories
      .filter(cat => !cat.parentId)
      .map(parent => ({
        ...parent.toJSON(),
        children: categories
          .filter(child => child.parentId === parent.id)
          .map(child => child.toJSON()),
      }));

    res.status(200).json({
      status: 'success',
      message: 'Categories retrieved successfully',
      data: {
        categories: categoryTree,
        allCategories: categories, // Flat list for dropdowns
      },
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve categories',
      error: error.message,
    });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category with products
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [
        {
          model: Category,
          as: 'children',
          attributes: ['id', 'name', 'slug'],
        },
        {
          model: Category,
          as: 'parent',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Category retrieved successfully',
      data: { category },
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve category',
      error: error.message,
    });
  }
});

module.exports = router;
