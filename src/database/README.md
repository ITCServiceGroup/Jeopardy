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

The database schema supports a comprehensive Jeopardy-style game system with tournament functionality. The complete schema is available in the root directory as `schema.sql`.

### Core Game Tables

#### Tech Types
```sql
CREATE TABLE tech_types (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
Manages different technology categories (JavaScript, Python, etc.)

#### Categories
```sql
CREATE TABLE categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
Question categories within tech types.

#### Category Tech Types Junction
```sql
CREATE TABLE category_tech_types (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    tech_type_id INTEGER NOT NULL REFERENCES tech_types(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id, tech_type_id)
);
```
Links categories to tech types (many-to-many relationship).

#### Questions
```sql
CREATE TABLE questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options JSONB,
    correct_answers JSONB NOT NULL,
    points INTEGER NOT NULL DEFAULT 100,
    question_type VARCHAR(50) DEFAULT 'multiple_choice',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
Stores all game questions with flexible answer formats.

### Tournament System

#### Tournaments
```sql
CREATE TABLE tournaments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    tournament_type VARCHAR(50) DEFAULT 'single_elimination',
    status VARCHAR(50) DEFAULT 'setup',
    max_participants INTEGER,
    current_round INTEGER DEFAULT 1,
    total_rounds INTEGER,
    created_by TEXT,
    winner_name TEXT,
    second_place_name TEXT,
    third_place_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);
```

#### Tournament Participants
```sql
CREATE TABLE tournament_participants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    participant_name TEXT NOT NULL,
    seed_number INTEGER,
    status VARCHAR(50) DEFAULT 'registered',
    eliminated_in_round INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tournament_id, participant_name)
);
```

#### Tournament Brackets
```sql
CREATE TABLE tournament_brackets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    match_number INTEGER NOT NULL,
    participant1_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
    participant2_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
    winner_id UUID REFERENCES tournament_participants(id) ON DELETE SET NULL,
    game_session_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
    match_status VARCHAR(50) DEFAULT 'pending',
    bye_match BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tournament_id, round_number, match_number)
);
```

#### Tournament Structures
```sql
CREATE TABLE tournament_structures (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID UNIQUE NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    participant_count INTEGER NOT NULL,
    total_rounds INTEGER NOT NULL,
    structure_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
Stores tournament bracket structure and advancement logic.

### Game Session Tables

#### Game Sessions
```sql
CREATE TABLE game_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
    tech_type_id INTEGER REFERENCES tech_types(id) ON DELETE SET NULL,
    player1_name TEXT,
    player2_name TEXT,
    player1_score INTEGER DEFAULT 0,
    player2_score INTEGER DEFAULT 0,
    winner INTEGER, -- 1 for player1, 2 for player2, NULL for tie/incomplete
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE
);
```

#### Game Statistics
```sql
CREATE TABLE game_statistics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    game_session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    tech_type_id INTEGER REFERENCES tech_types(id) ON DELETE SET NULL,
    current_player INTEGER NOT NULL, -- 1 or 2
    player1_name TEXT,
    player2_name TEXT,
    question_category TEXT,
    correct BOOLEAN NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Tournament Management

#### Tournament Available Names
```sql
CREATE TABLE tournament_available_names (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Database Functions

The schema includes several PostgreSQL functions for tournament management:

- `store_tournament_structure(tournament_uuid, structure_json)` - Stores tournament bracket structure
- `get_tournament_structure(tournament_uuid)` - Retrieves tournament structure
- `generate_tournament_brackets_universal(tournament_uuid)` - Creates tournament brackets
- `advance_tournament_byes_universal(tournament_uuid)` - Handles bye advancement
- `advance_tournament_winner_universal(bracket_uuid, winner_id)` - Advances tournament winners
- `update_game_session_scores()` - Trigger function for score updates
- `update_updated_at_column()` - Trigger function for timestamp updates

## Row Level Security (RLS)

All tables have RLS enabled with public access policies for game functionality:
- Most tables allow full public access for gameplay
- Tournament participants have restricted updates (authenticated users only)
- Tournament brackets and participants can only be deleted during tournament setup
- Special policies for tournament management based on tournament status

## Indexes

Performance indexes are created for:
- Question lookups by category and points
- Game statistics by session, question, and tech type
- Tournament queries by status, round, and participants
- Foreign key relationships for efficient joins

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
