import { executeSqlFile, productionSafetyCheck, verifyConnection, logOperation } from './db-utils.js';

async function runMigrations() {
  try {
    // Verify database connection
    console.log('Verifying database connection...');
    if (!await verifyConnection()) {
      throw new Error('Could not connect to database');
    }

    // Production safety check
    await productionSafetyCheck();

    console.log('Starting database migrations...');
    
    // Execute all migration files in sequence
    const migrations = [
      '001_initial_schema.sql',
      '002_add_tech_types.sql',
      '003_update_game_statistics.sql',
      '004_update_rls_policies.sql',
      '005_fix_options_type.sql',
      '006_category_tech_types.sql',
      '007_add_shared_categories.sql'
    ];

    for (const migration of migrations) {
      console.log(`\nApplying migration: ${migration}`);
      await executeSqlFile(`src/database/migrations/${migration}`);
      console.log(`✓ ${migration} applied successfully`);
    }

    logOperation('Migrations', true);
  } catch (error) {
    logOperation('Migrations', false, error);
    process.exit(1);
  }
}

console.log('🔄 Database Migration Tool');
runMigrations();
