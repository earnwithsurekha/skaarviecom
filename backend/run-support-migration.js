const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  let connection;
  try {
    console.log('🔄 Running support tables migration...');
    
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'skaarvi_resell_db',
      multipleStatements: true
    });
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../docs/migration-add-support-tables.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    await connection.query(sql);
    
    console.log('✅ Migration completed successfully!');
    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

runMigration();
