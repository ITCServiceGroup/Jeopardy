import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import GameBoard from './GameBoard';
import Scoreboard from './Scoreboard';
import TechTypeSelector from './TechTypeSelector';
import LoadingSpinner from './LoadingSpinner';

const GameContainer = () => {
  const [categories, setCategories] = useState([]);
  const [score, setScore] = useState(0);
  const [gameSession, setGameSession] = useState(null);
  const [techType, setTechType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (techType) {
      fetchCategories();
    }
  }, [techType]);

  const fetchCategories = async () => {
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

      setCategories(data);
    } catch (err) {
      setError('Error loading categories: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGameTypeSelect = ({ techType: selectedType, gameSession: newSession }) => {
    setTechType(selectedType);
    setGameSession(newSession);
  };

  const handleQuestionAnswered = async (correct, points, categoryName) => {
    // Update score
    const newScore = score + (correct ? points : -points);
    setScore(newScore);

    // Record statistics
    try {
      await supabase.from('game_statistics').insert({
        game_session_id: gameSession.id,
        tech_type_id: techType.id,
        player_name: gameSession.player_name,
        question_category: categoryName,
        question_value: points,
        correct
      });
    } catch (err) {
      console.error('Error recording statistics:', err);
    }
  };

  const handleGameEnd = async () => {
    try {
      // Update game session with final score
      await supabase
        .from('game_sessions')
        .update({ 
          end_time: new Date().toISOString(),
          final_score: score 
        })
        .eq('id', gameSession.id);
    } catch (err) {
      console.error('Error updating game session:', err);
    }
  };

  if (!techType) {
    return <TechTypeSelector onSelect={handleGameTypeSelect} />;
  }

  if (loading) {
    return <LoadingSpinner message="Loading game board..." />;
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
        <Scoreboard score={score} />
      </header>

      <GameBoard
        categories={categories}
        onQuestionAnswered={handleQuestionAnswered}
        onGameEnd={handleGameEnd}
      />

      <style jsx>{`
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
