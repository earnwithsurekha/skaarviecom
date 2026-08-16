require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixSettlementsTable() {
  console.log('🔄 Fixing settlements table schema...\n');
  
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    // Drop and recreate with correct schema
    console.log('🗑️  Dropping old settlements table...');
    await conn.query('DROP TABLE IF EXISTS settlements');
    
    console.log('✅ Creating new settlements table with correct schema...');
    await conn.query(`
      CREATE TABLE settlements (
        settlementId INT AUTO_INCREMENT PRIMARY KEY,
        manufacturerId CHAR(36) NOT NULL,
        userId CHAR(36) NOT NULL,
        startDate DATE NOT NULL,
        endDate DATE NOT NULL,
        totalOrderValue DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        platformFeePercentage DECIMAL(5, 2) DEFAULT 5.00,
        platformFeeAmount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
        amount DECIMAL(15, 2) NOT NULL,
        orderCount INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
        accountNumber VARCHAR(50),
        ifscCode VARCHAR(20),
        accountHolderName VARCHAR(255),
        transactionId VARCHAR(255),
        transactionDetails TEXT,
        paidBy CHAR(36),
        paidAt TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_settlements_manufacturer (manufacturerId),
        INDEX idx_settlements_user (userId),
        INDEX idx_settlements_status (status),
        INDEX idx_settlements_date (createdAt DESC),
        INDEX idx_settlements_period (startDate, endDate),
        FOREIGN KEY (manufacturerId) REFERENCES manufacturers(id),
        FOREIGN KEY (userId) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Settlements table recreated successfully!\n');

    // Verify the structure
    console.log('📋 New settlements table structure:');
    const [cols] = await conn.query('DESCRIBE settlements');
    cols.forEach(c => console.log(`  ${c.Field} (${c.Type})`));

    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

fixSettlementsTable().catch(console.error);
