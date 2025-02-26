import { supabase, verifyConnection, getTableCount, checkTablesExist, logOperation } from './db-utils.js';
import { formatDistanceToNow } from 'date-fns';

const TABLES = ['categories', 'questions', 'game_statistics'];
let startTime = new Date();
let changeCount = { categories: 0, questions: 0, game_statistics: 0 };

async function displayStatus() {
  console.clear();
  console.log('🔍 Database Watcher');
  console.log('------------------');
  console.log(`Runtime: ${formatDistanceToNow(startTime)}`);
  console.log('\nTable Statistics:');
  
  for (const table of TABLES) {
    const count = await getTableCount(table);
    console.log(`${table}:`);
    console.log(`  Records: ${count}`);
    console.log(`  Changes detected: ${changeCount[table]}`);
  }

  console.log('\nListening for changes... (Press Ctrl+C to stop)');
}

async function watchDatabase() {
  try {
    // Verify connection and schema
    console.log('Verifying database connection...');
    if (!await verifyConnection()) {
      throw new Error('Could not connect to database');
    }

    if (!await checkTablesExist(TABLES)) {
      throw new Error('Required tables are missing');
    }

    // Set up subscriptions with enhanced logging
    const subscriptions = TABLES.map(table => {
      return supabase
        .channel(`${table}-changes`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table
          },
          async (payload) => {
            changeCount[table]++;
            
            const timestamp = new Date().toLocaleTimeString();
            console.log(`\n[${timestamp}] ${table} change detected:`);
            console.log('Event:', payload.eventType);
            
            if (payload.eventType === 'INSERT') {
              console.log('New record:', payload.new);
            } else if (payload.eventType === 'DELETE') {
              console.log('Deleted record:', payload.old);
            } else if (payload.eventType === 'UPDATE') {
              console.log('Old values:', payload.old);
              console.log('New values:', payload.new);
            }

            // Refresh status display
            await displayStatus();
          }
        )
        .subscribe();
    });

    // Display initial status
    await displayStatus();

    // Handle cleanup on exit
    process.on('SIGINT', async () => {
      console.log('\nStopping database watch...');
      await Promise.all(subscriptions.map(sub => sub.unsubscribe()));
      
      // Display final statistics
      console.log('\nFinal Statistics:');
      console.log(`Total runtime: ${formatDistanceToNow(startTime)}`);
      console.log('Changes detected:');
      Object.entries(changeCount).forEach(([table, count]) => {
        console.log(`  ${table}: ${count}`);
      });
      
      console.log('\nCleanup completed.');
      process.exit(0);
    });

    // Refresh status periodically
    setInterval(() => displayStatus(), 60000); // Update every minute

  } catch (error) {
    logOperation('Database watch', false, error);
    process.exit(1);
  }
}

// Start watching
console.log('Starting database watcher...');
watchDatabase();
