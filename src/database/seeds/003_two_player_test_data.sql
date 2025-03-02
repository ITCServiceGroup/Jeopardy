-- Insert sample two-player game sessions
INSERT INTO game_sessions 
  (tech_type_id, start_time, end_time, player1_name, player2_name, player1_score, player2_score, winner)
VALUES
  (1, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour', 'John', 'Alice', 800, 600, 1),
  (2, NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours', 'Bob', 'Carol', 500, 700, 2),
  (1, NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours', 'Dave', 'Eve', 900, 850, 1),
  (2, NOW() - INTERVAL '2 days', NOW() - INTERVAL '47 hours', 'Frank', 'Grace', 600, 600, NULL),
  (1, NOW() - INTERVAL '1 week', NOW() - INTERVAL '167 hours', 'Henry', 'Ivy', 1000, 800, 1);

-- Insert corresponding game statistics
WITH sample_questions AS (
  SELECT id, category_id, points 
  FROM questions 
  ORDER BY RANDOM() 
  LIMIT 20
)
INSERT INTO game_statistics 
  (game_session_id, tech_type_id, player1_name, player2_name, current_player, question_id, correct, timestamp)
SELECT
  gs.id,
  gs.tech_type_id,
  gs.player1_name,
  gs.player2_name,
  CASE WHEN ROW_NUMBER() OVER (PARTITION BY gs.id ORDER BY sq.id) % 2 = 1 THEN 1 ELSE 2 END as current_player,
  sq.id,
  CASE WHEN RANDOM() > 0.3 THEN true ELSE false END as correct,
  gs.start_time + (ROW_NUMBER() OVER (PARTITION BY gs.id ORDER BY sq.id) * INTERVAL '2 minutes')
FROM game_sessions gs
CROSS JOIN sample_questions sq
WHERE gs.player2_name IS NOT NULL
ORDER BY gs.start_time, RANDOM()
LIMIT 100;

-- Update game session scores based on statistics
SELECT update_game_session_scores();
