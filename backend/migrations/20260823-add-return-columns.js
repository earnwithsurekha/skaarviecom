const { QueryTypes } = require('sequelize');

module.exports = {
  up: async (sequelize) => {
    console.log('Adding return-related columns to orders table...');
    
    try {
      // Add return_status column
      await sequelize.query(`
        ALTER TABLE orders 
        ADD COLUMN return_status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT NULL
        AFTER refund_status
      `);
      console.log('✅ Added return_status column');

      // Add return_requested_at column
      await sequelize.query(`
        ALTER TABLE orders 
        ADD COLUMN return_requested_at TIMESTAMP NULL DEFAULT NULL
        AFTER return_status
      `);
      console.log('✅ Added return_requested_at column');

      // Add return_reason column
      await sequelize.query(`
        ALTER TABLE orders 
        ADD COLUMN return_reason TEXT NULL
        AFTER return_requested_at
      `);
      console.log('✅ Added return_reason column');

      // Add return_approved_at column
      await sequelize.query(`
        ALTER TABLE orders 
        ADD COLUMN return_approved_at TIMESTAMP NULL DEFAULT NULL
        AFTER return_reason
      `);
      console.log('✅ Added return_approved_at column');

      // Add return_rejected_at column
      await sequelize.query(`
        ALTER TABLE orders 
        ADD COLUMN return_rejected_at TIMESTAMP NULL DEFAULT NULL
        AFTER return_approved_at
      `);
      console.log('✅ Added return_rejected_at column');

      // Add return_images column (JSON array of image URLs)
      await sequelize.query(`
        ALTER TABLE orders 
        ADD COLUMN return_images JSON NULL
        AFTER return_rejected_at
      `);
      console.log('✅ Added return_images column');

      // Add admin_notes column
      await sequelize.query(`
        ALTER TABLE orders 
        ADD COLUMN admin_notes TEXT NULL
        AFTER return_images
      `);
      console.log('✅ Added admin_notes column');

      console.log('✅ Migration completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  },

  down: async (sequelize) => {
    console.log('Removing return-related columns from orders table...');
    
    try {
      await sequelize.query('ALTER TABLE orders DROP COLUMN admin_notes');
      await sequelize.query('ALTER TABLE orders DROP COLUMN return_images');
      await sequelize.query('ALTER TABLE orders DROP COLUMN return_rejected_at');
      await sequelize.query('ALTER TABLE orders DROP COLUMN return_approved_at');
      await sequelize.query('ALTER TABLE orders DROP COLUMN return_reason');
      await sequelize.query('ALTER TABLE orders DROP COLUMN return_requested_at');
      await sequelize.query('ALTER TABLE orders DROP COLUMN return_status');
      
      console.log('✅ Rollback completed successfully');
    } catch (error) {
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }
};
