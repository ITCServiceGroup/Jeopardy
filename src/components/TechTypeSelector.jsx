import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';
import LoadingSpinner from './LoadingSpinner';
import '../styles/TechTypeSelector.css';

const TechTypeSelector = ({ onSelect }) => {
  const [techTypes, setTechTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');

  useEffect(() => {
    fetchTechTypes();
  }, []);

  const fetchTechTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('tech_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setTechTypes(data);
    } catch (err) {
      setError('Error loading tech types: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (techType) => {
    if (!player1Name.trim() || !player2Name.trim()) {
      setError('Please enter names for both players');
      return;
    }

    setSelectedType(techType);
    setError(null);

    try {
      // Pass tech type and player names to parent
      onSelect({
        techType,
        player1Name,
        player2Name
      });
    } catch (err) {
      setError('Error starting game: ' + err.message);
      setSelectedType(null);
    }
  };

  if (loading) return <LoadingSpinner message="Loading game options..." />;

  if (error) {
    return (
      <div className="tech-type-selector">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="tech-type-selector">
      <h2>Welcome to ITC Jeopardy!</h2>
      <p>Test your knowledge as an Install or Service Technician</p>
      <div className="player-inputs">
        <div className="player-input">
          <label htmlFor="player1Name">Player 1 Name:</label>
          <input
            type="text"
            id="player1Name"
            value={player1Name}
            onChange={(e) => setPlayer1Name(e.target.value)}
            placeholder="Enter Player 1 Name"
            required
          />
        </div>
        <div className="player-input">
          <label htmlFor="player2Name">Player 2 Name:</label>
          <input
            type="text"
            id="player2Name"
            value={player2Name}
            onChange={(e) => setPlayer2Name(e.target.value)}
            placeholder="Enter Player 2 Name"
            required
          />
        </div>
      </div>

      <div className="tech-type-buttons">
        {techTypes.map((type) => (
          <button
            key={type.id}
            className={`tech-type-button ${type.name.toLowerCase()}`}
            onClick={() => handleSelect(type)}
            disabled={loading || !player1Name.trim() || !player2Name.trim()}
          >
            {type.name} Tech
            <div className="button-description">
              {type.name === 'Install' 
                ? 'Test your installation knowledge'
                : 'Test your service expertise'}
            </div>
          </button>
        ))}
      </div>

      {selectedType && (
        <div className="loading-overlay">
          <LoadingSpinner message={`Preparing ${selectedType.name} Tech Challenge...`} />
        </div>
      )}
    </div>
  );
};

export default TechTypeSelector;
