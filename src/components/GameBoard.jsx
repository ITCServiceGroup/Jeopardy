import LoadingSpinner from './LoadingSpinner';
import '../styles/GameBoard.css';

const GameBoard = ({ onQuestionSelect, answeredQuestions, questions }) => {
  if (!questions) {
    return (
      <div className="game-board loading">
        <LoadingSpinner message="Loading questions..." />
      </div>
    );
  }

  const categories = Object.keys(questions);
  const values = [200, 400, 600, 800, 1000];

  const handleCellClick = (category, value) => {
    if (!answeredQuestions.has(`${category}-${value}`)) {
      onQuestionSelect(category, value);
    }
  };

  return (
    <div className="game-board">
      <div className="categories-row">
        {categories.map((category, index) => (
          <div key={index} className="category-cell">
            {category}
          </div>
        ))}
      </div>
      {values.map((value, rowIndex) => (
        <div key={rowIndex} className="question-row">
          {categories.map((category, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`question-cell ${
                answeredQuestions.has(`${category}-${value}`) ? 'selected' : ''
              }`}
              onClick={() => handleCellClick(category, value)}
            >
              {answeredQuestions.has(`${category}-${value}`) ? '' : `${value}mb`}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default GameBoard;
