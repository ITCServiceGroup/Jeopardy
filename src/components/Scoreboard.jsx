import { useState, useEffect } from 'react';
import '../styles/Scoreboard.css';

const Scoreboard = ({ scores, currentPlayer, player1Name, player2Name }) => {
  const [prevScores, setPrevScores] = useState(scores);
  const [scoreChangeClass, setScoreChangeClass] = useState({ player1: '', player2: '' });

  useEffect(() => {
    if (scores.player1 !== prevScores.player1) {
      setScoreChangeClass(prev => ({ ...prev, player1: 'score-change' }));
      setTimeout(() => setScoreChangeClass(prev => ({ ...prev, player1: '' })), 500);
    }
    if (scores.player2 !== prevScores.player2) {
      setScoreChangeClass(prev => ({ ...prev, player2: 'score-change' }));
      setTimeout(() => setScoreChangeClass(prev => ({ ...prev, player2: '' })), 500);
    }
    setPrevScores(scores);
  }, [scores, prevScores]);

  const formatScore = (score) => {
    if (score >= 1000) {
      return `${score / 1000}gb`;
    }
    return `${score}mb`;
  };

  return (
    <div className="scoreboard">
      <div className={`player-score ${currentPlayer === 1 ? 'active' : ''}`}>
        <h2>{player1Name}</h2>
        <div className={`score ${scoreChangeClass.player1}`}>
          {formatScore(scores.player1)}
        </div>
        {currentPlayer === 1 && (
          <div className="current-turn">Current Turn</div>
        )}
      </div>

      <div className={`player-score ${currentPlayer === 2 ? 'active' : ''}`}>
        <h2>{player2Name}</h2>
        <div className={`score ${scoreChangeClass.player2}`}>
          {formatScore(scores.player2)}
        </div>
        {currentPlayer === 2 && (
          <div className="current-turn">Current Turn</div>
        )}
      </div>
    </div>
  );
};

export default Scoreboard;
