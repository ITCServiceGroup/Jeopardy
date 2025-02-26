import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import LoadingSpinner from '../LoadingSpinner';
import styles from './QuestionManager.module.css';

const QuestionManager = () => {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [techTypes, setTechTypes] = useState([]);
  const [selectedTechType, setSelectedTechType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    category_id: '',
    question: '',
    answer: '',
    options: ['', '', ''], // Reduced to 3 options for incorrect answers
    points: '200'
  });

  useEffect(() => {
    fetchData();
  }, [selectedTechType, selectedCategory]);

  const fetchData = async () => {
    setError(null);
    setFiltering(true);
    try {
      // Fetch tech types
      const { data: techTypesData, error: techTypesError } = await supabase
        .from('tech_types')
        .select('*')
        .order('name');

      if (techTypesError) throw techTypesError;
      setTechTypes(techTypesData);

      // Fetch categories for selected tech type
      // Debug: log filters
      console.log('Current filters:', {
        techType: selectedTechType,
        category: selectedCategory
      });

      let categoryQuery = supabase
        .from('categories')
        .select(`
          id,
          name,
          category_tech_types!inner (
            tech_type_id,
            tech_types (
              id,
              name
            )
          )
        `)
        .order('name');

      if (selectedTechType !== 'all') {
        categoryQuery = categoryQuery.eq('category_tech_types.tech_type_id', parseInt(selectedTechType));
      }

      const { data: categoriesData, error: categoriesError } = await categoryQuery;
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData);

      // Build base query for questions
      const baseQuery = `
        id,
        category_id,
        question,
        answer,
        options,
        points,
        created_at,
        categories:categories (
          id,
          name,
          category_tech_types (
            tech_type_id,
            tech_types (
              id,
              name
            )
          )
        )
      `;

      let questionQuery = supabase
        .from('questions')
        .select(baseQuery)
        .order('created_at', { ascending: false });

      // Debug: log initial query state
      console.log('Initial query state:', questionQuery);

      // Apply filters
      if (selectedCategory) {
        console.log('Applying category filter:', selectedCategory);
        questionQuery = questionQuery.eq('category_id', selectedCategory);
      }

      if (selectedTechType !== 'all') {
        console.log('Applying tech type filter:', selectedTechType);
        // Create a subquery to get categories with the selected tech type
        const { data: categoryIds } = await supabase
          .from('category_tech_types')
          .select('category_id')
          .eq('tech_type_id', parseInt(selectedTechType));

        if (categoryIds) {
          const ids = categoryIds.map(item => item.category_id);
          console.log('Filtering by category IDs:', ids);
          questionQuery = questionQuery.in('category_id', ids);
        }
      }

      // Debug: log final query
      console.log('Final query state:', questionQuery);

      const { data: questionsData, error: questionsError } = await questionQuery;
      if (questionsError) throw questionsError;

      // Fetch statistics for each question
      const questionsWithStats = await Promise.all(
        questionsData.map(async question => {
          try {
            const { data: statsData, error: statsError } = await supabase
              .from('game_statistics')
              .select('correct')
              .eq('question_id', question.id);

            if (statsError) {
              console.warn(`Error fetching statistics for question ${question.id}:`, statsError);
              return {
                ...question,
                statistics: []
              };
            }

            return {
              ...question,
              statistics: statsData || []
            };
          } catch (err) {
            console.warn(`Failed to fetch statistics for question ${question.id}:`, err);
            return {
              ...question,
              statistics: []
            };
          }
        })
      );

      setQuestions(questionsWithStats);
    } catch (err) {
      setError('Error fetching data: ' + err.message);
      console.error('Detailed error:', err);
    } finally {
      setLoading(false);
      setFiltering(false);
    }
  };

  const calculateSuccessRate = (question) => {
    if (!question.statistics || question.statistics.length === 0) {
      return 'No attempts';
    }
    
    const correct = question.statistics.filter(stat => stat.correct).length;
    const total = question.statistics.length;
    const percentage = Math.round((correct / total) * 100);
    
    return `${percentage}% (${correct}/${total})`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Get incorrect options
      let incorrectOptions = formData.options
        .map(opt => opt.trim())
        .filter(opt => opt !== '');

      // Validate we have exactly 3 incorrect options
      if (incorrectOptions.length !== 3) {
        throw new Error('Please provide exactly 3 incorrect options');
      }

      // Validate incorrect options don't include the correct answer
      const answer = formData.answer.trim();
      if (incorrectOptions.includes(answer)) {
        throw new Error('Incorrect options should not include the correct answer');
      }

      // Combine and shuffle all options
      const allOptions = [...incorrectOptions, answer]
        .sort(() => Math.random() - 0.5);

      // Prepare the data
      const questionData = {
        category_id: formData.category_id, // Don't parse as int - keep as UUID
        question: formData.question.trim(),
        answer: answer,
        points: parseInt(formData.points),
        options: allOptions // Randomized array of all 4 options
      };

      console.log('Sending question data:', questionData);

      const { data, error } = await supabase
        .from('questions')
        .insert(questionData)
        .select();

      if (error) throw error;

      console.log('Successfully added question:', data);

      setFormData({
        category_id: '',
        question: '',
        answer: '',
        options: ['', '', ''],
        points: '200'
      });

      await fetchData();
    } catch (err) {
      console.error('Detailed error:', err);
      setError('Error adding question: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchData();
    } catch (err) {
      setError('Error deleting question: ' + err.message);
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  if (loading) return <LoadingSpinner message="Loading questions..." />;
  if (filtering) return <LoadingSpinner message="Filtering questions..." />;

  return (
    <div className={styles.questionManager}>
      <div className={styles.header}>
        <h2>Question Management</h2>
        <div className={styles.controlBar}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Tech Type:</span>
            <select 
              className={styles.filterSelect}
              value={selectedTechType} 
              onChange={(e) => {
                setError(null);
                setSelectedTechType(e.target.value);
                setSelectedCategory('');
              }}
              disabled={filtering}
            >
              <option value="all">All Types</option>
              {techTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Category:</span>
            <select 
              className={styles.filterSelect}
              value={selectedCategory}
              onChange={(e) => {
                setError(null);
                setSelectedCategory(e.target.value);
              }}
              disabled={filtering}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.category_tech_types.map(ct => ct.tech_types.name).join(' & ')})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button onClick={fetchData}>Retry</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.questionForm}>
        <div className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label>Category:</label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              required
            >
              <option value="">Select Category</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.category_tech_types.map(ct => ct.tech_types.name).join(' & ')})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Points:</label>
            <select
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: e.target.value })}
              required
            >
              {[200, 400, 600, 800, 1000].map(value => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Question:</label>
            <textarea
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              required
            />
          </div>

          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Answer:</label>
            <input
              type="text"
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              required
            />
          </div>

          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <label>Incorrect Options (provide exactly 3):</label>
            <div className={styles.optionsGrid}>
              {formData.options.map((option, index) => (
                <textarea
                  key={index}
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Incorrect Option ${index + 1}`}
                  required
                  rows={3}
                />
              ))}
            </div>
            <small style={{ color: '#666', marginTop: '0.5rem' }}>
              The correct answer will be randomly inserted among these options
            </small>
          </div>
        </div>

        <button type="submit" className={styles.submitButton}>
          Add Question
        </button>
      </form>

      <div className={styles.questionsGrid} style={{ opacity: filtering ? 0.5 : 1 }}>
        {questions.length === 0 ? (
          <div className={styles.noQuestions}>
            No questions found with the current filters
          </div>
        ) : questions.map(question => (
          <div key={question.id} className={styles.questionCard}>
            <div className={styles.questionHeader}>
              <span className={styles.points}>{question.points} points</span>
              <div className={styles.techTypeBadges}>
                {question.categories?.category_tech_types.map(ct => (
                  <span key={ct.tech_type_id} className={styles.techTypeBadge}>
                    {ct.tech_types.name}
                  </span>
                ))}
              </div>
            </div>
            <span className={styles.categoryName}>
              {question.categories?.name}
            </span>
            <p className={styles.questionText}>{question.question}</p>
            <p className={styles.answer}>Answer: {question.answer}</p>
            <div className={styles.optionsList}>
              {question.options.map((option, index) => (
                <span key={index} className={styles.option}>
                  {option}
                </span>
              ))}
            </div>
            <div className={styles.controls}>
              <span className={styles.stats}>
                Success Rate: {calculateSuccessRate(question)}
              </span>
              <button
                onClick={() => handleDelete(question.id)}
                className={styles.deleteButton}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuestionManager;
