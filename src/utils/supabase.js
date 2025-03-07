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

// Log configuration source for debugging
console.log('Supabase configuration source:', 
  window.JEOPARDY_CONFIG ? 'Runtime config' : 
  (import.meta.env.VITE_SUPABASE_URL ? 'Environment variables' : 'Default fallback'));

console.log('Supabase URL being used:', supabaseUrl ? '[URL available]' : '[URL missing]');
console.log('Supabase Key being used:', supabaseAnonKey ? '[KEY available]' : '[KEY missing]');

// Initialize Supabase client with the resolved credentials
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
