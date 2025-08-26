-- Test the new fair bracket system with 5 participants
-- This simulates what the bracket structure should look like

-- Expected structure for 5 people:
-- Round 1: 2 matches (4 people play)
--   Match 1: Person A vs Person B  
--   Match 2: Person C vs Person D
-- Round 2 (Semi-Final): 1 match + 1 bye participant
--   Match 1: Winner(A vs B) vs Winner(C vs D)  
--   Person E is placed here with bye status
-- Round 3 (Final): 1 match
--   Match 1: Winner of Semi-Final vs Person E

-- Verification queries to run after applying the fix:

-- 1. Check Round 1 structure (should have 2 matches, 4 participants total)
SELECT 
    'Round 1 Check' as test,
    COUNT(*) as total_matches,
    COUNT(*) FILTER (WHERE participant1_id IS NOT NULL) + 
    COUNT(*) FILTER (WHERE participant2_id IS NOT NULL) as total_participants_in_round1
FROM tournament_brackets 
WHERE round_number = 1;

-- 2. Check Round 2 structure (should have bye participant placed here)
SELECT 
    'Round 2 Check' as test,
    COUNT(*) as total_brackets,
    COUNT(*) FILTER (WHERE bye_match = TRUE) as bye_matches,
    COUNT(*) FILTER (WHERE bye_match = FALSE) as regular_matches
FROM tournament_brackets 
WHERE round_number = 2;

-- 3. Check total structure
SELECT 
    round_number,
    match_number,
    CASE 
        WHEN participant1_id IS NOT NULL THEN 'Participant 1'
        ELSE 'TBD'
    END as p1,
    CASE 
        WHEN participant2_id IS NOT NULL THEN 'Participant 2'  
        ELSE 'TBD'
    END as p2,
    bye_match,
    match_status
FROM tournament_brackets 
ORDER BY round_number, match_number;

-- Expected results:
-- Round 1: 2 rows, bye_match = FALSE
-- Round 2: 1-2 rows, at least 1 with bye_match = TRUE  
-- Round 3: 1 row, bye_match = FALSE

-- This ensures Person E (bye recipient) only advances once automatically,
-- then has to play the winner of the first semi-final match