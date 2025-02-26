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
