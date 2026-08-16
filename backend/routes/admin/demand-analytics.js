const express = require('express');
const router = express.Router();
const { sequelize } = require('../../models');
const { authMiddleware, adminOnly } = require('../../middleware/auth');

// Apply authentication middleware to all routes
router.use(authMiddleware);
router.use(adminOnly);

/**
 * GET /api/admin/demand-analytics
 * Get product-wise demand analytics
 * Query params: period (7d, 30d, 90d, all), groupBy (product, category, manufacturer), search, page, limit
 */
router.get('/', async (req, res) => {
  try {
    const { 
      period = '30d',
      groupBy = 'product',
      search = '',
      page = 1,
      limit = 20,
      sortBy = 'conversionRate',
      sortOrder = 'DESC'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Check if tracking tables exist
    const [tableCheck] = await sequelize.query(`
      SELECT 
        SUM(CASE WHEN table_name = 'product_clicks' THEN 1 ELSE 0 END) as has_clicks,
        SUM(CASE WHEN table_name = 'product_views' THEN 1 ELSE 0 END) as has_views,
        SUM(CASE WHEN table_name = 'product_saves' THEN 1 ELSE 0 END) as has_saves,
        SUM(CASE WHEN table_name = 'product_shares' THEN 1 ELSE 0 END) as has_shares
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name IN ('product_clicks', 'product_views', 'product_saves', 'product_shares')
    `);

    const hasClicks = tableCheck[0]?.has_clicks === 1;
    const hasViews = tableCheck[0]?.has_views === 1;
    const hasSaves = tableCheck[0]?.has_saves === 1;
    const hasShares = tableCheck[0]?.has_shares === 1;

    // Use product_views as fallback for product_clicks
    const clicksTable = hasClicks ? 'product_clicks' : (hasViews ? 'product_views' : null);
    const clicksDateColumn = hasClicks ? 'created_at' : 'viewed_at';

    // Calculate date filter based on period
    let dateFilter = '';
    if (period !== 'all') {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      dateFilter = `AND o.ordered_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`;
    }

    // Search filter
    const searchFilter = search ? `AND p.name LIKE '%${search}%'` : '';

    // Build clicks/views subquery dynamically
    const clicksJoin = clicksTable ? `
      LEFT JOIN (
        SELECT 
          product_id,
          COUNT(*) as total_clicks,
          SUM(CASE WHEN ${clicksDateColumn} >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as recent_clicks
        FROM ${clicksTable}
        WHERE 1=1 ${dateFilter.replace('o.ordered_at', clicksDateColumn)}
        GROUP BY product_id
      ) clicks ON p.id = clicks.product_id
    ` : '';

    // Build saves subquery dynamically
    const savesJoin = hasSaves ? `
      LEFT JOIN (
        SELECT 
          product_id,
          COUNT(*) as total_saves,
          COUNT(*) as active_saves,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as recent_saves
        FROM product_saves
        WHERE 1=1 ${dateFilter.replace('o.ordered_at', 'created_at')}
        GROUP BY product_id
      ) saves ON p.id = saves.product_id
    ` : '';

    // Build shares subquery dynamically
    const sharesJoin = hasShares ? `
      LEFT JOIN (
        SELECT 
          product_id,
          COUNT(*) as total_shares,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as recent_shares
        FROM product_shares
        WHERE 1=1 ${dateFilter.replace('o.ordered_at', 'created_at')}
        GROUP BY product_id
      ) shares ON p.id = shares.product_id
    ` : '';

    // Base query for product-wise demand
    const query = `
      SELECT 
        p.id as productId,
        p.name as productName,
        p.sku as productSku,
        pi.image_url as productImage,
        m.company_name as manufacturerName,
        m.brand_name as brandName,
        c.name as categoryName,
        
        -- Demand Metrics
        ${clicksTable ? 'COALESCE(clicks.total_clicks, 0)' : '0'} as totalClicks,
        ${hasSaves ? 'COALESCE(saves.total_saves, 0)' : '0'} as totalSaves,
        ${hasSaves ? 'COALESCE(saves.active_saves, 0)' : '0'} as activeSaves,
        ${hasShares ? 'COALESCE(shares.total_shares, 0)' : '0'} as totalShares,
        COALESCE(orders.total_orders, 0) as totalOrders,
        COALESCE(orders.total_quantity, 0) as totalQuantitySold,
        COALESCE(orders.total_revenue, 0) as totalRevenue,
        
        -- Conversion Metrics
        CASE 
          WHEN ${clicksTable ? 'COALESCE(clicks.total_clicks, 0)' : '0'} > 0 
          THEN (COALESCE(orders.total_orders, 0) * 100.0 / ${clicksTable ? 'clicks.total_clicks' : '1'})
          ELSE 0 
        END as conversionRate,
        
        CASE 
          WHEN ${hasSaves ? 'COALESCE(saves.total_saves, 0)' : '0'} > 0 
          THEN (COALESCE(orders.total_orders, 0) * 100.0 / ${hasSaves ? 'saves.total_saves' : '1'})
          ELSE 0 
        END as saveToOrderRate,
        
        -- Engagement Score (weighted)
        (
          (${clicksTable ? 'COALESCE(clicks.total_clicks, 0)' : '0'} * 1) +
          (${hasSaves ? 'COALESCE(saves.total_saves, 0)' : '0'} * 3) +
          (${hasShares ? 'COALESCE(shares.total_shares, 0)' : '0'} * 5) +
          (COALESCE(orders.total_orders, 0) * 10)
        ) as engagementScore,
        
        -- Trending Score (recent activity weighted higher)
        (
          (${clicksTable ? 'COALESCE(clicks.recent_clicks, 0)' : '0'} * 1) +
          (${hasSaves ? 'COALESCE(saves.recent_saves, 0)' : '0'} * 3) +
          (${hasShares ? 'COALESCE(shares.recent_shares, 0)' : '0'} * 5) +
          (COALESCE(orders.recent_orders, 0) * 10)
        ) as trendingScore
        
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      LEFT JOIN categories c ON p.category_id = c.id
      
      ${clicksJoin}
      ${savesJoin}
      ${sharesJoin}
      
      -- Orders aggregation
      LEFT JOIN (
        SELECT 
          oi.product_id,
          COUNT(DISTINCT o.id) as total_orders,
          SUM(oi.quantity) as total_quantity,
          SUM(oi.quantity * oi.selling_price) as total_revenue,
          COUNT(DISTINCT CASE WHEN o.ordered_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN o.id ELSE NULL END) as recent_orders
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.order_status != 'cancelled' ${dateFilter}
        GROUP BY oi.product_id
      ) orders ON p.id = orders.product_id
      
      WHERE p.deleted_at IS NULL ${searchFilter}
      
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ${parseInt(limit)} OFFSET ${offset}
    `;

    // Count query
    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      WHERE p.deleted_at IS NULL ${searchFilter}
    `;

    const [results] = await sequelize.query(query);
    const [countResults] = await sequelize.query(countQuery);
    const total = countResults[0]?.total || 0;

    // Get overall stats with dynamic table joins
    const statsClicksJoin = clicksTable 
      ? `LEFT JOIN ${clicksTable} pc ON p.id = pc.product_id ${dateFilter.replace('o.ordered_at', `AND pc.${clicksDateColumn}`) || ''}`
      : '';
    const statsSavesJoin = hasSaves
      ? `LEFT JOIN product_saves ps ON p.id = ps.product_id ${dateFilter.replace('o.ordered_at', 'AND ps.created_at') || ''}`
      : '';
    const statsSharesJoin = hasShares
      ? `LEFT JOIN product_shares psh ON p.id = psh.product_id ${dateFilter.replace('o.ordered_at', 'AND psh.created_at') || ''}`
      : '';

    const statsQuery = `
      SELECT 
        COUNT(DISTINCT ${clicksTable ? 'pc.product_id' : 'NULL'}) as productsWithClicks,
        COUNT(DISTINCT ${hasSaves ? 'ps.product_id' : 'NULL'}) as productsWithSaves,
        COUNT(DISTINCT ${hasShares ? 'psh.product_id' : 'NULL'}) as productsWithShares,
        COUNT(DISTINCT oi.product_id) as productsWithOrders,
        SUM(CASE WHEN ${clicksTable ? `pc.${clicksDateColumn}` : 'NULL'} IS NOT NULL THEN 1 ELSE 0 END) as totalClicks,
        SUM(CASE WHEN ${hasSaves ? 'ps.created_at' : 'NULL'} IS NOT NULL THEN 1 ELSE 0 END) as totalSaves,
        SUM(CASE WHEN ${hasShares ? 'psh.created_at' : 'NULL'} IS NOT NULL THEN 1 ELSE 0 END) as totalShares,
        COUNT(DISTINCT o.id) as totalOrders,
        SUM(oi.quantity * oi.selling_price) as totalRevenue
      FROM products p
      ${statsClicksJoin}
      ${statsSavesJoin}
      ${statsSharesJoin}
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.order_status != 'cancelled' ${dateFilter}
      WHERE p.deleted_at IS NULL
    `;

    const [statsResults] = await sequelize.query(statsQuery);
    const stats = statsResults[0] || {};

    res.json({
      success: true,
      data: {
        products: results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
        stats: {
          totalProducts: total,
          productsWithClicks: parseInt(stats.productsWithClicks) || 0,
          productsWithSaves: parseInt(stats.productsWithSaves) || 0,
          productsWithShares: parseInt(stats.productsWithShares) || 0,
          productsWithOrders: parseInt(stats.productsWithOrders) || 0,
          totalClicks: parseInt(stats.totalClicks) || 0,
          totalSaves: parseInt(stats.totalSaves) || 0,
          totalShares: parseInt(stats.totalShares) || 0,
          totalOrders: parseInt(stats.totalOrders) || 0,
          totalRevenue: parseFloat(stats.totalRevenue) || 0,
          overallConversionRate: stats.totalClicks > 0 
            ? ((stats.totalOrders / stats.totalClicks) * 100).toFixed(2)
            : 0,
        },
      },
    });
  } catch (error) {
    console.error('Demand analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demand analytics',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/demand-analytics/trending
 * Get trending products based on recent engagement
 */
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Check which tracking tables exist
    const [tableCheck] = await sequelize.query(`
      SELECT 
        SUM(CASE WHEN table_name = 'product_clicks' THEN 1 ELSE 0 END) as has_clicks,
        SUM(CASE WHEN table_name = 'product_views' THEN 1 ELSE 0 END) as has_views,
        SUM(CASE WHEN table_name = 'product_saves' THEN 1 ELSE 0 END) as has_saves,
        SUM(CASE WHEN table_name = 'product_shares' THEN 1 ELSE 0 END) as has_shares
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name IN ('product_clicks', 'product_views', 'product_saves', 'product_shares')
    `);

    const hasClicks = tableCheck[0]?.has_clicks === 1;
    const hasViews = tableCheck[0]?.has_views === 1;
    const hasSaves = tableCheck[0]?.has_saves === 1;
    const hasShares = tableCheck[0]?.has_shares === 1;

    const clicksTable = hasClicks ? 'product_clicks' : (hasViews ? 'product_views' : null);
    const clicksDateColumn = hasClicks ? 'created_at' : 'viewed_at';

    // If no tracking tables at all, return empty data
    if (!clicksTable && !hasSaves && !hasShares) {
      return res.json({
        success: true,
        message: 'No tracking tables found',
        data: [],
      });
    }

    // Build dynamic joins
    const clicksJoin = clicksTable ? `
      LEFT JOIN (
        SELECT 
          product_id,
          SUM(CASE WHEN ${clicksDateColumn} >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as recent_clicks,
          SUM(CASE WHEN ${clicksDateColumn} >= DATE_SUB(NOW(), INTERVAL 14 DAY) AND ${clicksDateColumn} < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as prev_clicks
        FROM ${clicksTable}
        WHERE ${clicksDateColumn} >= DATE_SUB(NOW(), INTERVAL 14 DAY)
        GROUP BY product_id
      ) clicks ON p.id = clicks.product_id
    ` : '';

    const savesJoin = hasSaves ? `
      LEFT JOIN (
        SELECT 
          product_id,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as recent_saves
        FROM product_saves
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY product_id
      ) saves ON p.id = saves.product_id
    ` : '';

    const sharesJoin = hasShares ? `
      LEFT JOIN (
        SELECT 
          product_id,
          SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as recent_shares
        FROM product_shares
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY product_id
      ) shares ON p.id = shares.product_id
    ` : '';

    const query = `
      SELECT 
        p.id as productId,
        p.name as productName,
        pi.image_url as productImage,
        m.brand_name as brandName,
        
        -- Recent activity (last 7 days)
        COALESCE(clicks.recent_clicks, 0) as recentClicks,
        COALESCE(saves.recent_saves, 0) as recentSaves,
        COALESCE(shares.recent_shares, 0) as recentShares,
        COALESCE(orders.recent_orders, 0) as recentOrders,
        
        -- Trending score (weighted recent activity)
        (
          (COALESCE(clicks.recent_clicks, 0) * 1) +
          (COALESCE(saves.recent_saves, 0) * 3) +
          (COALESCE(shares.recent_shares, 0) * 5) +
          (COALESCE(orders.recent_orders, 0) * 10)
        ) as trendingScore,
        
        -- Growth percentage (comparing last 7 days to previous 7 days)
        CASE 
          WHEN COALESCE(clicks.prev_clicks, 0) > 0 
          THEN ((COALESCE(clicks.recent_clicks, 0) - clicks.prev_clicks) * 100.0 / clicks.prev_clicks)
          ELSE 100
        END as growthPercentage
        
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = 1
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      
      ${clicksJoin}
      ${savesJoin}
      ${sharesJoin}
      
      -- Recent orders
      LEFT JOIN (
        SELECT 
          oi.product_id,
          COUNT(DISTINCT CASE WHEN o.ordered_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN o.id ELSE NULL END) as recent_orders
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.ordered_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) AND o.order_status != 'cancelled'
        GROUP BY oi.product_id
      ) orders ON p.id = orders.product_id
      
      WHERE p.deleted_at IS NULL
        AND (
          COALESCE(clicks.recent_clicks, 0) > 0 OR
          COALESCE(saves.recent_saves, 0) > 0 OR
          COALESCE(shares.recent_shares, 0) > 0 OR
          COALESCE(orders.recent_orders, 0) > 0
        )
      
      ORDER BY trendingScore DESC, growthPercentage DESC
      LIMIT ${parseInt(limit)}
    `;

    const [results] = await sequelize.query(query);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Trending products error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending products',
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/demand-analytics/share-breakdown
 * Get share platform breakdown
 */
router.get('/share-breakdown', async (req, res) => {
  try {
    const { period = '30d', productId } = req.query;

    // Check if product_shares table exists
    const [tableCheck] = await sequelize.query(`
      SELECT COUNT(*) as tableCount
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'product_shares'
    `);

    const tableExists = tableCheck[0]?.tableCount === 1;

    // If table doesn't exist, return empty data
    if (!tableExists) {
      return res.json({
        success: true,
        message: 'product_shares table not created yet',
        data: [],
      });
    }

    let dateFilter = '';
    if (period !== 'all') {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      dateFilter = `AND created_at >= DATE_SUB(NOW(), INTERVAL ${days} DAY)`;
    }

    const productFilter = productId ? `AND product_id = '${productId}'` : '';

    const query = `
      SELECT 
        platform,
        COUNT(*) as totalShares,
        COUNT(DISTINCT product_id) as uniqueProducts,
        COUNT(DISTINCT user_id) as uniqueUsers
      FROM product_shares
      WHERE 1=1 ${dateFilter} ${productFilter}
      GROUP BY platform
      ORDER BY totalShares DESC
    `;

    const [results] = await sequelize.query(query);

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Share breakdown error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch share breakdown',
      error: error.message,
    });
  }
});

module.exports = router;
