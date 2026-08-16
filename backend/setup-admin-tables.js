require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupAdminPanelTables() {
  console.log('🔄 Setting up Admin Panel tables...\n');
  
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'skaarvi_resell_db',
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // 1. Check main schema tables exist
    console.log('\n📊 Checking existing tables...');
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    console.log(`Found ${tableNames.length} existing tables:`);
    tableNames.forEach(table => console.log(`   • ${table}`));

    // 2. Run admin panel tables migration
    console.log('\n🔨 Creating admin panel tables...');
    const migrationPath = path.join(__dirname, '../docs/ADMIN-PANEL-TABLES.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migration = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by statement delimiter and execute
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        // Remove empty statements, comments, and USE statements
        if (!s) return false;
        if (s.startsWith('--')) return false;
        if (s === 'USE skaarvi_resell_db') return false;
        // Skip commented INSERT statements
        if (s.includes('INSERT INTO') && s.includes('--')) return false;
        return true;
      });

    let created = 0;
    let skipped = 0;
    let dropped = 0;

    for (const statement of statements) {
      if (statement.toUpperCase().includes('DROP TABLE') || statement.toUpperCase().includes('DROP VIEW')) {
        try {
          await connection.query(statement);
          const match = statement.match(/DROP (?:TABLE|VIEW)\s+(?:IF EXISTS\s+)?`?(\w+)`?/i);
          if (match) {
            console.log(`   🗑️  Dropped: ${match[1]}`);
            dropped++;
          }
        } catch (error) {
          // Silently skip if doesn't exist
          if (error.code !== 'ER_BAD_TABLE_ERROR' && error.code !== 'ER_BAD_DB_ERROR') {
            console.error(`   ⚠️  Error dropping: ${error.message}`);
          }
        }
      } else if (statement.toUpperCase().includes('CREATE TABLE')) {
        try {
          await connection.query(statement);
          const match = statement.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`?(\w+)`?/i);
          if (match) {
            console.log(`   ✅ Created table: ${match[1]}`);
            created++;
          }
        } catch (error) {
          if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            const match = statement.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?`?(\w+)`?/i);
            if (match) {
              console.log(`   ⏭️  Table exists: ${match[1]}`);
              skipped++;
            }
          } else {
            console.error(`   ❌ Error creating table: ${error.message}`);
          }
        }
      } else if (statement.toUpperCase().includes('CREATE VIEW')) {
        try {
          await connection.query(statement);
          const match = statement.match(/CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+`?(\w+)`?/i);
          if (match) {
            console.log(`   ✅ Created view: ${match[1]}`);
          }
        } catch (error) {
          console.error(`   ❌ Error creating view: ${error.message}`);
        }
      }
      // Removed INSERT handling - no sample data
    }

    console.log(`\n✅ Admin panel setup complete!`);
    console.log(`   Dropped: ${dropped} tables/views`);
    console.log(`   Created: ${created} tables`);
    console.log(`   Skipped: ${skipped} existing tables`);

    // 3. Show final table list
    console.log('\n📊 Final database structure:');
    const [finalTables] = await connection.query('SHOW TABLES');
    const finalTableNames = finalTables.map(t => Object.values(t)[0]);
    
    const categories = {
      'Users': ['users', 'manufacturers', 'resellers', 'customers'],
      'Products': ['categories', 'products', 'product_images', 'product_videos'],
      'Orders': ['orders', 'order_items', 'order_status_history'],
      'Financial': ['wallets', 'wallet_transactions', 'withdrawals', 'withdrawal_requests', 'settlements', 'commission_logs'],
      'Auth': ['otp_verifications', 'refresh_tokens', 'token_blacklist'],
      'Analytics': ['product_views', 'referral_clicks', 'stock_logs']
    };

    for (const [category, tables] of Object.entries(categories)) {
      const existingTables = tables.filter(t => finalTableNames.includes(t));
      if (existingTables.length > 0) {
        console.log(`\n  ${category}:`);
        existingTables.forEach(t => console.log(`    • ${t}`));
      }
    }

    // 4. Check for critical missing tables
    console.log('\n🔍 Checking for critical tables...');
    const criticalTables = ['users', 'products', 'orders', 'categories', 'withdrawals'];
    const missingCritical = criticalTables.filter(t => !finalTableNames.includes(t));
    
    if (missingCritical.length > 0) {
      console.log('⚠️  Missing critical tables:', missingCritical.join(', '));
      console.log('   Run setup-db.js first to create the main schema!');
    } else {
      console.log('✅ All critical tables present!');
    }

    // 5. Count records in key tables
    console.log('\n📈 Record counts:');
    const countTables = ['users', 'products', 'orders', 'categories', 'withdrawals', 'settlements'];
    
    for (const table of countTables) {
      if (finalTableNames.includes(table)) {
        try {
          const [[{ count }]] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
          console.log(`   ${table}: ${count} records`);
        } catch (error) {
          console.log(`   ${table}: error reading`);
        }
      }
    }

    console.log('\n✅ Setup complete! Your admin panel is ready to use.');
    console.log('💡 Note: No sample data was added. Tables are empty and ready for real data.\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run setup
setupAdminPanelTables().catch(console.error);
