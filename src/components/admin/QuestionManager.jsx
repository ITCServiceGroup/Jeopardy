import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import LoadingSpinner from '../LoadingSpinner';
import styles from './QuestionManager.module.css';

const VALID_POINTS = [200, 400, 600, 800, 1000];
const QUESTION_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'check_all', label: 'Check All That Apply' },
  { value: 'true_false', label: 'True/False' }
];

const QuestionManager = () => {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [techTypes, setTechTypes] = useState([]);
  const [selectedTechType, setSelectedTechType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedQuestionType, setSelectedQuestionType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    category_id: '',
    question: '',
    question_type: 'multiple_choice',
    correct_answers: [],
    options: ['', '', '', ''],
    points: 200 // Must be one of VALID_POINTS values
  });

  useEffect(() => {
    fetchData();
  }, [selectedTechType, selectedCategory, selectedQuestionType]);

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

      // Fetch categories
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
        question_type,
        correct_answers,
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

      // Apply filters
      if (selectedCategory) {
        questionQuery = questionQuery.eq('category_id', selectedCategory);
      }

      if (selectedTechType !== 'all') {
        const { data: categoryIds } = await supabase
          .from('category_tech_types')
          .select('category_id')
          .eq('tech_type_id', parseInt(selectedTechType));

        if (categoryIds) {
          const ids = categoryIds.map(item => item.category_id);
          questionQuery = questionQuery.in('category_id', ids);
        }
      }

      if (selectedQuestionType !== 'all') {
        questionQuery = questionQuery.eq('question_type', selectedQuestionType);
      }

      const { data: questionsData, error: questionsError } = await questionQuery;
      if (questionsError) throw questionsError;

      // Fetch statistics
      const questionsWithStats = await Promise.all(
        questionsData.map(async question => {
          const { data: statsData, error: statsError } = await supabase
            .from('game_statistics')
            .select('correct')
            .eq('question_id', question.id);

          if (statsError) {
            console.warn(`Error fetching statistics for question ${question.id}:`, statsError);
            return { ...question, statistics: [] };
          }

          return { ...question, statistics: statsData || [] };
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

  const handleQuestionTypeChange = (e) => {
    const type = e.target.value;
    setFormData(prev => ({
      ...prev,
      question_type: type,
      options: type === 'true_false' ? ['True', 'False'] : ['', '', '', ''],
      correct_answers: []
    }));
  };

  const handleOptionCheck = (option) => {
    setFormData(prev => ({
      ...prev,
      correct_answers: prev.correct_answers.includes(option)
        ? prev.correct_answers.filter(a => a !== option)
        : [...prev.correct_answers, option]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let options;
      let correct_answers;

      switch (formData.question_type) {
        case 'true_false':
          options = ['True', 'False'];
          correct_answers = formData.correct_answers;
          if (correct_answers.length !== 1) {
            throw new Error('Please select the correct answer for True/False');
          }
          break;

        case 'multiple_choice':
          // Get all options
          options = formData.options
            .map(opt => opt.trim())
            .filter(opt => opt !== '');

          if (options.length !== 4) {
            throw new Error('Please provide exactly 4 options');
          }

          correct_answers = formData.correct_answers;
          if (correct_answers.length !== 1) {
            throw new Error('Please select exactly one correct answer');
          }
          break;

        case 'check_all':
          // All options provided and some marked as correct
          options = formData.options
            .map(opt => opt.trim())
            .filter(opt => opt !== '');

          if (options.length !== 4) {
            throw new Error('Please provide exactly 4 options');
          }

          correct_answers = formData.correct_answers;
          if (correct_answers.length === 0) {
            throw new Error('Please select at least one correct answer');
          }
          break;

        default:
          throw new Error('Invalid question type');
      }

      // Validate points
      const points = parseInt(formData.points, 10);
      if (!VALID_POINTS.includes(points)) {
        throw new Error('Invalid points value. Must be one of: ' + VALID_POINTS.join(', '));
      }

      const questionData = {
        category_id: formData.category_id,
        question: formData.question.trim(),
        question_type: formData.question_type,
        correct_answers,
        options,
        points
      };

      const { data, error } = await supabase
        .from('questions')
        .insert(questionData)
        .select();

      if (error) throw error;

      setFormData({
        category_id: '',
        question: '',
        question_type: 'multiple_choice',
        correct_answers: [],
        options: ['', '', '', ''],
        points: 200
      });

      await fetchData();
    } catch (err) {
      setError('Error adding question: ' + err.message);
      console.error('Detailed error:', err);
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

  if (loading) return <LoadingSpinner message="Loading questions..." theme="light" />;
  if (filtering) return <LoadingSpinner message="Filtering questions..." theme="light" />;

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
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Question Type:</span>
            <select 
              className={styles.filterSelect}
              value={selectedQuestionType}
              onChange={(e) => {
                setError(null);
                setSelectedQuestionType(e.target.value);
              }}
              disabled={filtering}
            >
              {QUESTION_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
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
            <label>Question Type:</label>
            <select
              value={formData.question_type}
              onChange={handleQuestionTypeChange}
              required
            >
              {QUESTION_TYPES.filter(type => type.value !== 'all').map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Points:</label>
            <select
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value, 10) })}
              required
            >
              {VALID_POINTS.map(value => (
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

          {formData.question_type === 'true_false' ? (
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label>Correct Answer:</label>
              <div className={styles.truefalseOptions}>
                <label>
                  <input
                    type="radio"
                    name="correct_answer"
                    value="True"
                    checked={formData.correct_answers[0] === 'True'}
                    onChange={() => setFormData({
                      ...formData,
                      correct_answers: ['True']
                    })}
                  />
                  True
                </label>
                <label>
                  <input
                    type="radio"
                    name="correct_answer"
                    value="False"
                    checked={formData.correct_answers[0] === 'False'}
                    onChange={() => setFormData({
                      ...formData,
                      correct_answers: ['False']
                    })}
                  />
                  False
                </label>
              </div>
            </div>
          ) : (
            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label>
                {formData.question_type === 'check_all' 
                  ? 'Options (select all correct answers):' 
                  : 'Options (select one correct answer):'}
              </label>
              <div className={styles.optionsGrid}>
                {formData.options.map((option, index) => (
                  <div key={index} className={styles.optionWithCheckbox}>
                    <textarea
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      required
                      rows={2}
                    />
                    <label>
                      <input
                        type={formData.question_type === 'check_all' ? 'checkbox' : 'radio'}
                        name="correct_answers"
                        checked={formData.correct_answers.includes(option)}
                        onChange={() => handleOptionCheck(option)}
                        disabled={!option.trim()}
                      />
                      Correct
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
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
            <div className={styles.questionType}>
              Type: {question.question_type.replace(/_/g, ' ')}
            </div>
            <p className={styles.questionText}>{question.question}</p>
            <div className={styles.optionsList}>
              {question.options.map((option, index) => (
                <span 
                  key={index} 
                  className={`${styles.option} ${
                    question.correct_answers.includes(option) ? styles.correct : ''
                  }`}
                >
                  {option} {question.correct_answers.includes(option) && '✓'}
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
