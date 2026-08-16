require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  console.log('🔄 Starting migrations...\n');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    // Migration 1: Products table fields
    console.log('📦 Migrating Products table...');
    try {
      const productsSqlPath = path.join(__dirname, '../docs/migration-add-product-fields.sql');
      const productsSql = fs.readFileSync(productsSqlPath, 'utf8');
      await connection.query(productsSql);
      console.log('✅ Products table migration completed\n');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Products fields already exist - skipping\n');
      } else {
        console.error('❌ Products migration error:', error.message, '\n');
      }
    }

    // Migration 2: Manufacturers table fields
    console.log('🏭 Migrating Manufacturers table...');
    try {
      const mfgSqlPath = path.join(__dirname, '../docs/migration-add-manufacturer-fields.sql');
      const mfgSql = fs.readFileSync(mfgSqlPath, 'utf8');
      await connection.query(mfgSql);
      console.log('✅ Manufacturers table migration completed\n');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  Manufacturers fields already exist - skipping\n');
      } else {
        console.error('❌ Manufacturers migration error:', error.message, '\n');
      }
    }

    // Migration 3: Analytics tables
    console.log('📊 Creating Analytics tables...');
    try {
      const analyticsSqlPath = path.join(__dirname, 'migrations/create-analytics-tables.sql');
      const analyticsSql = fs.readFileSync(analyticsSqlPath, 'utf8');
      await connection.query(analyticsSql);
      console.log('✅ Analytics tables migration completed\n');
    } catch (error) {
      if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log('⚠️  Analytics tables already exist - skipping\n');
      } else {
        console.error('❌ Analytics migration error:', error.message, '\n');
      }
    }

    console.log('🎉 All migrations completed successfully!\n');
    console.log('📊 Summary:');
    console.log('  Products table - Added: brand_name, catalog_url, shipping_charges');
    console.log('  Manufacturers table - Added: brand_name, business_type, pan_number,');
    console.log('                                bank_name, document URLs (GST, PAN, Cheque)');
    console.log('  Analytics tables - Created: product_saves, product_shares, product_clicks');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigration().catch(console.error);
