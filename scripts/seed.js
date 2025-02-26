import {
  executeSqlFile,
  productionSafetyCheck,
  verifyConnection,
  logOperation,
  checkTablesExist,
  getTableCount
} from './db-utils.js';

async function runSeeds() {
  try {
    // Verify database connection
    console.log('Verifying database connection...');
    if (!await verifyConnection()) {
      throw new Error('Could not connect to database');
    }

    // Check if required tables exist
    console.log('Checking database schema...');
    const requiredTables = ['categories', 'questions', 'game_statistics'];
    if (!await checkTablesExist(requiredTables)) {
      throw new Error('Required tables are missing. Run migrations first.');
    }

    // Production safety check
    await productionSafetyCheck(10); // Longer wait for seeding

    // Show current table counts
    console.log('\nCurrent table counts:');
    for (const table of requiredTables) {
      const count = await getTableCount(table);
      console.log(`- ${table}: ${count} records`);
    }

    console.log('\nStarting database seeding...');

    // Execute seed files in order
    const seedFiles = [
      'src/database/seeds/001_test_data.sql',
      'src/database/seeds/002_additional_questions.sql'
    ];

    for (const filePath of seedFiles) {
      console.log(`\nProcessing: ${filePath}`);
      await executeSqlFile(filePath);
      logOperation(`Seeding ${filePath}`, true);
    }

    // Show updated table counts
    console.log('\nUpdated table counts:');
    for (const table of requiredTables) {
      const count = await getTableCount(table);
      console.log(`- ${table}: ${count} records`);
    }

    logOperation('Database seeding', true);
  } catch (error) {
    logOperation('Database seeding', false, error);
    process.exit(1);
  }
}

console.log('🌱 Database Seeding Tool');
runSeeds();
