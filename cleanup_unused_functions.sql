-- SQL script to remove unused database functions
-- Run this against your Supabase database to clean up legacy/unused functions

-- Drop unused tournament functions
DROP FUNCTION IF EXISTS public.advance_tournament_winner(uuid, uuid);
DROP FUNCTION IF EXISTS public.auto_advance_byes(uuid);
DROP FUNCTION IF EXISTS public.calculate_optimal_bracket_structure(integer);
DROP FUNCTION IF EXISTS public.generate_tournament_brackets(uuid);

-- Verify the functions have been removed
-- (This will show only the remaining functions after cleanup)
SELECT 
    routine_name as function_name,
    routine_type as type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_type = 'FUNCTION'
    AND routine_name IN (
        'advance_tournament_winner',
        'auto_advance_byes', 
        'calculate_optimal_bracket_structure',
        'generate_tournament_brackets'
    )
ORDER BY routine_name;

-- If the query above returns no rows, all unused functions were successfully deleted