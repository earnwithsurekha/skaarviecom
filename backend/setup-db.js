require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function setupDatabase() {
  console.log('🔄 Setting up database schema...\n');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    console.log('📥 Reading schema file...');
    const schemaPath = path.join(__dirname, '../docs/DATABASE-SCHEMA-MYSQL.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🔨 Creating tables...');
    await connection.query(schema);
    
    console.log('✅ Database schema created successfully!\n');
    
    // Show created tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`📊 Created ${tables.length} tables:`);
    tables.forEach(table => {
      console.log(`   • ${Object.values(table)[0]}`);
    });
    
  } catch (error) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('⚠️  Tables already exist. Use migrate.js to add new fields instead.');
    } else {
      console.error('❌ Database setup failed:', error.message);
      throw error;
    }
  } finally {
    await connection.end();
  }
}

setupDatabase().catch(console.error);
