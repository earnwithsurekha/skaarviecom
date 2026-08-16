/**
 * Script to update existing manufacturers and resellers with default password
 * Password: Welcome@1
 * 
 * Run this script once to add passwords to existing users who don't have one
 * Usage: node update-default-passwords.js
 */

const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

const DEFAULT_PASSWORD = 'Welcome@1';

async function updateDefaultPasswords() {
  console.log('=== Starting Default Password Update ===');
  console.log(`Default password will be: ${DEFAULT_PASSWORD}`);
  console.log('');

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Hash the default password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    console.log('✅ Password hashed successfully');
    console.log('');

    // Find users without passwords (manufacturers and resellers)
    console.log('🔍 Finding users without passwords...');
    const usersWithoutPassword = await sequelize.query(
      `SELECT id, email, mobile, role, full_name 
       FROM users 
       WHERE (role = 'manufacturer' OR role = 'reseller') 
       AND (password IS NULL OR password = '')`,
      { type: QueryTypes.SELECT }
    );

    console.log(`📊 Found ${usersWithoutPassword.length} users without passwords`);
    console.log('');

    if (usersWithoutPassword.length === 0) {
      console.log('✅ All manufacturers and resellers already have passwords!');
      console.log('No updates needed.');
      return;
    }

    // Display users that will be updated
    console.log('Users to be updated:');
    console.log('-----------------------------------');
    usersWithoutPassword.forEach((user, index) => {
      console.log(`${index + 1}. ${user.role.toUpperCase()}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${user.full_name || 'N/A'}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Mobile: ${user.mobile || 'N/A'}`);
      console.log('');
    });

    // Ask for confirmation (in production, you might want to add a prompt here)
    console.log('⚠️  IMPORTANT: This will update passwords for all users listed above!');
    console.log('');

    // Update passwords
    console.log('🔄 Updating passwords...');
    const [affectedRows] = await sequelize.query(
      `UPDATE users 
       SET password = ?, updated_at = NOW() 
       WHERE (role = 'manufacturer' OR role = 'reseller') 
       AND (password IS NULL OR password = '')`,
      {
        replacements: [hashedPassword],
        type: QueryTypes.UPDATE
      }
    );

    console.log(`✅ Successfully updated ${affectedRows} user(s)`);
    console.log('');

    // Verify updates
    console.log('🔍 Verifying updates...');
    const remainingUsers = await sequelize.query(
      `SELECT COUNT(*) as count 
       FROM users 
       WHERE (role = 'manufacturer' OR role = 'reseller') 
       AND (password IS NULL OR password = '')`,
      { type: QueryTypes.SELECT }
    );

    if (remainingUsers[0].count === 0) {
      console.log('✅ Verification successful! All users now have passwords.');
    } else {
      console.log(`⚠️  Warning: ${remainingUsers[0].count} user(s) still without password`);
    }

    console.log('');
    console.log('=== Update Complete ===');
    console.log('');
    console.log('📝 IMPORTANT: Share these credentials with affected users:');
    console.log('   Default Password: Welcome@1');
    console.log('   Users should change this password after first login.');

  } catch (error) {
    console.error('❌ Error updating passwords:', error);
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
updateDefaultPasswords();
