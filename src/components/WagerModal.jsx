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
  const STEP = 50;

  const clamp = (val) => Math.max(0, Math.min(maxWager, val));
  const increment = () => {
    const val = parseInt(wagerAmount || '0');
    const next = clamp((isNaN(val) ? 0 : val) + STEP);
    setWagerAmount(String(next));
  };
  const decrement = () => {
    const val = parseInt(wagerAmount || '0');
    const next = clamp((isNaN(val) ? 0 : val) - STEP);
    setWagerAmount(String(next));
  };

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
    <Modal isOpen={isOpen} onClose={onClose} variant="game" allowClose={false}>
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
          <label htmlFor="wager" className={styles.wagerLabel}>Enter Your Wager:</label>
          <div className={styles.wagerInputWrapper}>
            <input
              id="wager"
              type="number"
              step={STEP}
              min="0"
              max={maxWager}
              value={wagerAmount}
              onChange={(e) => {
                const raw = e.target.value;
                // Allow empty while typing so the user can clear and retype
                if (raw === '') {
                  setWagerAmount('');
                  return;
                }
                const value = parseInt(raw);
                if (!isNaN(value) && value >= 0 && value <= maxWager) {
                  setWagerAmount(raw);
                }
              }}
              className={styles.wagerInput}
              autoFocus
            />
            <div className={styles.stepper} aria-hidden={false}>
              <button
                type="button"
                className={styles.stepperBtn}
                onClick={increment}
                aria-label="Increase wager"
                disabled={parseInt(wagerAmount || '0') >= maxWager}
              >
                ▲
              </button>
              <button
                type="button"
                className={styles.stepperBtn}
                onClick={decrement}
                aria-label="Decrease wager"
                disabled={parseInt(wagerAmount || '0') <= 0}
              >
                ▼
              </button>
            </div>
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
