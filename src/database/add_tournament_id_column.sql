-- Add missing tournament_id column to game_sessions table
-- Run this in your Supabase SQL Editor

-- Add the column (will fail if it already exists, but that's ok)
ALTER TABLE game_sessions ADD COLUMN tournament_id UUID REFERENCES tournaments(id);

-- Create index for better performance  
CREATE INDEX IF NOT EXISTS idx_game_sessions_tournament ON game_sessions(tournament_id);