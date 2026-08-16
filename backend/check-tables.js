const { sequelize } = require('./models');

async function checkTables() {
  try {
    const [tables] = await sequelize.query(`SHOW TABLES LIKE '%product%'`);
    
    console.log('\n📊 Product-related tables in database:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`  ✓ ${tableName}`);
    });
    
    // Check specifically for tracking tables
    const [tracking] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name IN ('product_clicks', 'product_saves', 'product_shares')
    `);
    
    console.log('\n🎯 Demand Analytics Tracking Tables:');
    const hasClicks = tracking.find(t => t.table_name === 'product_clicks' || t.TABLE_NAME === 'product_clicks');
    const hasSaves = tracking.find(t => t.table_name === 'product_saves' || t.TABLE_NAME === 'product_saves');
    const hasShares = tracking.find(t => t.table_name === 'product_shares' || t.TABLE_NAME === 'product_shares');
    
    console.log(`  ${hasClicks ? '✅' : '❌'} product_clicks`);
    console.log(`  ${hasSaves ? '✅' : '❌'} product_saves`);
    console.log(`  ${hasShares ? '✅' : '❌'} product_shares`);
    
    if (hasClicks && hasSaves && hasShares) {
      console.log('\n🎉 All tracking tables are ready!');
      console.log('📈 Full demand analytics features are now available.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkTables();
