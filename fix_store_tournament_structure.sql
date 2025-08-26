-- Fix the ambiguous column reference in store_tournament_structure function
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION store_tournament_structure(
  tournament_uuid UUID,
  structure_json JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  participant_count INTEGER;
  total_rounds_param INTEGER;  -- Renamed to avoid ambiguity
BEGIN
  -- Extract key values from structure
  participant_count := (structure_json->>'participantCount')::INTEGER;
  total_rounds_param := (structure_json->>'totalRounds')::INTEGER;
  
  -- Insert or update tournament structure
  INSERT INTO tournament_structures (tournament_id, participant_count, total_rounds, structure_data)
  VALUES (tournament_uuid, participant_count, total_rounds_param, structure_json)
  ON CONFLICT (tournament_id) 
  DO UPDATE SET 
    participant_count = EXCLUDED.participant_count,
    total_rounds = EXCLUDED.total_rounds,
    structure_data = EXCLUDED.structure_data;
  
  -- Update tournament with total rounds (fixed ambiguous reference)
  UPDATE tournaments 
  SET total_rounds = total_rounds_param  -- Now uses the parameter, not the column
  WHERE id = tournament_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;