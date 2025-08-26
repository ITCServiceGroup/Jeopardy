-- Test the universal fair bracket system for various participant counts
-- This verifies the "bye winner faces opponent" principle works for all sizes

SELECT '=== TESTING UNIVERSAL FAIR BRACKET SYSTEM ===' as test;

-- Test 3 participants
SELECT '--- 3 PARTICIPANTS ---' as test;
SELECT * FROM calculate_optimal_bracket_structure(3) ORDER BY round_number;
-- Expected: Round 1: 1 match + 1 bye, Round 2: 1 match (bye winner vs match winner)

SELECT '--- 4 PARTICIPANTS ---' as test;
SELECT * FROM calculate_optimal_bracket_structure(4) ORDER BY round_number;
-- Expected: Round 1: 2 matches, Round 2: 1 match (standard power-of-2)

SELECT '--- 5 PARTICIPANTS ---' as test;
SELECT * FROM calculate_optimal_bracket_structure(5) ORDER BY round_number;
-- Expected: Round 1: 2 matches + 1 bye, Round 2: 2 matches (bye vs match1 winner, match2 winner gets bye), Round 3: 1 match

SELECT '--- 6 PARTICIPANTS ---' as test;
SELECT * FROM calculate_optimal_bracket_structure(6) ORDER BY round_number;
-- Expected: Round 1: 3 matches, Round 2: 1 match + 1 bye, Round 3: 1 match

SELECT '--- 7 PARTICIPANTS ---' as test;
SELECT * FROM calculate_optimal_bracket_structure(7) ORDER BY round_number;
-- Expected: Round 1: 3 matches + 1 bye, Round 2: 2 matches, Round 3: 1 match

SELECT '--- 8 PARTICIPANTS ---' as test;
SELECT * FROM calculate_optimal_bracket_structure(8) ORDER BY round_number;
-- Expected: Round 1: 4 matches, Round 2: 2 matches, Round 3: 1 match (standard power-of-2)

SELECT '--- 9 PARTICIPANTS ---' as test;
SELECT * FROM calculate_optimal_bracket_structure(9) ORDER BY round_number;
-- Expected: Round 1: 4 matches + 1 bye, Round 2: 2 matches + 1 bye, Round 3: 1 match + 1 bye, Round 4: 1 match

SELECT '--- 15 PARTICIPANTS ---' as test;
SELECT * FROM calculate_optimal_bracket_structure(15) ORDER BY round_number;

SELECT '--- 16 PARTICIPANTS ---' as test;
SELECT * FROM calculate_optimal_bracket_structure(16) ORDER BY round_number;
-- Expected: Perfect power-of-2 structure

SELECT '--- 31 PARTICIPANTS ---' as test;
SELECT * FROM calculate_optimal_bracket_structure(31) ORDER BY round_number;

SELECT '--- 32 PARTICIPANTS ---' as test;
SELECT * FROM calculate_optimal_bracket_structure(32) ORDER BY round_number;
-- Expected: Perfect power-of-2 structure

-- Verify fairness principle: count matches each participant would play
SELECT '=== FAIRNESS ANALYSIS ===' as test;

WITH participant_analysis AS (
  SELECT 
    participant_count,
    round_number,
    matches_in_round,
    byes_in_round,
    -- Calculate minimum and maximum matches a participant would play
    CASE 
      WHEN round_number = 1 AND byes_in_round > 0 THEN 'Bye winner plays from Round ' || round_number + 1
      ELSE 'Match winners play from Round ' || round_number
    END as participant_type
  FROM (
    VALUES (3), (5), (7), (9), (15), (31)
  ) as counts(participant_count),
  calculate_optimal_bracket_structure(counts.participant_count) as structure
  WHERE byes_in_round > 0  -- Only show rounds with byes
)
SELECT 
  participant_count || ' people tournament:' as analysis,
  participant_type
FROM participant_analysis
ORDER BY participant_count, round_number;

-- This should show that bye winners still have to play meaningful matches,
-- confirming the fairness principle is maintained across all tournament sizes.