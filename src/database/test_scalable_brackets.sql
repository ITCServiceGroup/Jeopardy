-- Test the scalable bracket generation for various participant counts
-- Run these queries to verify the bracket structures are fair and balanced

-- Test the helper function for different participant counts
SELECT 'Testing bracket structures for different participant counts' as test;

-- Test 3 participants
SELECT '=== 3 PARTICIPANTS ===' as test;
SELECT * FROM calculate_optimal_bracket_structure(3) ORDER BY round_number;

-- Test 5 participants (our main problem case)
SELECT '=== 5 PARTICIPANTS ===' as test;
SELECT * FROM calculate_optimal_bracket_structure(5) ORDER BY round_number;

-- Expected for 5: 
-- Round 1: 2 matches, 1 bye (5 participants entering)
-- Round 2: 1 match, 1 bye (3 participants entering) 
-- Round 3: 1 match, 0 byes (2 participants entering)

-- Test 6 participants
SELECT '=== 6 PARTICIPANTS ===' as test;
SELECT * FROM calculate_optimal_bracket_structure(6) ORDER BY round_number;

-- Test 7 participants
SELECT '=== 7 PARTICIPANTS ===' as test;
SELECT * FROM calculate_optimal_bracket_structure(7) ORDER BY round_number;

-- Test 8 participants (perfect power of 2)
SELECT '=== 8 PARTICIPANTS ===' as test;
SELECT * FROM calculate_optimal_bracket_structure(8) ORDER BY round_number;

-- Test 9 participants
SELECT '=== 9 PARTICIPANTS ===' as test;
SELECT * FROM calculate_optimal_bracket_structure(9) ORDER BY round_number;

-- Test 15 participants
SELECT '=== 15 PARTICIPANTS ===' as test;
SELECT * FROM calculate_optimal_bracket_structure(15) ORDER BY round_number;

-- Test 16 participants (perfect power of 2)
SELECT '=== 16 PARTICIPANTS ===' as test;
SELECT * FROM calculate_optimal_bracket_structure(16) ORDER BY round_number;

-- Test 31 participants
SELECT '=== 31 PARTICIPANTS ===' as test;
SELECT * FROM calculate_optimal_bracket_structure(31) ORDER BY round_number;

-- Test 32 participants (perfect power of 2)
SELECT '=== 32 PARTICIPANTS ===' as test;
SELECT * FROM calculate_optimal_bracket_structure(32) ORDER BY round_number;

-- Verification: Calculate match counts and fairness for 5-person tournament
SELECT '=== FAIRNESS CHECK FOR 5 PARTICIPANTS ===' as test;

WITH bracket_analysis AS (
  SELECT 
    round_number,
    matches_in_round,
    byes_in_round,
    participants_entering,
    -- Calculate who advances from each round
    CASE 
      WHEN round_number = 1 THEN matches_in_round + byes_in_round
      ELSE matches_in_round + byes_in_round 
    END as participants_advancing
  FROM calculate_optimal_bracket_structure(5)
)
SELECT 
  round_number,
  matches_in_round || ' matches' as matches,
  byes_in_round || ' byes' as byes,
  participants_entering || ' entering' as entering,
  participants_advancing || ' advancing' as advancing
FROM bracket_analysis
ORDER BY round_number;

-- This should show:
-- Round 1: 2 matches, 1 bye, 5 entering, 3 advancing
-- Round 2: 1 match, 1 bye, 3 entering, 2 advancing  
-- Round 3: 1 match, 0 byes, 2 entering, 1 advancing (winner)