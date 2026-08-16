const { sequelize } = require('./models');

async function fixResellerCodes() {
  try {
    console.log('🔄 Checking for resellers without referral codes...');
    
    // Find resellers without reseller_code
    const [resellersWithoutCode] = await sequelize.query(`
      SELECT id, full_name FROM resellers WHERE reseller_code IS NULL OR reseller_code = ''
    `);
    
    if (resellersWithoutCode.length === 0) {
      console.log('✅ All resellers already have referral codes!');
      process.exit(0);
    }
    
    console.log(`Found ${resellersWithoutCode.length} resellers without codes`);
    
    // Generate unique reseller codes
    const generateResellerCode = () => {
      const prefix = 'RSL';
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      return `${prefix}${random}`;
    };
    
    for (const reseller of resellersWithoutCode) {
      let resellerCode = generateResellerCode();
      
      // Ensure uniqueness
      let codeExists = true;
      while (codeExists) {
        const [existing] = await sequelize.query(
          'SELECT id FROM resellers WHERE reseller_code = :code',
          {
            replacements: { code: resellerCode },
            type: sequelize.QueryTypes.SELECT
          }
        );
        if (!existing) {
          codeExists = false;
        } else {
          resellerCode = generateResellerCode();
        }
      }
      
      // Update the reseller
      await sequelize.query(
        'UPDATE resellers SET reseller_code = :code WHERE id = :id',
        {
          replacements: { code: resellerCode, id: reseller.id },
          type: sequelize.QueryTypes.UPDATE
        }
      );
      
      console.log(`✅ Generated code ${resellerCode} for ${reseller.full_name}`);
    }
    
    console.log('✅ All reseller codes updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixResellerCodes();
