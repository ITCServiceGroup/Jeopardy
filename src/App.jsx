import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import GameBoard from './components/GameBoard';
import Question from './components/Question';
import Scoreboard from './components/Scoreboard';
import LoadingSpinner from './components/LoadingSpinner';
import AdminDashboard from './components/admin/AdminDashboard';
import TechTypeSelector from './components/TechTypeSelector';
import { getDailyDoublePositions, isDailyDouble } from './data/questions';
import { loadGameQuestions, saveGameStatistics } from './utils/supabase';
import './App.css';

function App() {
  const [gameQuestions, setGameQuestions] = useState(null);
  const [scores, setScores] = useState({ player1: 0, player2: 0 });
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [dailyDoublePositions, setDailyDoublePositions] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState(new Set());
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [selectedTechType, setSelectedTechType] = useState(null);

  useEffect(() => {
    const initializeGame = async () => {
      if (gameStarted) {
        try {
          setIsLoading(true);
          setLoadingMessage('Loading Questions...');
          console.log('Loading questions for tech type ID:', selectedTechType?.id);
          
          if (!selectedTechType?.id) {
            throw new Error('No tech type ID provided');
          }
          
          const questions = await loadGameQuestions(selectedTechType.id);
          console.log('Questions loaded:', questions);
          
          if (!questions || Object.keys(questions).length === 0) {
            throw new Error('No questions found for this tech type');
          }
          
          setGameQuestions(questions);
          setDailyDoublePositions(getDailyDoublePositions());
          console.log('Game initialized successfully');
        } catch (error) {
          console.error('Error loading questions:', error);
          setError(`Failed to load questions: ${error.message}. Please try again.`);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeGame();
  }, [gameStarted, selectedTechType]);

  useEffect(() => {
    if (gameQuestions && answeredQuestions.size === Object.keys(gameQuestions).length * 5) {
      setGameEnded(true);
    }
  }, [answeredQuestions]);

  const handleQuestionSelect = (category, value) => {
    if (!gameQuestions || answeredQuestions.has(`${category}-${value}`)) return;

    const isDaily = isDailyDouble(category, value, dailyDoublePositions);
    setSelectedQuestion({
      ...gameQuestions[category][value],
      category,
      value,
      isDaily
    });
  };

  const handleAnswer = async (correct, points, categoryName, questionId) => {
    console.log('App - handleAnswer received:', {
      correct,
      points,
      categoryName,
      currentPlayer,
      currentScores: scores
    });

    try {
      const questionKey = `${categoryName}-${points}`;
      
      // Set loading state and message immediately
      const message = correct 
        ? `Correct! ${currentPlayer === 1 ? player1Name : player2Name} gains ${points}mb` 
        : `Incorrect. ${currentPlayer === 1 ? player1Name : player2Name} loses ${points}mb`;
      setLoadingMessage(message);
      setIsLoading(true);

      // Update scores
      const scoreChange = correct ? points : -points;
      const newScores = {
        ...scores,
        [`player${currentPlayer}`]: scores[`player${currentPlayer}`] + scoreChange
      };
      
      console.log('App - updating score:', {
        player: currentPlayer,
        points,
        scoreChange,
        oldScore: scores[`player${currentPlayer}`],
        newScore: newScores[`player${currentPlayer}`]
      });
      
      setScores(newScores);
      setAnsweredQuestions(prev => new Set([...prev, questionKey]));

      // Save statistics if it's not a placeholder question
      if (!selectedQuestion?.isPlaceholder) {
        try {
          if (!selectedTechType?.id) {
            throw new Error('No tech type ID available');
          }

          const actualQuestionId = questionId;
          if (!actualQuestionId) {
            throw new Error('No valid question ID available');
          }

          console.log('Saving game statistics:', {
            actualQuestionId,
            techTypeId: selectedTechType.id,
            categoryName,
            points,
            correct
          });
          
          await saveGameStatistics(
            player1Name,
            player2Name,
            selectedTechType.id,
            actualQuestionId,
            correct,
            currentPlayer
          );
        } catch (statsError) {
          console.error('Failed to save statistics:', statsError);
        }
      }

      // Show the result message
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error('Error in game flow:', error);
    } finally {
      // Clear states and switch players
      setSelectedQuestion(null);
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleTimeout = async () => {
    if (!selectedQuestion) return;

    try {
      const questionKey = `${selectedQuestion.category}-${selectedQuestion.value}`;
      
      setLoadingMessage(`Time's Up! ${currentPlayer === 1 ? player1Name : player2Name} loses ${selectedQuestion.value}mb`);
      setIsLoading(true);

      const scoreChange = -selectedQuestion.value;
      const newScores = {
        ...scores,
        [`player${currentPlayer}`]: scores[`player${currentPlayer}`] + scoreChange
      };
      
      setScores(newScores);
      setAnsweredQuestions(prev => new Set([...prev, questionKey]));
      
      if (!selectedQuestion.isPlaceholder) {
        await saveGameStatistics(
          player1Name,
          player2Name,
          selectedTechType.id,
          selectedQuestion.id,
          false, // timeout is always incorrect
          currentPlayer
        );
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('Error in timeout flow:', error);
    } finally {
      setSelectedQuestion(null);
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const startGame = () => {
    if (!selectedTechType) {
      setError('Please select a tech type first');
      setTimeout(() => setError(null), 3000);
      return;
    }
    if (!player1Name.trim() || !player2Name.trim()) {
      setError('Please enter names for both players');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setGameStarted(true);
  };

  const resetGame = async () => {
    setIsLoading(true);
    setLoadingMessage('Resetting Game...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setScores({ player1: 0, player2: 0 });
    setCurrentPlayer(1);
    setSelectedQuestion(null);
    setDailyDoublePositions([]);
    setAnsweredQuestions(new Set());
    setGameEnded(false);
    setGameStarted(false);
    setPlayer1Name('');
    setPlayer2Name('');
    setSelectedTechType(null);
    setError(null);
    setIsLoading(false);
  };

  return (
    <Routes>
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/" element={
        !gameStarted ? (
          <div className="player-setup">
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
            <Link to="/admin" className="admin-link">Admin Dashboard</Link>
            {error && <div className="error-message">{error}</div>}
            {!selectedTechType ? (
              <TechTypeSelector 
                onSelect={({techType, gameSession, player1Name, player2Name}) => {
                  setSelectedTechType(techType);
                  setPlayer1Name(player1Name);
                  setPlayer2Name(player2Name);
                }}
              />
            ) : (
              <div className="selected-tech">
                <h3>Selected: {selectedTechType.name} Tech</h3>
                <div className="player-names">
                  <p>Player 1: {player1Name}</p>
                  <p>Player 2: {player2Name}</p>
                </div>
                <div className="button-group">
                  <button onClick={() => {
                    setSelectedTechType(null);
                    setPlayer1Name('');
                    setPlayer2Name('');
                  }}>Change Selection</button>
                  <button onClick={startGame}>Start Game</button>
                </div>
              </div>
            )}
          </div>
        ) : gameEnded ? (
          <div className="game-end">
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
            <h1>Game Over!</h1>
            <div className="final-scores">
              <div className="player-score">
                <h2>{player1Name}</h2>
                <p>{scores.player1 >= 1000 ? `${scores.player1/1000}gb` : `${scores.player1}mb`}</p>
              </div>
              <div className="player-score">
                <h2>{player2Name}</h2>
                <p>{scores.player2 >= 1000 ? `${scores.player2/1000}gb` : `${scores.player2}mb`}</p>
              </div>
            </div>
            {scores.player1 !== scores.player2 ? (
              <h2 className="winner">
                {scores.player1 > scores.player2 ? player1Name : player2Name} Wins!
              </h2>
            ) : (
              <h2 className="winner">It's a Tie!</h2>
            )}
            <button onClick={resetGame} className="play-again">Play Again</button>
          </div>
        ) : (
          <div className="app">
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
            <h1>ITC Jeopardy</h1>
            {error && <div className="error-message">{error}</div>}
            <Scoreboard 
              scores={scores} 
              currentPlayer={currentPlayer}
              player1Name={player1Name}
              player2Name={player2Name}
            />
            <GameBoard 
              onQuestionSelect={handleQuestionSelect}
              answeredQuestions={answeredQuestions}
              questions={gameQuestions}
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
            />
            {selectedQuestion && (
              <Question
                question={selectedQuestion}
                options={selectedQuestion.options}
                value={selectedQuestion.value}
                onAnswer={(correct, points, category) => handleAnswer(correct, points, category, selectedQuestion?.id)}
                onTimeout={handleTimeout}
                isDaily={selectedQuestion.isDaily}
                currentPlayer={currentPlayer}
                player1Name={player1Name}
                player2Name={player2Name}
              />
            )}
          </div>
        )}
      />
    </Routes>
  );
}

export default App;
