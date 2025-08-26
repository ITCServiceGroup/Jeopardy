-- Check if tournament has universal structure and create it if missing
-- Run this in Supabase SQL Editor

-- First, check current tournament status
SELECT 
  t.id as tournament_id,
  t.name,
  t.status,
  COUNT(tp.id) as participant_count,
  CASE WHEN ts.id IS NOT NULL THEN 'HAS STRUCTURE' ELSE 'MISSING STRUCTURE' END as structure_status
FROM tournaments t
LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id AND tp.status = 'registered'
LEFT JOIN tournament_structures ts ON t.id = ts.tournament_id
WHERE t.status = 'active'
GROUP BY t.id, t.name, t.status, ts.id
ORDER BY t.created_at DESC
LIMIT 1;

-- Now create the structure for your tournament
-- Change the participant count if different from 19
DO $$
DECLARE
    tournament_id_var UUID;
    participant_count_var INTEGER;
    structure_json JSONB;
BEGIN
    -- Get the active tournament
    SELECT t.id, COUNT(tp.id)::INTEGER
    INTO tournament_id_var, participant_count_var
    FROM tournaments t
    LEFT JOIN tournament_participants tp ON t.id = tp.tournament_id AND tp.status = 'registered'  
    WHERE t.status = 'active'
    GROUP BY t.id
    ORDER BY t.created_at DESC
    LIMIT 1;
    
    RAISE NOTICE 'Found tournament % with % participants', tournament_id_var, participant_count_var;
    
    -- Create structure based on actual participant count
    IF participant_count_var = 19 THEN
        structure_json := '{
            "participantCount": 19,
            "totalRounds": 5,
            "rounds": [
                {"round": 1, "matches": 9, "byes": 1, "participantsEntering": 19, "participantsAdvancing": 10},
                {"round": 2, "matches": 5, "byes": 0, "participantsEntering": 10, "participantsAdvancing": 5},
                {"round": 3, "matches": 2, "byes": 1, "participantsEntering": 5, "participantsAdvancing": 3},
                {"round": 4, "matches": 1, "byes": 1, "participantsEntering": 3, "participantsAdvancing": 2},
                {"round": 5, "matches": 1, "byes": 0, "participantsEntering": 2, "participantsAdvancing": 1}
            ],
            "advancementMap": {
                "1-1": {"toRound": 2, "toMatch": 1, "toPosition": 1},
                "1-2": {"toRound": 2, "toMatch": 1, "toPosition": 2},
                "1-3": {"toRound": 2, "toMatch": 2, "toPosition": 1},
                "1-4": {"toRound": 2, "toMatch": 2, "toPosition": 2},
                "1-5": {"toRound": 2, "toMatch": 3, "toPosition": 1},
                "1-6": {"toRound": 2, "toMatch": 3, "toPosition": 2},
                "1-7": {"toRound": 2, "toMatch": 4, "toPosition": 1},
                "1-8": {"toRound": 2, "toMatch": 4, "toPosition": 2},
                "1-9": {"toRound": 2, "toMatch": 5, "toPosition": 1},
                "2-1": {"toRound": 3, "toMatch": 1, "toPosition": 1},
                "2-2": {"toRound": 3, "toMatch": 1, "toPosition": 2},
                "2-3": {"toRound": 3, "toMatch": 2, "toPosition": 1},
                "2-4": {"toRound": 3, "toMatch": 2, "toPosition": 2},
                "2-5": {"toRound": 3, "toMatch": 3, "toPosition": 1},
                "3-1": {"toRound": 4, "toMatch": 1, "toPosition": 1},
                "3-2": {"toRound": 4, "toMatch": 1, "toPosition": 2},
                "4-1": {"toRound": 5, "toMatch": 1, "toPosition": 1}
            },
            "byePlacements": {
                "1-bye": {"toRound": 2, "toMatch": 5, "toPosition": 2},
                "3-bye": {"toRound": 4, "toMatch": 1, "toPosition": 2},
                "4-bye": {"toRound": 5, "toMatch": 1, "toPosition": 2}
            }
        }';
    ELSE
        -- For other participant counts, create a basic structure
        -- You'd need to generate this properly with the JavaScript function
        RAISE EXCEPTION 'Please use the JavaScript structure generator for % participants', participant_count_var;
    END IF;
    
    -- Store the structure
    PERFORM store_tournament_structure(tournament_id_var, structure_json);
    
    RAISE NOTICE 'Tournament structure created successfully!';
    
    -- Verify it was stored
    IF EXISTS (SELECT 1 FROM tournament_structures WHERE tournament_id = tournament_id_var) THEN
        RAISE NOTICE '✅ Structure verification: SUCCESS';
    ELSE
        RAISE NOTICE '❌ Structure verification: FAILED';
    END IF;
    
END $$;