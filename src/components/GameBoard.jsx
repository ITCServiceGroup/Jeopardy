import Question from './Question';
import LoadingSpinner from './LoadingSpinner';
import '../styles/GameBoard.css';
import { useState, useEffect } from 'react';

const GameBoard = ({ 
  categories = [], 
  onQuestionAnswered, 
  onGameEnd,
  currentPlayer,
  player1Name,
  player2Name,
  questions
}) => {
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Log only when categories or questions actually change
  useEffect(() => {
    if (categories.length > 0 || questions) {
      console.log("GameBoard data updated:", {
        categoriesCount: categories.length,
        questionsLoaded: !!questions
      });
    }
  }, [categories.length, questions]);

  if (!categories.length) {
    return (
      <div className="game-board loading">
        <LoadingSpinner message="Loading questions..." />
      </div>
    );
  }

  const values = [200, 400, 600, 800, 1000];

  const handleQuestionSelect = (category, value) => {
    if (!answeredQuestions.has(`${category.name}-${value}`)) {
      const question = category.questions.find(q => q.points === value);
      if (question) {
        const questionData = {
          ...question,
          category: category.name,
          points: value, // ensure points matches the displayed value
          value // use same value for consistency
        };
        
        console.log('GameBoard - handleQuestionSelect:', {
          category: category.name,
          value,
          question: questionData
        });
        
        setSelectedQuestion(questionData);
      }
    }
  };

  const handleQuestionAnswer = (correct, points, categoryName) => {
    if (!selectedQuestion) {
      console.error('No selected question available for answer');
      return;
    }

    console.log('GameBoard - handleQuestionAnswer:', {
      correct,
      points,
      categoryName,
      selectedQuestion
    });
    
    const key = `${categoryName}-${points}`;
    setAnsweredQuestions(prev => new Set([...prev, key]));
    
    // Call onQuestionAnswered with the selected question's data
    const questionId = selectedQuestion.id;
    const value = selectedQuestion.value;

    console.log('GameBoard - calling onQuestionAnswered:', {
      correct,
      value,
      categoryName,
      questionId
    });
    
    onQuestionAnswered(correct, value, categoryName, questionId);
    
    // Question will auto-close after the answer is processed
    setSelectedQuestion(null);

    // Check if game is over
    const totalQuestions = categories.length * values.length;
    if (answeredQuestions.size + 1 === totalQuestions) {
      onGameEnd();
    }
  };

  return (
    <div className="game-board">
      <div className="categories-row">
        {categories.map((category) => (
          <div key={category.id} className="category-cell">
            {category.name}
          </div>
        ))}
      </div>
      {values.map((value) => (
        <div key={value} className="question-row">
          {categories.map((category) => (
            <div
              key={`${category.id}-${value}`}
              className={`question-cell ${
                answeredQuestions.has(`${category.name}-${value}`) ? 'answered' : ''
              }`}
              onClick={() => handleQuestionSelect(category, value)}
            >
              {answeredQuestions.has(`${category.name}-${value}`) ? '' : value}
            </div>
          ))}
        </div>
      ))}

      {selectedQuestion && (
        <Question
          question={selectedQuestion}
          value={selectedQuestion.value} // Pass value explicitly
          options={selectedQuestion.options}
          onAnswer={handleQuestionAnswer}
          onClose={() => setSelectedQuestion(null)}
          currentPlayer={currentPlayer}
          player1Name={player1Name}
          player2Name={player2Name}
        />
      )}
    </div>
  );
};

export default GameBoard;
