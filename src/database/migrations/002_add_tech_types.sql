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
