const { Op } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Get sales report for manufacturer
 * @param {string} manufacturerId - Manufacturer ID
 * @param {string} period - Period type (daily, weekly, monthly)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Sales data grouped by period
 */
async function getSalesReport(manufacturerId, period, startDate, endDate) {
  try {
    let dateFormat;
    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        dateFormat = '%Y-%u';
        break;
      case 'monthly':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const [results] = await sequelize.query(`
      SELECT 
        DATE_FORMAT(o.created_at, :dateFormat) as period,
        DATE(o.created_at) as date,
        COUNT(DISTINCT o.id) as ordersCount,
        SUM(oi.quantity) as productsSold,
        SUM(oi.item_total) as revenue,
        SUM(oi.platform_fee) as platformFee,
        SUM(oi.manufacturer_amount) as netRevenue
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      WHERE oi.manufacturer_id = :manufacturerId
        AND o.payment_status = 'paid'
        AND o.order_status NOT IN ('cancelled', 'returned')
        AND o.created_at BETWEEN :startDate AND :endDate
      GROUP BY DATE_FORMAT(o.created_at, :dateFormat), DATE(o.created_at)
      ORDER BY date ASC
    `, {
      replacements: { manufacturerId, dateFormat, startDate, endDate },
      type: sequelize.QueryTypes.SELECT,
    });

    return results.map(r => ({
      period: r.period,
      date: r.date,
      ordersCount: parseInt(r.ordersCount || 0),
      productsSold: parseInt(r.productsSold || 0),
      revenue: parseFloat(r.revenue || 0),
      platformFee: parseFloat(r.platformFee || 0),
      netRevenue: parseFloat(r.netRevenue || 0),
    }));
  } catch (error) {
    console.error('Get sales report error:', error);
    throw error;
  }
}

/**
 * Get product performance report
 * @param {string} manufacturerId - Manufacturer ID
 * @param {string} type - Report type (best/least/saved/shared)
 * @param {number} limit - Number of products to return
 * @returns {Array} Product performance data
 */
async function getProductReport(manufacturerId, type, limit = 10) {
  try {
    let query;
    
    switch (type) {
      case 'best':
        // Best selling products by quantity
        query = `
          SELECT 
            p.id as productId,
            p.name as productName,
            p.sku as productSku,
            p.stock_quantity as currentStock,
            SUM(oi.quantity) as quantitySold,
            SUM(oi.item_total) as revenue,
            COUNT(DISTINCT oi.order_id) as ordersCount
          FROM products p
          INNER JOIN order_items oi ON p.id = oi.product_id
          INNER JOIN orders o ON oi.order_id = o.id
          WHERE p.manufacturer_id = :manufacturerId
            AND o.payment_status = 'paid'
            AND o.order_status NOT IN ('cancelled', 'returned')
          GROUP BY p.id, p.name, p.sku, p.stock_quantity
          ORDER BY quantitySold DESC
          LIMIT :limit
        `;
        break;

      case 'least':
        // Least selling products
        query = `
          SELECT 
            p.id as productId,
            p.name as productName,
            p.sku as productSku,
            p.stock_quantity as currentStock,
            COALESCE(SUM(oi.quantity), 0) as quantitySold,
            COALESCE(SUM(oi.item_total), 0) as revenue,
            COUNT(DISTINCT oi.order_id) as ordersCount
          FROM products p
          LEFT JOIN order_items oi ON p.id = oi.product_id
          LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid' AND o.order_status NOT IN ('cancelled', 'returned')
          WHERE p.manufacturer_id = :manufacturerId
            AND p.approval_status = 'approved'
            AND p.is_active = 1
          GROUP BY p.id, p.name, p.sku, p.stock_quantity
          ORDER BY quantitySold ASC
          LIMIT :limit
        `;
        break;

      case 'saved':
        // Most saved products (reseller interest)
        query = `
          SELECT 
            p.id as productId,
            p.name as productName,
            p.sku as productSku,
            p.stock_quantity as currentStock,
            COUNT(ps.id) as savesCount,
            COALESCE(SUM(oi.quantity), 0) as quantitySold
          FROM products p
          LEFT JOIN product_saves ps ON p.id = ps.product_id
          LEFT JOIN order_items oi ON p.id = oi.product_id
          LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
          WHERE p.manufacturer_id = :manufacturerId
            AND p.approval_status = 'approved'
          GROUP BY p.id, p.name, p.sku, p.stock_quantity
          ORDER BY savesCount DESC
          LIMIT :limit
        `;
        break;

      case 'shared':
        // Most shared products (virality)
        query = `
          SELECT 
            p.id as productId,
            p.name as productName,
            p.sku as productSku,
            COUNT(ps.id) as sharesCount,
            COALESCE(SUM(oi.quantity), 0) as quantitySold
          FROM products p
          LEFT JOIN product_shares ps ON p.id = ps.product_id
          LEFT JOIN order_items oi ON p.id = oi.product_id
          LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
          WHERE p.manufacturer_id = :manufacturerId
            AND p.approval_status = 'approved'
          GROUP BY p.id, p.name, p.sku
          ORDER BY sharesCount DESC
          LIMIT :limit
        `;
        break;

      default:
        throw new Error('Invalid report type');
    }

    const [results] = await sequelize.query(query, {
      replacements: { manufacturerId, limit: parseInt(limit) },
      type: sequelize.QueryTypes.SELECT,
    });

    return results;
  } catch (error) {
    console.error('Get product report error:', error);
    throw error;
  }
}

/**
 * Get reseller demand report (most saved, shared, clicked products)
 * @param {string} manufacturerId - Manufacturer ID
 * @param {number} limit - Number of products per category
 * @returns {Object} Reseller demand metrics
 */
async function getResellerDemandReport(manufacturerId, limit = 10) {
  try {
    // Most saved products
    const [mostSaved] = await sequelize.query(`
      SELECT 
        p.id as productId,
        p.name as productName,
        p.sku as productSku,
        COUNT(ps.id) as savesCount,
        COALESCE(SUM(oi.quantity), 0) as quantitySold,
        CASE 
          WHEN COUNT(ps.id) > 0 THEN (COALESCE(SUM(oi.quantity), 0) / COUNT(ps.id)) * 100 
          ELSE 0 
        END as conversionRate
      FROM products p
      LEFT JOIN product_saves ps ON p.id = ps.product_id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
      WHERE p.manufacturer_id = :manufacturerId
        AND p.approval_status = 'approved'
      GROUP BY p.id, p.name, p.sku
      HAVING savesCount > 0
      ORDER BY savesCount DESC
      LIMIT :limit
    `, {
      replacements: { manufacturerId, limit: parseInt(limit) },
      type: sequelize.QueryTypes.SELECT,
    });

    // Most shared products
    const [mostShared] = await sequelize.query(`
      SELECT 
        p.id as productId,
        p.name as productName,
        p.sku as productSku,
        COUNT(ps.id) as sharesCount,
        COALESCE(SUM(oi.quantity), 0) as quantitySold
      FROM products p
      LEFT JOIN product_shares ps ON p.id = ps.product_id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
      WHERE p.manufacturer_id = :manufacturerId
        AND p.approval_status = 'approved'
      GROUP BY p.id, p.name, p.sku
      HAVING sharesCount > 0
      ORDER BY sharesCount DESC
      LIMIT :limit
    `, {
      replacements: { manufacturerId, limit: parseInt(limit) },
      type: sequelize.QueryTypes.SELECT,
    });

    // Most clicked products
    const [mostClicked] = await sequelize.query(`
      SELECT 
        p.id as productId,
        p.name as productName,
        p.sku as productSku,
        COUNT(pc.id) as clicksCount,
        COALESCE(SUM(oi.quantity), 0) as quantitySold,
        CASE 
          WHEN COUNT(pc.id) > 0 THEN (COALESCE(SUM(oi.quantity), 0) / COUNT(pc.id)) * 100 
          ELSE 0 
        END as conversionRate
      FROM products p
      LEFT JOIN product_clicks pc ON p.id = pc.product_id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
      WHERE p.manufacturer_id = :manufacturerId
        AND p.approval_status = 'approved'
      GROUP BY p.id, p.name, p.sku
      HAVING clicksCount > 0
      ORDER BY clicksCount DESC
      LIMIT :limit
    `, {
      replacements: { manufacturerId, limit: parseInt(limit) },
      type: sequelize.QueryTypes.SELECT,
    });

    // Highest conversion products (saves to orders ratio)
    const [highestConversion] = await sequelize.query(`
      SELECT 
        p.id as productId,
        p.name as productName,
        p.sku as productSku,
        COUNT(DISTINCT ps.id) as savesCount,
        COUNT(DISTINCT oi.order_id) as ordersCount,
        COALESCE(SUM(oi.quantity), 0) as quantitySold,
        CASE 
          WHEN COUNT(DISTINCT ps.id) > 0 THEN (COUNT(DISTINCT oi.order_id) / COUNT(DISTINCT ps.id)) * 100 
          ELSE 0 
        END as conversionRate
      FROM products p
      LEFT JOIN product_saves ps ON p.id = ps.product_id
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
      WHERE p.manufacturer_id = :manufacturerId
        AND p.approval_status = 'approved'
      GROUP BY p.id, p.name, p.sku
      HAVING savesCount > 0
      ORDER BY conversionRate DESC
      LIMIT :limit
    `, {
      replacements: { manufacturerId, limit: parseInt(limit) },
      type: sequelize.QueryTypes.SELECT,
    });

    return {
      mostSaved: mostSaved.map(p => ({
        ...p,
        conversionRate: parseFloat(p.conversionRate).toFixed(2),
      })),
      mostShared,
      mostClicked: mostClicked.map(p => ({
        ...p,
        conversionRate: parseFloat(p.conversionRate).toFixed(2),
      })),
      highestConversion: highestConversion.map(p => ({
        ...p,
        conversionRate: parseFloat(p.conversionRate).toFixed(2),
      })),
    };
  } catch (error) {
    console.error('Get reseller demand report error:', error);
    throw error;
  }
}

/**
 * Get revenue report with breakdown
 * @param {string} manufacturerId - Manufacturer ID
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @param {string} groupBy - Grouping period (day, week, month)
 * @returns {Object} Revenue breakdown
 */
async function getRevenueReport(manufacturerId, startDate, endDate, groupBy = 'day') {
  try {
    let dateFormat;
    switch (groupBy) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    // Get revenue breakdown by period
    const [breakdown] = await sequelize.query(`
      SELECT 
        DATE_FORMAT(o.created_at, :dateFormat) as period,
        DATE(o.created_at) as date,
        SUM(oi.item_total) as grossRevenue,
        SUM(oi.platform_fee) as platformFees,
        SUM(oi.manufacturer_amount) as netRevenue,
        COUNT(DISTINCT o.id) as ordersCount
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      WHERE oi.manufacturer_id = :manufacturerId
        AND o.payment_status = 'paid'
        AND o.order_status NOT IN ('cancelled', 'returned')
        AND o.created_at BETWEEN :startDate AND :endDate
      GROUP BY DATE_FORMAT(o.created_at, :dateFormat), DATE(o.created_at)
      ORDER BY date ASC
    `, {
      replacements: { manufacturerId, dateFormat, startDate, endDate },
      type: sequelize.QueryTypes.SELECT,
    });

    // Get totals
    const [totals] = await sequelize.query(`
      SELECT 
        SUM(oi.item_total) as totalGrossRevenue,
        SUM(oi.platform_fee) as totalPlatformFees,
        SUM(oi.manufacturer_amount) as totalNetRevenue,
        COUNT(DISTINCT o.id) as totalOrders
      FROM orders o
      INNER JOIN order_items oi ON o.id = oi.order_id
      WHERE oi.manufacturer_id = :manufacturerId
        AND o.payment_status = 'paid'
        AND o.order_status NOT IN ('cancelled', 'returned')
        AND o.created_at BETWEEN :startDate AND :endDate
    `, {
      replacements: { manufacturerId, startDate, endDate },
      type: sequelize.QueryTypes.SELECT,
    });

    return {
      grossRevenue: parseFloat(totals[0]?.totalGrossRevenue || 0),
      platformFees: parseFloat(totals[0]?.totalPlatformFees || 0),
      netRevenue: parseFloat(totals[0]?.totalNetRevenue || 0),
      totalOrders: parseInt(totals[0]?.totalOrders || 0),
      breakdown: breakdown.map(b => ({
        period: b.period,
        date: b.date,
        grossRevenue: parseFloat(b.grossRevenue || 0),
        platformFees: parseFloat(b.platformFees || 0),
        netRevenue: parseFloat(b.netRevenue || 0),
        ordersCount: parseInt(b.ordersCount || 0),
      })),
    };
  } catch (error) {
    console.error('Get revenue report error:', error);
    throw error;
  }
}

module.exports = {
  getSalesReport,
  getProductReport,
  getResellerDemandReport,
  getRevenueReport,
};
