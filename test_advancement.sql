-- Test script to debug Round 2 Match 2 advancement issue
-- Run this in your Supabase SQL Editor to see what's happening

-- First, let's see the bracket structure for your tournament
SELECT * FROM calculate_optimal_bracket_structure(
    (SELECT COUNT(*)::INTEGER FROM tournament_participants 
     WHERE status = 'registered' 
     AND tournament_id = (SELECT id FROM tournaments ORDER BY created_at DESC LIMIT 1))
);

-- Check Round 2 structure specifically
SELECT 
    round_number,
    matches_in_round,
    byes_in_round
FROM calculate_optimal_bracket_structure(
    (SELECT COUNT(*)::INTEGER FROM tournament_participants 
     WHERE status = 'registered' 
     AND tournament_id = (SELECT id FROM tournaments ORDER BY created_at DESC LIMIT 1))
)
WHERE round_number = 2;

-- Check what brackets exist for Round 3
SELECT 
    round_number,
    match_number,
    id,
    participant1_id,
    participant2_id,
    bye_match
FROM tournament_brackets 
WHERE tournament_id = (SELECT id FROM tournaments ORDER BY created_at DESC LIMIT 1)
AND round_number = 3
ORDER BY match_number;

-- Check Round 2 Match 2 details
SELECT 
    id,
    tournament_id,
    round_number,
    match_number,
    participant1_id,
    participant2_id,
    winner_id,
    match_status
FROM tournament_brackets 
WHERE tournament_id = (SELECT id FROM tournaments ORDER BY created_at DESC LIMIT 1)
AND round_number = 2
AND match_number = 2;

-- Check for any bye matches that might interfere
SELECT 
    round_number,
    match_number,
    participant1_id,
    winner_id,
    bye_match,
    match_status
FROM tournament_brackets 
WHERE tournament_id = (SELECT id FROM tournaments ORDER BY created_at DESC LIMIT 1)
AND bye_match = TRUE
ORDER BY round_number, match_number;