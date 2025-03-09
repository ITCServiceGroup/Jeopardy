import React, { useState, useEffect, useCallback, memo } from 'react';
import Modal from './Modal';
import '../styles/Question.css';

// Memoize the option button component
const QuestionOption = memo(({ 
  option, 
  isSelected, 
  disabled, 
  confirmed, 
  isCorrect,
  onClick,
  prefix = ''
}) => {
  const optionText = typeof option === 'string' 
    ? option 
    : option.text || option.answer || option.value || JSON.stringify(option);

  return (
    <button
      className={`option ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      disabled={disabled}
      data-selected={isSelected ? "true" : "false"}
      data-confirmed={confirmed ? "true" : "false"}
      data-correct={(confirmed && isCorrect) ? "true" : "false"}
    >
      {isSelected ? `✓ ${optionText}` : optionText}
    </button>
  );
});

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
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [confirmed, setConfirmed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [correctAnswers, setCorrectAnswers] = useState([]);
  const [questionType, setQuestionType] = useState('multiple_choice');
  const [isTrueFalse, setIsTrueFalse] = useState(false);
  
  // Extract option text function
  const getOptionText = useCallback((option) => {
    if (typeof option === 'string') return option;
    return option.text || option.answer || option.value || JSON.stringify(option);
  }, []);

  // Determine if option is correct
  const isOptionCorrect = useCallback((option) => {
    if (typeof option === 'object' && (option.isCorrect || option.correct)) {
      return true;
    }
    
    if (!Array.isArray(question.correct_answers)) {
      return false;
    }
    
    const optionText = getOptionText(option);
    return question.correct_answers.includes(optionText);
  }, [question.correct_answers, getOptionText]);

  // Handle option selection
  const handleOptionSelect = useCallback((option) => {
    if (confirmed) return;
    
    const formattedOption = {
      text: getOptionText(option),
      isCorrect: isOptionCorrect(option),
      original: option
    };
    
    setSelectedOptions(prev => {
      if (questionType === 'check_all') {
        // Check if this option is already selected
        const isAlreadySelected = prev.some(o => o.text === formattedOption.text);
        return isAlreadySelected
          ? prev.filter(o => o.text !== formattedOption.text)
          : [...prev, formattedOption];
      } else {
        // For multiple_choice or true_false
        return [formattedOption];
      }
    });
  }, [confirmed, getOptionText, isOptionCorrect, questionType]);

  // Check if an option is selected
  const isOptionSelected = useCallback((option) => {
    const optionText = getOptionText(option);
    return selectedOptions.some(selected => selected.text === optionText);
  }, [selectedOptions, getOptionText]);

  // Determine question type
  useEffect(() => {
    const type = question.question_type || 
                (Array.isArray(question.correct_answers) && question.correct_answers.length > 1 
                  ? 'check_all' 
                  : 'multiple_choice');
    
    const tfQuestion = type === 'true_false' || 
                      (Array.isArray(options) && options.length === 2 && 
                        options.some(o => ['True', 'true', true].includes(getOptionText(o))) && 
                        options.some(o => ['False', 'false', false].includes(getOptionText(o))));
    
    setQuestionType(type);
    setIsTrueFalse(tfQuestion);
  }, [question.question_type, question.correct_answers, options, getOptionText]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
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

  // Set correct answers
  useEffect(() => {
    if (Array.isArray(options) && options.length > 0) {
      const correctOpts = options.filter(opt => isOptionCorrect(opt));
      setCorrectAnswers(correctOpts.map(opt => ({
        text: getOptionText(opt),
        isCorrect: true,
        original: opt
      })));
    }
  }, [options, isOptionCorrect, getOptionText]);

  const handleConfirm = useCallback(() => {
    if (selectedOptions.length === 0) return;
    
    let correct = false;
    
    if (questionType === 'check_all') {
      const allSelectedAreCorrect = selectedOptions.every(opt => opt.isCorrect);
      const allCorrectAreSelected = correctAnswers.every(correctOpt => 
        selectedOptions.some(selectedOpt => selectedOpt.text === correctOpt.text)
      );
      
      correct = allSelectedAreCorrect && allCorrectAreSelected;
    } else {
      correct = selectedOptions[0]?.isCorrect || false;
    }
    
    setConfirmed(true);
    onAnswer(correct, value, question.category);
  }, [selectedOptions, questionType, correctAnswers, value, onAnswer, question.category]);

  const renderOptions = useCallback(() => {
    if (isTrueFalse) {
      const trueOption = { text: 'True', isCorrect: correctAnswers.some(a => ['True', 'true'].includes(a.text)) };
      const falseOption = { text: 'False', isCorrect: correctAnswers.some(a => ['False', 'false'].includes(a.text)) };
      
      return (
        <div className="true-false-options">
          <QuestionOption
            option={trueOption}
            isSelected={selectedOptions.some(o => o.text === 'True')}
            disabled={confirmed}
            confirmed={confirmed}
            isCorrect={trueOption.isCorrect}
            onClick={() => handleOptionSelect(trueOption)}
          />
          <QuestionOption
            option={falseOption}
            isSelected={selectedOptions.some(o => o.text === 'False')}
            disabled={confirmed}
            confirmed={confirmed}
            isCorrect={falseOption.isCorrect}
            onClick={() => handleOptionSelect(falseOption)}
          />
        </div>
      );
    }

    const containerClass = questionType === 'check_all' ? 'check-all-options' : 'multiple-choice-options';
    
    return (
      <div className={containerClass}>
        {questionType === 'check_all' && (
          <div className="check-all-instructions">Select all that apply:</div>
        )}
        {Array.isArray(options) ? options.map((option, index) => (
          <QuestionOption
            key={index}
            option={option}
            isSelected={isOptionSelected(option)}
            disabled={confirmed}
            confirmed={confirmed}
            isCorrect={isOptionCorrect(option)}
            onClick={() => handleOptionSelect(option)}
          />
        )) : (
          <div className="no-options">
            No options available for this question.
            {!Array.isArray(options) && (
              <QuestionOption
                option={{ text: "Continue" }}
                isSelected={false}
                disabled={confirmed}
                confirmed={confirmed}
                isCorrect={true}
                onClick={() => handleOptionSelect({ isCorrect: true, text: "Continue" })}
              />
            )}
          </div>
        )}
      </div>
    );
  }, [isTrueFalse, questionType, options, selectedOptions, confirmed, correctAnswers, handleOptionSelect, isOptionSelected, isOptionCorrect]);

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

        <div className="question-text">
          {question.question || question.text || 'Question text not available'}
        </div>

        <div className="options">
          {renderOptions()}
        </div>

        {selectedOptions.length > 0 && !confirmed && (
          <button
            className="confirm-button"
            onClick={handleConfirm}
          >
            Confirm Answer
          </button>
        )}

        {confirmed && correctAnswers.length > 0 && (
          <div className="answer-reveal">
            {(questionType === 'check_all' 
              ? selectedOptions.every(opt => opt.isCorrect) && 
                correctAnswers.every(correctOpt => 
                  selectedOptions.some(selectedOpt => selectedOpt.text === correctOpt.text)
                )
              : selectedOptions[0]?.isCorrect) ? (
              <p>Correct! Well done!</p>
            ) : (
              <div>
                <p>Sorry, that's incorrect.</p>
                <p>
                  The correct answer{correctAnswers.length > 1 ? 's were' : ' was'}:
                  <ul className="correct-answers-list">
                    {correctAnswers.map((answer, index) => (
                      <li key={index} className="correct-answer">{answer.text}</li>
                    ))}
                  </ul>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default Question;
