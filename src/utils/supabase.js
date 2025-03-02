import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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

    // Transform into the game format
    const gameQuestions = {};
    categories.forEach(category => {
      gameQuestions[category.name] = {};
      const categoryQuestions = questionsData.filter(q => q.category_id === category.id);
      console.log(`Questions for category ${category.name}:`, categoryQuestions);
      
      // Make sure we have questions for each point value
      [200, 400, 600, 800, 1000].forEach(points => {
        const question = categoryQuestions.find(q => q.points === points);
        if (question) {
          gameQuestions[category.name][points] = {
            id: question.id,
            question: question.question,
            correctAnswer: question.answer,
            options: question.options || []
          };
        } else {
          // Add a placeholder question if none exists for this point value
          gameQuestions[category.name][points] = {
            id: `placeholder-${category.name}-${points}`,
            question: `No ${points} point question available for ${category.name}`,
            correctAnswer: "No answer available",
            options: ["No answer available"],
            isPlaceholder: true
          };
        }
      });
    });

    console.log("Transformed game questions:", gameQuestions);
    return gameQuestions;
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
