import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import GameBoard from './GameBoard';
import Scoreboard from './Scoreboard';
import TechTypeSelector from './TechTypeSelector';
import LoadingSpinner from './LoadingSpinner';

const GameContainer = () => {
  const [categories, setCategories] = useState([]);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [gameSession, setGameSession] = useState(null);
  const [techType, setTechType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (techType && gameSession) {
      fetchCategories();
    }
  }, [techType, gameSession]);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          questions (
            id,
            question,
            answer,
            options,
            points
          )
        `)
        .eq('tech_type_id', techType.id)
        .order('name');

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error('No categories found for this tech type');
      }

      setCategories(data);
    } catch (err) {
      setError('Error loading categories: ' + err.message);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGameTypeSelect = ({ techType: selectedType, gameSession: newSession }) => {
    if (!selectedType || !newSession) {
      setError('Invalid game configuration');
      return;
    }

    // Reset game state
    setCategories([]);
    setScores({ player1: 0, player2: 0 });
    setCurrentPlayer(1);
    setError(null);
    
    // Set new game configuration
    setTechType(selectedType);
    setGameSession(newSession);
  };

  const handleQuestionAnswered = async (correct, points, categoryName) => {
    // Update score for current player
    const playerKey = `player${currentPlayer}`;
    const newScores = { 
      ...scores,
      [playerKey]: scores[playerKey] + (correct ? points : -points)
    };
    setScores(newScores);

    // Switch to other player
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);

    // Record statistics
    try {
      await supabase.from('game_statistics').insert({
        game_session_id: gameSession.id,
        tech_type_id: techType.id,
        player1_name: gameSession.player1_name,
        player2_name: gameSession.player2_name,
        question_category: categoryName,
        question_value: points,
        correct,
        current_player: currentPlayer,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error recording statistics:', err);
    }
  };

  const handleGameEnd = async () => {
    try {
      // Update game session with final scores
      await supabase
        .from('game_sessions')
        .update({ 
          end_time: new Date().toISOString(),
          player1_score: scores.player1,
          player2_score: scores.player2,
          winner: scores.player1 > scores.player2 ? 1 : 2
        })
        .eq('id', gameSession.id);
    } catch (err) {
      console.error('Error updating game session:', err);
    }
  };

  if (!techType || !gameSession) {
    return <TechTypeSelector onSelect={handleGameTypeSelect} />;
  }

  if (loading) {
    return <LoadingSpinner message="Loading Questions..." />;
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="game-container">
      <header>
        <h1>{techType.name} Tech Challenge</h1>
        <Scoreboard 
          scores={scores}
          currentPlayer={currentPlayer}
          player1Name={gameSession.player1_name}
          player2Name={gameSession.player2_name}
        />
      </header>

      <div>
        <div className="player-turn">
          Current Player: {currentPlayer === 1 ? gameSession.player1_name : gameSession.player2_name}
        </div>
        <GameBoard
          categories={categories}
          onQuestionAnswered={handleQuestionAnswered}
          onGameEnd={handleGameEnd}
          currentPlayer={currentPlayer}
          player1Name={gameSession.player1_name}
          player2Name={gameSession.player2_name}
        />
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(37, 99, 235, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
          }
        }

        .player-turn {
          background: #2563eb;
          color: white;
          padding: 0.75rem;
          text-align: center;
          font-size: 1.2rem;
          font-weight: 600;
          margin-bottom: 2rem;
          border-radius: 8px;
          animation: pulse 2s infinite;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.2);
          transition: all 0.3s ease;
        }

        .player-turn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .game-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 1rem;
        }

        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        h1 {
          color: #2c3e50;
          margin: 0;
        }

        .error-container {
          text-align: center;
          padding: 2rem;
          color: #e74c3c;
        }

        .error-container button {
          background-color: #e74c3c;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
};

export default GameContainer;
