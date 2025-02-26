import { 
  createBackup,
  listBackups, 
  restoreFromBackup, 
  cleanupBackups,
  logOperation,
  productionSafetyCheck
} from './db-utils.js';

const command = process.argv[2];
const arg = process.argv[3];

async function handleBackupCommand() {
  try {
    switch (command) {
      case 'create':
        await createBackup();
        break;

      case 'list':
        const backups = await listBackups();
        console.log('\nAvailable Backups:');
        console.log('------------------');
        if (backups.length === 0) {
          console.log('No backups found.');
        } else {
          backups.forEach(backup => {
            console.log(`\nFile: ${backup.file}`);
            console.log(`Date: ${backup.date.toLocaleString()}`);
            console.log(`Size: ${backup.size}KB`);
          });
        }
        break;

      case 'restore':
        if (arg) {
          await productionSafetyCheck(10);
          await restoreFromBackup(arg);
        } else {
          console.error('Please specify a backup file to restore.');
          console.log('Usage: npm run db:backup restore <filename>');
          process.exit(1);
        }
        break;

      case 'clean':
        const keepCount = parseInt(arg) || 5;
        await cleanupBackups(keepCount);
        break;

      default:
        console.log(`
Database Backup Tool
-------------------

Usage:
  npm run db:backup <command> [args]

Commands:
  create           Create a new backup
  list             List available backups
  restore <file>   Restore from a backup file
  clean [count]    Clean up old backups (keeps last [count] backups, default: 5)

Examples:
  npm run db:backup create
  npm run db:backup list
  npm run db:backup restore backup-2025-02-25.json
  npm run db:backup clean 3
        `);
        process.exit(1);
    }
  } catch (error) {
    logOperation('Backup operation', false, error);
    process.exit(1);
  }
}

console.log('🗄️  Database Backup Tool');
handleBackupCommand();
