# Database Setup and Management

This directory contains database migrations and seed data for the ITC Jeopardy game.

## Structure

```
database/
├── migrations/         # Database schema definitions
│   └── 001_initial_schema.sql
├── seeds/             # Test and initial data
│   ├── 001_test_data.sql
│   └── 002_additional_questions.sql
└── README.md          # This file
```

## Setting Up the Database

1. Create a new Supabase project at [https://supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Create a `.env` file in the root directory with:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

## Database Management Scripts

The following npm scripts are available for database management:

### Migration & Seeding Scripts
```bash
# Run migrations
npm run db:migrate

# Reset database (drops all tables and runs migrations)
npm run db:reset

# Reset database and load seed data
npm run db:reset-with-seed

# Load seed data only
npm run db:seed
```

### Backup and Restore Scripts
```bash
# Create a new backup
npm run db:backup:create

# List available backups
npm run db:backup:list

# Restore from a backup
npm run db:backup:restore <filename>

# Clean up old backups (keeps last 5 by default)
npm run db:backup:clean [count]

# Show backup tool help
npm run db:backup
```

### Monitoring Scripts
```bash
# Watch database for changes (development)
npm run db:watch
```

### Script Details

#### Database Operations
- `db:migrate`: Applies the schema from `migrations/001_initial_schema.sql`
- `db:seed`: Loads test data from both seed files in order
- `db:reset`: Drops all tables and reapplies the schema
- `db:reset-with-seed`: Performs reset and loads all seed data

#### Backup Operations
- `db:backup:create`: Creates a timestamped backup of all tables
- `db:backup:list`: Shows all available backups with dates and sizes
- `db:backup:restore`: Restores database from a specified backup
- `db:backup:clean`: Removes old backups keeping the most recent ones

#### Monitoring Tools
- `db:watch`: Real-time monitoring of database changes
  - Tracks all table modifications
  - Shows detailed change information
  - Provides continuous status updates

### Development Features

#### Real-time Database Watcher
- Monitors all database tables
- Shows detailed change information:
  - Category modifications
  - Question updates
  - Game statistics tracking
- Provides timestamp for all operations
- Displays running statistics

#### Backup Management
- Automatic backup before risky operations
- Configurable backup retention
- JSON format for easy inspection
- Safety checks for production environments

#### Environment Configuration
```env
# Database Script Settings
DB_AUTO_RESET=false        # Auto reset on errors
DB_BACKUP_ENABLED=true     # Enable auto-backups
DB_BACKUP_PATH=./backups   # Backup directory
DB_SCRIPT_TIMEOUT=30000    # Script timeout (ms)
DB_WATCH_INTERVAL=60000    # Watch refresh interval
```

### Usage Examples

```bash
# Create a backup
npm run db:backup:create

# List backups with details
npm run db:backup:list

# Restore from specific backup
npm run db:backup:restore backup-2025-02-25T12-00-00.json

# Keep only last 3 backups
npm run db:backup:clean 3

# Monitor database changes
npm run db:watch
```

## Database Schema

### Categories Table
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Questions Table
```sql
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  options TEXT[] NOT NULL,
  points INTEGER NOT NULL CHECK (points IN (200, 400, 600, 800, 1000)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Game Statistics Table
```sql
CREATE TABLE game_statistics (
  id SERIAL PRIMARY KEY,
  player_name TEXT NOT NULL,
  question_category TEXT NOT NULL,
  question_value INTEGER NOT NULL,
  correct BOOLEAN NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Row Level Security (RLS)

- All tables have RLS enabled
- Read access is granted to all users
- Write access for categories and questions requires authentication
- Game statistics can be written by anyone (to allow gameplay without auth)

## Indexes

The following indexes are created for performance:
- `idx_game_statistics_player_name` on `game_statistics(player_name)`
- `idx_game_statistics_timestamp` on `game_statistics(timestamp)`
- `idx_questions_category_id` on `questions(category_id)`
- `idx_questions_points` on `questions(points)`

## Maintenance

### Adding New Categories
Use the admin interface or insert directly:
```sql
INSERT INTO categories (name) VALUES ('New Category');
```

### Adding New Questions
Use the admin interface or insert directly:
```sql
INSERT INTO questions (
  category_id, 
  question, 
  answer, 
  options, 
  points
) VALUES (
  (SELECT id FROM categories WHERE name = 'Category Name'),
  'Question text',
  'Correct answer',
  ARRAY['Option 1', 'Option 2', 'Option 3', 'Option 4'],
  200
);
```

### Backing Up Data
Use Supabase Dashboard or API to export data regularly.
