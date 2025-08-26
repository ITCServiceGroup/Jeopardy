-- Quick migration script to add tournament structure to your existing tournament
-- Run this in your Supabase SQL Editor

-- First, let's check if tournament structure exists
SELECT 
  t.name as tournament_name,
  t.id as tournament_id,
  COUNT(tp.id) as participant_count,
  ts.id as structure_exists
FROM tournaments t
LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id AND tp.status = 'registered'
LEFT JOIN tournament_structures ts ON t.id = ts.tournament_id
WHERE t.status IN ('active', 'setup')
GROUP BY t.id, t.name, ts.id
ORDER BY t.created_at DESC
LIMIT 1;

-- If structure_exists is NULL, then we need to create it
-- Replace 'YOUR_TOURNAMENT_ID' with your actual tournament ID from the query above

DO $$
DECLARE
    tournament_id_var UUID;
    participant_count_var INTEGER;
    structure_json JSONB;
BEGIN
    -- Get the most recent active tournament
    SELECT t.id, COUNT(tp.id)
    INTO tournament_id_var, participant_count_var
    FROM tournaments t
    LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id AND tp.status = 'registered'
    WHERE t.status IN ('active', 'setup')
    GROUP BY t.id
    ORDER BY t.created_at DESC
    LIMIT 1;
    
    -- Check if structure already exists
    IF NOT EXISTS (SELECT 1 FROM tournament_structures WHERE tournament_id = tournament_id_var) THEN
        -- Create the structure JSON (this is a simplified version for 19 participants)
        -- You should run the JavaScript structure generator for the exact structure
        structure_json := '{
            "participantCount": ' || participant_count_var || ',
            "totalRounds": 5,
            "rounds": [
                {"round": 1, "matches": 9, "byes": 1, "participantsEntering": 19, "participantsAdvancing": 10},
                {"round": 2, "matches": 5, "byes": 0, "participantsEntering": 10, "participantsAdvancing": 5},
                {"round": 3, "matches": 2, "byes": 1, "participantsEntering": 5, "participantsAdvancing": 3},
                {"round": 4, "matches": 1, "byes": 1, "participantsEntering": 3, "participantsAdvancing": 2},
                {"round": 5, "matches": 1, "byes": 0, "participantsEntering": 2, "participantsAdvancing": 1}
            ],
            "advancementMap": {
                "1-1": {"toRound": 2, "toMatch": 1, "toPosition": 1, "fromRound": 1, "fromMatch": 1},
                "1-2": {"toRound": 2, "toMatch": 1, "toPosition": 2, "fromRound": 1, "fromMatch": 2},
                "1-3": {"toRound": 2, "toMatch": 2, "toPosition": 1, "fromRound": 1, "fromMatch": 3},
                "1-4": {"toRound": 2, "toMatch": 2, "toPosition": 2, "fromRound": 1, "fromMatch": 4},
                "1-5": {"toRound": 2, "toMatch": 3, "toPosition": 1, "fromRound": 1, "fromMatch": 5},
                "1-6": {"toRound": 2, "toMatch": 3, "toPosition": 2, "fromRound": 1, "fromMatch": 6},
                "1-7": {"toRound": 2, "toMatch": 4, "toPosition": 1, "fromRound": 1, "fromMatch": 7},
                "1-8": {"toRound": 2, "toMatch": 4, "toPosition": 2, "fromRound": 1, "fromMatch": 8},
                "1-9": {"toRound": 2, "toMatch": 5, "toPosition": 1, "fromRound": 1, "fromMatch": 9},
                "2-1": {"toRound": 3, "toMatch": 1, "toPosition": 1, "fromRound": 2, "fromMatch": 1},
                "2-2": {"toRound": 3, "toMatch": 1, "toPosition": 2, "fromRound": 2, "fromMatch": 2},
                "2-3": {"toRound": 3, "toMatch": 2, "toPosition": 1, "fromRound": 2, "fromMatch": 3},
                "2-4": {"toRound": 3, "toMatch": 2, "toPosition": 2, "fromRound": 2, "fromMatch": 4},
                "2-5": {"toRound": 3, "toMatch": 3, "toPosition": 1, "fromRound": 2, "fromMatch": 5},
                "3-1": {"toRound": 4, "toMatch": 1, "toPosition": 1, "fromRound": 3, "fromMatch": 1},
                "3-2": {"toRound": 4, "toMatch": 1, "toPosition": 2, "fromRound": 3, "fromMatch": 2},
                "4-1": {"toRound": 5, "toMatch": 1, "toPosition": 1, "fromRound": 4, "fromMatch": 1}
            },
            "byePlacements": {
                "1-bye": {"toRound": 2, "toMatch": 5, "toPosition": 2},
                "3-bye": {"toRound": 4, "toMatch": 1, "toPosition": 2},
                "4-bye": {"toRound": 5, "toMatch": 1, "toPosition": 2}
            }
        }';
        
        -- Store the structure
        PERFORM store_tournament_structure(tournament_id_var, structure_json);
        
        RAISE NOTICE 'Tournament structure created for tournament % with % participants', tournament_id_var, participant_count_var;
    ELSE
        RAISE NOTICE 'Tournament structure already exists for tournament %', tournament_id_var;
    END IF;
END $$;