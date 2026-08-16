require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkSchema() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('📋 USERS TABLE:');
  const [usersCols] = await conn.query('DESCRIBE users');
  usersCols.forEach(c => console.log(`  ${c.Field} (${c.Type})`));

  console.log('\n📋 RESELLERS TABLE:');
  const [resellersCols] = await conn.query('DESCRIBE resellers');
  resellersCols.forEach(c => console.log(`  ${c.Field} (${c.Type})`));

  console.log('\n📋 ORDERS TABLE:');
  const [ordersCols] = await conn.query('DESCRIBE orders');
  ordersCols.forEach(c => console.log(`  ${c.Field} (${c.Type})`));

  console.log('\n📋 ORDER_ITEMS TABLE:');
  const [orderItemsCols] = await conn.query('DESCRIBE order_items');
  orderItemsCols.forEach(c => console.log(`  ${c.Field} (${c.Type})`));

  console.log('\n📋 MANUFACTURERS TABLE:');
  const [manufacturersCols] = await conn.query('DESCRIBE manufacturers');
  manufacturersCols.forEach(c => console.log(`  ${c.Field} (${c.Type})`));

  await conn.end();
}

checkSchema().catch(console.error);
