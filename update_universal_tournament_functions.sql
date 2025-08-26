-- Update universal tournament functions to work with simplified advancement tracking
-- This eliminates the position assignment conflicts by using dynamic position allocation

-- Universal advance_tournament_winner function using simplified advancement tracking
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
  
  -- Find the first available bracket in the destination round
  SELECT id INTO next_bracket_id
  FROM tournament_brackets
  WHERE tournament_id = current_tournament_id
  AND round_number = destination_round
  AND bye_match = FALSE
  AND (participant1_id IS NULL OR participant2_id IS NULL)
  ORDER BY match_number
  LIMIT 1;
  
  IF next_bracket_id IS NULL THEN
    -- Debug information
    RAISE EXCEPTION 'No available bracket found in Round %. Debug: Match winners should only fill regular match positions, not bye positions. Check if bye advancement is interfering with match positions.', destination_round;
  END IF;
  
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
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Universal bye advancement function using simplified advancement tracking  
CREATE OR REPLACE FUNCTION advance_tournament_byes_universal(tournament_uuid UUID)
RETURNS VOID AS $$
DECLARE
  tournament_structure JSONB;
  bye_placements JSONB;
  bye_record RECORD;
  bye_key TEXT;
  destination JSONB;
  destination_round INTEGER;
  next_bracket_id UUID;
BEGIN
  -- Get tournament structure
  SELECT structure_data INTO tournament_structure
  FROM tournament_structures
  WHERE tournament_id = tournament_uuid;
  
  IF tournament_structure IS NULL THEN
    RAISE EXCEPTION 'Tournament structure not found for tournament %', tournament_uuid;
  END IF;
  
  -- Get bye placements
  bye_placements := tournament_structure->'byePlacements';
  
  -- Process all bye matches that need advancement
  FOR bye_record IN
    SELECT id, winner_id, round_number, match_number
    FROM tournament_brackets
    WHERE tournament_id = tournament_uuid
      AND bye_match = TRUE
      AND winner_id IS NOT NULL
      AND match_status = 'completed'
    ORDER BY round_number, match_number
  LOOP
    bye_key := bye_record.round_number || '-bye';
    destination := bye_placements->bye_key;
    
    IF destination IS NOT NULL THEN
      -- Extract destination round
      destination_round := (destination->>'toRound')::INTEGER;
      
      -- Check if bye winner is already placed in destination round
      IF NOT EXISTS (
        SELECT 1 FROM tournament_brackets 
        WHERE tournament_id = tournament_uuid 
        AND round_number = destination_round 
        AND (participant1_id = bye_record.winner_id OR participant2_id = bye_record.winner_id)
      ) THEN
        -- Find first available bracket in destination round
        SELECT id INTO next_bracket_id
        FROM tournament_brackets
        WHERE tournament_id = tournament_uuid
        AND round_number = destination_round
        AND bye_match = FALSE
        AND (participant1_id IS NULL OR participant2_id IS NULL)
        ORDER BY match_number
        LIMIT 1;
        
        IF next_bracket_id IS NOT NULL THEN
          -- Place bye winner in first available position
          UPDATE tournament_brackets
          SET participant1_id = CASE 
            WHEN participant1_id IS NULL THEN bye_record.winner_id 
            ELSE participant1_id 
          END,
          participant2_id = CASE 
            WHEN participant1_id IS NOT NULL AND participant2_id IS NULL THEN bye_record.winner_id 
            ELSE participant2_id 
          END
          WHERE id = next_bracket_id;
        END IF;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;