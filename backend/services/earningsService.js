const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { ManufacturerEarnings, Product } = require('../models');

/**
 * Calculate manufacturer earnings from order items
 * @param {string} manufacturerId - Manufacturer ID
 * @param {Date} startDate - Start date for calculation
 * @param {Date} endDate - End date for calculation
 * @returns {Object} Earnings data
 */
async function calculateManufacturerEarnings(manufacturerId, startDate, endDate) {
  try {
    const [results] = await sequelize.query(`
      SELECT 
        COUNT(DISTINCT oi.order_id) as ordersCount,
        SUM(oi.quantity) as productsSold,
        SUM(oi.item_total) as totalSales,
        SUM(oi.platform_fee) as platformFee,
        SUM(oi.manufacturer_amount) as netEarnings
      FROM order_items oi
      INNER JOIN orders o ON oi.order_id = o.id
      WHERE oi.manufacturer_id = :manufacturerId
        AND o.order_status IN ('delivered', 'processing', 'shipped')
        AND o.payment_status = 'paid'
        AND o.created_at BETWEEN :startDate AND :endDate
    `, {
      replacements: { manufacturerId, startDate, endDate },
      type: sequelize.QueryTypes.SELECT,
    });

    return results[0] || {
      ordersCount: 0,
      productsSold: 0,
      totalSales: 0,
      platformFee: 0,
      netEarnings: 0,
    };
  } catch (error) {
    console.error('Calculate manufacturer earnings error:', error);
    throw error;
  }
}

/**
 * Get earnings overview for manufacturer
 * @param {string} manufacturerId - Manufacturer ID
 * @returns {Object} Overview with total sales, fees, net earnings, paid and pending amounts
 */
async function getEarningsOverview(manufacturerId) {
  try {
    // Get all-time earnings
    const [totalResults] = await sequelize.query(`
      SELECT 
        SUM(oi.item_total) as totalSales,
        SUM(oi.platform_fee) as platformFee,
        SUM(oi.manufacturer_amount) as netEarnings,
        COUNT(DISTINCT oi.order_id) as ordersCount
      FROM order_items oi
      INNER JOIN orders o ON oi.order_id = o.id
      WHERE oi.manufacturer_id = :manufacturerId
        AND o.payment_status = 'paid'
        AND o.order_status NOT IN ('cancelled', 'returned')
    `, {
      replacements: { manufacturerId },
      type: sequelize.QueryTypes.SELECT,
    });

    // Get paid amount from settlements
    const [paidResults] = await sequelize.query(`
      SELECT 
        COALESCE(SUM(net_payable), 0) as amountPaid
      FROM manufacturer_settlements
      WHERE manufacturer_id = :manufacturerId
        AND status = 'paid'
    `, {
      replacements: { manufacturerId },
      type: sequelize.QueryTypes.SELECT,
    });

    const total = totalResults[0] || {};
    const paid = paidResults[0] || {};

    const totalSales = parseFloat(total.totalSales || 0);
    const platformFee = parseFloat(total.platformFee || 0);
    const netEarnings = parseFloat(total.netEarnings || 0);
    const amountPaid = parseFloat(paid.amountPaid || 0);
    const pendingAmount = netEarnings - amountPaid;

    return {
      totalSales,
      platformFee,
      netEarnings,
      amountPaid,
      pendingAmount: pendingAmount > 0 ? pendingAmount : 0,
      ordersCount: parseInt(total.ordersCount || 0),
    };
  } catch (error) {
    console.error('Get earnings overview error:', error);
    throw error;
  }
}

/**
 * Get product-wise earnings breakdown
 * @param {string} manufacturerId - Manufacturer ID
 * @param {Object} filters - Filters for pagination, sorting, search
 * @returns {Object} Product earnings list with pagination
 */
async function getProductWiseEarnings(manufacturerId, filters = {}) {
  try {
    const { page = 1, limit = 20, sortBy = 'revenue', sortOrder = 'DESC', search = '' } = filters;
    const offset = (page - 1) * limit;

    // Build search condition
    let searchCondition = '';
    if (search) {
      searchCondition = `AND p.name LIKE '%${search}%'`;
    }

    // Validate sortBy
    const validSortFields = ['revenue', 'quantitySold', 'ordersCount', 'productName'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'revenue';

    const sortMapping = {
      revenue: 'totalRevenue',
      quantitySold: 'quantitySold',
      ordersCount: 'ordersCount',
      productName: 'p.name',
    };

    const [products] = await sequelize.query(`
      SELECT 
        p.id as productId,
        p.name as productName,
        p.sku as productSku,
        COUNT(DISTINCT oi.order_id) as ordersCount,
        SUM(oi.quantity) as quantitySold,
        SUM(oi.item_total) as totalRevenue,
        SUM(oi.platform_fee) as platformFee,
        SUM(oi.manufacturer_amount) as netEarnings
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid' AND o.order_status NOT IN ('cancelled', 'returned')
      WHERE p.manufacturer_id = :manufacturerId
        ${searchCondition}
      GROUP BY p.id, p.name, p.sku
      ORDER BY ${sortMapping[sortField]} ${sortOrder}
      LIMIT :limit OFFSET :offset
    `, {
      replacements: { manufacturerId, limit: parseInt(limit), offset },
      type: sequelize.QueryTypes.SELECT,
    });

    // Get total count
    const [countResult] = await sequelize.query(`
      SELECT COUNT(DISTINCT p.id) as total
      FROM products p
      WHERE p.manufacturer_id = :manufacturerId
        ${searchCondition}
    `, {
      replacements: { manufacturerId },
      type: sequelize.QueryTypes.SELECT,
    });

    return {
      products: products.map(p => ({
        productId: p.productId,
        productName: p.productName,
        productSku: p.productSku,
        quantitySold: parseInt(p.quantitySold || 0),
        revenue: parseFloat(p.totalRevenue || 0),
        platformFee: parseFloat(p.platformFee || 0),
        netEarnings: parseFloat(p.netEarnings || 0),
        ordersCount: parseInt(p.ordersCount || 0),
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult[0].total),
        totalPages: Math.ceil(countResult[0].total / limit),
      },
    };
  } catch (error) {
    console.error('Get product-wise earnings error:', error);
    throw error;
  }
}

/**
 * Aggregate period earnings for a manufacturer
 * @param {string} manufacturerId - Manufacturer ID
 * @param {string} period - Period type (daily, weekly, monthly)
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Earnings timeline data
 */
async function aggregatePeriodEarnings(manufacturerId, period, startDate, endDate) {
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
        COUNT(DISTINCT oi.order_id) as ordersCount,
        SUM(oi.quantity) as productsSold,
        SUM(oi.item_total) as totalSales,
        SUM(oi.platform_fee) as platformFee,
        SUM(oi.manufacturer_amount) as netEarnings,
        DATE(MIN(o.created_at)) as periodStart,
        DATE(MAX(o.created_at)) as periodEnd
      FROM order_items oi
      INNER JOIN orders o ON oi.order_id = o.id
      WHERE oi.manufacturer_id = :manufacturerId
        AND o.payment_status = 'paid'
        AND o.order_status NOT IN ('cancelled', 'returned')
        AND o.created_at BETWEEN :startDate AND :endDate
      GROUP BY DATE_FORMAT(o.created_at, :dateFormat)
      ORDER BY period ASC
    `, {
      replacements: { manufacturerId, dateFormat, startDate, endDate },
      type: sequelize.QueryTypes.SELECT,
    });

    return results.map(r => ({
      period: r.period,
      date: r.periodStart,
      ordersCount: parseInt(r.ordersCount || 0),
      productsSold: parseInt(r.productsSold || 0),
      totalSales: parseFloat(r.totalSales || 0),
      platformFee: parseFloat(r.platformFee || 0),
      netEarnings: parseFloat(r.netEarnings || 0),
    }));
  } catch (error) {
    console.error('Aggregate period earnings error:', error);
    throw error;
  }
}

module.exports = {
  calculateManufacturerEarnings,
  getEarningsOverview,
  getProductWiseEarnings,
  aggregatePeriodEarnings,
};
