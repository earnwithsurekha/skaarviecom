const { sequelize } = require('./models');

async function checkTableStructure() {
  try {
    console.log('📋 Checking tracking table structures...\n');
    
    const tables = ['product_clicks', 'product_saves', 'product_shares'];
    
    for (const table of tables) {
      const [columns] = await sequelize.query(`DESCRIBE ${table}`);
      
      console.log(`\n${table}:`);
      columns.forEach(col => {
        console.log(`  • ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTableStructure();
