-- Universal Tournament System Database Schema
-- Replaces complex dynamic calculations with predetermined tournament structures

-- Table to store complete tournament structures
CREATE TABLE IF NOT EXISTS tournament_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  participant_count INTEGER NOT NULL,
  total_rounds INTEGER NOT NULL,
  structure_data JSONB NOT NULL, -- Complete structure with rounds, advancement mappings, bye placements
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tournament_id)
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_tournament_structures_tournament_id ON tournament_structures(tournament_id);

-- Function to store tournament structure
CREATE OR REPLACE FUNCTION store_tournament_structure(
  tournament_uuid UUID,
  structure_json JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  participant_count INTEGER;
  total_rounds INTEGER;
BEGIN
  -- Extract key values from structure
  participant_count := (structure_json->>'participantCount')::INTEGER;
  total_rounds := (structure_json->>'totalRounds')::INTEGER;
  
  -- Insert or update tournament structure
  INSERT INTO tournament_structures (tournament_id, participant_count, total_rounds, structure_data)
  VALUES (tournament_uuid, participant_count, total_rounds, structure_json)
  ON CONFLICT (tournament_id) 
  DO UPDATE SET 
    participant_count = EXCLUDED.participant_count,
    total_rounds = EXCLUDED.total_rounds,
    structure_data = EXCLUDED.structure_data;
  
  -- Update tournament with total rounds
  UPDATE tournaments 
  SET total_rounds = total_rounds
  WHERE id = tournament_uuid;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get tournament structure
CREATE OR REPLACE FUNCTION get_tournament_structure(tournament_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  structure JSONB;
BEGIN
  SELECT structure_data INTO structure
  FROM tournament_structures
  WHERE tournament_id = tournament_uuid;
  
  RETURN structure;
END;
$$ LANGUAGE plpgsql;

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
    RAISE EXCEPTION 'No available bracket found in Round %', destination_round;
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

-- Function to generate tournament brackets using predetermined structure
CREATE OR REPLACE FUNCTION generate_tournament_brackets_universal(tournament_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  tournament_structure JSONB;
  participant_count INTEGER;
  round_data JSONB;
  round_info RECORD;
  current_participant_idx INTEGER := 1;
  current_match INTEGER;
  participants_cursor CURSOR FOR 
    SELECT id, participant_name 
    FROM tournament_participants 
    WHERE tournament_id = tournament_uuid 
    AND status = 'registered'
    ORDER BY gen_random_uuid();
  participant_record RECORD;
  participant_ids UUID[];
BEGIN
  -- Get tournament structure
  SELECT structure_data INTO tournament_structure
  FROM tournament_structures
  WHERE tournament_id = tournament_uuid;
  
  IF tournament_structure IS NULL THEN
    RAISE EXCEPTION 'Tournament structure not found. Call store_tournament_structure first.';
  END IF;
  
  participant_count := (tournament_structure->>'participantCount')::INTEGER;
  
  -- Clear any existing brackets
  DELETE FROM tournament_brackets WHERE tournament_id = tournament_uuid;
  
  -- Collect participant IDs randomly
  participant_ids := ARRAY[]::UUID[];
  FOR participant_record IN participants_cursor LOOP
    participant_ids := array_append(participant_ids, participant_record.id);
  END LOOP;
  
  -- Generate brackets for each round
  FOR round_info IN 
    SELECT 
      (value->>'round')::INTEGER as round_number,
      (value->>'matches')::INTEGER as matches,
      (value->>'byes')::INTEGER as byes
    FROM jsonb_array_elements(tournament_structure->'rounds') as value
  LOOP
    current_match := 1;
    
    -- Generate matches for this round
    FOR i IN 1..round_info.matches LOOP
      IF round_info.round_number = 1 THEN
        -- First round: assign actual participants
        INSERT INTO tournament_brackets (
          tournament_id, round_number, match_number,
          participant1_id, participant2_id, match_status, bye_match
        ) VALUES (
          tournament_uuid, round_info.round_number, current_match,
          participant_ids[current_participant_idx], 
          participant_ids[current_participant_idx + 1], 
          'pending', FALSE
        );
        current_participant_idx := current_participant_idx + 2;
      ELSE
        -- Later rounds: placeholder brackets
        INSERT INTO tournament_brackets (
          tournament_id, round_number, match_number,
          match_status, bye_match
        ) VALUES (
          tournament_uuid, round_info.round_number, current_match,
          'pending', FALSE
        );
      END IF;
      current_match := current_match + 1;
    END LOOP;
    
    -- Handle byes for this round
    FOR i IN 1..round_info.byes LOOP
      INSERT INTO tournament_brackets (
        tournament_id, round_number, match_number,
        participant1_id, match_status, bye_match, winner_id
      ) VALUES (
        tournament_uuid, round_info.round_number, current_match,
        participant_ids[current_participant_idx], 
        'completed', TRUE, participant_ids[current_participant_idx]
      );
      current_participant_idx := current_participant_idx + 1;
      current_match := current_match + 1;
    END LOOP;
  END LOOP;
  
  -- Auto-advance any completed byes
  PERFORM advance_tournament_byes_universal(tournament_uuid);
  
  RETURN (tournament_structure->>'totalRounds')::INTEGER;
END;
$$ LANGUAGE plpgsql;