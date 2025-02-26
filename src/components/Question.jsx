import { useState, useEffect, useCallback } from 'react';
import '../styles/Question.css';

const Question = ({ 
  question, 
  options, 
  value, 
  onAnswer, 
  onTimeout,
  isDaily = false 
}) => {
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [wagerAmount, setWagerAmount] = useState(value);
  const [wagerSubmitted, setWagerSubmitted] = useState(!isDaily);
  const [particles, setParticles] = useState([]);

  const createParticles = useCallback(() => {
    const newParticles = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        speed: Math.random() * 2 + 1,
        angle: Math.random() * 360,
      });
    }
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    if (isDaily && !wagerSubmitted) {
      createParticles();
    }
  }, [isDaily, wagerSubmitted, createParticles]);

  const handleTimeout = useCallback(() => {
    setIsAnswered(true);
    onTimeout();
  }, [onTimeout]);

  useEffect(() => {
    if (!wagerSubmitted) return;

    if (timeLeft > 0 && !isAnswered) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      handleTimeout();
    }
  }, [timeLeft, isAnswered, wagerSubmitted, handleTimeout]);

  const handleAnswerClick = (answer) => {
    if (!isAnswered) {
      setSelectedAnswer(answer);
      setIsAnswered(true);
      onAnswer(answer, isDaily ? wagerAmount : value);
    }
  };

  const handleWagerSubmit = (e) => {
    e.preventDefault();
    setWagerSubmitted(true);
  };

  const timerPercentage = (timeLeft / 15) * 100;

  return (
    <div className="question-modal">
      <div className="question-content">
        {isDaily && !wagerSubmitted ? (
          <div className="daily-double-wager">
            <div className="daily-double">DAILY DOUBLE!</div>
            {particles.map(particle => (
              <div
                key={particle.id}
                className="particle"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  transform: `rotate(${particle.angle}deg)`,
                  animationDuration: `${particle.speed}s`
                }}
              />
            ))}
            <form onSubmit={handleWagerSubmit}>
              <label>
                Enter your wager (max {value}mb):
                <input
                  type="number"
                  min={5}
                  max={value}
                  value={wagerAmount}
                  onChange={(e) => setWagerAmount(Number(e.target.value))}
                />
              </label>
              <button type="submit">Start Question</button>
            </form>
          </div>
        ) : (
          <>
            <div className="question-header">
              <div className="timer-container">
                <div 
                  className="timer-bar" 
                  style={{ width: `${timerPercentage}%` }}
                />
                <div className="timer-text">{timeLeft}s</div>
              </div>
              <div className="value">{isDaily ? wagerAmount : value}mb</div>
            </div>
            
            <div className="question-text">
              <h2>{question}</h2>
            </div>

            <div className="options-grid">
              {options.map((option, index) => (
                <button
                  key={index}
                  className={`option-button ${
                    selectedAnswer === option ? 'selected' : ''
                  }`}
                  onClick={() => handleAnswerClick(option)}
                  disabled={isAnswered}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Question;
