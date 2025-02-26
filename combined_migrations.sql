-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  options TEXT[] NOT NULL,
  points INTEGER NOT NULL CHECK (points IN (200, 400, 600, 800, 1000)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create game_statistics table
CREATE TABLE IF NOT EXISTS game_statistics (
  id SERIAL PRIMARY KEY,
  player_name TEXT NOT NULL,
  question_category TEXT NOT NULL,
  question_value INTEGER NOT NULL,
  correct BOOLEAN NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_game_statistics_player_name ON game_statistics(player_name);
CREATE INDEX IF NOT EXISTS idx_game_statistics_timestamp ON game_statistics(timestamp);
CREATE INDEX IF NOT EXISTS idx_questions_category_id ON questions(category_id);
CREATE INDEX IF NOT EXISTS idx_questions_points ON questions(points);

-- Create row level security policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_statistics ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable read access for all users" ON categories FOR SELECT USING (true);
CREATE POLICY "Enable write access for authenticated users" ON categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON categories FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON questions FOR SELECT USING (true);
CREATE POLICY "Enable write access for authenticated users" ON questions FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON questions FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON questions FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON game_statistics FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON game_statistics FOR INSERT WITH CHECK (true);
-- Create tech_types table
CREATE TABLE IF NOT EXISTS tech_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (name IN ('Install', 'Service')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add initial tech types
INSERT INTO tech_types (name) VALUES
  ('Install'),
  ('Service')
ON CONFLICT (name) DO NOTHING;

-- Add game sessions table for tracking individual games
CREATE TABLE IF NOT EXISTS game_sessions (
  id SERIAL PRIMARY KEY,
  tech_type_id INTEGER REFERENCES tech_types(id),
  player_name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP WITH TIME ZONE,
  final_score INTEGER
);

-- Add tech_type to categories
ALTER TABLE categories 
ADD COLUMN tech_type_id INTEGER REFERENCES tech_types(id);

-- Update game_statistics to include game session and tech type
ALTER TABLE game_statistics 
ADD COLUMN game_session_id INTEGER REFERENCES game_sessions(id),
ADD COLUMN tech_type_id INTEGER REFERENCES tech_types(id);

-- Create index for tech type lookups
CREATE INDEX IF NOT EXISTS idx_categories_tech_type ON categories(tech_type_id);
CREATE INDEX IF NOT EXISTS idx_game_statistics_tech_type ON game_statistics(tech_type_id);
CREATE INDEX IF NOT EXISTS idx_game_statistics_session ON game_statistics(game_session_id);

-- Update RLS policies to include tech type context
DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
CREATE POLICY "Enable read access for all users" ON categories 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable write access for authenticated users" ON categories;
CREATE POLICY "Enable write access for authenticated users" ON categories 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create view for comparative statistics
CREATE OR REPLACE VIEW tech_performance_stats AS
SELECT 
  t.name as tech_type,
  COUNT(DISTINCT gs.id) as total_games,
  COUNT(DISTINCT gs.player_name) as unique_players,
  AVG(gs.final_score) as average_score,
  SUM(CASE WHEN gst.correct THEN 1 ELSE 0 END)::float / COUNT(*) as correct_answer_rate
FROM tech_types t
LEFT JOIN game_sessions gs ON gs.tech_type_id = t.id
LEFT JOIN game_statistics gst ON gst.game_session_id = gs.id
GROUP BY t.id, t.name;
-- Modify game_statistics table
ALTER TABLE game_statistics
  DROP COLUMN question_category,
  DROP COLUMN question_value,
  ADD COLUMN question_id INTEGER REFERENCES questions(id) ON DELETE SET NULL,
  ADD COLUMN game_session_id INTEGER REFERENCES game_sessions(id) ON DELETE CASCADE;

-- Add index for the new foreign key relationships
CREATE INDEX IF NOT EXISTS idx_game_statistics_question_id ON game_statistics(question_id);
CREATE INDEX IF NOT EXISTS idx_game_statistics_game_session_id ON game_statistics(game_session_id);

-- Drop old view if exists
DROP VIEW IF EXISTS tech_performance_stats;

-- Create updated performance stats view
CREATE OR REPLACE VIEW tech_performance_stats AS
SELECT 
  tt.name as tech_type,
  COUNT(DISTINCT gs.id) as total_games,
  COUNT(DISTINCT gs.player_name) as unique_players,
  AVG(gs.final_score) as average_score,
  (
    SELECT CAST(COUNT(*) FILTER (WHERE gst.correct = true) AS float) / NULLIF(COUNT(*), 0)
    FROM game_statistics gst
    JOIN game_sessions gs2 ON gs2.id = gst.game_session_id
    WHERE gs2.tech_type_id = tt.id
  ) as correct_answer_rate
FROM tech_types tt
LEFT JOIN game_sessions gs ON gs.tech_type_id = tt.id
GROUP BY tt.id, tt.name;

-- Update RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON game_statistics;
DROP POLICY IF EXISTS "Enable insert for all users" ON game_statistics;

CREATE POLICY "Enable read access for all users" 
  ON game_statistics FOR SELECT 
  USING (true);

CREATE POLICY "Enable insert for all users" 
  ON game_statistics FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM game_sessions gs 
      WHERE gs.id = game_session_id
    )
  );

-- Add trigger to update game session score
CREATE OR REPLACE FUNCTION update_game_session_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE game_sessions
  SET final_score = (
    SELECT COALESCE(SUM(
      CASE 
        WHEN gs.correct THEN q.points 
        ELSE -q.points 
      END
    ), 0)
    FROM game_statistics gs
    JOIN questions q ON q.id = gs.question_id
    WHERE gs.game_session_id = NEW.game_session_id
  )
  WHERE id = NEW.game_session_id;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_game_session_score_trigger
  AFTER INSERT OR UPDATE ON game_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_game_session_score();
-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON categories;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON categories;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON categories;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON categories;

DROP POLICY IF EXISTS "Enable read access for all users" ON questions;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON questions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON questions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON questions;

DROP POLICY IF EXISTS "Enable read access for all users" ON game_statistics;
DROP POLICY IF EXISTS "Enable insert for all users" ON game_statistics;

-- Create new open policies
CREATE POLICY "Enable all access for categories"
ON categories FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all access for questions"
ON questions FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable all access for game_statistics"
ON game_statistics FOR ALL
USING (true)
WITH CHECK (true);

-- Verify RLS is still enabled
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_statistics ENABLE ROW LEVEL SECURITY;
-- Drop and recreate the questions table with proper array type
ALTER TABLE questions 
ALTER COLUMN options TYPE JSONB USING array_to_json(options)::JSONB;

-- Add check constraint to ensure options is an array
ALTER TABLE questions
ADD CONSTRAINT options_is_array CHECK (jsonb_typeof(options) = 'array');
-- Create new join table for categories and tech types
CREATE TABLE IF NOT EXISTS category_tech_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  tech_type_id INTEGER REFERENCES tech_types(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category_id, tech_type_id)
);

-- Copy existing tech type assignments to the new join table
INSERT INTO category_tech_types (category_id, tech_type_id)
SELECT id, tech_type_id
FROM categories
WHERE tech_type_id IS NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_category_tech_types_category ON category_tech_types(category_id);
CREATE INDEX IF NOT EXISTS idx_category_tech_types_tech_type ON category_tech_types(tech_type_id);

-- Drop the old tech_type_id column
ALTER TABLE categories DROP COLUMN IF EXISTS tech_type_id;

-- Update RLS policies
ALTER TABLE category_tech_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON category_tech_types
  FOR SELECT USING (true);

CREATE POLICY "Enable write access for authenticated users" ON category_tech_types
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON category_tech_types
  FOR DELETE USING (auth.role() = 'authenticated');
-- Add categories that belong to both tech types
WITH shared_categories AS (
  INSERT INTO categories (name) VALUES
    ('Safety and Compliance'),
    ('Testing and Troubleshooting'),
    ('Equipment Documentation'),
    ('Customer Communication')
  RETURNING id, name
)
INSERT INTO category_tech_types (category_id, tech_type_id)
SELECT 
  c.id,
  t.id
FROM shared_categories c
CROSS JOIN tech_types t;

-- Add some test questions for shared categories
WITH safety_category AS (
  SELECT id FROM categories WHERE name = 'Safety and Compliance' LIMIT 1
)
INSERT INTO questions (category_id, question, answer, options, points)
SELECT 
  id,
  'What is the first step when approaching any equipment service or installation?',
  'Check for safety hazards',
  ARRAY['Start working immediately', 'Call supervisor', 'Check for safety hazards', 'Review documentation'],
  400
FROM safety_category;

WITH docs_category AS (
  SELECT id FROM categories WHERE name = 'Equipment Documentation' LIMIT 1
)
INSERT INTO questions (category_id, question, answer, options, points)
SELECT 
  id,
  'Which document should be reviewed first when troubleshooting equipment?',
  'Equipment manual',
  ARRAY['Service history', 'Equipment manual', 'Installation guide', 'Warranty card'],
  600
FROM docs_category;
