import { useState, useEffect } from 'react';
import styles from './QuestionForm.module.css';

const VALID_POINTS = [200, 400, 600, 800, 1000];
const QUESTION_TYPES = [
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'check_all', label: 'Check All That Apply' },
  { value: 'true_false', label: 'True/False' }
];

const QuestionForm = ({ categories, onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    category_id: '',
    question: '',
    question_type: 'multiple_choice',
    correct_answers: [],
    options: ['', '', '', ''],
    points: 200
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        category_id: initialData.category_id,
        question: initialData.question,
        question_type: initialData.question_type,
        correct_answers: initialData.correct_answers,
        options: initialData.question_type === 'true_false' 
          ? ['True', 'False']
          : [...initialData.options],
        points: initialData.points
      });
    }
  }, [initialData]);

  const handleQuestionTypeChange = (e) => {
    const type = e.target.value;
    setFormData(prev => ({
      ...prev,
      question_type: type,
      options: type === 'true_false' ? ['True', 'False'] : ['', '', '', ''],
      correct_answers: []
    }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index) => {
    setFormData(prev => {
      const newOptions = prev.options.filter((_, i) => i !== index);
      const removedOption = prev.options[index];
      const newCorrectAnswers = prev.correct_answers.filter(answer => answer !== removedOption);

      return {
        ...prev,
        options: newOptions,
        correct_answers: newCorrectAnswers
      };
    });
  };

  const handleOptionCheck = (option) => {
    setFormData(prev => ({
      ...prev,
      correct_answers: prev.question_type === 'multiple_choice'
        ? [option]
        : prev.correct_answers.includes(option)
          ? prev.correct_answers.filter(a => a !== option)
          : [...prev.correct_answers, option]
    }));
  };

  const updateOption = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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
          options = formData.options
            .map(opt => opt.trim())
            .filter(opt => opt !== '');

          if (options.length < 2) {
            throw new Error('Please provide at least 2 options');
          }

          correct_answers = formData.correct_answers;
          if (correct_answers.length !== 1) {
            throw new Error('Please select exactly one correct answer');
          }
          break;

        case 'check_all':
          options = formData.options
            .map(opt => opt.trim())
            .filter(opt => opt !== '');

          if (options.length < 2) {
            throw new Error('Please provide at least 2 options');
          }

          correct_answers = formData.correct_answers;
          if (correct_answers.length === 0) {
            throw new Error('Please select at least one correct answer');
          }
          break;

        default:
          throw new Error('Invalid question type');
      }

      await onSubmit({
        id: initialData?.id,
        ...formData,
        options,
        correct_answers
      });

      if (!initialData) {
        // Only reset form if this was a new question creation
        setFormData({
          category_id: '',
          question: '',
          question_type: 'multiple_choice',
          correct_answers: [],
          options: ['', '', '', ''],
          points: 200
        });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.questionForm}>
      <h2>{initialData ? 'Edit Question' : 'Add New Question'}</h2>

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.formGrid}>
        <div className={styles.formGroup}>
          <label>Category:</label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
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
            {QUESTION_TYPES.map(type => (
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
            onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value, 10) }))}
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
            onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
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
                  onChange={() => setFormData(prev => ({
                    ...prev,
                    correct_answers: ['True']
                  }))}
                />
                True
              </label>
              <label>
                <input
                  type="radio"
                  name="correct_answer"
                  value="False"
                  checked={formData.correct_answers[0] === 'False'}
                  onChange={() => setFormData(prev => ({
                    ...prev,
                    correct_answers: ['False']
                  }))}
                />
                False
              </label>
            </div>
          </div>
        ) : (
          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
            <div className={styles.optionsHeader}>
              <label>
                {formData.question_type === 'check_all'
                  ? 'Options (select all correct answers):'
                  : 'Options (select one correct answer):'}
              </label>
              <button
                type="button"
                onClick={addOption}
                className={styles.addOptionButton}
                title="Add option"
              >
                + Add Option
              </button>
            </div>
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
                  <div className={styles.optionControls}>
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
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className={styles.removeOptionButton}
                        title="Remove option"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button type="submit" className={styles.submitButton}>
        {initialData ? 'Save Changes' : 'Add Question'}
      </button>
    </form>
  );
};

export default QuestionForm;
