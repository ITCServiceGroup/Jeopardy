import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getActiveTournaments,
  getTournamentDetails,
  autoCompleteMatch,
  autoCompleteMatchUniversalWrapper
} from '../utils/supabase';
import BracketView from './BracketView';
import styles from './TournamentBracketView.module.css';

const TournamentBracketView = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentDetails, setTournamentDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [useUniversalSystem] = useState(true); // Always use universal system
  const [autoCompletingMatches, setAutoCompletingMatches] = useState(new Set());

  useEffect(() => {
    loadAllTournaments();
  }, []);

  const loadAllTournaments = async () => {
    try {
      setLoading(true);
      const tournamentsData = await getActiveTournaments(); // Note: function name is misleading, it now returns all tournaments
      setTournaments(tournamentsData);
      
      if (tournamentsData.length === 1) {
        // Auto-select if only one tournament
        const tournament = tournamentsData[0];
        setSelectedTournament(tournament);
        const details = await getTournamentDetails(tournament.id);
        setTournamentDetails(details);
      }
    } catch (err) {
      setError('Failed to load tournaments: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleSelectTournament = async (tournament) => {
    try {
      setLoading(true);
      setSelectedTournament(tournament);
      const details = await getTournamentDetails(tournament.id);
      setTournamentDetails(details);
    } catch (err) {
      setError('Failed to load tournament details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMatch = (bracketId, participant1Name, participant2Name) => {
    navigate('/tournament-game', { 
      state: { 
        bracketId, 
        participant1Name,
        participant2Name,
        tournamentId: selectedTournament.id
      } 
    });
  };

  const handleAutoCompleteMatch = async (bracket) => {
    if (autoCompletingMatches.has(bracket.id)) return;
    
    try {
      setAutoCompletingMatches(prev => new Set(prev).add(bracket.id));
      
      console.log('Using universal tournament system');
      await autoCompleteMatchUniversalWrapper(bracket.id);
      
      // Refresh tournament data after auto-completion without page reload
      const refreshedDetails = await getTournamentDetails(selectedTournament.id);
      setTournamentDetails(refreshedDetails);
      
      // Update selected tournament if it's been completed
      const refreshedTournaments = await getActiveTournaments();
      const updatedSelectedTournament = refreshedTournaments.find(t => t.id === selectedTournament.id);
      if (updatedSelectedTournament) {
        setSelectedTournament(updatedSelectedTournament);
      }
    } catch (error) {
      console.error('Error auto-completing match:', error);
      alert('Failed to auto-complete match (Universal system): ' + error.message);
    } finally {
      setAutoCompletingMatches(prev => {
        const newSet = new Set(prev);
        newSet.delete(bracket.id);
        return newSet;
      });
    }
  };

  const clearMessages = () => {
    setError(null);
  };


  // Tournament selection (if multiple tournaments)
  if (tournaments.length > 1 && !selectedTournament) {
    return (
      <div className={styles.bracketView}>
        <div className={styles.header}>
          <h1>Select Tournament</h1>
          <button 
            onClick={() => navigate('/')}
            className={styles.backButton}
          >
            Back to Main Game
          </button>
        </div>

        <div className={styles.tournamentSelection}>
          <h2>Choose Tournament</h2>
          <div className={styles.tournamentGrid}>
            {tournaments.map(tournament => (
              <div
                key={tournament.id}
                className={`${styles.tournamentCard} ${loading ? styles.disabled : ''}`}
                onClick={() => !loading && handleSelectTournament(tournament)}
              >
                <h3>{tournament.name}</h3>
                <p>{tournament.description}</p>
                <div className={styles.tournamentMeta}>
                  <div className={styles.statusRow}>
                    <span className={`${styles.status} ${styles[tournament.status]}`}>
                      {tournament.status.toUpperCase()}
                    </span>
                    {tournament.status === 'completed' && tournament.completed_at && (
                      <div className={styles.completionDate}>
                        {new Date(tournament.completed_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {tournament.status === 'completed' && (
                    <div className={styles.tournamentResults}>
                      {tournament.winner_name && (
                        <div className={styles.winner}>
                          🏆 {tournament.winner_name}
                        </div>
                      )}
                      {tournament.second_place_name && (
                        <div className={styles.secondPlace}>
                          🥈 {tournament.second_place_name}
                        </div>
                      )}
                      {tournament.third_place_name && (
                        <div className={styles.thirdPlace}>
                          🥉 {tournament.third_place_name}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTournament(tournament);
                  }}
                  className={styles.selectButton}
                  disabled={loading}
                >
                  View Bracket
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Main bracket view
  if (selectedTournament && tournamentDetails) {
    return (
      <div className={styles.bracketView}>
        {error && (
          <div className={styles.error} onClick={clearMessages}>
            {error}
          </div>
        )}

        <div className={styles.header}>
          <h1>{selectedTournament.name}</h1>
          <div className={styles.headerActions}>
            {tournaments.length > 1 && (
              <button 
                onClick={() => setSelectedTournament(null)}
                className={styles.backButton}
              >
                Back to Tournaments
              </button>
            )}
            <button 
              onClick={() => navigate('/')}
              className={styles.backButton}
            >
              Back to Main
            </button>
          </div>
        </div>

        {/* Enhanced Bracket View with click handlers */}
        <EnhancedBracketView 
          tournament={tournamentDetails}
          onStartMatch={handleStartMatch}
          tournamentStatus={selectedTournament.status}
          useUniversalSystem={useUniversalSystem}
          onAutoCompleteMatch={handleAutoCompleteMatch}
          autoCompletingMatches={autoCompletingMatches}
        />
      </div>
    );
  }

  // No tournaments found or loading
  return (
    <div className={styles.bracketView}>
      <div className={styles.header}>
        <h1>Tournament Bracket</h1>
        <button 
          onClick={() => navigate('/')}
          className={styles.backButton}
        >
          Back to Main Game
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <p>Loading tournaments...</p>
        </div>
      ) : (
        <div className={styles.noTournaments}>
          <h2>No Tournaments Found</h2>
          <p>There are currently no tournaments available.</p>
          <p>Please contact an administrator to create a tournament.</p>
        </div>
      )}
    </div>
  );
};

// Enhanced BracketView component with click functionality
const EnhancedBracketView = ({ tournament, onStartMatch, tournamentStatus, useUniversalSystem, onAutoCompleteMatch, autoCompletingMatches }) => {
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


  const canPlayMatch = (bracket) => {
    return (
      tournamentStatus === 'active' &&
      bracket.match_status === 'pending' &&
      !bracket.bye_match &&
      bracket.participant1_id && bracket.participant2_id
    );
  };

  const handlePlayMatch = (bracket) => {
    const participant1Name = getParticipantName(bracket.participant1_id);
    const participant2Name = getParticipantName(bracket.participant2_id);
    onStartMatch(bracket.id, participant1Name, participant2Name);
  };


  const canAutoComplete = (bracket) => {
    return (
      tournamentStatus === 'active' &&
      bracket.match_status === 'pending' &&
      !bracket.bye_match &&
      bracket.participant1_id && bracket.participant2_id &&
      !autoCompletingMatches.has(bracket.id)
    );
  };

  if (!tournament?.brackets || tournament.brackets.length === 0) {
    return (
      <div className={styles.noBracket}>
        <h3>Tournament Bracket</h3>
        <p>Tournament brackets have not been generated yet.</p>
      </div>
    );
  }

  return (
    <div className={styles.bracketContainer}>
      <h3>Tournament Bracket</h3>
      
      {tournament.winner_name && (
        <div className={styles.tournamentWinner}>
          <h2>🏆 Tournament Winner: {tournament.winner_name}</h2>
          <h3>🥈 Second Place: {tournament.second_place_name || 'NO DATA'}</h3>
          <h3>🥉 Third Place: {tournament.third_place_name || 'NO DATA'}</h3>
        </div>
      )}

      <div className={styles.rounds}>
        {Object.keys(bracketData).map(roundNumber => (
          <div key={roundNumber} className={styles.round}>
            <h4 className={styles.roundTitle}>
              {getRoundName(parseInt(roundNumber), maxRounds)}
            </h4>
            
            <div className={styles.matches}>
              {bracketData[roundNumber].map((bracket) => (
                <div 
                  key={bracket.id} 
                  className={`${styles.match} ${
                    bracket.bye_match ? styles.byeMatch : ''
                  } ${
                    canPlayMatch(bracket) ? styles.playableMatch : ''
                  }`}
                  onClick={canPlayMatch(bracket) ? () => handlePlayMatch(bracket) : undefined}
                  style={canPlayMatch(bracket) ? { cursor: 'pointer' } : {}}
                >
                  <div className={styles.matchHeader}>
                    <span className={styles.matchNumber}>
                      Match {bracket.match_number}
                    </span>
                    <span className={`${styles.matchStatus} ${styles[bracket.match_status]}`}>
                      {bracket.match_status.toUpperCase()}
                    </span>
                  </div>

                  <div className={styles.participants}>
                    <div className={`${styles.participant} ${
                      bracket.winner_id === bracket.participant1_id ? styles.winner : 
                      (bracket.winner_id && bracket.winner_id === bracket.participant2_id ? styles.loser : '')
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
                          bracket.winner_id === bracket.participant2_id ? styles.winner :
                          (bracket.winner_id && bracket.winner_id === bracket.participant1_id ? styles.loser : '')
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

                  {canPlayMatch(bracket) && (
                    <div className={styles.playMatchPrompt}>
                      Click to Play Match
                    </div>
                  )}

                  {canAutoComplete(bracket) && (
                    <div className={styles.autoCompleteSection}>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onAutoCompleteMatch(bracket);
                        }}
                        className={styles.autoCompleteButton}
                        disabled={autoCompletingMatches.has(bracket.id)}
                      >
                        {autoCompletingMatches.has(bracket.id) ? 'Auto-Completing...' : '🎲 Auto-Complete (Test)'}
                      </button>
                    </div>
                  )}

                  {bracket.match_status === 'completed' && bracket.winner_id && (
                    <div className={styles.matchResult}>
                      Winner: {getParticipantName(bracket.winner_id)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const getRoundName = (roundNumber, maxRounds) => {
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

export default TournamentBracketView;