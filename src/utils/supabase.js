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
export const loadGameQuestions = async (techTypeId) => {
  // Get categories filtered by tech type if provided
  let { data: categoriesData, error: categoryError } = await supabase
    .from('categories')
    .select('*')
    .eq('tech_type_id', techTypeId)
    .order('name');

  if (categoryError) throw categoryError;

  // Get questions for the filtered categories
  const { data: questionsData, error: questionError } = await supabase
    .from('questions')
    .select(`
      *,
      category:categories(name)
    `)
    .in('category_id', categoriesData.map(c => c.id))
    .order('created_at', { ascending: false });

  if (questionError) throw questionError;

  // Transform into the game format
  const gameQuestions = {};
  categoriesData.forEach(category => {
    gameQuestions[category.name] = {};
    const categoryQuestions = questionsData.filter(q => q.category_id === category.id);
    categoryQuestions.forEach(q => {
      gameQuestions[category.name][q.points] = {
        question: q.question,
        correctAnswer: q.answer,
        options: q.options
      };
    });
  });

  return gameQuestions;
};

export const saveGameStatistics = async (playerName, category, points, correct) => {
  const { error } = await supabase
    .from('game_statistics')
    .insert([{
      player_name: playerName,
      question_category: category,
      question_value: points,
      correct: correct,
      timestamp: new Date().toISOString()
    }]);

  if (error) throw error;
  return true;
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
