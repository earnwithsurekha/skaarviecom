const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { QueryTypes } = require('sequelize');

async function resetPassword() {
  try {
    const email = 'Bablu@gmail.com';
    const password = 'Welcome@1';
    
    // Generate hash
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Generated hash for Welcome@1:', hashedPassword);
    
    // Update user
    const [result] = await sequelize.query(
      'UPDATE users SET password = ? WHERE email = ?',
      {
        replacements: [hashedPassword, email],
        type: QueryTypes.UPDATE
      }
    );
    
    console.log(`✅ Password updated for ${email}`);
    
    // Verify it works
    const [user] = await sequelize.query(
      'SELECT id, email, password FROM users WHERE email = ?',
      {
        replacements: [email],
        type: QueryTypes.SELECT
      }
    );
    
    const matches = await bcrypt.compare(password, user.password);
    console.log('Password verification test:', matches ? '✅ SUCCESS' : '❌ FAILED');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetPassword();
