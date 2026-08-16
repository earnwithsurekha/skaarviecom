const sequelize = require('../config/database');

async function createStockLogsTable() {
  try {
    console.log('🔄 Creating stock_logs table...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS stock_logs (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        product_id CHAR(36) NOT NULL,
        manufacturer_id CHAR(36) NOT NULL,
        change_type VARCHAR(50) NOT NULL CHECK (change_type IN ('increase', 'decrease', 'update', 'order_placed', 'order_cancelled', 'adjustment')),
        quantity_change INT NOT NULL COMMENT 'Positive for increase, negative for decrease',
        previous_stock INT NOT NULL,
        new_stock INT NOT NULL,
        reason VARCHAR(255),
        notes TEXT,
        changed_by CHAR(36),
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_stock_logs_product (product_id),
        INDEX idx_stock_logs_manufacturer (manufacturer_id),
        INDEX idx_stock_logs_date (changed_at DESC),
        INDEX idx_stock_logs_type (change_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    console.log('✅ stock_logs table created successfully!');
    
    // Verify table creation
    const [results] = await sequelize.query(`SHOW TABLES LIKE 'stock_logs'`);
    if (results.length > 0) {
      console.log('✅ Verification: stock_logs table exists');
      
      // Show table structure
      const [structure] = await sequelize.query(`DESC stock_logs`);
      console.log('\n📋 Table Structure:');
      console.table(structure);
    } else {
      console.log('⚠️  Warning: Table creation might have failed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating stock_logs table:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the migration
createStockLogsTable();
