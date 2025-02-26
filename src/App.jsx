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

  // Load questions when game starts
  useEffect(() => {
    const initializeGame = async () => {
      if (gameStarted) {
        try {
          setIsLoading(true);
          setLoadingMessage('Loading Questions...');
          const questions = await loadGameQuestions(selectedTechType?.id);
          setGameQuestions(questions);
          setDailyDoublePositions(getDailyDoublePositions());
        } catch (error) {
          console.error('Error loading questions:', error);
          setError('Failed to load questions. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeGame();
  }, [gameStarted]);

  useEffect(() => {
    if (gameQuestions && answeredQuestions.size === Object.keys(gameQuestions).length * 5) {
      setIsLoading(true);
      setLoadingMessage('Initializing Game Board...');
      setTimeout(() => {
        setDailyDoublePositions(getDailyDoublePositions());
        setIsLoading(false);
      }, 1500); // Add a slight delay for effect
    }
  }, [gameStarted]);

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

  const handleAnswer = async (answer, wagerAmount = null) => {
    const questionKey = `${selectedQuestion.category}-${selectedQuestion.value}`;
    const correct = answer === selectedQuestion.correctAnswer;
    const points = wagerAmount || selectedQuestion.value;
    const currentPlayerName = currentPlayer === 1 ? player1Name : player2Name;

    setLoadingMessage(
      correct 
        ? `Correct! ${currentPlayerName} gains ${points}mb` 
        : `Incorrect. ${currentPlayerName} loses ${points}mb`
    );
    setIsLoading(true);

    setScores(prev => ({
      ...prev,
      [`player${currentPlayer}`]: prev[`player${currentPlayer}`] + (correct ? points : -points)
    }));

    setAnsweredQuestions(prev => new Set([...prev, questionKey]));
    
    // Save statistics and show transition effect
    await saveGameStatistics(currentPlayerName, selectedQuestion.category, points, correct);
    
    // Add a short delay for the loading animation
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setSelectedQuestion(null);
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    setIsLoading(false);
  };

  const handleTimeout = async () => {
    const questionKey = `${selectedQuestion.category}-${selectedQuestion.value}`;
    const currentPlayerName = currentPlayer === 1 ? player1Name : player2Name;

    setLoadingMessage(`Time's Up! ${currentPlayerName} loses ${selectedQuestion.value}mb`);
    setIsLoading(true);

    setScores(prev => ({
      ...prev,
      [`player${currentPlayer}`]: prev[`player${currentPlayer}`] - selectedQuestion.value
    }));

    setAnsweredQuestions(prev => new Set([...prev, questionKey]));
    
    // Save timeout as incorrect answer and show transition
    await saveGameStatistics(currentPlayerName, selectedQuestion.category, selectedQuestion.value, false);
    
    // Add a short delay for the loading animation
    await new Promise(resolve => setTimeout(resolve, 800));

    setSelectedQuestion(null);
    setCurrentPlayer(currentPlayer === 1 ? 2 : 1);
    setIsLoading(false);
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
    
    // Add a slight delay for effect
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
                onSelect={({techType, player1Name: p1Name, player2Name: p2Name}) => {
                  setSelectedTechType(techType);
                  setPlayer1Name(p1Name);
                  setPlayer2Name(p2Name);
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
            />
            {selectedQuestion && (
              <Question
                question={selectedQuestion.question}
                options={selectedQuestion.options}
                value={selectedQuestion.value}
                onAnswer={handleAnswer}
                onTimeout={handleTimeout}
                isDaily={selectedQuestion.isDaily}
              />
            )}
          </div>
        )
      } />
    </Routes>
  );
}

export default App;
