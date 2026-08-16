const sequelize = require('../config/database');

async function createAdminUser() {
  try {
    // Check for existing admin users
    const [adminUsers] = await sequelize.query(
      'SELECT id, email, role FROM users WHERE role = "admin"'
    );

    console.log('Current admin users:', adminUsers);

    if (adminUsers.length === 0) {
      console.log('No admin users found. Creating one...');
      
      // Create admin user with dummy mobile for admin account
      await sequelize.query(
        'INSERT INTO users (id, email, mobile, role, is_verified, is_active, created_at, updated_at) VALUES (UUID(), "admin@skaarvi.com", "9999999999", "admin", 1, 1, NOW(), NOW())'
      );

      console.log('✅ Admin user created successfully!');
      
      // Verify
      const [newAdmins] = await sequelize.query(
        'SELECT id, email, role, created_at FROM users WHERE role = "admin"'
      );
      console.log('Verification - Admin users:', newAdmins);
    } else {
      console.log('✅ Admin users already exist');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();
