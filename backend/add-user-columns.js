require('dotenv').config();
const mysql = require('mysql2/promise');

async function addColumns() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('Adding columns to users table...\n');

  const columns = [
    { name: 'password', sql: 'ALTER TABLE users ADD COLUMN password VARCHAR(255) NULL AFTER email' },
    { name: 'full_name', sql: 'ALTER TABLE users ADD COLUMN full_name VARCHAR(255) NULL AFTER password' },
    { name: 'profile_photo', sql: 'ALTER TABLE users ADD COLUMN profile_photo TEXT NULL AFTER full_name' },
    { name: 'city', sql: 'ALTER TABLE users ADD COLUMN city VARCHAR(100) NULL AFTER profile_photo' },
    { name: 'state', sql: 'ALTER TABLE users ADD COLUMN state VARCHAR(100) NULL AFTER city' },
    { name: 'address', sql: 'ALTER TABLE users ADD COLUMN address TEXT NULL AFTER state' },
    { name: 'pincode', sql: 'ALTER TABLE users ADD COLUMN pincode VARCHAR(10) NULL AFTER address' },
    { name: 'status', sql: "ALTER TABLE users ADD COLUMN status VARCHAR(50) DEFAULT 'active' AFTER pincode" }
  ];

  for (const col of columns) {
    try {
      await conn.query(col.sql);
      console.log(`✅ Added ${col.name}`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log(`⚠️  ${col.name} already exists`);
      } else {
        console.log(`❌ Error adding ${col.name}:`, e.message);
      }
    }
  }

  console.log('\n🔍 Verifying columns...');
  const [columns_result] = await conn.query('SHOW COLUMNS FROM users');
  console.log('Users table columns:');
  columns_result.forEach(col => console.log(`  - ${col.Field} : ${col.Type}`));

  await conn.end();
  console.log('\n✅ Done!');
}

addColumns().catch(console.error);
