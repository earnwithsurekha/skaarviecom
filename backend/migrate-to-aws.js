/**
 * Database Migration Script: Local MySQL → AWS RDS MySQL
 * 
 * This script exports data from local MySQL and imports to AWS RDS
 * Run: node migrate-to-aws.js
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs');
const path = require('path');

// Configuration
const LOCAL_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Arun@535', // Your local MySQL root password
  database: 'skaarvi_resell_db'
};

const AWS_CONFIG = {
  host: 'skaarvi-db.cxm0emkgszfj.ap-south-1.rds.amazonaws.com',
  port: 3306,
  user: 'admin',
  password: 'Skaarvi2026',
  database: 'skaarvi_db'
};

const DUMP_FILE = path.join(__dirname, 'db-dump.sql');

// Helper function to execute shell commands
async function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stderr && !stderr.includes('Warning')) {
      console.log(`⚠️  ${stderr}`);
    }
    if (stdout) {
      console.log(stdout);
    }
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    throw error;
  }
}

// Check if mysqldump is available
async function checkMySQLTools() {
  console.log('\n🔍 Checking MySQL tools...');
  try {
    await execPromise('mysqldump --version');
    console.log('✅ mysqldump found');
    return true;
  } catch (error) {
    console.error('❌ mysqldump not found in PATH');
    console.error('Please install MySQL client tools or add MySQL bin directory to PATH');
    console.error('Common locations:');
    console.error('  - C:\\Program Files\\MySQL\\MySQL Server 8.x\\bin');
    console.error('  - C:\\xampp\\mysql\\bin');
    return false;
  }
}

// Export database from local MySQL
async function exportLocalDatabase() {
  console.log('\n📤 Exporting local database...');
  console.log(`   Database: ${LOCAL_CONFIG.database}`);
  console.log(`   Host: ${LOCAL_CONFIG.host}`);
  
  // Export without --databases flag to avoid creating new database on AWS
  const dumpCommand = `mysqldump -h ${LOCAL_CONFIG.host} -P ${LOCAL_CONFIG.port} -u ${LOCAL_CONFIG.user} ${LOCAL_CONFIG.password ? `-p${LOCAL_CONFIG.password}` : ''} --single-transaction --routines --triggers ${LOCAL_CONFIG.database} > "${DUMP_FILE}"`;
  
  await runCommand(dumpCommand, 'Database export');
  
  const stats = fs.statSync(DUMP_FILE);
  console.log(`📊 Dump file size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
}

// Import database to AWS RDS
async function importToAWS() {
  console.log('\n📥 Importing to AWS RDS...');
  console.log(`   Database: ${AWS_CONFIG.database}`);
  console.log(`   Host: ${AWS_CONFIG.host}`);
  
  const importCommand = `mysql -h ${AWS_CONFIG.host} -P ${AWS_CONFIG.port} -u ${AWS_CONFIG.user} -p${AWS_CONFIG.password} ${AWS_CONFIG.database} < "${DUMP_FILE}"`;
  
  await runCommand(importCommand, 'Database import');
}

// Verify migration
async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');
  
  // Check table count
  const verifyCommand = `mysql -h ${AWS_CONFIG.host} -P ${AWS_CONFIG.port} -u ${AWS_CONFIG.user} -p${AWS_CONFIG.password} -e "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = '${AWS_CONFIG.database}';" ${AWS_CONFIG.database}`;
  
  try {
    const { stdout } = await execPromise(verifyCommand);
    console.log(stdout);
    console.log('✅ Verification completed');
  } catch (error) {
    console.log('⚠️  Could not verify (this is optional)');
  }
}

// Cleanup
function cleanup() {
  if (fs.existsSync(DUMP_FILE)) {
    console.log('\n🧹 Cleaning up dump file...');
    fs.unlinkSync(DUMP_FILE);
    console.log('✅ Cleanup completed');
  }
}

// Main migration function
async function migrate() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Database Migration: Local MySQL → AWS RDS           ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  
  try {
    // Check prerequisites
    const hasTools = await checkMySQLTools();
    if (!hasTools) {
      process.exit(1);
    }
    
    // Step 1: Export from local
    await exportLocalDatabase();
    
    // Step 2: Import to AWS
    await importToAWS();
    
    // Step 3: Verify
    await verifyMigration();
    
    // Step 4: Cleanup
    cleanup();
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║            ✅ MIGRATION COMPLETED SUCCESSFULLY         ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log('\n📝 Next Steps:');
    console.log('   1. Verify data in AWS RDS');
    console.log('   2. Test application connectivity');
    console.log('   3. Update backend to use RDS endpoint');
    
  } catch (error) {
    console.error('\n╔════════════════════════════════════════════════════════╗');
    console.error('║              ❌ MIGRATION FAILED                       ║');
    console.error('╚════════════════════════════════════════════════════════╝');
    console.error('\nError:', error.message);
    
    // Cleanup on failure
    cleanup();
    
    process.exit(1);
  }
}

// Run migration
if (require.main === module) {
  migrate();
}

module.exports = { migrate };
