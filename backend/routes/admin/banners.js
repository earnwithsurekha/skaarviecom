const express = require('express');
const router = express.Router();
const { sequelize } = require('../../models');
const { authMiddleware, adminOnly } = require('../../middleware/auth');
const { validateImageQuality } = require('../../middleware/upload');
const { s3, bucket } = require('../../config/aws');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Apply authentication middleware to all routes
router.use(authMiddleware);
router.use(adminOnly);

// Configure multer for banner image uploads - use memory storage for validation
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Helper function to save banner file to S3 after validation
const saveBannerFile = async (file) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = 'banner-' + uniqueSuffix + path.extname(file.originalname);
  const s3Key = `banners/${filename}`;
  
  const params = {
    Bucket: bucket,
    Key: s3Key,
    Body: file.buffer,
    ContentType: file.mimetype
  };
  
  try {
    const result = await s3.upload(params).promise();
    return result.Location;
  } catch (error) {
    throw new Error(`Failed to upload banner to S3: ${error.message}`);
  }
};

/**
 * GET /api/admin/banners
 * Get all banners with filters
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      bannerType,
      isActive,
      search = '',
      sortBy = 'display_order',
      sortOrder = 'ASC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where conditions
    const whereConditions = ['b.deleted_at IS NULL'];
    
    if (bannerType && bannerType !== 'all') {
      whereConditions.push(`b.banner_type = '${bannerType}'`);
    }
    
    if (isActive !== undefined && isActive !== 'all') {
      whereConditions.push(`b.is_active = ${isActive === 'true' ? 1 : 0}`);
    }
    
    if (search) {
      whereConditions.push(`(b.title LIKE '%${search}%' OR b.description LIKE '%${search}%')`);
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Valid sort columns
    const validSortColumns = ['display_order', 'title', 'banner_type', 'is_active', 'start_date', 'end_date', 'click_count', 'view_count', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'display_order';
    const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Main query
    const query = `
      SELECT 
        b.id,
        b.title,
        b.description,
        b.image_url,
        b.banner_type,
        b.link_url,
        b.link_type,
        b.link_id,
        b.is_active,
        b.start_date,
        b.end_date,
        b.display_order,
        b.click_count,
        b.view_count,
        b.target,
        b.created_at,
        b.updated_at,
        creator.email as created_by_email,
        updater.email as updated_by_email,
        CASE 
          WHEN b.link_type = 'product' THEN p.name
          WHEN b.link_type = 'category' THEN c.name
          ELSE NULL
        END as link_name
      FROM banners b
      LEFT JOIN users creator ON b.created_by = creator.id
      LEFT JOIN users updater ON b.updated_by = updater.id
      LEFT JOIN products p ON b.link_type = 'product' AND b.link_id = p.id
      LEFT JOIN categories c ON b.link_type = 'category' AND b.link_id = c.id
      ${whereClause}
      ORDER BY b.${sortColumn} ${order}
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM banners b
      ${whereClause}
    `;

    const [banners] = await sequelize.query(query);
    const [countResult] = await sequelize.query(countQuery);
    const total = countResult[0]?.total || 0;

    // Get stats
    const statsQuery = `
      SELECT 
        COUNT(*) as total_banners,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_banners,
        SUM(CASE WHEN banner_type = 'homepage' THEN 1 ELSE 0 END) as homepage_banners,
        SUM(CASE WHEN banner_type = 'promotional' THEN 1 ELSE 0 END) as promotional_banners,
        SUM(CASE WHEN banner_type = 'festival' THEN 1 ELSE 0 END) as festival_banners,
        SUM(CASE WHEN banner_type = 'featured' THEN 1 ELSE 0 END) as featured_banners,
        SUM(click_count) as total_clicks,
        SUM(view_count) as total_views
      FROM banners
      WHERE deleted_at IS NULL
    `;

    const [statsResult] = await sequelize.query(statsQuery);
    const stats = statsResult[0] || {};

    res.json({
      success: true,
      data: {
        banners,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
        stats: {
          totalBanners: parseInt(stats.total_banners) || 0,
          activeBanners: parseInt(stats.active_banners) || 0,
          homepageBanners: parseInt(stats.homepage_banners) || 0,
          promotionalBanners: parseInt(stats.promotional_banners) || 0,
          festivalBanners: parseInt(stats.festival_banners) || 0,
          featuredBanners: parseInt(stats.featured_banners) || 0,
          totalClicks: parseInt(stats.total_clicks) || 0,
          totalViews: parseInt(stats.total_views) || 0,
        },
      },
    });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banners',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/banners/:id
 * Get single banner by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        b.*,
        creator.email as created_by_email,
        updater.email as updated_by_email,
        CASE 
          WHEN b.link_type = 'product' THEN p.name
          WHEN b.link_type = 'category' THEN c.name
          ELSE NULL
        END as link_name
      FROM banners b
      LEFT JOIN users creator ON b.created_by = creator.id
      LEFT JOIN users updater ON b.updated_by = updater.id
      LEFT JOIN products p ON b.link_type = 'product' AND b.link_id = p.id
      LEFT JOIN categories c ON b.link_type = 'category' AND b.link_id = c.id
      WHERE b.id = ? AND b.deleted_at IS NULL
    `;

    const [banners] = await sequelize.query(query, {
      replacements: [id],
    });

    if (banners.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
      });
    }

    res.json({
      success: true,
      data: banners[0],
    });
  } catch (error) {
    console.error('Get banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banner',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/banners
 * Create new banner
 */
router.post('/', upload.single('image'), validateImageQuality, async (req, res) => {
  try {
    const {
      title,
      description,
      bannerType,
      linkUrl,
      linkType = 'none',
      linkId,
      isActive = true,
      startDate,
      endDate,
      displayOrder = 0,
      target = '_self',
    } = req.body;

    // Validate required fields
    if (!title || !bannerType) {
      return res.status(400).json({
        success: false,
        message: 'Title and banner type are required',
      });
    }

    // Get image URL from uploaded file or provided URL
    let imageUrl = req.body.imageUrl;
    if (req.file) {
      // Upload file to S3 after validation
      imageUrl = await saveBannerFile(req.file);
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Banner image is required',
      });
    }

    const userId = req.user.id;

    const insertQuery = `
      INSERT INTO banners (
        id, title, description, image_url, banner_type, link_url, link_type, link_id,
        is_active, start_date, end_date, display_order, target, created_by, updated_by
      ) VALUES (
        UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `;

    await sequelize.query(insertQuery, {
      replacements: [
        title,
        description || null,
        imageUrl,
        bannerType,
        linkUrl || null,
        linkType,
        linkId || null,
        isActive === 'true' || isActive === true ? 1 : 0,
        startDate || null,
        endDate || null,
        parseInt(displayOrder) || 0,
        target,
        userId,
        userId,
      ],
    });

    res.json({
      success: true,
      message: 'Banner created successfully',
    });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create banner',
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/banners/:id
 * Update banner
 */
router.put('/:id', upload.single('image'), validateImageQuality, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      bannerType,
      linkUrl,
      linkType,
      linkId,
      isActive,
      startDate,
      endDate,
      displayOrder,
      target,
    } = req.body;

    const userId = req.user.id;

    // Get current banner
    const [currentBanner] = await sequelize.query(
      'SELECT * FROM banners WHERE id = ? AND deleted_at IS NULL',
      { replacements: [id] }
    );

    if (currentBanner.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
      });
    }

    // Handle image update
    let imageUrl = req.body.imageUrl || currentBanner[0].image_url;
    if (req.file) {
      // Upload new file to S3 after validation
      imageUrl = await saveBannerFile(req.file);
      // Note: Old S3 files can be cleaned up via lifecycle policies or manual cleanup
    }

    const updateQuery = `
      UPDATE banners
      SET 
        title = ?,
        description = ?,
        image_url = ?,
        banner_type = ?,
        link_url = ?,
        link_type = ?,
        link_id = ?,
        is_active = ?,
        start_date = ?,
        end_date = ?,
        display_order = ?,
        target = ?,
        updated_by = ?
      WHERE id = ? AND deleted_at IS NULL
    `;

    await sequelize.query(updateQuery, {
      replacements: [
        title,
        description || null,
        imageUrl,
        bannerType,
        linkUrl || null,
        linkType,
        linkId || null,
        isActive === 'true' || isActive === true ? 1 : 0,
        startDate || null,
        endDate || null,
        parseInt(displayOrder) || 0,
        target,
        userId,
        id,
      ],
    });

    res.json({
      success: true,
      message: 'Banner updated successfully',
    });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update banner',
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/banners/:id
 * Soft delete banner
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deleteQuery = `
      UPDATE banners
      SET deleted_at = NOW()
      WHERE id = ? AND deleted_at IS NULL
    `;

    const [result] = await sequelize.query(deleteQuery, {
      replacements: [id],
    });

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Banner not found',
      });
    }

    res.json({
      success: true,
      message: 'Banner deleted successfully',
    });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete banner',
      error: error.message,
    });
  }
});

/**
 * PATCH /api/admin/banners/:id/toggle-status
 * Toggle banner active status
 */
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;

    const toggleQuery = `
      UPDATE banners
      SET 
        is_active = NOT is_active,
        updated_by = ?
      WHERE id = ? AND deleted_at IS NULL
    `;

    await sequelize.query(toggleQuery, {
      replacements: [req.user.id, id],
    });

    res.json({
      success: true,
      message: 'Banner status updated successfully',
    });
  } catch (error) {
    console.error('Toggle banner status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update banner status',
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/banners/:id/track-view
 * Track banner view (increment view count)
 */
router.post('/:id/track-view', async (req, res) => {
  try {
    const { id } = req.params;

    await sequelize.query(
      'UPDATE banners SET view_count = view_count + 1 WHERE id = ?',
      { replacements: [id] }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/admin/banners/:id/track-click
 * Track banner click (increment click count)
 */
router.post('/:id/track-click', async (req, res) => {
  try {
    const { id } = req.params;

    await sequelize.query(
      'UPDATE banners SET click_count = click_count + 1 WHERE id = ?',
      { replacements: [id] }
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/admin/banners/public/active
 * Get active banners for public display (no auth required)
 */
router.get('/public/active', async (req, res) => {
  try {
    const { bannerType } = req.query;

    let typeFilter = '';
    if (bannerType && bannerType !== 'all') {
      typeFilter = `AND banner_type = '${bannerType}'`;
    }

    const query = `
      SELECT 
        id, title, description, image_url, banner_type, link_url, link_type,
        link_id, target, display_order
      FROM banners
      WHERE 
        is_active = 1
        AND deleted_at IS NULL
        AND (start_date IS NULL OR start_date <= NOW())
        AND (end_date IS NULL OR end_date >= NOW())
        ${typeFilter}
      ORDER BY display_order ASC, created_at DESC
    `;

    const [banners] = await sequelize.query(query);

    res.json({
      success: true,
      data: banners,
    });
  } catch (error) {
    console.error('Get public banners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch banners',
      error: error.message,
    });
  }
});

module.exports = router;
