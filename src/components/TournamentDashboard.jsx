import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getTournamentsForParticipant, 
  getAvailableNames,
  getTournamentDetails
} from '../utils/supabase';
import BracketView from './BracketView';
import styles from './TournamentDashboard.module.css';

const TournamentDashboard = () => {
  const navigate = useNavigate();
  const [participantName, setParticipantName] = useState(null);
  const [availableNames, setAvailableNames] = useState([]);
  const [userTournaments, setUserTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tournamentDetails, setTournamentDetails] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const namesData = await getAvailableNames();
      setAvailableNames(namesData.filter(name => name.is_active));
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserTournaments = async (selectedName) => {
    try {
      setLoading(true);
      const userTournamentsData = await getTournamentsForParticipant(selectedName);
      setUserTournaments(userTournamentsData);
      
      if (userTournamentsData.length > 0) {
        // Auto-select the first tournament if only one exists
        const firstTournament = userTournamentsData[0];
        setSelectedTournament(firstTournament);
        const details = await getTournamentDetails(firstTournament.id);
        setTournamentDetails(details);
      }
    } catch (err) {
      setError('Failed to load tournaments: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectName = async (name) => {
    setParticipantName(name);
    setError(null);
    await loadUserTournaments(name);
  };

  const handleSelectTournament = async (tournament) => {
    try {
      setLoading(true);
      const details = await getTournamentDetails(tournament.id);
      setSelectedTournament(tournament);
      setTournamentDetails(details);
    } catch (err) {
      setError('Failed to load tournament details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleStartMatch = (bracketId, opponent) => {
    // Navigate to tournament game with match details
    navigate('/tournament-game', { 
      state: { 
        bracketId, 
        participantName, 
        opponent,
        tournamentId: selectedTournament.id
      } 
    });
  };

  const isParticipantRegistered = () => {
    if (!tournamentDetails || !participantName) return false;
    return tournamentDetails.participants.some(p => p.participant_name === participantName);
  };

  const getParticipantStatus = () => {
    if (!tournamentDetails || !participantName) return null;
    const participant = tournamentDetails.participants.find(p => p.participant_name === participantName);
    return participant?.status || null;
  };

  const getNextMatch = () => {
    if (!tournamentDetails || !participantName) return null;
    
    const participant = tournamentDetails.participants.find(p => p.participant_name === participantName);
    if (!participant) return null;

    // Find next pending match for this participant
    const nextMatch = tournamentDetails.brackets.find(bracket => 
      (bracket.participant1_id === participant.id || bracket.participant2_id === participant.id) &&
      bracket.match_status === 'pending'
    );

    return nextMatch;
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  if (!participantName) {
    return (
      <div className={styles.tournamentDashboard}>
        <div className={styles.header}>
          <h1>Tournament Dashboard</h1>
          <button 
            onClick={() => navigate('/')}
            className={styles.backButton}
          >
            Back to Main Game
          </button>
        </div>

        <div className={styles.nameSelection}>
          <h2>Select Your Name</h2>
          <p>Choose your name to view your tournament(s) and matches:</p>
          <div className={styles.namesList}>
            {availableNames.map(name => (
              <button
                key={name.id}
                className={styles.nameButton}
                onClick={() => handleSelectName(name.name)}
              >
                {name.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (participantName && userTournaments.length === 0 && !loading) {
    return (
      <div className={styles.tournamentDashboard}>
        <div className={styles.header}>
          <h1>Tournament Dashboard</h1>
          <div className={styles.headerActions}>
            <span className={styles.participantName}>Playing as: {participantName}</span>
            <button 
              onClick={() => setParticipantName(null)}
              className={styles.backButton}
            >
              Change Name
            </button>
            <button 
              onClick={() => navigate('/')}
              className={styles.backButton}
            >
              Back to Main Game
            </button>
          </div>
        </div>

        <div className={styles.noTournaments}>
          <h2>No Tournaments Found</h2>
          <p>You are not currently registered for any active tournaments.</p>
          <p>Please contact an administrator to be added to a tournament.</p>
        </div>
      </div>
    );
  }

  if (selectedTournament && tournamentDetails) {
    return (
      <div className={styles.tournamentDashboard}>
        {error && (
          <div className={styles.error} onClick={clearMessages}>
            {error}
          </div>
        )}
        {success && (
          <div className={styles.success} onClick={clearMessages}>
            {success}
          </div>
        )}

        <div className={styles.header}>
          <h1>{selectedTournament.name}</h1>
          <div className={styles.headerActions}>
            <span className={styles.participantName}>Playing as: {participantName}</span>
            <button 
              onClick={() => {
                setSelectedTournament(null);
                setTournamentDetails(null);
              }}
              className={styles.backButton}
            >
              Back to Tournaments
            </button>
          </div>
        </div>

        <div className={styles.tournamentContent}>
          <div className={styles.statusPanel}>
            <div className={styles.statusCard}>
              <h3>Tournament Status</h3>
              <span className={`${styles.status} ${styles[selectedTournament.status]}`}>
                {selectedTournament.status.toUpperCase()}
              </span>
            </div>

            <div className={styles.statusCard}>
              <h3>Your Status</h3>
              <span className={`${styles.status} ${styles[getParticipantStatus()]}`}>
                {getParticipantStatus()?.toUpperCase() || 'NOT REGISTERED'}
              </span>
            </div>

            <div className={styles.statusCard}>
              <h3>Participants</h3>
              <span>{tournamentDetails.participants.length}/{selectedTournament.max_participants}</span>
            </div>
          </div>

          {/* Tournament action sections */}
              {getNextMatch() && selectedTournament.status === 'active' && (
                <div className={styles.nextMatchSection}>
                  <h3>Your Next Match</h3>
                  <div className={styles.matchCard}>
                    <p>Round {getNextMatch().round_number}, Match {getNextMatch().match_number}</p>
                    <p>
                      Opponent: {
                        getNextMatch().participant1_id !== tournamentDetails.participants.find(p => p.participant_name === participantName)?.id
                          ? tournamentDetails.participants.find(p => p.id === getNextMatch().participant1_id)?.participant_name
                          : tournamentDetails.participants.find(p => p.id === getNextMatch().participant2_id)?.participant_name
                      }
                    </p>
                    <button 
                      onClick={() => handleStartMatch(
                        getNextMatch().id,
                        getNextMatch().participant1_id !== tournamentDetails.participants.find(p => p.participant_name === participantName)?.id
                          ? tournamentDetails.participants.find(p => p.id === getNextMatch().participant1_id)?.participant_name
                          : tournamentDetails.participants.find(p => p.id === getNextMatch().participant2_id)?.participant_name
                      )}
                      className={styles.startMatchButton}
                    >
                      Start Match
                    </button>
                  </div>
                </div>
              )}

          <BracketView 
            tournament={tournamentDetails}
            currentParticipant={participantName}
          />
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className={styles.tournamentDashboard}>
      <div className={styles.header}>
        <h1>Tournament Dashboard</h1>
        <div className={styles.headerActions}>
          <span className={styles.participantName}>Playing as: {participantName}</span>
          <button 
            onClick={() => setParticipantName(null)}
            className={styles.backButton}
          >
            Change Name
          </button>
          <button 
            onClick={() => navigate('/')}
            className={styles.backButton}
          >
            Back to Main Game
          </button>
        </div>
      </div>

      <div className={styles.loading}>
        <p>Loading tournament information...</p>
      </div>
    </div>
  );
};

export default TournamentDashboard;