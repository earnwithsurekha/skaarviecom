require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    logging: false
  }
);

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ DATABASE CONNECTION SUCCESSFUL!');
    console.log('Connected to:', process.env.DB_NAME);
    
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log(`\nFound ${tables.length} tables in database`);
    
    if (tables.length > 0) {
      console.log('Tables:', tables.map(t => Object.values(t)[0]).join(', '));
    } else {
      console.log('ℹ️  Database is empty. You need to import the SQL schema.');
    }
    
    process.exit(0);
  } catch (err) {
    console.log('❌ CONNECTION FAILED:', err.message);
    process.exit(1);
  }
}

testConnection();
