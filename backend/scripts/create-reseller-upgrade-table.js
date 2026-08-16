/**
 * Migration script to create reseller_upgrade_requests table
 * This table tracks customer requests to become resellers
 * 
 * Run: node create-reseller-upgrade-table.js
 */

const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function createResellerUpgradeTable() {
  console.log('=== Creating Reseller Upgrade Requests Table ===');
  console.log('');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    console.log('');

    // Create the table
    console.log('🔄 Creating reseller_upgrade_requests table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS reseller_upgrade_requests (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        user_id CHAR(36) NOT NULL,
        request_reason TEXT,
        business_details JSON,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        reviewed_by CHAR(36) NULL,
        reviewed_at TIMESTAMP NULL,
        rejection_reason TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `, { type: QueryTypes.RAW });
    
    console.log('✅ Table created successfully');
    console.log('');

    // Verify the table
    console.log('🔍 Verifying table structure...');
    const structure = await sequelize.query(
      'DESCRIBE reseller_upgrade_requests',
      { type: QueryTypes.SELECT }
    );
    
    console.log('Table columns:');
    structure.forEach(col => {
      console.log(`  - ${col.Field} : ${col.Type}`);
    });
    console.log('');

    console.log('=== Migration Complete ===');
    console.log('');
    console.log('✅ Reseller upgrade requests table is ready!');
    console.log('   Customers can now request to upgrade to reseller.');
    console.log('   Admins can approve/reject these requests.');

  } catch (error) {
    console.error('❌ Error creating table:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
    console.log('');
    console.log('Database connection closed');
  }
}

// Run the migration
createResellerUpgradeTable();
