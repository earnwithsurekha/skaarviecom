const { sequelize } = require('./models');
const fs = require('fs');
const path = require('path');

async function setupBannersTable() {
  try {
    console.log('📋 Setting up banners table...\n');

    // Read SQL file
    const sqlFile = path.join(__dirname, '..', 'docs', 'BANNERS-SCHEMA.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    // Remove comments and split by semicolon
    const statements = sqlContent
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute...\n`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.toLowerCase().includes('create table')) {
        const tableName = statement.match(/CREATE TABLE.*?`?(\w+)`?\s*\(/i)?.[1];
        console.log(`Creating table: ${tableName}...`);
        
        try {
          await sequelize.query(statement);
          console.log(`✅ Table ${tableName} created successfully\n`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log(`ℹ️  Table ${tableName} already exists\n`);
          } else {
            console.error(`❌ Error creating table ${tableName}:`, error.message);
          }
        }
      }
    }

    // Verify tables were created
    console.log('\n📊 Verifying tables...\n');
    const [tables] = await sequelize.query(`
      SHOW TABLES LIKE 'banner%'
    `);

    if (tables.length > 0) {
      console.log('✅ Banner tables verified:');
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        console.log(`   • ${tableName}`);
      });
    } else {
      console.log('⚠️  No banner tables found');
    }

    console.log('\n✅ Banner management setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up banners table:', error);
    process.exit(1);
  }
}

setupBannersTable();
