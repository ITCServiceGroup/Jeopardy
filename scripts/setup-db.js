import { createClient } from '@supabase/supabase-js';
import { writeFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config();

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setupDatabase() {
  console.log('🔧 Supabase Project Setup Tool');
  console.log('------------------------------\n');

  try {
    // Get or create .env file
    const envPath = join(__dirname, '..', '.env');
    const envExists = existsSync(envPath);
    let envContent = envExists ? '' : `# Supabase Configuration\n\n`;

    // Collect Supabase credentials
    const url = await question('Enter your Supabase project URL: ');
    const anonKey = await question('Enter your Supabase anon key: ');
    const accessToken = await question('Enter your Supabase access token (optional): ');
    const dbPassword = await question('Enter your database password (optional): ');

    // Verify credentials
    console.log('\nVerifying credentials...');
    const supabase = createClient(url, anonKey);
    const { error } = await supabase.from('categories').select('count').limit(1);
    
    if (error) {
      throw new Error('Failed to connect to Supabase: ' + error.message);
    }

    // Update environment variables
    const envVars = {
      VITE_SUPABASE_URL: url,
      VITE_SUPABASE_ANON_KEY: anonKey,
      ...(accessToken && { SUPABASE_ACCESS_TOKEN: accessToken }),
      ...(dbPassword && { SUPABASE_DB_PASSWORD: dbPassword })
    };

    // Add database configuration
    const dbConfig = {
      DB_AUTO_RESET: 'false',
      DB_BACKUP_ENABLED: 'true',
      DB_BACKUP_PATH: './backups',
      DB_SCRIPT_TIMEOUT: '30000',
      DB_WATCH_INTERVAL: '60000'
    };

    // Build .env content
    Object.entries({ ...envVars, ...dbConfig }).forEach(([key, value]) => {
      envContent += `${key}=${value}\n`;
    });

    // Save .env file
    writeFileSync(envPath, envContent);

    console.log('\n✅ Environment configuration saved successfully!');

    // Ask about initializing the database
    const initDb = await question('\nWould you like to initialize the database now? (y/N): ');
    
    if (initDb.toLowerCase() === 'y') {
      console.log('\nInitializing database...');
      
      // Import and run database setup functions
      const { executeSqlFile, logOperation } = await import('./db-utils.js');
      
      // Apply all migrations
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
      logOperation('Database initialization', true);

      // Ask about loading test data
      const loadTest = await question('\nWould you like to load test data? (y/N): ');
      
      if (loadTest.toLowerCase() === 'y') {
        await executeSqlFile('src/database/seeds/001_test_data.sql');
        await executeSqlFile('src/database/seeds/002_additional_questions.sql');
        logOperation('Test data loading', true);
      }
    }

    console.log('\n🎉 Setup completed successfully!');
    console.log('\nYou can now run the following commands:');
    console.log('  npm run dev         - Start the development server');
    console.log('  npm run db:watch    - Monitor database changes');
    console.log('  npm run db:backup   - Manage database backups');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

setupDatabase();
