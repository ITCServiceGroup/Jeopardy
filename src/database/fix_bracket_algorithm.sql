-- Improved tournament bracket generation algorithm
-- This fixes the issue where 10 participants created 8 matches instead of 5
-- For 10 participants: Round 1 = 5 matches, no unnecessary byes
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION generate_tournament_brackets(tournament_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    participant_count INTEGER;
    calculated_total_rounds INTEGER;
    current_round INTEGER := 1;
    current_match INTEGER := 1;
    participants_cursor CURSOR FOR 
        SELECT id, participant_name 
        FROM tournament_participants 
        WHERE tournament_id = tournament_uuid 
        AND status = 'registered'
        ORDER BY gen_random_uuid();
    participant_record RECORD;
    participant_ids UUID[];
    i INTEGER;
BEGIN
    -- Get participant count
    SELECT COUNT(*) INTO participant_count
    FROM tournament_participants
    WHERE tournament_id = tournament_uuid AND status = 'registered';
    
    IF participant_count < 2 THEN
        RAISE EXCEPTION 'Need at least 2 participants to generate brackets';
    END IF;
    
    -- Calculate total rounds needed
    calculated_total_rounds := CEIL(LOG(2, participant_count));
    
    -- Update tournament with total rounds
    UPDATE tournaments 
    SET total_rounds = calculated_total_rounds
    WHERE id = tournament_uuid;
    
    -- Clear any existing brackets
    DELETE FROM tournament_brackets WHERE tournament_id = tournament_uuid;
    
    -- Collect participant IDs
    participant_ids := ARRAY[]::UUID[];
    FOR participant_record IN participants_cursor LOOP
        participant_ids := array_append(participant_ids, participant_record.id);
    END LOOP;
    
    -- Generate first round with only the matches we actually need
    current_match := 1;
    i := 1;
    
    -- Create matches for pairs of participants
    WHILE i < array_length(participant_ids, 1) LOOP
        INSERT INTO tournament_brackets (
            tournament_id, round_number, match_number,
            participant1_id, participant2_id, match_status, bye_match
        ) VALUES (
            tournament_uuid, current_round, current_match,
            participant_ids[i], participant_ids[i+1], 'pending', FALSE
        );
        i := i + 2;
        current_match := current_match + 1;
    END LOOP;
    
    -- Handle odd participant (gets a bye to next round)
    IF i = array_length(participant_ids, 1) THEN
        INSERT INTO tournament_brackets (
            tournament_id, round_number, match_number,
            participant1_id, match_status, bye_match, winner_id
        ) VALUES (
            tournament_uuid, current_round, current_match,
            participant_ids[i], 'bye', TRUE, participant_ids[i]
        );
    END IF;
    
    -- Generate placeholder brackets for subsequent rounds
    FOR round_num IN 2..calculated_total_rounds LOOP
        current_match := 1;
        -- Calculate how many matches needed in this round
        DECLARE
            prev_round_winners INTEGER;
            matches_this_round INTEGER;
        BEGIN
            -- Count winners from previous round
            SELECT COUNT(*) INTO prev_round_winners
            FROM tournament_brackets 
            WHERE tournament_id = tournament_uuid 
            AND round_number = round_num - 1;
            
            -- Each match takes 2 winners, plus handle odd numbers
            matches_this_round := CEIL(prev_round_winners::DECIMAL / 2);
            
            FOR match_num IN 1..matches_this_round LOOP
                INSERT INTO tournament_brackets (
                    tournament_id, round_number, match_number,
                    match_status
                ) VALUES (
                    tournament_uuid, round_num, current_match, 'pending'
                );
                current_match := current_match + 1;
            END LOOP;
        END;
    END LOOP;
    
    RETURN calculated_total_rounds;
END;
$$ LANGUAGE plpgsql;