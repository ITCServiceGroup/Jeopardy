import {
  executeSqlFile,
  productionSafetyCheck,
  verifyConnection,
  logOperation,
  supabase
} from './db-utils.js';

async function resetDatabase() {
  try {
    // Verify database connection
    console.log('Verifying database connection...');
    if (!await verifyConnection()) {
      throw new Error('Could not connect to database');
    }

    // Extra safety check for production with longer wait time
    await productionSafetyCheck(15);

    console.log('Starting database reset...');

    // Drop all tables one by one
    console.log('\n🗑️  Dropping existing tables...');
    const tables = ['game_statistics', 'questions', 'categories', 'tech_types'];
    for (const table of tables) {
      const { error } = await supabase.from(table).delete();
      if (error && !error.message.includes('relation "public.') && !error.message.includes('does not exist')) {
        throw error;
      }
    }
    logOperation('Drop tables', true);

    // Run migrations
    console.log('\n⚡ Applying migrations...');
    const migrations = [
      '001_initial_schema.sql',
      '002_add_tech_types.sql',
      '003_update_game_statistics.sql',
      '004_update_rls_policies.sql',
      '005_fix_options_type.sql'
    ];

    for (const migration of migrations) {
      console.log(`\nApplying migration: ${migration}`);
      await executeSqlFile(`src/database/migrations/${migration}`);
      console.log(`✓ ${migration} applied successfully`);
    }
    logOperation('Migrations', true);

    // Run seeds if specified
    if (process.env.WITH_SEED === 'true') {
      console.log('\n🌱 Applying seed data...');
      await executeSqlFile('src/database/seeds/001_test_data.sql');
      await executeSqlFile('src/database/seeds/002_additional_questions.sql');
      logOperation('Seeding', true);
    }

    console.log('\n✨ Database reset completed successfully!');
  } catch (error) {
    logOperation('Database reset', false, error);
    process.exit(1);
  }
}

console.log('🔄 Database Reset Tool');
console.log('----------------------');
if (process.env.WITH_SEED === 'true') {
  console.log('Mode: Reset with seed data');
} else {
  console.log('Mode: Reset schema only');
}
console.log('----------------------\n');

resetDatabase();
