require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixWithdrawalsTable() {
  console.log('🔄 Fixing withdrawals table schema...\n');
  
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
    console.log('🗑️  Dropping old withdrawals table...');
    await conn.query('DROP TABLE IF EXISTS withdrawals');
    
    console.log('✅ Creating new withdrawals table with correct schema...');
    await conn.query(`
      CREATE TABLE withdrawals (
        withdrawalId INT AUTO_INCREMENT PRIMARY KEY,
        userId CHAR(36) NOT NULL,
        resellerId CHAR(36) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
        paymentMethod VARCHAR(100) DEFAULT 'Bank Transfer',
        accountNumber VARCHAR(50),
        ifscCode VARCHAR(20),
        accountHolderName VARCHAR(255),
        upiId VARCHAR(100),
        transactionId VARCHAR(255),
        remarks TEXT,
        approvedBy CHAR(36),
        approvedAt TIMESTAMP NULL,
        paidAt TIMESTAMP NULL,
        rejectedAt TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deletedAt TIMESTAMP NULL,
        INDEX idx_withdrawals_user (userId),
        INDEX idx_withdrawals_reseller (resellerId),
        INDEX idx_withdrawals_status (status),
        INDEX idx_withdrawals_date (createdAt DESC),
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (resellerId) REFERENCES resellers(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Withdrawals table recreated successfully!\n');

    // Verify the structure
    console.log('📋 New withdrawals table structure:');
    const [cols] = await conn.query('DESCRIBE withdrawals');
    cols.forEach(c => console.log(`  ${c.Field} (${c.Type})`));

    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

fixWithdrawalsTable().catch(console.error);
