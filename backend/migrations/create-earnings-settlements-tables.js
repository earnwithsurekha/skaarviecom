const sequelize = require('../config/database');

async function createEarningsSettlementsTables() {
  try {
    console.log('🔄 Creating Earnings & Settlements tables...');

    // 1. Create manufacturer_earnings table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS manufacturer_earnings (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        manufacturer_id CHAR(36) NOT NULL,
        period VARCHAR(20) NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
        total_sales DECIMAL(12, 2) DEFAULT 0.00,
        platform_fee DECIMAL(12, 2) DEFAULT 0.00,
        net_earnings DECIMAL(12, 2) DEFAULT 0.00,
        orders_count INT DEFAULT 0,
        products_sold INT DEFAULT 0,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id) ON DELETE CASCADE,
        INDEX idx_manufacturer_earnings_manufacturer (manufacturer_id),
        INDEX idx_manufacturer_earnings_period (period),
        INDEX idx_manufacturer_earnings_period_start (period_start DESC),
        UNIQUE KEY unique_manufacturer_period (manufacturer_id, period, period_start)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ manufacturer_earnings table created');

    // 2. Create manufacturer_settlements table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS manufacturer_settlements (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        settlement_id VARCHAR(50) UNIQUE NOT NULL,
        manufacturer_id CHAR(36) NOT NULL,
        settlement_date DATE NOT NULL,
        orders_count INT DEFAULT 0,
        order_ids JSON,
        gross_revenue DECIMAL(12, 2) NOT NULL,
        platform_fee_total DECIMAL(12, 2) NOT NULL,
        net_payable DECIMAL(12, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid')),
        payment_reference VARCHAR(255),
        payment_method VARCHAR(50),
        payment_date TIMESTAMP NULL,
        processed_by CHAR(36),
        processed_at TIMESTAMP NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id) ON DELETE CASCADE,
        FOREIGN KEY (processed_by) REFERENCES users(id),
        INDEX idx_manufacturer_settlements_manufacturer (manufacturer_id),
        INDEX idx_manufacturer_settlements_status (status),
        INDEX idx_manufacturer_settlements_date (settlement_date DESC),
        INDEX idx_manufacturer_settlements_payment_date (payment_date DESC)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ manufacturer_settlements table created');

    // 3. Create product_analytics table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS product_analytics (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        product_id CHAR(36) NOT NULL,
        manufacturer_id CHAR(36) NOT NULL,
        date DATE NOT NULL,
        views_count INT DEFAULT 0,
        saves_count INT DEFAULT 0,
        shares_count INT DEFAULT 0,
        clicks_count INT DEFAULT 0,
        orders_count INT DEFAULT 0,
        revenue DECIMAL(12, 2) DEFAULT 0.00,
        period_type VARCHAR(20) DEFAULT 'daily' CHECK (period_type IN ('daily', 'weekly', 'monthly')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id) ON DELETE CASCADE,
        INDEX idx_product_analytics_product (product_id),
        INDEX idx_product_analytics_manufacturer (manufacturer_id),
        INDEX idx_product_analytics_date (date DESC),
        INDEX idx_product_analytics_period (period_type),
        UNIQUE KEY unique_product_date_period (product_id, date, period_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ product_analytics table created');

    // Verify tables
    console.log('\n📊 Verifying table structures...\n');
    
    const [earnings] = await sequelize.query('DESC manufacturer_earnings');
    console.log('manufacturer_earnings table structure:');
    console.table(earnings);

    const [settlements] = await sequelize.query('DESC manufacturer_settlements');
    console.log('\nmanufacturer_settlements table structure:');
    console.table(settlements);

    const [analytics] = await sequelize.query('DESC product_analytics');
    console.log('\nproduct_analytics table structure:');
    console.table(analytics);

    console.log('\n✅ All tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the migration
createEarningsSettlementsTables();
