const { Sequelize } = require('sequelize');

// AWS RDS Production Database Connection
const sequelize = new Sequelize('skaarvi_db', 'admin', 'Skaarvi2026', {
  host: 'skaarvi-db.cxm0emkgszfj.ap-south-1.rds.amazonaws.com',
  port: 3306,
  dialect: 'mysql',
  logging: console.log,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const migration = require('./migrations/20260823-add-return-columns.js');

(async () => {
  try {
    console.log('Connecting to AWS RDS Production Database...');
    await sequelize.authenticate();
    console.log('✅ Connected to production database');

    console.log('\nRunning migration to add return columns...');
    await migration.up(sequelize);
    
    console.log('\n✅ Migration completed successfully on production database!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    console.log('Database connection closed.');
  }
})();
