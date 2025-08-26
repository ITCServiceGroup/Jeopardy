-- Add 2nd and 3rd place columns to tournaments table
ALTER TABLE tournaments 
ADD COLUMN second_place_name TEXT,
ADD COLUMN third_place_name TEXT;

-- Update the advance_tournament_winner_universal function to determine 2nd and 3rd place
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
  total_rounds INTEGER;
  final_round_participants UUID[];
  semifinal_round_participants UUID[];
  losing_finalist_id UUID;
  third_place_candidates UUID[];
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
    -- Get total rounds to determine final/semifinal rounds
    total_rounds := (tournament_structure->>'totalRounds')::INTEGER;
    
    -- Get the losing finalist (2nd place)
    SELECT CASE 
      WHEN participant1_id = winner_participant_id THEN participant2_id 
      ELSE participant1_id 
    END INTO losing_finalist_id
    FROM tournament_brackets 
    WHERE id = bracket_uuid;
    
    -- Determine 3rd place from semifinal losers (previous round)
    -- In single elimination, 3rd place is typically the semifinal loser who performed better
    -- We'll take both semifinal losers and pick one based on their path or seed
    IF total_rounds >= 2 THEN
      -- Get semifinal matches (round before final)
      SELECT ARRAY_AGG(
        CASE 
          WHEN winner_id = participant1_id THEN participant2_id 
          ELSE participant1_id 
        END
      ) INTO third_place_candidates
      FROM tournament_brackets 
      WHERE tournament_id = current_tournament_id 
        AND round_number = total_rounds - 1 
        AND match_status = 'completed'
        AND winner_id IS NOT NULL
        AND (participant1_id IS NOT NULL AND participant2_id IS NOT NULL);
    END IF;
    
    -- Update tournament with winner and places
    UPDATE tournaments
    SET winner_name = (SELECT participant_name FROM tournament_participants WHERE id = winner_participant_id),
        second_place_name = (SELECT participant_name FROM tournament_participants WHERE id = losing_finalist_id),
        third_place_name = (
          SELECT participant_name 
          FROM tournament_participants 
          WHERE id = COALESCE(third_place_candidates[1], NULL)
        ),
        status = 'completed',
        completed_at = CURRENT_TIMESTAMP
    WHERE id = current_tournament_id;
    
    -- Update participant statuses
    UPDATE tournament_participants
    SET status = 'winner'
    WHERE id = winner_participant_id;
    
    UPDATE tournament_participants
    SET status = 'eliminated'
    WHERE id = losing_finalist_id;
    
    -- Mark semifinal losers as eliminated if not already
    IF third_place_candidates IS NOT NULL THEN
      UPDATE tournament_participants
      SET status = 'eliminated'
      WHERE id = ANY(third_place_candidates);
    END IF;
    
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