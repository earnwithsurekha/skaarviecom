const { sequelize } = require('./models');

async function checkTables() {
  try {
    console.log('🔍 Checking table structures...\n');
    
    // Check banners table
    console.log('=== BANNERS TABLE ===');
    try {
      const [bannerColumns] = await sequelize.query('DESCRIBE banners');
      console.log('Columns:');
      bannerColumns.forEach(col => {
        console.log(`  • ${col.Field} (${col.Type})`);
      });
    } catch (error) {
      console.log('❌ Banners table does not exist:', error.message);
    }
    
    console.log('\n=== PRODUCT_CLICKS TABLE ===');
    try {
      const [clicksColumns] = await sequelize.query('DESCRIBE product_clicks');
      console.log('Columns:');
      clicksColumns.forEach(col => {
        console.log(`  • ${col.Field} (${col.Type})`);
      });
    } catch (error) {
      console.log('❌ Product_clicks table does not exist:', error.message);
    }
    
    console.log('\n=== PRODUCT_SAVES TABLE ===');
    try {
      const [savesColumns] = await sequelize.query('DESCRIBE product_saves');
      console.log('Columns:');
      savesColumns.forEach(col => {
        console.log(`  • ${col.Field} (${col.Type})`);
      });
    } catch (error) {
      console.log('❌ Product_saves table does not exist:', error.message);
    }
    
    console.log('\n=== PRODUCT_SHARES TABLE ===');
    try {
      const [sharesColumns] = await sequelize.query('DESCRIBE product_shares');
      console.log('Columns:');
      sharesColumns.forEach(col => {
        console.log(`  • ${col.Field} (${col.Type})`);
      });
    } catch (error) {
      console.log('❌ Product_shares table does not exist:', error.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkTables();
