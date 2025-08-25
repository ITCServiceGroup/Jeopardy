import { useState, useEffect } from 'react';
import styles from './BracketView.module.css';

const BracketView = ({ tournament, currentParticipant }) => {
  const [bracketData, setBracketData] = useState([]);
  const [maxRounds, setMaxRounds] = useState(0);

  useEffect(() => {
    if (tournament?.brackets) {
      organizeBracketData();
    }
  }, [tournament]);

  const organizeBracketData = () => {
    const rounds = {};
    let maxRound = 0;

    tournament.brackets.forEach(bracket => {
      const round = bracket.round_number;
      maxRound = Math.max(maxRound, round);
      
      if (!rounds[round]) {
        rounds[round] = [];
      }
      rounds[round].push(bracket);
    });

    // Sort matches within each round
    Object.keys(rounds).forEach(round => {
      rounds[round].sort((a, b) => a.match_number - b.match_number);
    });

    setMaxRounds(maxRound);
    setBracketData(rounds);
  };

  const getParticipantName = (participantId) => {
    if (!participantId) return 'TBD';
    const participant = tournament.participants.find(p => p.id === participantId);
    return participant ? participant.participant_name : 'TBD';
  };

  const getMatchStatus = (bracket) => {
    if (bracket.bye_match) return 'BYE';
    return bracket.match_status.toUpperCase();
  };

  const getMatchWinner = (bracket) => {
    if (!bracket.winner_id) return null;
    return getParticipantName(bracket.winner_id);
  };

  const isCurrentParticipantMatch = (bracket) => {
    if (!currentParticipant) return false;
    const participant1Name = getParticipantName(bracket.participant1_id);
    const participant2Name = getParticipantName(bracket.participant2_id);
    return participant1Name === currentParticipant || participant2Name === currentParticipant;
  };

  const getRoundName = (roundNumber) => {
    if (!maxRounds) return `Round ${roundNumber}`;
    
    const remainingRounds = maxRounds - roundNumber + 1;
    switch (remainingRounds) {
      case 1:
        return 'Final';
      case 2:
        return 'Semi-Final';
      case 3:
        return 'Quarter-Final';
      default:
        return `Round ${roundNumber}`;
    }
  };

  const getConnectorStyle = (roundNumber, matchNumber) => {
    if (roundNumber === maxRounds) return {}; // No connectors from the final
    
    const nextRoundMatch = Math.ceil(matchNumber / 2);
    const isTop = matchNumber % 2 === 1;
    
    return {
      position: 'absolute',
      right: '-20px',
      top: isTop ? '25%' : '75%',
      width: '20px',
      height: '2px',
      backgroundColor: '#e5e7eb',
      zIndex: 1
    };
  };

  if (!tournament?.brackets || tournament.brackets.length === 0) {
    return (
      <div className={styles.bracketView}>
        <h3>Tournament Bracket</h3>
        <div className={styles.noBracket}>
          <p>Tournament brackets have not been generated yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.bracketView}>
      <h3>Tournament Bracket</h3>
      
      {tournament.winner_name && (
        <div className={styles.winner}>
          <h2>🏆 Tournament Winner: {tournament.winner_name}</h2>
        </div>
      )}

      <div className={styles.bracketContainer}>
        {Object.keys(bracketData).map(roundNumber => (
          <div key={roundNumber} className={styles.round}>
            <h4 className={styles.roundTitle}>
              {getRoundName(parseInt(roundNumber))}
            </h4>
            
            <div className={styles.matches}>
              {bracketData[roundNumber].map((bracket, index) => (
                <div 
                  key={bracket.id} 
                  className={`${styles.match} ${
                    isCurrentParticipantMatch(bracket) ? styles.currentParticipantMatch : ''
                  } ${bracket.bye_match ? styles.byeMatch : ''}`}
                >
                  <div className={styles.matchHeader}>
                    <span className={styles.matchNumber}>
                      Match {bracket.match_number}
                    </span>
                    <span className={`${styles.matchStatus} ${styles[bracket.match_status]}`}>
                      {getMatchStatus(bracket)}
                    </span>
                  </div>

                  <div className={styles.participants}>
                    <div className={`${styles.participant} ${
                      bracket.winner_id === bracket.participant1_id ? styles.winner : ''
                    } ${
                      getParticipantName(bracket.participant1_id) === currentParticipant ? styles.currentParticipant : ''
                    }`}>
                      <span className={styles.participantName}>
                        {getParticipantName(bracket.participant1_id)}
                      </span>
                      {bracket.winner_id === bracket.participant1_id && (
                        <span className={styles.winnerBadge}>✓</span>
                      )}
                    </div>

                    {!bracket.bye_match && (
                      <>
                        <div className={styles.vs}>vs</div>
                        <div className={`${styles.participant} ${
                          bracket.winner_id === bracket.participant2_id ? styles.winner : ''
                        } ${
                          getParticipantName(bracket.participant2_id) === currentParticipant ? styles.currentParticipant : ''
                        }`}>
                          <span className={styles.participantName}>
                            {getParticipantName(bracket.participant2_id)}
                          </span>
                          {bracket.winner_id === bracket.participant2_id && (
                            <span className={styles.winnerBadge}>✓</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>

                  {bracket.match_status === 'completed' && getMatchWinner(bracket) && (
                    <div className={styles.matchResult}>
                      Winner: {getMatchWinner(bracket)}
                    </div>
                  )}

                  {/* Connector line to next round */}
                  {parseInt(roundNumber) < maxRounds && (
                    <div 
                      className={styles.connector}
                      style={getConnectorStyle(parseInt(roundNumber), bracket.match_number)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.legend}>
        <h4>Legend:</h4>
        <div className={styles.legendItems}>
          <div className={styles.legendItem}>
            <div className={`${styles.legendColor} ${styles.currentParticipantColor}`}></div>
            <span>Your matches</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendColor} ${styles.completedColor}`}></div>
            <span>Completed</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendColor} ${styles.inProgressColor}`}></div>
            <span>In Progress</span>
          </div>
          <div className={styles.legendItem}>
            <div className={`${styles.legendColor} ${styles.pendingColor}`}></div>
            <span>Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BracketView;