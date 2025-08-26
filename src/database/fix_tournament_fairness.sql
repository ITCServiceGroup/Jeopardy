-- Scalable Fair Tournament Bracket Generation
-- This creates optimized single-elimination brackets for any participant count
-- Minimizes bye advantages and ensures fair competition
-- Run this in your Supabase SQL Editor

-- Helper function to calculate fair tournament structure for any participant count
-- Uses the "bye winner faces opponent" principle throughout
CREATE OR REPLACE FUNCTION calculate_optimal_bracket_structure(participant_count INTEGER)
RETURNS TABLE(
    round_number INTEGER,
    matches_in_round INTEGER,
    byes_in_round INTEGER,
    participants_entering INTEGER
) AS $$
DECLARE
    remaining_participants INTEGER := participant_count;
    current_round INTEGER := 1;
    matches_this_round INTEGER;
    byes_this_round INTEGER;
BEGIN
    -- Calculate total rounds needed
    WHILE remaining_participants > 1 LOOP
        -- Determine matches and byes for current round
        IF remaining_participants % 2 = 0 THEN
            -- Even participants: pair them all up, no byes
            matches_this_round := remaining_participants / 2;
            byes_this_round := 0;
        ELSE
            -- Odd participants: pair up as many as possible, one bye
            matches_this_round := (remaining_participants - 1) / 2;
            byes_this_round := 1;
        END IF;
        
        -- Return this round's structure
        RETURN QUERY VALUES (current_round, matches_this_round, byes_this_round, remaining_participants);
        
        -- Calculate participants advancing to next round
        remaining_participants := matches_this_round + byes_this_round;
        current_round := current_round + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_tournament_brackets(tournament_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    participant_count INTEGER;
    calculated_total_rounds INTEGER;
    participants_cursor CURSOR FOR 
        SELECT id, participant_name 
        FROM tournament_participants 
        WHERE tournament_id = tournament_uuid 
        AND status = 'registered'
        ORDER BY gen_random_uuid();
    participant_record RECORD;
    participant_ids UUID[];
    bracket_structure RECORD;
    current_participant_idx INTEGER := 1;
    current_match INTEGER;
    bye_participants UUID[];
    i INTEGER;
BEGIN
    -- Get participant count
    SELECT COUNT(*) INTO participant_count
    FROM tournament_participants
    WHERE tournament_id = tournament_uuid AND status = 'registered';
    
    IF participant_count < 2 THEN
        RAISE EXCEPTION 'Need at least 2 participants to generate brackets';
    END IF;
    
    -- Calculate total rounds using optimal structure
    SELECT MAX(round_number) INTO calculated_total_rounds
    FROM calculate_optimal_bracket_structure(participant_count);
    
    -- Update tournament with total rounds
    UPDATE tournaments 
    SET total_rounds = calculated_total_rounds
    WHERE id = tournament_uuid;
    
    -- Clear any existing brackets
    DELETE FROM tournament_brackets WHERE tournament_id = tournament_uuid;
    
    -- Collect participant IDs randomly
    participant_ids := ARRAY[]::UUID[];
    FOR participant_record IN participants_cursor LOOP
        participant_ids := array_append(participant_ids, participant_record.id);
    END LOOP;
    
    -- Generate brackets using optimal structure
    FOR bracket_structure IN 
        SELECT * FROM calculate_optimal_bracket_structure(participant_count) 
        ORDER BY round_number 
    LOOP
        current_match := 1;
        
        -- Generate matches for this round
        FOR i IN 1..bracket_structure.matches_in_round LOOP
            IF bracket_structure.round_number = 1 THEN
                -- First round: assign actual participants
                INSERT INTO tournament_brackets (
                    tournament_id, round_number, match_number,
                    participant1_id, participant2_id, match_status, bye_match
                ) VALUES (
                    tournament_uuid, bracket_structure.round_number, current_match,
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
                    tournament_uuid, bracket_structure.round_number, current_match,
                    'pending', FALSE
                );
            END IF;
            current_match := current_match + 1;
        END LOOP;
        
        -- Handle byes for this round
        FOR i IN 1..bracket_structure.byes_in_round LOOP
            INSERT INTO tournament_brackets (
                tournament_id, round_number, match_number,
                participant1_id, match_status, bye_match, winner_id
            ) VALUES (
                tournament_uuid, bracket_structure.round_number, current_match,
                participant_ids[current_participant_idx], 
                'completed', TRUE, participant_ids[current_participant_idx]
            );
            current_participant_idx := current_participant_idx + 1;
            current_match := current_match + 1;
        END LOOP;
    END LOOP;
    
    -- Auto-advance any completed byes
    PERFORM auto_advance_byes(tournament_uuid);
    
    RETURN calculated_total_rounds;
END;
$$ LANGUAGE plpgsql;

-- Universal advance_tournament_winner function using fair bracket principles
CREATE OR REPLACE FUNCTION advance_tournament_winner(bracket_uuid UUID, winner_participant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_tournament_id UUID;
    current_round INTEGER;
    current_match INTEGER;
    participant_count INTEGER;
    next_round INTEGER;
    next_match INTEGER;
    next_bracket_id UUID;
    current_round_matches INTEGER;
    current_round_byes INTEGER;
    next_round_matches INTEGER;
    next_round_byes INTEGER;
    bye_match_in_current_round BOOLEAN := FALSE;
    advancing_participants INTEGER;
    next_round_needs_byes BOOLEAN := FALSE;
    filled_matches INTEGER;
    total_next_matches INTEGER;
BEGIN
    -- Get current bracket info
    SELECT tournament_id, round_number, match_number
    INTO current_tournament_id, current_round, current_match
    FROM tournament_brackets
    WHERE id = bracket_uuid;
    
    -- Get participant count for this tournament
    SELECT COUNT(*) INTO participant_count
    FROM tournament_participants
    WHERE tournament_id = current_tournament_id AND status = 'registered';
    
    -- Update current bracket with winner
    UPDATE tournament_brackets
    SET winner_id = winner_participant_id,
        match_status = 'completed',
        completed_at = CURRENT_TIMESTAMP
    WHERE id = bracket_uuid;
    
    -- Get current round structure
    SELECT matches_in_round, byes_in_round
    INTO current_round_matches, current_round_byes
    FROM calculate_optimal_bracket_structure(participant_count)
    WHERE round_number = current_round;
    
    -- Check if there's a bye in current round
    IF current_round_byes > 0 THEN
        bye_match_in_current_round := TRUE;
    END IF;
    
    -- Calculate next round position
    next_round := current_round + 1;
    
    -- Get next round structure (if exists)
    SELECT matches_in_round, byes_in_round
    INTO next_round_matches, next_round_byes
    FROM calculate_optimal_bracket_structure(participant_count)
    WHERE round_number = next_round;
    
    -- If no next round, this was the final
    IF next_round_matches IS NULL THEN
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
    
    -- Fair advancement logic: implement "bye winner faces opponent" principle
    IF bye_match_in_current_round THEN
        -- There's a bye in this round - use fair advancement pattern
        IF current_match = 1 THEN
            -- First match winner goes to face the bye winner
            next_match := 1;
            
            SELECT id INTO next_bracket_id
            FROM tournament_brackets
            WHERE tournament_id = current_tournament_id
            AND round_number = next_round
            AND match_number = next_match;
            
            UPDATE tournament_brackets
            SET participant1_id = winner_participant_id
            WHERE id = next_bracket_id;
            
        ELSIF current_match = 2 AND next_round_byes > 0 AND current_round = 1 THEN
            -- Second match winner gets bye in next round if there are byes available AND it's Round 1
            next_match := next_round_matches + 1; -- First bye slot
            
            SELECT id INTO next_bracket_id
            FROM tournament_brackets
            WHERE tournament_id = current_tournament_id
            AND round_number = next_round
            AND match_number = next_match;
            
            -- Create bye advancement (but don't recursively advance - let auto_advance_byes handle it)
            UPDATE tournament_brackets
            SET participant1_id = winner_participant_id,
                bye_match = TRUE,
                winner_id = winner_participant_id,
                match_status = 'completed'
            WHERE id = next_bracket_id;
            
        ELSE
            -- Remaining matches use standard power-of-2 pairing
            next_match := CEIL(current_match / 2.0);
            
            SELECT id INTO next_bracket_id
            FROM tournament_brackets
            WHERE tournament_id = current_tournament_id
            AND round_number = next_round
            AND match_number = next_match;
            
            IF current_match % 2 = 1 THEN
                UPDATE tournament_brackets
                SET participant1_id = winner_participant_id
                WHERE id = next_bracket_id;
            ELSE
                UPDATE tournament_brackets
                SET participant2_id = winner_participant_id
                WHERE id = next_bracket_id;
            END IF;
        END IF;
    ELSE
        -- No byes in current round - standard power-of-2 advancement
        next_match := CEIL(current_match / 2.0);
        
        SELECT id INTO next_bracket_id
        FROM tournament_brackets
        WHERE tournament_id = current_tournament_id
        AND round_number = next_round
        AND match_number = next_match;
        
        IF current_match % 2 = 1 THEN
            UPDATE tournament_brackets
            SET participant1_id = winner_participant_id
            WHERE id = next_bracket_id;
        ELSE
            UPDATE tournament_brackets
            SET participant2_id = winner_participant_id
            WHERE id = next_bracket_id;
        END IF;
    END IF;
    
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Universal auto_advance_byes function for all tournament sizes
CREATE OR REPLACE FUNCTION auto_advance_byes(tournament_uuid uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  b RECORD;
  participant_count INTEGER;
  round_matches INTEGER;
  round_byes INTEGER;
  next_round INTEGER;
  next_match INTEGER;
  next_round_match_count INTEGER;
  next_round_byes INTEGER;
BEGIN
  -- Get participant count
  SELECT COUNT(*) INTO participant_count
  FROM tournament_participants
  WHERE tournament_id = tournament_uuid AND status = 'registered';
  
  -- Process all bye matches that need advancement
  FOR b IN
    SELECT id, winner_id, round_number, match_number
    FROM tournament_brackets
    WHERE tournament_id = tournament_uuid
      AND bye_match = TRUE
      AND winner_id IS NOT NULL
    ORDER BY round_number, match_number
  LOOP
    -- Get structure for this round
    SELECT matches_in_round, byes_in_round
    INTO round_matches, round_byes
    FROM calculate_optimal_bracket_structure(participant_count)
    WHERE round_number = b.round_number;
    
    -- Only advance if there are actual matches in this round (meaning bye should face someone)
    IF round_matches > 0 THEN
      next_round := b.round_number + 1;
      
      -- Check if bye winner is already placed in next round
      IF NOT EXISTS (
        SELECT 1 FROM tournament_brackets 
        WHERE tournament_id = tournament_uuid 
        AND round_number = next_round 
        AND participant2_id = b.winner_id
      ) THEN
        IF b.round_number = 1 THEN
          -- Round 1 byes: use original logic (Match 1 of next round)
          next_match := 1; -- Bye winner always goes to first match of next round to face match winner
          
          -- Only place if participant2 slot is available
          IF EXISTS (
            SELECT 1 FROM tournament_brackets 
            WHERE tournament_id = tournament_uuid 
            AND round_number = next_round 
            AND match_number = next_match 
            AND participant2_id IS NULL
          ) THEN
            UPDATE tournament_brackets
            SET participant2_id = b.winner_id
            WHERE tournament_id = tournament_uuid
              AND round_number = next_round
              AND match_number = next_match
              AND participant2_id IS NULL;
          END IF;
        ELSE
          -- Round 2+ byes: check if next round has byes (meaning fair advancement applies)
          SELECT byes_in_round INTO next_round_byes
          FROM calculate_optimal_bracket_structure(participant_count)
          WHERE round_number = next_round;
          
          IF next_round_byes > 0 THEN
            -- Next round has byes, so use fair advancement: bye winner goes to Match 1
            next_match := 1;
          ELSE
            -- Next round has no byes, place in last match for consistency
            SELECT matches_in_round INTO next_round_match_count
            FROM calculate_optimal_bracket_structure(participant_count)
            WHERE round_number = next_round;
            
            next_match := next_round_match_count;
          END IF;
          
          -- Only place if the slot is available
          IF EXISTS (
            SELECT 1 FROM tournament_brackets 
            WHERE tournament_id = tournament_uuid 
            AND round_number = next_round 
            AND match_number = next_match
            AND participant2_id IS NULL
          ) THEN
            UPDATE tournament_brackets
            SET participant2_id = b.winner_id
            WHERE tournament_id = tournament_uuid
              AND round_number = next_round
              AND match_number = next_match
              AND participant2_id IS NULL;
          END IF;
        END IF;
      END IF;
    END IF;
    
    -- Mark the bye as completed
    UPDATE tournament_brackets
    SET match_status = 'completed',
        completed_at = CURRENT_TIMESTAMP
    WHERE id = b.id;
  END LOOP;
END;
$$;