const fs = require('fs');
const path = require('path');
const { sequelize } = require('./models');

async function runTrackingSQL() {
  try {
    console.log('📊 Creating product demand tracking tables...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, '..', 'docs', 'PRODUCT-DEMAND-TRACKING.sql');
    let sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Remove comments
    sqlContent = sqlContent
      .replace(/--.*$/gm, '') // Remove single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
    
    // Split by semicolons (but keep the semicolon for execution)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10); // Filter out very short/empty statements
    
    console.log(`Found ${statements.length} SQL statements to execute...`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'; // Add semicolon back
      
      if (statement.toLowerCase().includes('create table') || 
          statement.toLowerCase().includes('insert into')) {
        try {
          await sequelize.query(statement);
          
          if (statement.toLowerCase().includes('create table')) {
            const tableName = statement.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?`?(\w+)`?/i)?.[1] || 'unknown';
            console.log(`✅ Created table: ${tableName}`);
          }
        } catch (error) {
          // Ignore "table already exists" errors
          if (error.message.includes('already exists')) {
            const tableName = statement.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?`?(\w+)`?/i)?.[1] || 'unknown';
            console.log(`ℹ️  Table already exists: ${tableName}`);
          } else {
            console.error(`❌ Error: ${error.message.substring(0, 100)}`);
          }
        }
      }
    }
    
    // Verify tables were created
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name IN ('product_clicks', 'product_saves', 'product_shares')
    `);
    
    console.log('\n✨ Tracking Tables Status:');
    console.log('  - product_clicks:', tables.find(t => t.table_name === 'product_clicks') ? '✅ Created' : '❌ Missing');
    console.log('  - product_saves:', tables.find(t => t.table_name === 'product_saves') ? '✅ Created' : '❌ Missing');
    console.log('  - product_shares:', tables.find(t => t.table_name === 'product_shares') ? '✅ Created' : '❌ Missing');
    
    console.log('\n🎉 Demand analytics tracking tables setup complete!');
    console.log('📈 You can now use full analytics features at /admin/demand-analytics');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up tracking tables:', error);
    process.exit(1);
  }
}

runTrackingSQL();
