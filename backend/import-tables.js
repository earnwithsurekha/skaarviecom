require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function importMissingTables() {
  console.log('🔄 Importing missing tables...\n');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: false
  });

  try {
    console.log('📥 Reading schema file...');
    const schemaPath = path.join(__dirname, '../docs/DATABASE-SCHEMA-MYSQL.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Extract CREATE TABLE statements using regex
    const createTableRegex = /CREATE TABLE[\s\S]+?ENGINE=InnoDB[^;]*;/gi;
    const createStatements = schema.match(createTableRegex) || [];
    
    console.log(`Found ${createStatements.length} table definitions\n`);
    
    let created = 0;
    let skipped = 0;
    
    for (const statement of createStatements) {
      // Extract table name
      const match = statement.match(/CREATE TABLE (\w+)/i);
      if (!match) continue;
      
      const tableName = match[1];
      
      try {
        await connection.query(statement);
        console.log(`✅ Created table: ${tableName}`);
        created++;
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`⚠️  Skipped existing table: ${tableName}`);
          skipped++;
        } else {
          console.error(`❌ Error creating ${tableName}:`, error.message);
        }
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   • Created: ${created} tables`);
    console.log(`   • Skipped: ${skipped} tables (already exist)`);
    
    // Show all tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`\n📋 Total tables in database: ${tables.length}`);
    tables.forEach(table => {
      console.log(`   • ${Object.values(table)[0]}`);
    });
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

importMissingTables().catch(console.error);
