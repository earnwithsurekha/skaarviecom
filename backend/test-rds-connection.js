/**
 * Test RDS MySQL Connection
 * Run: node test-rds-connection.js
 */

const mysql = require('mysql2/promise');

const config = {
  host: 'skaarvi-db.cxm0emkgszfj.ap-south-1.rds.amazonaws.com',
  user: 'admin',
  password: 'Skaarvi2026',
  port: 3306,
  connectTimeout: 10000
};

async function testConnection() {
  console.log('🔄 Testing RDS MySQL Connection...\n');
  console.log('Host:', config.host);
  console.log('User:', config.user);
  console.log('Port:', config.port);
  console.log('-----------------------------------\n');

  let connection;
  
  try {
    // Test basic connection
    console.log('⏳ Attempting to connect...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connection established successfully!\n');

    // Test query - Get MySQL version
    console.log('⏳ Testing query execution...');
    const [rows] = await connection.execute('SELECT VERSION() as version, NOW() as server_time');
    console.log('✅ Query executed successfully!');
    console.log('MySQL Version:', rows[0].version);
    console.log('Server Time:', rows[0].server_time);
    console.log('');

    // List databases
    console.log('⏳ Listing databases...');
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('✅ Available databases:');
    databases.forEach(db => console.log('  -', db.Database));
    console.log('');

    // Check if skaarvi_db exists
    const dbExists = databases.some(db => db.Database === 'skaarvi_db');
    if (!dbExists) {
      console.log('⚠️  Database "skaarvi_db" does not exist yet.');
      console.log('📝 Creating database...');
      await connection.execute('CREATE DATABASE IF NOT EXISTS skaarvi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
      console.log('✅ Database "skaarvi_db" created successfully!\n');
    } else {
      console.log('✅ Database "skaarvi_db" already exists\n');
    }

    // Test connection with database
    await connection.end();
    console.log('⏳ Testing connection to skaarvi_db...');
    connection = await mysql.createConnection({
      ...config,
      database: 'skaarvi_db'
    });
    console.log('✅ Successfully connected to skaarvi_db database!\n');

    // Get database size
    const [sizeInfo] = await connection.execute(`
      SELECT 
        table_schema AS 'Database',
        ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
      FROM information_schema.tables 
      WHERE table_schema = 'skaarvi_db'
      GROUP BY table_schema
    `);
    
    if (sizeInfo.length > 0) {
      console.log('📊 Database Size:', sizeInfo[0]['Size (MB)'], 'MB');
    } else {
      console.log('📊 Database is empty (no tables yet)');
    }

    console.log('\n✅ All connection tests passed!');
    console.log('\n📝 Next Steps:');
    console.log('1. Update your .env.local with these credentials');
    console.log('2. Run database migrations to create tables');
    console.log('3. Update AWS Secrets Manager with these values');

  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    console.error('\nCommon issues:');
    console.error('- Check security group allows inbound traffic on port 3306');
    console.error('- Verify RDS instance is publicly accessible (if connecting from outside VPC)');
    console.error('- Confirm credentials are correct');
    console.error('- Check if RDS instance status is "Available"');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔒 Connection closed.');
    }
  }
}

testConnection();
