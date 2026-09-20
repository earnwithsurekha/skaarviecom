require('dotenv').config();

const { Sequelize } = require('sequelize');
const migration = require('./migrations/20260920-add-device-tokens');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

const runMigration = async () => {
  try {
    await sequelize.authenticate();
    await migration.up(sequelize);
    console.log('FCM device token migration completed successfully.');
  } catch (error) {
    console.error('FCM device token migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

runMigration();