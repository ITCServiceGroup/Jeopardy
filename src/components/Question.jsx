import { useState, useEffect } from 'react';
import '../styles/Question.css';

const Question = ({ question, onAnswer, onClose, onTimeout, currentPlayer, player1Name, player2Name, value, options, isDaily }) => {
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timeoutRef, setTimeoutRef] = useState(null);
  const [countdownRef, setCountdownRef] = useState(null);
  
  // Timer and state management
  useEffect(() => {
    const cleanup = () => {
      if (timeoutRef) clearTimeout(timeoutRef);
      if (countdownRef) clearInterval(countdownRef);
    };

    try {
      // Auto-close after showing answer
      if (isConfirmed) {
        console.log('Question answered:', {
          correct: isAnswerCorrect(),
          category: question?.category,
          id: question?.id,
          value,
          timeLeft
        });

        setTimeoutRef(setTimeout(() => {
          try {
            onClose?.();
          } catch (error) {
            console.error('Auto-close error:', error);
          }
        }, 2000));
      }

      // Countdown timer when question is active
      if (timeLeft > 0 && !showAnswer) {
        setCountdownRef(setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              cleanup();
              handleTimeout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000));
      }
    } catch (error) {
      console.error('Timer error:', error);
      cleanup();
    }

    return cleanup;
  }, [showAnswer, timeLeft, isConfirmed, question?.id, value, onClose]);

  // Reset state on unmount
  useEffect(() => {
    return () => {
      setTimeLeft(0);
      setShowAnswer(false);
      setSelectedOptions([]);
    };
  }, []);

  const handleTimeout = () => {
    if (!isConfirmed) {
      try {
        setIsConfirmed(true);
        setShowAnswer(true);
        setTimeLeft(0);
        onAnswer(false, value, question?.category);
      } catch (error) {
        console.error('Error handling timeout:', error);
      }
    }
  };

  const isAnswerCorrect = () => {
    if (!question) return false;

    switch (question.question_type) {
      case 'multiple_choice':
      case 'true_false':
        return selectedOptions[0] === question.correct_answers[0];
      case 'check_all':
        const selected = [...selectedOptions].sort();
        const correct = [...question.correct_answers].sort();
        return selected.length === correct.length && 
          selected.every((value, index) => value === correct[index]);
      default:
        return false;
    }
  };

  const handleOptionSelect = (option) => {
    if (!isConfirmed) {
      try {
        switch (question.question_type) {
          case 'multiple_choice':
          case 'true_false':
            setSelectedOptions([option]);
            break;
          case 'check_all':
            setSelectedOptions(prev => 
              prev.includes(option)
                ? prev.filter(o => o !== option)
                : [...prev, option]
            );
            break;
        }
      } catch (error) {
        console.error('Option select error:', error);
      }
    }
  };

  const handleConfirm = () => {
    if (!isConfirmed && selectedOptions.length > 0) {
      try {
        const isCorrect = isAnswerCorrect();
        setIsConfirmed(true);
        setShowAnswer(true);
        setTimeLeft(0);
        onAnswer(isCorrect, value, question?.category);
      } catch (error) {
        console.error('Confirm error:', error);
      }
    }
  };

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
              className={`option ${
                showAnswer
                  ? (question.question_type === 'check_all'
                    ? question.correct_answers.includes(option)
                      ? 'correct'
                      : selectedOptions.includes(option)
                        ? 'incorrect'
                        : ''
                    : option === question.correct_answers[0]
                      ? 'correct'
                      : selectedOptions.includes(option)
                        ? 'incorrect'
                        : '')
                  : selectedOptions.includes(option)
                    ? 'selected'
                    : ''
              }`}
              aria-label={`Answer option: ${option}${
                showAnswer ? (
                  question.question_type === 'check_all'
                    ? question.correct_answers.includes(option)
                      ? ' (Correct)'
                      : selectedOptions.includes(option)
                        ? ' (Incorrect)'
                        : ''
                    : option === question.correct_answers[0]
                      ? ' (Correct)'
                      : selectedOptions.includes(option)
                        ? ' (Incorrect)'
                        : ''
                ) : ''
              }`}
              data-testid={`option-${index}`}
              data-correct={question.question_type === 'check_all'
                ? question.correct_answers.includes(option)
                : option === question.correct_answers[0]}
              data-selected={selectedOptions.includes(option)}
              data-confirmed={isConfirmed}
              onClick={() => handleOptionSelect(option)}
              disabled={isConfirmed}
              aria-disabled={isConfirmed}
              aria-current={selectedOptions.includes(option) ? 'true' : undefined}
              role={question.question_type === 'check_all' ? 'checkbox' : 'radio'}
              aria-checked={selectedOptions.includes(option)}
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
              {question.question_type === 'check_all' 
                ? `Correct Answers: ${question.correct_answers.join(', ')}` 
                : `Correct Answer: ${question.correct_answers[0]}`}
            </div>
          </div>
        )}

        {!isConfirmed && selectedOptions.length > 0 && (
          <button 
            className="confirm-button" 
            onClick={handleConfirm}
            data-testid="confirm-answer"
          >
            Confirm Answer
          </button>
        )}
      </div>
    </div>
  );
};

export default Question;
