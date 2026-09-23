const { ProductSave, Product, ProductImage } = require('../models');

const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const savedProducts = await ProductSave.findAll({
      where: { userId },
      include: [{
        model: Product,
        as: 'product',
        required: true,
        where: { status: 'approved' },
        include: [{
          model: ProductImage,
          as: 'images',
          attributes: ['imageUrl', 'sortOrder', 'isPrimary'],
        }],
      }],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
      status: 'success',
      data: {
        products: savedProducts.map((savedProduct) => ({
          ...savedProduct.product.toJSON(),
          savedAt: savedProduct.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('Fetch wishlist error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch wishlist',
    });
  }
};

module.exports = { getWishlist };