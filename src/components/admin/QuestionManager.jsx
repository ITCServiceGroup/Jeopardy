import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../Modal';
import QuestionForm from './QuestionForm';
import styles from './QuestionManager.module.css';
import ConfirmDialog from '../ConfirmDialog';

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
  const [sortOrder, setSortOrder] = useState('none'); // Add sortOrder state
  const [loading, setLoading] = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    requireTextConfirmation: false,
    textConfirmationValue: '',
    onConfirm: null
  });
  const [modalState, setModalState] = useState({ isOpen: false, questionToEdit: null });

  useEffect(() => {
    fetchData();
  }, [selectedTechType, selectedCategory, selectedQuestionType, sortOrder]); // Add sortOrder to useEffect

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
      let baseQuery = supabase
        .from('questions')
        .select(`
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
        `);

      // Only apply default created_at ordering if no points sorting is selected
      if (sortOrder === 'none') {
        baseQuery = baseQuery.order('created_at', { ascending: false });
      } else {
        baseQuery = baseQuery.order('points', { ascending: sortOrder === 'asc' });
      }

      // Apply filters
      if (selectedCategory) {
        baseQuery.eq('category_id', selectedCategory);
      }

      if (selectedTechType !== 'all') {
        try {
          // Get all categories that have the selected tech type
          const { data: categoriesWithType, error: catError } = await supabase
            .from('categories')
            .select(`
              id,
              category_tech_types!inner (
                tech_type_id,
                tech_types (
                  id,
                  name
                )
              )
            `)
            .eq('category_tech_types.tech_type_id', parseInt(selectedTechType));

          if (catError) throw catError;

          if (categoriesWithType && categoriesWithType.length > 0) {
            const categoryIds = categoriesWithType.map(cat => cat.id);
            baseQuery.in('category_id', categoryIds);
          } else {
            // If no categories found, ensure no results are returned
            baseQuery.eq('category_id', -1);
          }
        } catch (err) {
          console.error('Error filtering by tech type:', err);
          throw new Error('Error filtering questions by tech type');
        }
      }

      if (selectedQuestionType !== 'all') {
        baseQuery.eq('question_type', selectedQuestionType);
      }

      const { data: questionsData, error: questionsError } = await baseQuery;
      if (questionsError) throw questionsError;

      // Fetch statistics (rest of the code remains the same)
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

  const handleSubmitQuestion = async (formData) => {
    try {
      if (formData.id) {
        // Update existing question
        const { error } = await supabase
          .from('questions')
          .update({
            category_id: formData.category_id,
            question: formData.question.trim(),
            question_type: formData.question_type,
            correct_answers: formData.correct_answers,
            options: formData.options,
            points: formData.points
          })
          .eq('id', formData.id);

        if (error) throw error;
      } else {
        // Create new question
        const { error } = await supabase
          .from('questions')
          .insert({
            category_id: formData.category_id,
            question: formData.question.trim(),
            question_type: formData.question_type,
            correct_answers: formData.correct_answers,
            options: formData.options,
            points: formData.points
          });

        if (error) throw error;
      }

      await fetchData();
    } catch (err) {
      setError('Error saving question: ' + err.message);
      throw err;
    }
  };

  const performDeleteQuestion = async (id) => {
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

  const handleDeleteQuestion = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Question',
      message: 'Are you sure you want to delete this question?',
      confirmText: 'Delete',
      confirmButtonStyle: 'danger',
      requireTextConfirmation: false,
      onConfirm: () => performDeleteQuestion(id)
    });
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
      <div className={styles.actionRow}>
        <div className={styles.sortGroup}>
          <span className={styles.filterLabel}>Sort by Points:</span>
          <select
            className={styles.filterSelect}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            disabled={filtering}
          >
            <option value="none">No Sorting</option>
            <option value="asc">Low to High</option>
            <option value="desc">High to Low</option>
          </select>
        </div>
        <div className={styles.buttonContainer}>
          <button
            onClick={() => setModalState({ isOpen: true, questionToEdit: null })}
            className={styles.addButton}
          >
            Add New Question
          </button>
        </div>
      </div>
      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, questionToEdit: null })}
      >
        <QuestionForm
          categories={categories}
          initialData={modalState.questionToEdit}
          defaultCategoryId={selectedCategory}
          onSubmit={async (formData) => {
            await handleSubmitQuestion(formData);
            setModalState({ isOpen: false, questionToEdit: null });
          }}
        />
      </Modal>

      <div className={styles.questionsGrid} style={{ opacity: filtering ? 0.5 : 1 }}>
        {questions.length === 0 ? (
          <div className={styles.noQuestions}>
            No questions found with the current filters
          </div>
        ) : questions.map(question => (
          <div key={question.id} className={styles.questionCard}>
            <div className={styles.questionHeader}>
              <span className={styles.points}>{question.points} points</span>
            </div>
            <div className={styles.techTypeBadges}>
              {question.categories?.category_tech_types.map(ct => (
                <span key={ct.tech_type_id} className={styles.techTypeBadge}>
                  {ct.tech_types.name}
                </span>
              ))}
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
                  className={`${styles.option} ${question.correct_answers.includes(option) ? styles.correct : ''}`}
                >
                  {option} {question.correct_answers.includes(option) && '✓'}
                </span>
              ))}
            </div>
            <div className={styles.controls}>
              <span className={styles.stats}>
                Success Rate: {calculateSuccessRate(question)}
              </span>
              <div className={styles.cardButtons}>
                <button
                  onClick={() => setModalState({ isOpen: true, questionToEdit: question })}
                  className={styles.editButton}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteQuestion(question.id)}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        requireTextConfirmation={confirmDialog.requireTextConfirmation}
        textConfirmationValue={confirmDialog.textConfirmationValue}
      />
    </div>
);

};

export default QuestionManager;
