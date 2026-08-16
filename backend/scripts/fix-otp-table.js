/**
 * Script to fix OTP table - expand mobile column to store emails too
 * Changes mobile column from VARCHAR(15) to VARCHAR(100)
 * 
 * Run this script once to fix the column size
 * Usage: node fix-otp-table.js
 */

const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function fixOTPTable() {
  console.log('=== Fixing OTP Table Schema ===');
  console.log('');

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check current column definition
    console.log('🔍 Checking current schema...');
    const currentSchema = await sequelize.query(
      `DESCRIBE otp_verifications`,
      { type: QueryTypes.SELECT }
    );
    
    const mobileField = currentSchema.find(field => field.Field === 'mobile');
    console.log(`Current mobile column: ${mobileField.Type}`);
    console.log('');

    // Alter the column to support both email and mobile
    console.log('🔄 Altering mobile column to VARCHAR(100)...');
    await sequelize.query(
      `ALTER TABLE otp_verifications 
       MODIFY COLUMN mobile VARCHAR(100) NOT NULL`,
      { type: QueryTypes.RAW }
    );
    console.log('✅ Column altered successfully');
    console.log('');

    // Verify the change
    console.log('🔍 Verifying changes...');
    const newSchema = await sequelize.query(
      `DESCRIBE otp_verifications`,
      { type: QueryTypes.SELECT }
    );
    
    const updatedField = newSchema.find(field => field.Field === 'mobile');
    console.log(`Updated mobile column: ${updatedField.Type}`);
    console.log('');

    console.log('=== Fix Complete ===');
    console.log('');
    console.log('✅ The mobile column can now store:');
    console.log('   - Email addresses (up to 100 characters)');
    console.log('   - Mobile numbers (up to 100 characters)');

  } catch (error) {
    console.error('❌ Error fixing OTP table:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('');
    console.log('Database connection closed');
  }
}

// Run the script
fixOTPTable();
