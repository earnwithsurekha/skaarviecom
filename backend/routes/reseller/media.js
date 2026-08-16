const express = require('express');
const router = express.Router();
const { sequelize } = require('../../models');

// @route   POST /api/reseller/media/generate-pdf/:productId
// @desc    Generate product catalog PDF
// @access  Private (Reseller only)
router.post('/generate-pdf/:productId', async (req, res) => {
  try {
    const resellerId = req.user.id;
    const { productId } = req.params;

    // Get product details
    const [product] = await sequelize.query(`
      SELECT 
        p.*,
        c.name as category_name,
        m.company_name as manufacturer_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN manufacturers m ON p.manufacturer_id = m.id
      WHERE p.id = :productId AND p.deleted_at IS NULL
    `, {
      replacements: { productId },
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
      SELECT image_url, sort_order
      FROM product_images
      WHERE product_id = :productId
      ORDER BY sort_order
      LIMIT 5
    `, {
      replacements: { productId },
      type: sequelize.QueryTypes.SELECT
    });

    // Get reseller code for referral link
    const [reseller] = await sequelize.query(`
      SELECT reseller_code
      FROM resellers
      WHERE id = :resellerId
    `, {
      replacements: { resellerId },
      type: sequelize.QueryTypes.SELECT
    });

    // Generate HTML for PDF
    const baseUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
    const slug = product.slug || `product-${product.id}`;
    const referralLink = reseller ? `${baseUrl}/p/${slug}?ref=${reseller.reseller_code}` : `${baseUrl}/p/${slug}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px;
            color: #333;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #4F46E5;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .product-name {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #1F2937;
          }
          .category {
            font-size: 16px;
            color: #6B7280;
          }
          .price-section {
            background: #F3F4F6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            display: flex;
            justify-content: space-around;
          }
          .price-item {
            text-align: center;
          }
          .price-label {
            font-size: 14px;
            color: #6B7280;
            margin-bottom: 5px;
          }
          .price-value {
            font-size: 24px;
            font-weight: bold;
            color: #1F2937;
          }
          .profit {
            color: #10B981;
          }
          .images-section {
            margin: 30px 0;
          }
          .images-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
          }
          .product-image {
            width: 100%;
            height: 150px;
            object-fit: cover;
            border-radius: 8px;
            border: 1px solid #E5E7EB;
          }
          .description-section {
            margin: 30px 0;
          }
          .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #1F2937;
            margin-bottom: 15px;
            border-left: 4px solid #4F46E5;
            padding-left: 10px;
          }
          .description-text {
            line-height: 1.6;
            color: #4B5563;
          }
          .specs-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .specs-table tr {
            border-bottom: 1px solid #E5E7EB;
          }
          .specs-table td {
            padding: 12px;
          }
          .specs-table td:first-child {
            font-weight: bold;
            color: #6B7280;
            width: 40%;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #E5E7EB;
            text-align: center;
          }
          .referral-link {
            background: #EEF2FF;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: center;
          }
          .referral-link-text {
            font-size: 12px;
            color: #6B7280;
            margin-bottom: 5px;
          }
          .referral-link-url {
            font-size: 14px;
            color: #4F46E5;
            font-weight: bold;
            word-break: break-all;
          }
          .stock-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 600;
            margin: 10px 0;
          }
          .in-stock {
            background: #D1FAE5;
            color: #065F46;
          }
          .low-stock {
            background: #FED7AA;
            color: #92400E;
          }
          .out-of-stock {
            background: #FEE2E2;
            color: #991B1B;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="product-name">${product.name}</div>
          <div class="category">${product.category_name || 'Uncategorized'}</div>
          ${product.manufacturer_name ? `<div class="category">by ${product.manufacturer_name}</div>` : ''}
        </div>

        <div class="price-section">
          <div class="price-item">
            <div class="price-label">Selling Price</div>
            <div class="price-value">₹${product.selling_price}</div>
          </div>
          <div class="price-item">
            <div class="price-label">Your Profit</div>
            <div class="price-value profit">₹${product.reseller_margin || 0}</div>
          </div>
          <div class="price-item">
            <div class="price-label">Stock Status</div>
            <div class="stock-badge ${product.stock_quantity > 10 ? 'in-stock' : product.stock_quantity > 0 ? 'low-stock' : 'out-of-stock'}">
              ${product.stock_quantity > 10 ? 'In Stock' : product.stock_quantity > 0 ? `${product.stock_quantity} Left` : 'Out of Stock'}
            </div>
          </div>
        </div>

        ${images.length > 0 ? `
        <div class="images-section">
          <div class="section-title">Product Images</div>
          <div class="images-grid">
            ${images.map(img => `<img src="${img.image_url}" class="product-image" alt="Product Image" />`).join('')}
          </div>
        </div>
        ` : ''}

        ${product.description ? `
        <div class="description-section">
          <div class="section-title">Product Description</div>
          <div class="description-text">${product.description}</div>
        </div>
        ` : ''}

        ${product.specifications ? `
        <div class="description-section">
          <div class="section-title">Specifications</div>
          <table class="specs-table">
            ${Object.entries(JSON.parse(product.specifications)).map(([key, value]) => `
              <tr>
                <td>${key}</td>
                <td>${value}</td>
              </tr>
            `).join('')}
          </table>
        </div>
        ` : ''}

        <div class="referral-link">
          <div class="referral-link-text">Your Referral Link:</div>
          <div class="referral-link-url">${referralLink}</div>
        </div>

        <div class="footer">
          <p style="color: #6B7280; font-size: 14px;">
            ${product.delivery_time ? `Delivery: ${product.delivery_time}` : 'Standard delivery applies'}
          </p>
          <p style="color: #9CA3AF; font-size: 12px; margin-top: 10px;">
            Generated on ${new Date().toLocaleDateString()} • Skaarvi Reseller Platform
          </p>
        </div>
      </body>
      </html>
    `;

    // For now, return HTML (in production, use a PDF library like puppeteer or pdfkit)
    // This is a placeholder - you'll need to implement actual PDF generation
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${product.name.replace(/[^a-z0-9]/gi, '-')}-catalog.html"`);
    res.send(htmlContent);

  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
});

// @route   GET /api/reseller/media/marketing-creatives
// @desc    Get marketing creatives and templates
// @access  Private (Reseller only)
router.get('/marketing-creatives', async (req, res) => {
  try {
    // In a real application, this would fetch marketing templates,
    // banners, social media posts, etc. from a database or storage
    const creatives = [
      {
        id: 1,
        name: 'Social Media Banner Template',
        type: 'banner',
        format: 'PNG',
        size: '1200x628',
        url: '/assets/templates/social-banner.png',
        description: 'Facebook & LinkedIn banner template'
      },
      {
        id: 2,
        name: 'Instagram Story Template',
        type: 'story',
        format: 'PNG',
        size: '1080x1920',
        url: '/assets/templates/instagram-story.png',
        description: 'Instagram story template'
      },
      {
        id: 3,
        name: 'WhatsApp Status Template',
        type: 'status',
        format: 'PNG',
        size: '1080x1920',
        url: '/assets/templates/whatsapp-status.png',
        description: 'WhatsApp status template'
      },
      {
        id: 4,
        name: 'Product Showcase Video',
        type: 'video',
        format: 'MP4',
        size: '1920x1080',
        url: '/assets/templates/product-showcase.mp4',
        description: 'Editable video template'
      }
    ];

    res.json({
      status: 'success',
      data: {
        creatives,
        total: creatives.length
      }
    });

  } catch (error) {
    console.error('Get marketing creatives error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch marketing creatives',
      error: error.message
    });
  }
});

module.exports = router;
