const fs = require('fs');
const path = require('path');
const { sequelize } = require('./models');

async function runMigration() {
  try {
    console.log('Running manufacturer suspension migration...');
    
    const migrationFile = path.join(__dirname, 'migrations', 'add-manufacturer-suspension.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      await sequelize.query(statement);
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
