const sequelize = require('./config/database');
const { QueryTypes } = require('sequelize');

async function checkUser() {
  try {
    const email = 'kopparapugeetha95@gmail.com';
    
    console.log('Checking user:', email);
    console.log('='.repeat(50));
    
    // Get user info
    const [user] = await sequelize.query(
      'SELECT id, email, full_name, role, status FROM users WHERE email = ?',
      {
        replacements: [email],
        type: QueryTypes.SELECT
      }
    );
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(0);
    }
    
    console.log('✅ User found:');
    console.log('   ID:', user.id);
    console.log('   Name:', user.full_name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Status:', user.status);
    console.log('');
    
    // Check customer record
    const [customer] = await sequelize.query(
      'SELECT id, user_id FROM customers WHERE user_id = ?',
      {
        replacements: [user.id],
        type: QueryTypes.SELECT
      }
    );
    
    if (customer) {
      console.log('✅ Customer record found:');
      console.log('   Customer ID:', customer.id);
      console.log('   User ID:', customer.user_id);
    } else {
      console.log('❌ No customer record found');
    }
    console.log('');
    
    // Check reseller record
    const [reseller] = await sequelize.query(
      'SELECT id, user_id, reseller_code FROM resellers WHERE user_id = ?',
      {
        replacements: [user.id],
        type: QueryTypes.SELECT
      }
    );
    
    if (reseller) {
      console.log('✅ Reseller record found:');
      console.log('   Reseller ID:', reseller.id);
      console.log('   User ID:', reseller.user_id);
      console.log('   Reseller Code:', reseller.reseller_code);
    } else {
      console.log('❌ No reseller record found');
    }
    console.log('');
    
    // Check upgrade request
    const [upgradeRequest] = await sequelize.query(
      'SELECT id, user_id, status FROM reseller_upgrade_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      {
        replacements: [user.id],
        type: QueryTypes.SELECT
      }
    );
    
    if (upgradeRequest) {
      console.log('✅ Upgrade request found:');
      console.log('   Request ID:', upgradeRequest.id);
      console.log('   User ID:', upgradeRequest.user_id);
      console.log('   Status:', upgradeRequest.status);
    } else {
      console.log('❌ No upgrade request found');
    }
    console.log('');
    
    console.log('='.repeat(50));
    console.log('SUMMARY:');
    console.log(`User role: ${user.role}`);
    console.log(`Has customer record: ${customer ? 'YES' : 'NO'}`);
    console.log(`Has reseller record: ${reseller ? 'YES' : 'NO'}`);
    
    if (user.role === 'reseller' && customer) {
      console.log('✅ This user should have access to BOTH customer and reseller portals');
    } else if (user.role === 'reseller' && !customer) {
      console.log('⚠️  This user should ONLY have access to reseller portal');
    } else if (user.role === 'customer') {
      console.log('✅ This user should have access to customer portal');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser();
