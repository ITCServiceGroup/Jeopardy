-- First drop the dependent view
DROP VIEW IF EXISTS tech_performance_stats;

-- Add new columns for two-player system
ALTER TABLE game_sessions
  ADD COLUMN player1_name VARCHAR(255),
  ADD COLUMN player2_name VARCHAR(255) DEFAULT 'Player 2',  -- Default value for existing records
  ADD COLUMN player1_score INTEGER DEFAULT 0,
  ADD COLUMN player2_score INTEGER DEFAULT 0,
  ADD COLUMN winner INTEGER CHECK (winner IN (1, 2));

-- Copy existing player data to player1_name
UPDATE game_sessions
SET player1_name = player_name,
    player1_score = COALESCE(final_score, 0),
    player2_score = 0,
    winner = CASE WHEN COALESCE(final_score, 0) > 0 THEN 1 ELSE NULL END;

-- Make new columns NOT NULL after data migration
ALTER TABLE game_sessions
  ALTER COLUMN player1_name SET NOT NULL,
  ALTER COLUMN player2_name SET NOT NULL;

-- Now safe to drop old columns
ALTER TABLE game_sessions
  DROP COLUMN player_name,
  DROP COLUMN final_score;

-- Update game_statistics table
ALTER TABLE game_statistics
  ADD COLUMN player1_name VARCHAR(255),
  ADD COLUMN player2_name VARCHAR(255) DEFAULT 'Player 2',  -- Default value for existing records
  ADD COLUMN current_player INTEGER DEFAULT 1;  -- Assume player 1 for existing records

-- Copy existing player data
UPDATE game_statistics gs
SET 
  player1_name = gs.player_name,
  current_player = 1,
  player2_name = (
    SELECT player2_name 
    FROM game_sessions gs2 
    WHERE gs2.id = gs.game_session_id
  );

-- Make new columns NOT NULL after data migration
ALTER TABLE game_statistics
  ALTER COLUMN player1_name SET NOT NULL,
  ALTER COLUMN player2_name SET NOT NULL,
  ALTER COLUMN current_player SET NOT NULL;

-- Add constraint for current_player values
ALTER TABLE game_statistics
  ADD CONSTRAINT check_current_player 
  CHECK (current_player IN (1, 2));

-- Drop old column
ALTER TABLE game_statistics
  DROP COLUMN player_name;

-- Create new performance stats view
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

-- Drop old trigger
DROP TRIGGER IF EXISTS update_game_session_score_trigger ON game_statistics;
DROP FUNCTION IF EXISTS update_game_session_score();

-- Create new trigger function for two-player scoring
CREATE OR REPLACE FUNCTION update_game_session_scores()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE game_sessions
  SET player1_score = (
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
  
  -- Update winner based on scores
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

-- Create new trigger
CREATE TRIGGER update_game_session_scores_trigger
  AFTER INSERT OR UPDATE ON game_statistics
  FOR EACH ROW
  EXECUTE FUNCTION update_game_session_scores();

-- Add indices for improved query performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_winner ON game_sessions(winner);
CREATE INDEX IF NOT EXISTS idx_game_statistics_current_player ON game_statistics(current_player);
