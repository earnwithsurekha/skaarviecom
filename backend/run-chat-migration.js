require('dotenv').config();

const sequelize = require('./config/database');
const liveChatMigration = require('./migrations/20260923-add-live-chat');
const customerSupportMigration = require('./migrations/20260923-add-customer-support-role');

const runMigration = async () => {
  try {
    await sequelize.authenticate();
    await liveChatMigration.up(sequelize);
    await customerSupportMigration.up(sequelize);
    console.log('Live chat migration completed successfully.');
  } catch (error) {
    console.error('Live chat migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

runMigration();