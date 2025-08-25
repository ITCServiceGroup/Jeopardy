import { createClient } from '@supabase/supabase-js';

// Detection for GitHub Pages deployment
const isGitHubPages = window.location.hostname.includes('github.io');
console.log('Is GitHub Pages deployment:', isGitHubPages);

// Default Supabase credentials - IMPORTANT: these are already public in your .env file
// Using them as a last resort fallback to ensure the app always works in production
const DEFAULT_SUPABASE_URL = 'https://dwbuyhxjaqlydlhaulca.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR3YnV5aHhqYXFseWRsaGF1bGNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MzYxODQsImV4cCI6MjA1NjAxMjE4NH0.l64i74owmFelvdbn0Gqk0k6pYtQ9NqQIQGsWaDu1eCE';

// Get runtime configuration with multiple fallbacks
// 1. Try window.JEOPARDY_CONFIG from config.js
// 2. Try environment variables from Vite
// 3. Use hardcoded defaults as last resort
const supabaseUrl = window.JEOPARDY_CONFIG?.supabaseUrl ||
                   import.meta.env.VITE_SUPABASE_URL ||
                   DEFAULT_SUPABASE_URL;

const supabaseAnonKey = window.JEOPARDY_CONFIG?.supabaseAnonKey ||
                        import.meta.env.VITE_SUPABASE_ANON_KEY ||
                        DEFAULT_SUPABASE_ANON_KEY;

// Create a singleton Supabase client and use an app-specific storage key to avoid GoTrue collisions
const globalScope = typeof window !== 'undefined' ? window : globalThis;
const SUPABASE_STORAGE_KEY = 'jeopardy_app_auth';

if (!globalScope.__SUPABASE_LOGGED__) {
  console.log('Supabase configuration source:',
    window.JEOPARDY_CONFIG ? 'Runtime config' :
    (import.meta.env.VITE_SUPABASE_URL ? 'Environment variables' : 'Default fallback'));
  console.log('Supabase URL being used:', supabaseUrl ? '[URL available]' : '[URL missing]');
  console.log('Supabase Key being used:', supabaseAnonKey ? '[KEY available]' : '[KEY missing]');
  globalScope.__SUPABASE_LOGGED__ = true;
}

if (!globalScope.__SUPABASE_CLIENT__) {
  globalScope.__SUPABASE_CLIENT__ = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storageKey: SUPABASE_STORAGE_KEY,
      autoRefreshToken: true,
      persistSession: true,
      // Avoid multiple clients trying to parse URL on HMR/refresh
      detectSessionInUrl: false,
    },
  });
}

export const supabase = globalScope.__SUPABASE_CLIENT__;

// Category Management
export const getCategories = async () => {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
};

export const addCategory = async (name) => {
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name }])
    .select();

  if (error) throw error;
  return data[0];
};

export const updateCategory = async (id, name) => {
  const { data, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
};

export const deleteCategory = async (id) => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

// Question Management
export const getQuestions = async () => {
  const { data, error } = await supabase
    .from('questions')
    .select(`
      *,
      category:categories(name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const addQuestion = async (questionData) => {
  const { data, error } = await supabase
    .from('questions')
    .insert([questionData])
    .select(`
      *,
      category:categories(name)
    `);

  if (error) throw error;
  return data[0];
};

export const updateQuestion = async (id, questionData) => {
  const { data, error } = await supabase
    .from('questions')
    .update(questionData)
    .eq('id', id)
    .select(`
      *,
      category:categories(name)
    `);

  if (error) throw error;
  return data[0];
};

export const deleteQuestion = async (id) => {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};

// Game Functions
export const createGameSession = async (player1Name, player2Name, techTypeId) => {
  const { data, error } = await supabase
    .from('game_sessions')
    .insert([{
      player1_name: player1Name,
      player2_name: player2Name,
      tech_type_id: techTypeId,
      start_time: new Date().toISOString()
    }])
    .select();

  if (error) throw error;
  return data[0];
};

export const loadGameQuestions = async (techTypeId) => {
  console.log("Loading game questions for tech type ID:", techTypeId);

  try {
    // Get categories filtered by tech type using the join table
    let { data: categoriesData, error: categoryError } = await supabase
      .from('category_tech_types')
      .select(`
        category_id,
        categories:category_id(
          id,
          name
        )
      `)
      .eq('tech_type_id', techTypeId);

    if (categoryError) throw categoryError;
    console.log("Category tech types loaded:", categoriesData);

    if (!categoriesData || categoriesData.length === 0) {
      console.error("No categories found for tech type ID:", techTypeId);
      return {};
    }

    // Extract the actual category objects from the nested structure
    const categories = categoriesData.map(item => item.categories).filter(Boolean);
    console.log("Categories extracted:", categories);

    if (categories.length === 0) {
      console.error("No valid categories found for tech type ID:", techTypeId);
      return {};
    }

    // Get questions for the filtered categories
    const categoryIds = categories.map(c => c.id);
    console.log("Fetching questions for category IDs:", categoryIds);

    const { data: questionsData, error: questionError } = await supabase
      .from('questions')
      .select(`
        *,
        category:categories(name)
      `)
      .in('category_id', categoryIds);

    if (questionError) throw questionError;
    console.log("Questions loaded:", questionsData);

    if (!questionsData || questionsData.length === 0) {
      console.error("No questions found for the categories");
      return {};
    }

    // Transform into the game format with random selection
    const validGameQuestions = {};
    categories.forEach(category => {
      const categoryQuestions = questionsData.filter(q => q.category_id === category.id);
      const selectedQuestions = {};
      let isValid = true;

      [200, 400, 600, 800, 1000].forEach(points => {
        const candidates = categoryQuestions.filter(q => q.points === points);
        if (candidates.length === 0) {
          isValid = false;
        } else {
          const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];
          selectedQuestions[points] = {
            id: randomCandidate.id,
            question: randomCandidate.question,
            correct_answers: randomCandidate.correct_answers || [randomCandidate.answer],
            options: randomCandidate.options || [randomCandidate.answer],
            question_type: randomCandidate.question_type || 'multiple_choice'
          };
        }
      });

      if (isValid) {
        validGameQuestions[category.name] = selectedQuestions;
      }
    });

    // Randomly select 6 categories if there are more than 6
    let finalGameQuestions = {};
    const categoryNames = Object.keys(validGameQuestions);
    if (categoryNames.length > 6) {
      // Shuffle the categoryNames array
      categoryNames.sort(() => Math.random() - 0.5);
      const selectedCategoryNames = categoryNames.slice(0, 6);
      selectedCategoryNames.forEach(name => {
        finalGameQuestions[name] = validGameQuestions[name];
      });
    } else {
      finalGameQuestions = validGameQuestions;
    }

    console.log("Transformed game questions:", finalGameQuestions);
    return finalGameQuestions;
  } catch (error) {
    console.error("Error in loadGameQuestions:", error);
    throw error;
  }
};

export const saveGameStatistics = async (
  player1Name,
  player2Name,
  techTypeId,   // Get this from the selected tech type
  questionId,   // Get this from the current question
  correct,
  currentPlayer
) => {
  try {
    console.log('Saving game statistics:', {
      player1Name,
      player2Name,
      techTypeId,
      questionId,
      correct,
      currentPlayer
    });

    const { data: sessionData, error: sessionError } = await supabase
      .from('game_sessions')
      .select('id')
      .eq('player1_name', player1Name)
      .eq('player2_name', player2Name)
      .eq('tech_type_id', techTypeId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (sessionError) throw sessionError;

    const gameSessionId = sessionData?.[0]?.id;
    if (!gameSessionId) {
      console.error('No active game session found');
      return false;
    }

    const { error } = await supabase
      .from('game_statistics')
      .insert([{
        player1_name: player1Name,
        player2_name: player2Name,
        game_session_id: gameSessionId,
        tech_type_id: techTypeId,
        question_id: questionId,
        current_player: currentPlayer,
        correct: correct,
        timestamp: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error saving game statistics:', error);
      return false;
    }

    console.log('Game statistics saved successfully');
    return true;
  } catch (error) {
    console.error('Error in saveGameStatistics:', error);
    return false;
  }
};

// Game Statistics
export const getGameStats = async (filter = 'all') => {
  let query = supabase
    .from('game_statistics')
    .select('*')
    .order('timestamp', { ascending: false });

  const now = new Date();
  if (filter === 'today') {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    query = query.gte('timestamp', today);
  } else if (filter === 'week') {
    const lastWeek = new Date(now.setDate(now.getDate() - 7)).toISOString();
    query = query.gte('timestamp', lastWeek);
  } else if (filter === 'month') {
    const lastMonth = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
    query = query.gte('timestamp', lastMonth);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
};

// Tournament Management Functions

// Available Names Management
export const getAvailableNames = async () => {
  const { data, error } = await supabase
    .from('tournament_available_names')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
};

export const addAvailableName = async (name) => {
  const { data, error } = await supabase
    .from('tournament_available_names')
    .insert([{ name, is_active: true }])
    .select();

  if (error) throw error;
  return data[0];
};

export const removeAvailableName = async (nameId) => {
  const { data, error } = await supabase
    .from('tournament_available_names')
    .update({ is_active: false })
    .eq('id', nameId)
    .select();

  if (error) throw error;
  return data[0];
};

// Tournament Management
export const getTournaments = async () => {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createTournament = async (tournamentData) => {
  const { data, error } = await supabase
    .from('tournaments')
    .insert([{
      name: tournamentData.name,
      description: tournamentData.description,
      status: 'setup',
      created_by: 'admin',
      current_round: 1
    }])
    .select();

  if (error) throw error;
  return data[0];
};

export const updateTournament = async (tournamentId, updates) => {
  const { data, error } = await supabase
    .from('tournaments')
    .update(updates)
    .eq('id', tournamentId)
    .select();

  if (error) throw error;
  return data[0];
};

export const deleteTournament = async (tournamentId) => {
  // To avoid FK conflicts (game_sessions.tournament_id -> tournaments.id),
  // we must remove related records/refs before deleting the tournament.
  // Order:
  // 1) Null out bracket.game_session_id for this tournament (break FK to game_sessions)
  // 2) Delete game_sessions for this tournament (game_statistics will cascade)
  // 3) Delete the tournament (participants and brackets will cascade via ON DELETE CASCADE)

  // 1) Clear bracket references to game sessions for this tournament
  const { error: bracketUpdateError } = await supabase
    .from('tournament_brackets')
    .update({ game_session_id: null })
    .eq('tournament_id', tournamentId);
  if (bracketUpdateError) throw bracketUpdateError;

  // 2) Delete game sessions that belong to this tournament
  const { error: sessionsDeleteError } = await supabase
    .from('game_sessions')
    .delete()
    .eq('tournament_id', tournamentId);
  if (sessionsDeleteError) throw sessionsDeleteError;

  // 3) Delete the tournament row itself (brackets/participants cascade)
  const { error: tournamentDeleteError } = await supabase
    .from('tournaments')
    .delete()
    .eq('id', tournamentId);
  if (tournamentDeleteError) throw tournamentDeleteError;

  return true;
};

export const startTournament = async (tournamentId) => {
  const { data, error } = await supabase
    .from('tournaments')
    .update({
      status: 'active',
      started_at: new Date().toISOString()
    })
    .eq('id', tournamentId)
    .select();

  if (error) throw error;
  return data[0];
};

export const openTournamentRegistration = async (tournamentId) => {
  const { data, error } = await supabase
    .from('tournaments')
    .update({ status: 'registration' })
    .eq('id', tournamentId)
    .select();

  if (error) throw error;
  return data[0];
};

// Tournament Participants
export const getTournamentParticipants = async (tournamentId) => {
  const { data, error } = await supabase
    .from('tournament_participants')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order('seed_number', { ascending: true, nullsLast: true });

  if (error) throw error;
  return data;
};

export const registerTournamentParticipant = async (tournamentId, participantName) => {
  // Check if tournament is accepting registrations
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('status')
    .eq('id', tournamentId)
    .single();

  if (tournamentError) throw tournamentError;

  if (tournament.status !== 'setup' && tournament.status !== 'registration') {
    throw new Error('Tournament is not accepting registrations');
  }

  // Check if participant already registered (avoid .single() to prevent 406 noise)
  const { data: existingRows, error: existingError } = await supabase
    .from('tournament_participants')
    .select('id')
    .eq('tournament_id', tournamentId)
    .eq('participant_name', participantName)
    .limit(1);

  if (existingError) {
    throw existingError;
  }

  if (existingRows && existingRows.length > 0) {
    throw new Error('Participant already registered for this tournament');
  }

  // Determine next seed number (append to end)
  const { data: maxSeedRows, error: maxSeedErr } = await supabase
    .from('tournament_participants')
    .select('seed_number')
    .eq('tournament_id', tournamentId)
    .order('seed_number', { ascending: false })
    .limit(1);
  if (maxSeedErr) throw maxSeedErr;
  const nextSeed = ((maxSeedRows && maxSeedRows.length > 0 ? (maxSeedRows[0].seed_number || 0) : 0) + 1);

  // Register participant (graceful under race: unique constraint)
  let insertRes;
  try {
    insertRes = await supabase
      .from('tournament_participants')
      .insert([{
        tournament_id: tournamentId,
        participant_name: participantName,
        status: 'registered',
        seed_number: nextSeed
      }])
      .select();
  } catch (e) {
    // Fallback on unique violation: return existing participant
    if (e?.code === '23505') {
      const { data: existing } = await supabase
        .from('tournament_participants')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('participant_name', participantName)
        .limit(1);
      return existing?.[0] || null;
    }
    throw e;
  }

  if (insertRes.error) throw insertRes.error;
  return insertRes.data[0];
};

// Bulk register participants for a tournament
export const registerTournamentParticipantsBulk = async (tournamentId, participantNames) => {
  if (!Array.isArray(participantNames) || participantNames.length === 0) {
    return [];
  }

  // Ensure tournament accepts registrations
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('status')
    .eq('id', tournamentId)
    .single();
  if (tournamentError) throw tournamentError;
  if (tournament.status !== 'setup' && tournament.status !== 'registration') {
    throw new Error('Tournament is not accepting registrations');
  }

  // Get existing participants to avoid duplicates and compute seed start
  const { data: existing, error: existingErr } = await supabase
    .from('tournament_participants')
    .select('participant_name, seed_number')
    .eq('tournament_id', tournamentId);
  if (existingErr) throw existingErr;
  const existingNames = new Set((existing || []).map(r => r.participant_name));
  const currentMaxSeed = (existing || [])
    .map(r => r.seed_number || 0)
    .reduce((a, b) => Math.max(a, b), 0);

  // Build rows, skipping duplicates
  let nextSeed = currentMaxSeed + 1;
  const rows = [];
  for (const name of participantNames) {
    if (existingNames.has(name)) continue;
    rows.push({
      tournament_id: tournamentId,
      participant_name: name,
      status: 'registered',
      seed_number: nextSeed++
    });
  }
  if (rows.length === 0) return [];

  const { data: inserted, error: insertErr } = await supabase
    .from('tournament_participants')
    .insert(rows)
    .select();
  if (insertErr) throw insertErr;
  return inserted;
};


export const removeParticipant = async (participantId, tournamentId) => {
  // If brackets exist for this tournament, remove them first to avoid FK conflicts
  const { count: bracketCount, error: bracketCountError } = await supabase
    .from('tournament_brackets')
    .select('id', { count: 'exact', head: true })
    .eq('tournament_id', tournamentId);
  if (bracketCountError) throw bracketCountError;

  if ((bracketCount || 0) > 0) {
    const { data: deletedBrackets, error: bracketDeleteError } = await supabase
      .from('tournament_brackets')
      .delete()
      .eq('tournament_id', tournamentId)
      .select('id');
    if (bracketDeleteError) throw bracketDeleteError;
    if (!deletedBrackets || deletedBrackets.length === 0) {
      throw new Error('Unable to update brackets due to permissions. Please adjust RLS policies.');
    }
  }

  // Now delete the participant and ensure a row was actually deleted
  const { data: deletedRows, error: participantDeleteError } = await supabase
    .from('tournament_participants')
    .delete()
    .eq('id', participantId)
    .eq('tournament_id', tournamentId)
    .select('*');

  if (participantDeleteError) throw participantDeleteError;
  if (!deletedRows || deletedRows.length === 0) {
    throw new Error('Participant not found or could not be deleted due to permissions');
  }
  return true;
};

// Tournament Brackets
export const getTournamentBrackets = async (tournamentId) => {
  const { data, error } = await supabase
    .from('tournament_brackets')
    .select('*')
    .eq('tournament_id', tournamentId)
    .order(['round_number', 'match_number'], { ascending: true });

  if (error) throw error;
  return data;
};

export const generateTournamentBrackets = async (tournamentId) => {
  console.log('=== SUPABASE FUNCTION CALL ===');
  console.log('Calling generate_tournament_brackets with tournament_uuid:', tournamentId);

  const { data, error } = await supabase
    .rpc('generate_tournament_brackets', { tournament_uuid: tournamentId });

  console.log('Database response - data:', data);
  console.log('Database response - error:', error);

  if (error) {
    console.error('Database function error details:');
    console.error('- message:', error.message);
    console.error('- code:', error.code);
    console.error('- details:', error.details);
    console.error('- hint:', error.hint);
    console.error('- Full error:', error);
    throw error;
  }

  return data;
};

export const updateTournamentMatch = async (bracketId, updates) => {
  const { data, error } = await supabase
    .from('tournament_brackets')
    .update(updates)
    .eq('id', bracketId)
    .select();

  if (error) throw error;
  return data[0];
};

export const advanceTournamentWinner = async (bracketId, winnerId) => {
  const { data, error } = await supabase
    .rpc('advance_tournament_winner', {
      bracket_uuid: bracketId,
      winner_participant_id: winnerId
    });

  if (error) throw error;
  return data;
};

// Tournament Game Management
export const createTournamentGameSession = async (tournamentId, bracketId, player1Name, player2Name) => {
  const { data: gameSession, error: gameError } = await supabase
    .from('game_sessions')
    .insert([{
      player1_name: player1Name,
      player2_name: player2Name,
      start_time: new Date().toISOString(),
      tournament_id: tournamentId
    }])
    .select();

  if (gameError) throw gameError;

  // Update bracket with game session
  // Try to claim this bracket only if not already started elsewhere
  const { data: bracket, error: bracketError } = await supabase
    .from('tournament_brackets')
    .update({
      game_session_id: gameSession[0].id,
      match_status: 'in_progress',
      started_at: new Date().toISOString()
    })
    .eq('id', bracketId)
    .eq('match_status', 'pending')
    .is('game_session_id', null)
    .select();

  // If unable to claim (someone else started it), clean up the created session and abort
  if (!bracketError && (!bracket || bracket.length === 0)) {
    await supabase.from('game_sessions').delete().eq('id', gameSession[0].id);
    throw new Error('Match already started on another device');
  }

  if (bracketError) throw bracketError;

  return { gameSession: gameSession[0], bracket: bracket[0] };
};

export const completeTournamentMatch = async (bracketId, gameSessionId, winnerId) => {
  try {
    // Idempotent complete of game session (only if not already ended)
    const { error: gameError } = await supabase
      .from('game_sessions')
      .update({ end_time: new Date().toISOString() })
      .eq('id', gameSessionId)
      .is('end_time', null);
    if (gameError) throw gameError;

    // Quick guard: don't advance if the bracket is already finalized
    const { data: bracketRow, error: bracketFetchErr } = await supabase
      .from('tournament_brackets')
      .select('match_status, winner_id')
      .eq('id', bracketId)
      .single();
    if (bracketFetchErr) throw bracketFetchErr;
    if (bracketRow?.winner_id || bracketRow?.match_status === 'completed') {
      throw new Error('Match already completed');
    }

    // Advance winner in tournament (DB function does the propagation)
    const result = await advanceTournamentWinner(bracketId, winnerId);
    return result;
  } catch (error) {
    console.error('Error completing tournament match:', error);
    throw error;
  }
};

// Get tournament by ID with full details
export const getTournamentDetails = async (tournamentId) => {
  const { data: tournament, error: tournamentError } = await supabase
    .from('tournaments')
    .select('*')
    .eq('id', tournamentId)
    .single();

  if (tournamentError) throw tournamentError;

  const [participants, brackets] = await Promise.all([
    getTournamentParticipants(tournamentId),
    getTournamentBrackets(tournamentId)
  ]);

  return {
    ...tournament,
    participants,
    brackets
  };
};

// Get active tournaments for participants
export const getActiveTournaments = async () => {
  const { data, error } = await supabase
    .from('tournaments')
    .select('*')
    .in('status', ['registration', 'active'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const getTournamentsForParticipant = async (participantName) => {
  const { data, error } = await supabase
    .from('tournaments')
    .select(`
      *,
      tournament_participants!inner(participant_name)
    `)
    .eq('tournament_participants.participant_name', participantName)
    .in('status', ['registration', 'active'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

// Tournament-specific question loading with mixed tech types and deduplication
export const loadTournamentGameQuestions = async () => {
  console.log("Loading tournament game questions with mixed tech types");

  try {
    // Get categories from BOTH Install (1) and Service (2) tech types
    let { data: categoriesData, error: categoryError } = await supabase
      .from('category_tech_types')
      .select(`
        category_id,
        tech_type_id,
        categories:category_id(
          id,
          name
        )
      `)
      .in('tech_type_id', [1, 2]);

    if (categoryError) throw categoryError;
    console.log("All tech type categories loaded:", categoriesData);

    if (!categoriesData || categoriesData.length === 0) {
      console.error("No categories found for any tech types");
      return {};
    }

    // Group categories by name to identify duplicates
    const categoryGroups = {};
    categoriesData.forEach(item => {
      if (item.categories) {
        const categoryName = item.categories.name;
        if (!categoryGroups[categoryName]) {
          categoryGroups[categoryName] = [];
        }
        categoryGroups[categoryName].push({
          id: item.categories.id,
          name: categoryName,
          tech_type_id: item.tech_type_id
        });
      }
    });

    console.log("Categories grouped by name:", categoryGroups);

    // For each category name, randomly select ONE version if there are duplicates
    const selectedCategories = [];
    Object.keys(categoryGroups).forEach(categoryName => {
      const categoryVersions = categoryGroups[categoryName];
      // Randomly select one version of the category
      const selectedVersion = categoryVersions[Math.floor(Math.random() * categoryVersions.length)];
      selectedCategories.push(selectedVersion);
    });

    console.log("Categories after deduplication:", selectedCategories);

    if (selectedCategories.length === 0) {
      console.error("No valid categories found after deduplication");
      return {};
    }

    // Get questions for the selected categories
    const categoryIds = selectedCategories.map(c => c.id);
    console.log("Fetching questions for category IDs:", categoryIds);

    const { data: questionsData, error: questionError } = await supabase
      .from('questions')
      .select(`
        *,
        category:categories(name)
      `)
      .in('category_id', categoryIds);

    if (questionError) throw questionError;
    console.log("Questions loaded:", questionsData);

    if (!questionsData || questionsData.length === 0) {
      console.error("No questions found for the selected categories");
      return {};
    }

    // Transform into the game format with random selection
    const validGameQuestions = {};
    selectedCategories.forEach(category => {
      const categoryQuestions = questionsData.filter(q => q.category_id === category.id);
      const selectedQuestions = {};
      let isValid = true;

      [200, 400, 600, 800, 1000].forEach(points => {
        const candidates = categoryQuestions.filter(q => q.points === points);
        if (candidates.length === 0) {
          isValid = false;
        } else {
          const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];
          selectedQuestions[points] = {
            id: randomCandidate.id,
            question: randomCandidate.question,
            correct_answers: randomCandidate.correct_answers || [randomCandidate.answer],
            options: randomCandidate.options || [randomCandidate.answer],
            question_type: randomCandidate.question_type || 'multiple_choice'
          };
        }
      });

      if (isValid) {
        validGameQuestions[category.name] = selectedQuestions;
      }
    });

    // Randomly select 6 categories if there are more than 6
    let finalGameQuestions = {};
    const categoryNames = Object.keys(validGameQuestions);
    if (categoryNames.length > 6) {
      // Shuffle the categoryNames array
      categoryNames.sort(() => Math.random() - 0.5);
      const selectedCategoryNames = categoryNames.slice(0, 6);
      selectedCategoryNames.forEach(name => {
        finalGameQuestions[name] = validGameQuestions[name];
      });
    } else {
      finalGameQuestions = validGameQuestions;
    }

    console.log("Final tournament game questions:", finalGameQuestions);
    console.log("Categories selected:", Object.keys(finalGameQuestions));
    return finalGameQuestions;
  } catch (error) {
    console.error("Error in loadTournamentGameQuestions:", error);
    throw error;
  }
};
