-- Test to manually trigger bye advancement
-- Run this in Supabase SQL Editor to advance Round 4 bye to Round 5

SELECT auto_advance_byes(
    (SELECT id FROM tournaments ORDER BY created_at DESC LIMIT 1)
);

-- Check what happened after running the function
SELECT 
    round_number,
    match_number,
    participant1_id,
    participant2_id,
    bye_match,
    match_status
FROM tournament_brackets 
WHERE tournament_id = (SELECT id FROM tournaments ORDER BY created_at DESC LIMIT 1)
AND round_number IN (4, 5)
ORDER BY round_number, match_number;