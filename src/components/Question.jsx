import { useState, useEffect } from 'react';
import '../styles/Question.css';

const Question = ({ question, onAnswer, onClose, onTimeout, currentPlayer, player1Name, player2Name, value, options, isDaily }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  
  // Timer and state management
  useEffect(() => {
    const timers = new Set();
    
    const clearTimers = () => {
      timers.forEach(timer => {
        clearTimeout(timer);
        clearInterval(timer);
      });
      timers.clear();
    };

    try {
      // Auto-close after showing answer
      if (showAnswer) {
        console.log('Question answered:', {
          correct: selectedOption === question?.correctAnswer,
          category: question?.category,
          id: question?.id,
          value,
          timeLeft
        });

        const closeTimer = setTimeout(() => {
          try {
            onClose?.();
          } catch (error) {
            console.error('Auto-close error:', error);
          }
        }, 2000);
        timers.add(closeTimer);
      }

      // Countdown timer when question is active
      if (timeLeft > 0 && !showAnswer) {
        const countdownTimer = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearTimers();
              handleTimeout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        timers.add(countdownTimer);
      }
    } catch (error) {
      console.error('Timer error:', error);
      clearTimers();
    }

    return clearTimers;
  }, [showAnswer, timeLeft, selectedOption, question?.id, value, onClose]);

  // Reset state on unmount
  useEffect(() => {
    return () => {
      setTimeLeft(0);
      setShowAnswer(false);
      setSelectedOption(null);
    };
  }, []);

  const handleTimeout = () => {
    if (!showAnswer) {
      try {
        setShowAnswer(true);
        setTimeLeft(0);
        onAnswer(false, value, question?.category);
      } catch (error) {
        console.error('Error handling timeout:', error);
      }
    }
  };

  const handleOptionSelect = (option) => {
    if (!showAnswer) {
      try {
        const isCorrect = option === question?.correctAnswer;
        // Update state atomically
        setSelectedOption(option);
        setShowAnswer(true);
        setTimeLeft(0);
        // Notify parent component
        onAnswer(isCorrect, value, question?.category);
      } catch (error) {
        console.error('Option select error:', error);
        // Ensure state is consistent even on error
        setSelectedOption(option);
        setShowAnswer(true);
        setTimeLeft(0);
      }
    }
  };

  // Format time display with leading zeros

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="question-modal"
      role="dialog"
      aria-labelledby="question-title"
    >
      <div className="question-content">
        <header className="question-header">
          <div className="category-points" role="group" aria-label="Question details">
            <span className="category" data-testid="question-category">
              {question.category}
            </span>
            <span className="points" data-testid="question-points">
              {question.points}
            </span>
          </div>
          <div 
            className="timer" 
            role="timer" 
            data-testid="question-timer"
          >
            {formatTime(timeLeft)}
          </div>
        </header>

        <div 
          className="current-player"
          role="status"
          aria-live="polite"
          data-testid="current-player"
        >
          {currentPlayer === 1 ? player1Name : player2Name}'s Turn
        </div>

        <div className="question-text" data-testid="question-text">
          {question.question}
        </div>

        <div className="options">
          {question.options.map((option, index) => (
            <button
              key={index}
              className={`option ${showAnswer 
                ? option === question?.correctAnswer
                  ? 'correct'
                  : option === selectedOption
                  ? 'incorrect'
                  : ''
                : ''
              }`}
              aria-label={`Answer option: ${option}${
                showAnswer ? (
                  option === question?.correctAnswer 
                    ? ' (Correct)' 
                    : option === selectedOption 
                      ? ' (Incorrect)' 
                      : ''
                ) : ''
              }`}
              data-testid={`option-${index}`}
              data-correct={option === question?.correctAnswer}
              data-selected={option === selectedOption}
              onClick={() => handleOptionSelect(option)}
              disabled={showAnswer}
              aria-disabled={showAnswer}
              aria-current={selectedOption === option ? 'true' : undefined}
              role="radio"
              aria-checked={selectedOption === option}
            >
              {option}
            </button>
          ))}
        </div>

        {showAnswer && (
          <div 
            className="answer-reveal" 
            role="alert"
            aria-live="assertive"
            data-testid="answer-reveal"
          >
            <div className="correct-answer">
              Correct Answer: {question.correctAnswer}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Question;
