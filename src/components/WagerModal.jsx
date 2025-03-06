import { useState, useEffect } from 'react';
import Modal from './Modal';
import { formatScore } from '../utils/scoreUtils';
import styles from './WagerModal.module.css';

const WagerModal = ({ 
  isOpen, 
  onClose, 
  maxWager, 
  onWager, 
  currentPlayer, 
  playerName,
  playerScore,
  questionValue 
}) => {
  const [wagerAmount, setWagerAmount] = useState('0');
  const [isEntering, setIsEntering] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsEntering(true);
      setWagerAmount(questionValue.toString());
    }
  }, [isOpen, questionValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseInt(wagerAmount);
    if (amount >= 0 && amount <= maxWager) {
      onWager(amount);
    }
  };

  const displayScore = formatScore(playerScore);
  const displayQuestionValue = formatScore(questionValue);
  const displayMaxWager = formatScore(maxWager);

  return (
    <Modal isOpen={isOpen} onClose={onClose} variant="game">
      <div className={`${styles.wagerModal} ${isEntering ? styles.enter : ''}`}>
        <div className={styles.dailyDoubleOverlay}>
          <div className={styles.spotlight} />
        </div>
        <h2>Daily Double!</h2>
        <div className={styles.playerInfo}>
          <p className={styles.playerName}>{playerName}, it's your turn!</p>
          <div className={styles.wagerDetails}>
            <p>Question Value: {displayQuestionValue}</p>
            <p>Your Current Score: {displayScore}</p>
            <p className={styles.maxWager}>
              Maximum Wager: {displayMaxWager}
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.wagerForm}>
          <div className={styles.wagerInputWrapper}>
            <label htmlFor="wager" className={styles.wagerLabel}>Enter Your Wager:</label>
            <input
              id="wager"
              type="number"
              min="0"
              max={maxWager}
              value={wagerAmount}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value >= 0 && value <= maxWager) {
                  setWagerAmount(e.target.value);
                }
              }}
              className={styles.wagerInput}
              autoFocus
            />
            <span className={styles.wagerUnit}>MB</span>
          </div>
          <button type="submit" className={styles.wagerButton}>
            Place Wager
          </button>
        </form>
      </div>
    </Modal>
  );
};

export default WagerModal;
