const { sequelize } = require('./models');
const fs = require('fs');
const path = require('path');

async function recreateBannersTable() {
  try {
    console.log('🔄 Recreating banners table with correct schema...\n');

    // Drop existing tables
    console.log('Dropping existing banners tables...');
    await sequelize.query('DROP TABLE IF EXISTS banner_analytics');
    await sequelize.query('DROP TABLE IF EXISTS banners');
    console.log('✅ Old tables dropped\n');

    // Read and execute SQL file
    const sqlFile = path.join(__dirname, '..', 'docs', 'BANNERS-SCHEMA.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    const statements = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      if (statement.toLowerCase().includes('create table')) {
        const tableName = statement.match(/CREATE TABLE.*?`?(\w+)`?\s*\(/i)?.[1];
        console.log(`Creating table: ${tableName}...`);
        await sequelize.query(statement);
        console.log(`✅ ${tableName} created\n`);
      }
    }

    // Verify
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'banner%'");
    console.log('✅ Verification complete:');
    tables.forEach(table => {
      console.log(`   • ${Object.values(table)[0]}`);
    });

    // Show structure
    console.log('\n📋 New banners table structure:');
    const [columns] = await sequelize.query('DESCRIBE banners');
    columns.forEach(col => {
      console.log(`   • ${col.Field} (${col.Type})`);
    });

    console.log('\n✅ Banners table recreated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

recreateBannersTable();
