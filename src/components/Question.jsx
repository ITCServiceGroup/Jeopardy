import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import '../styles/Question.css';

const Question = ({ 
  question, 
  value, 
  options, 
  onAnswer, 
  onClose,
  currentPlayer,
  player1Name,
  player2Name,
  isDaily = false,
}) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [correctAnswer, setCorrectAnswer] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onAnswer(false, value);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [value, onAnswer]);

  const handleOptionSelect = (option) => {
    if (!confirmed) {
      setSelectedOption(option);
    }
  };

  const handleConfirm = () => {
    if (selectedOption !== null) {
      const correct = selectedOption.isCorrect;
      setConfirmed(true);
      setCorrectAnswer(options.find(opt => opt.isCorrect));
      onAnswer(correct, value, question.category);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} variant="game">
      <div className="question-content">
        <div className="question-header">
          <div className="category-points">
            <span className="category">{question.category}</span>
            <span className="points">{value}mb</span>
          </div>
          <div className="timer">{timeLeft}s</div>
        </div>
        
        <div className="current-player">
          Current Player: {currentPlayer === 1 ? player1Name : player2Name}
        </div>

        <div className="question-text">{question.text}</div>

        <div className="options">
          {options.map((option, index) => (
            <button
              key={index}
              className="option"
              onClick={() => handleOptionSelect(option)}
              disabled={confirmed}
              data-selected={selectedOption === option}
              data-confirmed={confirmed}
              data-correct={confirmed && option.isCorrect}
            >
              {option.text}
            </button>
          ))}
        </div>

        {selectedOption && !confirmed && (
          <button
            className="confirm-button"
            onClick={handleConfirm}
          >
            Confirm Answer
          </button>
        )}

        {confirmed && correctAnswer && (
          <div className="answer-reveal">
            {selectedOption.isCorrect ? (
              <p>Correct! Well done!</p>
            ) : (
              <p>
                Sorry, that's incorrect.<br />
                The correct answer was: <span className="correct-answer">{correctAnswer.text}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default Question;
