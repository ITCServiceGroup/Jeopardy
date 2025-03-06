import { useState, useEffect } from 'react';
import Question from './Question';
import LoadingSpinner from './LoadingSpinner';
import WagerModal from './WagerModal';
import { convertToMB, formatScore } from '../utils/scoreUtils';
import '../styles/GameBoard.css';

const GameBoard = ({ 
  categories = [], 
  onQuestionAnswered, 
  onGameEnd,
  currentPlayer,
  player1Name,
  player2Name,
  scores = { player1: 0, player2: 0 }
}) => {
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [dailyDoubles, setDailyDoubles] = useState(new Set());
  const [showWager, setShowWager] = useState(false);
  const [currentWagerQuestion, setCurrentWagerQuestion] = useState(null);
  const [revealedDailyDoubles, setRevealedDailyDoubles] = useState(new Set());

  useEffect(() => {
    const initializeDailyDoubles = () => {
      if (categories.length > 0) {
        const allQuestionKeys = [];
        categories.forEach(category => {
          [400, 600, 800, 1000].forEach(value => {
            allQuestionKeys.push(`${category.name}-${value}`);
          });
        });

        const selectedDailyDoubles = new Set();
        while (selectedDailyDoubles.size < 2 && allQuestionKeys.length > 0) {
          const randomIndex = Math.floor(Math.random() * allQuestionKeys.length);
          selectedDailyDoubles.add(allQuestionKeys[randomIndex]);
          allQuestionKeys.splice(randomIndex, 1);
        }

        setDailyDoubles(selectedDailyDoubles);
      }
    };

    initializeDailyDoubles();
  }, [categories]);

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
          points: value,
          value
        };
        
        const key = `${category.name}-${value}`;
        if (dailyDoubles.has(key)) {
          setRevealedDailyDoubles(prev => new Set([...prev, key]));
          setCurrentWagerQuestion(questionData);
          setShowWager(true);
        } else {
          setSelectedQuestion(questionData);
        }
      }
    }
  };

  const handleWager = (wagerAmount) => {
    setShowWager(false);
    setSelectedQuestion({
      ...currentWagerQuestion,
      value: wagerAmount
    });
    setCurrentWagerQuestion(null);
  };

  const handleQuestionAnswer = (correct, points, categoryName) => {
    if (!selectedQuestion) return;
    
    const key = `${categoryName}-${selectedQuestion.points}`;
    setAnsweredQuestions(prev => new Set([...prev, key]));
    
    onQuestionAnswered(correct, points, categoryName, selectedQuestion.id);
    setSelectedQuestion(null);

    const totalQuestions = categories.length * values.length;
    if (answeredQuestions.size + 1 === totalQuestions) {
      onGameEnd();
    }
  };

  const getCurrentPlayerScore = () => {
    const score = scores[`player${currentPlayer}`] || 0;
    return score >= 1000 ? score * 1000 : score; // Convert GB to MB if needed
  };

  const getMaxWager = () => {
    const currentScore = getCurrentPlayerScore();
    const questionValue = currentWagerQuestion?.value || 0;
    return Math.max(currentScore, questionValue);
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
          {categories.map((category) => {
            const key = `${category.name}-${value}`;
            const isAnswered = answeredQuestions.has(key);
            const isDailyDouble = dailyDoubles.has(key);
            const isRevealed = revealedDailyDoubles.has(key);
            
            return (
              <div
                key={`${category.id}-${value}`}
                className={`question-cell ${isAnswered ? 'answered' : ''} ${
                  isDailyDouble ? 'daily-double' : ''
                } ${isRevealed ? 'revealed' : ''}`}
                onClick={() => handleQuestionSelect(category, value)}
              >
                {isAnswered ? '' : value}
              </div>
            );
          })}
        </div>
      ))}

      {showWager && currentWagerQuestion && (
        <WagerModal
          isOpen={showWager}
          onClose={() => {
            setShowWager(false);
            setCurrentWagerQuestion(null);
          }}
          maxWager={getMaxWager()}
          onWager={handleWager}
          currentPlayer={currentPlayer}
          playerName={currentPlayer === 1 ? player1Name : player2Name}
          playerScore={scores[`player${currentPlayer}`]}
          questionValue={currentWagerQuestion.value}
        />
      )}

      {selectedQuestion && (
        <Question
          question={selectedQuestion}
          value={selectedQuestion.value}
          options={selectedQuestion.options}
          onAnswer={handleQuestionAnswer}
          onClose={() => setSelectedQuestion(null)}
          currentPlayer={currentPlayer}
          player1Name={player1Name}
          player2Name={player2Name}
          isDaily={dailyDoubles.has(`${selectedQuestion.category}-${selectedQuestion.points}`)}
        />
      )}
    </div>
  );
};

export default GameBoard;
