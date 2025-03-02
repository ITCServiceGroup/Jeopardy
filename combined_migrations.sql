-- Drop everything in correct order
DROP VIEW IF EXISTS tech_performance_stats CASCADE;
DROP TABLE IF EXISTS category_tech_types CASCADE;
DROP TABLE IF EXISTS game_statistics CASCADE;
DROP TABLE IF EXISTS game_sessions CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS tech_types CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS update_game_session_scores CASCADE;

-- Create tech_types table
CREATE TABLE tech_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (name IN ('Install', 'Service')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  options JSONB NOT NULL,
  points INTEGER NOT NULL CHECK (points IN (100, 200, 300, 400, 500)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT options_is_array CHECK (jsonb_typeof(options) = 'array')
);

-- Create game_sessions table with two-player support
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tech_type_id INTEGER REFERENCES tech_types(id),
  player1_name TEXT NOT NULL,
  player2_name TEXT NOT NULL,
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP WITH TIME ZONE,
  winner INTEGER CHECK (winner IN (1, 2)),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create game_statistics table with two-player support
CREATE TABLE game_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_session_id UUID REFERENCES game_sessions(id) ON DELETE CASCADE,
  tech_type_id INTEGER REFERENCES tech_types(id),
  question_id UUID REFERENCES questions(id) ON DELETE SET NULL,
  player1_name TEXT NOT NULL,
  player2_name TEXT NOT NULL,
  current_player INTEGER NOT NULL CHECK (current_player IN (1, 2)),
  correct BOOLEAN NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create category_tech_types join table
CREATE TABLE category_tech_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  tech_type_id INTEGER REFERENCES tech_types(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category_id, tech_type_id)
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

-- Create game session scores trigger
CREATE OR REPLACE FUNCTION update_game_session_scores()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE game_sessions
  SET 
    player1_score = (
      SELECT COALESCE(SUM(
        CASE 
          WHEN gs.correct AND gs.current_player = 1 THEN q.points 
          WHEN NOT gs.correct AND gs.current_player = 1 THEN -q.points
          ELSE 0
        END
      ), 0)
      FROM game_statistics gs
      JOIN questions q ON q.id = gs.question_id
      WHERE gs.game_session_id = NEW.game_session_id
    ),
    player2_score = (
      SELECT COALESCE(SUM(
        CASE 
          WHEN gs.correct AND gs.current_player = 2 THEN q.points 
          WHEN NOT gs.correct AND gs.current_player = 2 THEN -q.points
          ELSE 0
        END
      ), 0)
      FROM game_statistics gs
      JOIN questions q ON q.id = gs.question_id
      WHERE gs.game_session_id = NEW.game_session_id
    )
  WHERE id = NEW.game_session_id;
  
  -- Update winner based on current scores
  UPDATE game_sessions
  SET winner = CASE 
    WHEN player1_score > player2_score THEN 1
    WHEN player2_score > player1_score THEN 2
    ELSE NULL
  END
  WHERE id = NEW.game_session_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for game session score updates
CREATE TRIGGER update_game_session_scores_trigger
  AFTER INSERT OR UPDATE ON game_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_game_session_scores();

-- Create performance stats view
CREATE OR REPLACE VIEW tech_performance_stats AS
SELECT 
  tt.name as tech_type,
  COUNT(DISTINCT gs.id) as total_games,
  COUNT(DISTINCT gs.player1_name) + COUNT(DISTINCT gs.player2_name) as unique_players,
  AVG(GREATEST(gs.player1_score, gs.player2_score)) as best_score,
  AVG(LEAST(gs.player1_score, gs.player2_score)) as lowest_score,
  (
    SELECT CAST(COUNT(*) FILTER (WHERE gst.correct = true) AS float) / NULLIF(COUNT(*), 0)
    FROM game_statistics gst
    JOIN game_sessions gs2 ON gs2.id = gst.game_session_id
    WHERE gs2.tech_type_id = tt.id
  ) as correct_answer_rate
FROM tech_types tt
LEFT JOIN game_sessions gs ON gs.tech_type_id = tt.id
GROUP BY tt.id, tt.name;

-- Create indexes for performance
CREATE INDEX idx_questions_category ON questions(category_id);
CREATE INDEX idx_questions_points ON questions(points);
CREATE INDEX idx_game_stats_session ON game_statistics(game_session_id);
CREATE INDEX idx_game_stats_question ON game_statistics(question_id);
CREATE INDEX idx_game_stats_tech_type ON game_statistics(tech_type_id);
CREATE INDEX idx_category_tech_types_category ON category_tech_types(category_id);
CREATE INDEX idx_category_tech_types_tech_type ON category_tech_types(tech_type_id);
CREATE INDEX idx_game_sessions_tech_type ON game_sessions(tech_type_id);
CREATE INDEX idx_game_sessions_winner ON game_sessions(winner);

-- Enable row level security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_tech_types ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Enable all access for categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for questions" ON questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for game_statistics" ON game_statistics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for game_sessions" ON game_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for category_tech_types" ON category_tech_types FOR ALL USING (true) WITH CHECK (true);

-- Insert initial tech types
INSERT INTO tech_types (name) VALUES
  ('Install'),
  ('Service')
ON CONFLICT (name) DO NOTHING;
