-- Fix the advancement issue where final Round 1 match winner should fill the bye spot in Round 2
-- The problem is that advance_tournament_winner_universal only looks for regular match positions,
-- but sometimes a match winner needs to advance to a bye position

CREATE OR REPLACE FUNCTION advance_tournament_winner_universal(
  bracket_uuid UUID, 
  winner_participant_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  current_tournament_id UUID;
  current_round INTEGER;
  current_match INTEGER;
  tournament_structure JSONB;
  advancement_map JSONB;
  match_key TEXT;
  destination JSONB;
  destination_round INTEGER;
  next_bracket_id UUID;
  available_regular_brackets INTEGER;
  available_bye_brackets INTEGER;
BEGIN
  -- Get current bracket info
  SELECT tournament_id, round_number, match_number
  INTO current_tournament_id, current_round, current_match
  FROM tournament_brackets
  WHERE id = bracket_uuid;
  
  -- Update current bracket with winner
  UPDATE tournament_brackets
  SET winner_id = winner_participant_id,
      match_status = 'completed',
      completed_at = CURRENT_TIMESTAMP
  WHERE id = bracket_uuid;
  
  -- Get tournament structure
  SELECT structure_data INTO tournament_structure
  FROM tournament_structures
  WHERE tournament_id = current_tournament_id;
  
  IF tournament_structure IS NULL THEN
    RAISE EXCEPTION 'Tournament structure not found for tournament %', current_tournament_id;
  END IF;
  
  -- Get advancement mappings
  advancement_map := tournament_structure->'advancementMap';
  match_key := current_round || '-' || current_match;
  destination := advancement_map->match_key;
  
  -- If no destination, this is the final match
  IF destination IS NULL THEN
    -- Update tournament winner
    UPDATE tournaments
    SET winner_name = (SELECT participant_name FROM tournament_participants WHERE id = winner_participant_id),
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP
    WHERE id = current_tournament_id;
    
    UPDATE tournament_participants
    SET status = 'winner'
    WHERE id = winner_participant_id;
    
    RETURN TRUE;
  END IF;
  
  -- Extract destination round
  destination_round := (destination->>'toRound')::INTEGER;
  
  -- Check available slots in destination round
  SELECT COUNT(*) INTO available_regular_brackets
  FROM tournament_brackets
  WHERE tournament_id = current_tournament_id
  AND round_number = destination_round
  AND bye_match = FALSE
  AND (participant1_id IS NULL OR participant2_id IS NULL);
  
  SELECT COUNT(*) INTO available_bye_brackets
  FROM tournament_brackets
  WHERE tournament_id = current_tournament_id
  AND round_number = destination_round
  AND bye_match = TRUE
  AND participant1_id IS NULL;
  
  -- Try to find a regular match position first
  IF available_regular_brackets > 0 THEN
    SELECT id INTO next_bracket_id
    FROM tournament_brackets
    WHERE tournament_id = current_tournament_id
    AND round_number = destination_round
    AND bye_match = FALSE
    AND (participant1_id IS NULL OR participant2_id IS NULL)
    ORDER BY match_number
    LIMIT 1;
    
    -- Place winner in first available position
    UPDATE tournament_brackets
    SET participant1_id = CASE 
      WHEN participant1_id IS NULL THEN winner_participant_id 
      ELSE participant1_id 
    END,
    participant2_id = CASE 
      WHEN participant1_id IS NOT NULL AND participant2_id IS NULL THEN winner_participant_id 
      ELSE participant2_id 
    END
    WHERE id = next_bracket_id;
    
  ELSIF available_bye_brackets > 0 THEN
    -- No regular positions available, but there's a bye position - place winner there
    SELECT id INTO next_bracket_id
    FROM tournament_brackets
    WHERE tournament_id = current_tournament_id
    AND round_number = destination_round
    AND bye_match = TRUE
    AND participant1_id IS NULL
    ORDER BY match_number
    LIMIT 1;
    
    -- Place winner in bye position and mark as completed
    UPDATE tournament_brackets
    SET participant1_id = winner_participant_id,
        winner_id = winner_participant_id,
        match_status = 'completed'
    WHERE id = next_bracket_id;
    
  ELSE
    RAISE EXCEPTION 'No available bracket found in Round % (regular: %, bye: %)', 
      destination_round, available_regular_brackets, available_bye_brackets;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;