import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import GameBoard from './GameBoard';
import Question from './Question';
import Scoreboard from './Scoreboard';
import LoadingSpinner from './LoadingSpinner';
import { 
  loadTournamentGameQuestions, 
  saveGameStatistics,
  createTournamentGameSession,
  completeTournamentMatch,
  getTournamentDetails
} from '../utils/supabase';
import styles from './TournamentGame.module.css';

const TournamentGame = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Tournament specific data from navigation state
  const { bracketId, participant1Name, participant2Name, tournamentId } = location.state || {};
  
  const [gameQuestions, setGameQuestions] = useState(null);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [gameSessionId, setGameSessionId] = useState(null);
  const [tournament, setTournament] = useState(null);

  // Player names for tournament
  const player1Name = participant1Name;
  const player2Name = participant2Name;

  useEffect(() => {
    if (!bracketId || !participant1Name || !participant2Name || !tournamentId) {
      setError('Missing tournament match information');
      return;
    }
    
    loadTournamentData();
  }, [bracketId, participant1Name, participant2Name, tournamentId]);

  useEffect(() => {
    if (gameStarted) {
      initializeGame();
    }
  }, [gameStarted]);

  useEffect(() => {
    if (gameQuestions && answeredQuestions.size === Object.keys(gameQuestions).length * 5) {
      endGame();
    }
  }, [answeredQuestions, gameQuestions]);

  const loadTournamentData = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Loading tournament details...');
      
      const tournamentDetails = await getTournamentDetails(tournamentId);
      setTournament(tournamentDetails);
      
      // Create tournament game session
      const { gameSession } = await createTournamentGameSession(
        tournamentId, 
        bracketId, 
        player1Name, 
        player2Name
      );
      setGameSessionId(gameSession.id);
      
      setGameStarted(true);
    } catch (err) {
      setError('Failed to start tournament match: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeGame = async () => {
    try {
      setIsLoading(true);
      setLoadingMessage('Loading Mixed Tech Type Questions...');
      
      const questions = await loadTournamentGameQuestions();
      
      if (!questions || Object.keys(questions).length === 0) {
        throw new Error('No questions found for tournament');
      }
      
      setGameQuestions(questions);
    } catch (err) {
      setError(`Failed to load questions: ${err.message}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswer = async (correct, points, categoryName, questionId) => {
    try {
      const questionKey = `${categoryName}-${points}`;
      
      const message = correct 
        ? `Correct! ${currentPlayer === 1 ? player1Name : player2Name} gains ${points}mb` 
        : `Incorrect. ${currentPlayer === 1 ? player1Name : player2Name} loses ${points}mb`;
      setLoadingMessage(message);
      setIsLoading(true);

      const scoreChange = correct ? points : -points;
      const newScores = {
        ...scores,
        [`player${currentPlayer}`]: scores[`player${currentPlayer}`] + scoreChange
      };
      
      setScores(newScores);
      setAnsweredQuestions(prev => new Set([...prev, questionKey]));

      // Save tournament game statistics
      if (!selectedQuestion?.isPlaceholder && gameSessionId) {
        try {
          await saveGameStatistics(
            player1Name,
            player2Name,
            null, // No tech type for tournament games
            questionId,
            correct,
            currentPlayer
          );
        } catch (statsError) {
          console.error('Failed to save tournament statistics:', statsError);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error('Error in tournament game flow:', error);
    } finally {
      setSelectedQuestion(null);
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const endGame = async () => {
    setGameEnded(true);
    
    try {
      setIsLoading(true);
      setLoadingMessage('Processing tournament match result...');
      
      // Determine winner
      const winner = scores.player1 > scores.player2 ? 1 : (scores.player2 > scores.player1 ? 2 : null);
      
      if (winner && gameSessionId) {
        // Get winner participant ID
        const winnerName = winner === 1 ? player1Name : player2Name;
        const winnerParticipant = tournament.participants.find(p => p.participant_name === winnerName);
        
        if (winnerParticipant) {
          await completeTournamentMatch(bracketId, gameSessionId, winnerParticipant.id);
        }
      }
      
      // Wait a moment to show the processing message
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error('Error completing tournament match:', error);
      setError('Failed to process match result: ' + error.message);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const returnToTournament = () => {
    navigate('/tournament');
  };

  if (error) {
    return (
      <div className={styles.tournamentGame}>
        <div className={styles.error}>
          <h2>Tournament Match Error</h2>
          <p>{error}</p>
          <button onClick={returnToTournament} className={styles.returnButton}>
            Return to Tournament Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!gameStarted || !gameQuestions) {
    return (
      <div className={styles.tournamentGame}>
        {isLoading && 
          <LoadingSpinner 
            message={loadingMessage}
          />
        }
      </div>
    );
  }

  if (gameEnded) {
    const winner = scores.player1 > scores.player2 ? player1Name : 
                  (scores.player2 > scores.player1 ? player2Name : null);
    
    return (
      <div className={styles.tournamentGame}>
        {isLoading && 
          <LoadingSpinner 
            message={loadingMessage}
          />
        }
        <div className={styles.gameEnd}>
          <div className={styles.tournamentHeader}>
            <h1>Tournament Match Complete!</h1>
            <p>Match: {player1Name} vs {player2Name}</p>
          </div>
          
          <div className={styles.finalScores}>
            <div className={`${styles.playerScore} ${winner === player1Name ? styles.winner : ''}`}>
              <h2>{player1Name}</h2>
              <p>{scores.player1 >= 1000 ? `${scores.player1/1000}gb` : `${scores.player1}mb`}</p>
            </div>
            <div className={`${styles.playerScore} ${winner === player2Name ? styles.winner : ''}`}>
              <h2>{player2Name}</h2>
              <p>{scores.player2 >= 1000 ? `${scores.player2/1000}gb` : `${scores.player2}mb`}</p>
            </div>
          </div>
          
          {winner ? (
            <h2 className={styles.winnerAnnouncement}>
              🏆 {winner} Advances to the Next Round!
            </h2>
          ) : (
            <h2 className={styles.winnerAnnouncement}>
              It's a Tie! (Tournament rules will determine advancement)
            </h2>
          )}
          
          <button onClick={returnToTournament} className={styles.returnButton}>
            Return to Tournament Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.tournamentGame}>
      {isLoading && 
        <LoadingSpinner 
          message={loadingMessage}
          className={
            loadingMessage.includes('Correct!') ? 'correct' :
            loadingMessage.includes('Incorrect') || loadingMessage.includes('Time\'s Up!') ? 'incorrect' :
            ''
          }
        />
      }
      
      <div className={styles.tournamentHeader}>
        <h1>Tournament Match</h1>
        <p>{player1Name} vs {player2Name}</p>
        <button onClick={returnToTournament} className={styles.returnButton}>
          Forfeit & Return to Tournament
        </button>
      </div>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      <Scoreboard 
        scores={scores} 
        currentPlayer={currentPlayer}
        player1Name={player1Name}
        player2Name={player2Name}
      />
      
      <GameBoard 
        categories={Object.keys(gameQuestions || {}).map(categoryName => {
          const questions = Object.entries(gameQuestions[categoryName] || {}).map(([points, q]) => ({
            ...q,
            points: parseInt(points, 10),
            value: parseInt(points, 10),
            category: categoryName,
            id: q.id || `${categoryName}-${points}`
          }));
          return {
            id: categoryName,
            name: categoryName,
            questions
          };
        })}
        onQuestionAnswered={handleAnswer}
        onGameEnd={() => setGameEnded(true)}
        currentPlayer={currentPlayer}
        player1Name={player1Name}
        player2Name={player2Name}
        scores={scores}
      />
    </div>
  );
};

export default TournamentGame;