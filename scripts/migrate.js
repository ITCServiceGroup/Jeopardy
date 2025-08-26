#!/usr/bin/env node
import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  console.log(chalk.blue('🔄 Database Migration Tool'));

  const { VITE_SUPABASE_DB_HOST, VITE_SUPABASE_DB_PASSWORD } = process.env;

  if (!VITE_SUPABASE_DB_HOST || !VITE_SUPABASE_DB_PASSWORD) {
    console.error(chalk.red('Error: Database configuration not found in .env file'));
    process.exit(1);
  }

  const client = new pg.Client({
    host: VITE_SUPABASE_DB_HOST,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: VITE_SUPABASE_DB_PASSWORD,
    ssl: true
  });

  try {
    console.log(chalk.blue('Verifying database connection...'));
    await client.connect();

    console.log(chalk.blue('Applying schema...'));

    const schemaFile = path.join(__dirname, '../database/schema.sql');
    const sql = fs.readFileSync(schemaFile, 'utf8');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // Execute each statement
    for (const statement of statements) {
      try {
        await client.query(statement + ';');
        console.log(chalk.green('✓ Statement executed successfully'));
      } catch (error) {
        // Log the error but continue with other statements
        console.log(chalk.yellow(`⚠️ Statement error: ${error.message}`));
      }
    }

    console.log(chalk.green('✅ Schema applied successfully'));

  } catch (err) {
    console.error(chalk.red('Error:', err));
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate().catch(err => {
  console.error(chalk.red('Fatal error:', err));
  process.exit(1);
});
