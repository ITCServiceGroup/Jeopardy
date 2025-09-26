import { useState, useEffect } from 'react';
import {
  supabase,
  getTournaments,
  createTournament,
  getTournamentParticipants,
  getAvailableNames,
  addAvailableName,
  removeAvailableName,
  updateAvailableName,
  registerTournamentParticipant,
  registerTournamentParticipantsBulk,
  removeParticipant,
  startTournament,
  getTournamentBrackets,
  deleteTournament,
  generateTournamentBrackets,
  getMarkets,
  createMarket,
} from '../../utils/supabase';
import ConfirmDialog from '../ConfirmDialog';
import Modal from '../Modal';
import styles from './TournamentAdmin.module.css';

const TournamentAdmin = () => {
  const [activeTab, setActiveTab] = useState('tournaments');
  const [tournaments, setTournaments] = useState([]);
  const [availableNames, setAvailableNames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // New tournament form state
  const [newTournament, setNewTournament] = useState({
    name: '',
    description: '',
    market_id: null
  });

  // New tournament modal state
  const [newTournamentModalOpen, setNewTournamentModalOpen] = useState(false);



  // Markets state
  const [markets, setMarkets] = useState([]);
  const [selectedMarketId, setSelectedMarketId] = useState(null);
  const [newMarketModalOpen, setNewMarketModalOpen] = useState(false);
  const [newMarketName, setNewMarketName] = useState('');

  // Edit available name state
  const [editNameModalOpen, setEditNameModalOpen] = useState(false);
  const [editName, setEditName] = useState({ id: null, name: '', market_id: null });

  // New available name state
  const [newAvailableName, setNewAvailableName] = useState('');

  // Selected tournament state
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [tournamentParticipants, setTournamentParticipants] = useState([]);
  const [tournamentBrackets, setTournamentBrackets] = useState([]);

  // Participant management state
  const [selectedParticipantName, setSelectedParticipantName] = useState('');

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    requireTextConfirmation: false,
    textConfirmationValue: '',
    onConfirm: null
  });

  useEffect(() => {
    loadData(selectedMarketId);
  }, [selectedMarketId]);

  const loadData = async (marketId = selectedMarketId) => {
    try {
      setLoading(true);
      const [marketsData, tournamentsData, namesData] = await Promise.all([
        getMarkets(),
        getTournaments(marketId),
        getAvailableNames(marketId)
      ]);

      setMarkets(marketsData);
      setTournaments(tournamentsData);
      setAvailableNames(namesData);
    } catch (err) {
      setError('Failed to load data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMarket = async (e) => {
    e.preventDefault();
    if (!newMarketName.trim()) return;
    try {
      setLoading(true);
      await createMarket(newMarketName.trim());
      setNewMarketName('');
      setNewMarketModalOpen(false);
      setSuccess('Market created successfully!');
      loadData();
    } catch (err) {
      setError('Failed to create market: ' + err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleCreateTournament = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createTournament(newTournament);
      setNewTournament({ name: '', description: '', market_id: selectedMarketId || null });
      setSuccess('Tournament created successfully!');
      setNewTournamentModalOpen(false);
      loadData();
    } catch (err) {
      setError('Failed to create tournament: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAvailableName = async (e) => {
    e.preventDefault();
    if (!newAvailableName.trim()) return;

    try {
      setLoading(true);
      if (!selectedMarketId) {
        setError('Please select a Market from the filter above before adding a name.');
        return;
      }
      await addAvailableName(newAvailableName.trim(), selectedMarketId);
      setNewAvailableName('');
      setSuccess('Name added successfully!');
      loadData(selectedMarketId);
    } catch (err) {
      setError('Failed to add name: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const performRemoveAvailableName = async (nameId) => {
    try {
      setLoading(true);
      await removeAvailableName(nameId);
      setSuccess('Name removed successfully!');
      loadData();
    } catch (err) {
      setError('Failed to remove name: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAvailableName = (nameId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Name',
      message: 'Are you sure you want to remove this name?',
      confirmText: 'REMOVE',


      confirmButtonStyle: 'danger',
      requireTextConfirmation: true,
      textConfirmationValue: 'REMOVE',
      onConfirm: () => performRemoveAvailableName(nameId)
    });
  };

  const handleSelectTournament = async (tournament) => {
    try {
      setLoading(true);
      setSelectedTournament(tournament);
      if (tournament?.market_id && tournament.market_id !== selectedMarketId) {
        setSelectedMarketId(tournament.market_id);
      }
      const [participants, brackets] = await Promise.all([
        getTournamentParticipants(tournament.id),
        getTournamentBrackets(tournament.id)
      ]);
      setTournamentParticipants(participants);
      setTournamentBrackets(brackets);
    } catch (err) {
      setError('Failed to load tournament details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const performGenerateBrackets = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('=== BRACKET GENERATION DEBUG ===');
      console.log('Tournament ID:', selectedTournament.id);
      console.log('Tournament status:', selectedTournament.status);
      console.log('Participant count:', tournamentParticipants.length);
      console.log('Participants:', tournamentParticipants.map(p => ({ id: p.id, name: p.participant_name, status: p.status })));

      const result = await generateTournamentBrackets(selectedTournament.id);
      setSuccess(`Brackets generated successfully! Tournament will have ${result || 'multiple'} rounds.`);
      handleSelectTournament(selectedTournament); // Refresh data
    } catch (err) {
      console.error('=== BRACKET GENERATION ERROR ===');
      console.error('Full error object:', err);
      console.error('Error message:', err.message);
      console.error('Error code:', err.code);
      console.error('Error details:', err.details);
      console.error('Error hint:', err.hint);
      console.error('Supabase error:', err);

      let errorMessage = 'Failed to generate brackets: ';
      if (err.message) {
        errorMessage += err.message;
      } else if (err.details) {
        errorMessage += err.details;
      } else {
        errorMessage += 'Unknown database error';
      }

      if (err.hint) {
        errorMessage += ` (Hint: ${err.hint})`;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBrackets = () => {
    if (!selectedTournament) return;

    // Validate minimum participants
    if (tournamentParticipants.length < 2) {
      setError('Need at least 2 participants to generate brackets');
      return;
    }

    const hasExisting = tournamentBrackets.length > 0;
    const title = hasExisting ? 'Regenerate Brackets' : 'Generate Brackets';
    const confirmMessage = `Generate brackets for ${tournamentParticipants.length} participants? This will replace any existing brackets.`;

    setConfirmDialog({
      isOpen: true,
      title,
      message: confirmMessage,
      confirmText: hasExisting ? 'Regenerate' : 'Generate',
      confirmButtonStyle: 'primary',
      requireTextConfirmation: false,
      onConfirm: () => performGenerateBrackets()
    });
  };

  const performStartTournament = async () => {
    try {
      setLoading(true);
      await startTournament(selectedTournament.id);
      setSuccess('Tournament started successfully!');
      loadData();
      handleSelectTournament({ ...selectedTournament, status: 'active' });
    } catch (err) {
      setError('Failed to start tournament: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTournament = () => {
    if (!selectedTournament) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Start Tournament',
      message: 'Are you sure you want to start this tournament? This cannot be undone.',
      confirmText: 'Start',
      confirmButtonStyle: 'primary',
      requireTextConfirmation: false,
      onConfirm: () => performStartTournament()
    });
  };



  const handleAddParticipant = async () => {
    if (!selectedTournament || !selectedParticipantName) return;

    try {
      setLoading(true);
      await registerTournamentParticipant(selectedTournament.id, selectedParticipantName);
      setSelectedParticipantName('');
      setSuccess(`${selectedParticipantName} added to tournament successfully!`);
      handleSelectTournament(selectedTournament); // Refresh data
    } catch (err) {
      setError('Failed to add participant: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const performAddAllParticipants = async (namesToAdd) => {
    try {
      setLoading(true);
      const inserted = await registerTournamentParticipantsBulk(selectedTournament.id, namesToAdd);
      const added = inserted?.length || 0;
      setSuccess(`Added ${added} participant${added === 1 ? '' : 's'} successfully`);
      await handleSelectTournament(selectedTournament);
    } catch (err) {
      setError('Failed to add participants: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

	  const handleAddAllParticipants = () => {
	    if (!selectedTournament) return;
	    const unregisteredActiveNames = availableNames
	      .filter(n => n.is_active)
	      .map(n => n.name)
	      .filter(name => !tournamentParticipants.some(p => p.participant_name === name));

	    const remainingSlots = Infinity;
	    if (remainingSlots <= 0) {
	      setError('Tournament is already at maximum capacity');
	      return;
	    }

	    if (unregisteredActiveNames.length === 0) {
	      setError('No available names to add');
	      return;
	    }

	    const namesToAdd = unregisteredActiveNames.slice(0, remainingSlots);
	    const extra = unregisteredActiveNames.length - namesToAdd.length;
	    const pluralNames = namesToAdd.length === 1 ? 'participant' : 'participants';
	    const extraMsg = extra > 0 ? `\n\nNote: ${extra} name${extra === 1 ? '' : 's'} will not be added due to capacity.` : '';

	    setConfirmDialog({
	      isOpen: true,
	      title: 'Add All Participants',
	      message: `Add ${namesToAdd.length} ${pluralNames} to the tournament?${extraMsg}`,
	      confirmText: 'Add All',
	      confirmButtonStyle: 'primary',
	      requireTextConfirmation: false,
	      onConfirm: () => performAddAllParticipants(namesToAdd)
	    });
	  };



  const performRemoveAllParticipants = async () => {
    try {
      if (!selectedTournament) return;
      setLoading(true);

      // First clear brackets for this tournament (if any)
      const { error: bracketDeleteError } = await supabase
        .from('tournament_brackets')
        .delete()
        .eq('tournament_id', selectedTournament.id);
      if (bracketDeleteError) {
        throw bracketDeleteError;
      }

      // Then remove all participants
      const toRemove = [...tournamentParticipants];
      await Promise.all(
        toRemove.map(p => removeParticipant(p.id, selectedTournament.id))
      );

      const removed = toRemove.length;
      setSuccess(`Removed ${removed} participant${removed === 1 ? '' : 's'} successfully`);
      await handleSelectTournament(selectedTournament);
    } catch (err) {
      setError('Failed to remove participants: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAllParticipants = () => {
    if (!selectedTournament) return;
    const count = tournamentParticipants.length;
    if (count === 0) {
      setError('No participants to remove');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Remove All Participants',
      message: `Remove all ${count} participant${count === 1 ? '' : 's'} from the tournament?\n\nThis will also clear any existing brackets and cannot be undone.`,
      confirmText: 'REMOVE ALL',
      confirmButtonStyle: 'danger',
      requireTextConfirmation: true,
      textConfirmationValue: 'REMOVE ALL',
      onConfirm: () => performRemoveAllParticipants()
    });
  };

  const performRemoveParticipant = async (participantId, participantName) => {
    try {
      setLoading(true);
      await removeParticipant(participantId, selectedTournament.id);

      // Optimistically update local state
      setTournamentParticipants(prev => prev.filter(p => p.id !== participantId));

      setSuccess(`${participantName} removed from tournament successfully!`);
      await handleSelectTournament(selectedTournament);
    } catch (err) {
      setError('Failed to remove participant: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipant = (participantId, participantName) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Participant',
      message: `Are you sure you want to remove ${participantName} from this tournament?`,
      confirmText: 'Remove',


      confirmButtonStyle: 'danger',
      requireTextConfirmation: false,
      onConfirm: () => performRemoveParticipant(participantId, participantName)
    });
  };

  const handleDeleteTournament = (tournamentId, tournamentName, tournamentStatus) => {
    // Create different confirmation messages based on tournament status
    let title = '';
    let message = '';
    let requireTextConfirmation = false;

    switch (tournamentStatus) {
      case 'setup':
        title = 'Delete Tournament';
        message = `Are you sure you want to delete "${tournamentName}"?\n\nThis tournament is still in setup and can be safely deleted.\n\nThis action cannot be undone.`;
        requireTextConfirmation = false;
        break;
      case 'registration':
        title = 'Delete Tournament';
        message = `Are you sure you want to delete "${tournamentName}"?\n\nThis will delete the tournament and all registered participants.\n\nThis action cannot be undone.`;
        requireTextConfirmation = true;
        break;
      case 'active':
        title = '⚠️ Delete ACTIVE Tournament';
        message = `WARNING: You are about to delete the ACTIVE tournament "${tournamentName}".\n\nThis tournament currently has ongoing matches. All brackets, participants, and match data will be permanently destroyed.\n\nThis action cannot be undone and will affect all participants.`;
        requireTextConfirmation = true;
        break;
      case 'completed':
        title = 'Delete Completed Tournament';
        message = `Are you sure you want to delete the completed tournament "${tournamentName}"?\n\nThis will permanently delete all tournament data including final results, brackets, and participant records.\n\nThis action cannot be undone.`;
        requireTextConfirmation = true;
        break;
      default:
        title = 'Delete Tournament';
        message = `Are you sure you want to delete "${tournamentName}"?\n\nThis action cannot be undone.`;


        requireTextConfirmation = false;
    }

    setConfirmDialog({
      isOpen: true,
      title,
      message,
      confirmText: 'Delete Tournament',
      requireTextConfirmation,
      textConfirmationValue: 'DELETE',
      onConfirm: () => performDeleteTournament(tournamentId, tournamentName)
    });
  };

  const performDeleteTournament = async (tournamentId, tournamentName) => {
    try {
      setLoading(true);
      await deleteTournament(tournamentId);
      setSuccess(`Tournament "${tournamentName}" deleted successfully!`);
      if (selectedTournament?.id === tournamentId) {
        setSelectedTournament(null);
        setTournamentParticipants([]);
        setTournamentBrackets([]);
      }
      loadData();
    } catch (err) {
      setError('Failed to delete tournament: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const closeConfirmDialog = () => {
    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
  };



  const renderTournamentsTab = () => (
    <div className={styles.tournamentsTab}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>

        <button
          onClick={() => { setNewTournament({ name: '', description: '', market_id: selectedMarketId }); setNewTournamentModalOpen(true); }}
          className={styles.primaryButton}
          disabled={loading}
          style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}
        >
          New Tournament
        </button>
      </div>

      <div className={styles.section}>
        <h3>Existing Tournaments</h3>
        <div className={styles.tournamentList}>
          {tournaments.map(tournament => (
            <div key={tournament.id} className={styles.tournamentCard}>
              <div className={styles.tournamentInfo}>
                <h4>{tournament.name}</h4>
                <p>{tournament.description}</p>
                <div className={styles.tournamentMeta}>
                  <span className={`${styles.status} ${styles[tournament.status]}`}>
                    {tournament.status.toUpperCase()}
                  </span>
                  <span>Market: {markets.find(m => m.id === tournament.market_id)?.name || '—'}</span>
                  <span>Tech: Mixed (Install & Service)</span>
                </div>
              </div>
              <div className={styles.tournamentActions}>
                <button
                  onClick={() => handleSelectTournament(tournament)}
                  className={styles.secondaryButton}
                >
                  Manage
                </button>
                <button
                  onClick={() => handleDeleteTournament(tournament.id, tournament.name, tournament.status)}
                  className={styles.dangerButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAvailableNamesTab = () => (
    <div className={styles.availableNamesTab}>
      <div className={styles.section}>
        <h3>Add Available Name</h3>
        <form onSubmit={handleAddAvailableName} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Technician Name</label>
            <input
              type="text"
              value={newAvailableName}
              onChange={(e) => setNewAvailableName(e.target.value)}
              placeholder="Enter technician name"
              required
            />
          </div>

          <button type="submit" disabled={loading} className={styles.primaryButton}>
            Add Name
          </button>
        </form>
      </div>

      <div className={styles.section}>
        <h3>Available Names ({availableNames.filter(n => n.is_active).length})</h3>
        <div className={styles.namesList}>
          {availableNames.filter(n => n.is_active).map(name => (
            <div key={name.id} className={styles.nameCard}>
              <span className={styles.nameText} title={name.name}>{name.name}</span>
              <div className={styles.nameActions}>
                <button
                  onClick={() => handleOpenEditName(name)}
                  className={styles.secondaryButton}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleRemoveAvailableName(name.id)}
                  className={styles.dangerButton}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const handleOpenEditName = (name) => {
    setEditName({ id: name.id, name: name.name, market_id: name.market_id || '' });
    setEditNameModalOpen(true);
  };

  const handleUpdateAvailableName = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const updates = {
        name: (editName.name || '').trim(),
        market_id: editName.market_id || null,
      };
      if (!updates.name) {
        setError('Name cannot be empty.');
        return;
      }
      await updateAvailableName(editName.id, updates);
      setSuccess('Available name updated successfully!');
      setEditNameModalOpen(false);
      await loadData(selectedMarketId);
    } catch (err) {
      setError('Failed to update available name: ' + (err?.message || err));
    } finally {
      setLoading(false);
    }
  };


  const renderTournamentDetail = () => (
    <div className={styles.tournamentDetail}>
      <div className={styles.detailHeader}>
        <h3>{selectedTournament.name}</h3>
        <button
          onClick={() => setSelectedTournament(null)}
          className={styles.secondaryButton}
        >
          Back to List
        </button>
      </div>

      <div className={styles.detailContent}>
        <div className={styles.participantsSection}>
          <h4>Participants ({tournamentParticipants.length})</h4>

          {selectedTournament.status === 'setup' && (
            <div className={styles.addParticipantSection}>
              <div className={styles.addParticipantForm}>
                <select
                  value={selectedParticipantName}
                  onChange={(e) => setSelectedParticipantName(e.target.value)}
                  className={styles.participantSelect}
                >
                  <option value="">Select participant to add...</option>
                  {availableNames
                    .filter(name => name.is_active)
                    .filter(name => !tournamentParticipants.some(p => p.participant_name === name.name))
                    .map(name => (
                      <option key={name.id} value={name.name}>
                        {name.name}
                      </option>
                    ))}
                </select>
                <button
                  onClick={handleAddParticipant}
                  className={styles.primaryButton}
                  disabled={loading || !selectedParticipantName}
                >
                  Add Participant
                </button>
                <button
                  onClick={handleAddAllParticipants}
                  className={styles.secondaryButton}
                  disabled={loading}
                  style={{ marginLeft: '0.5rem' }}
                >
                  Add All Participants
                </button>
                <button
                  onClick={handleRemoveAllParticipants}
                  className={styles.dangerButton}
                  disabled={loading}
                  style={{ marginLeft: '0.5rem' }}
                >
                  Remove All Participants
                </button>
              </div>
            </div>
          )}

          {tournamentParticipants.length === 0 ? (
            <div className={styles.emptyParticipants}>
              No participants registered yet. Use the form above to add participants.
            </div>
          ) : (
            <div className={styles.participantsList}>
              {tournamentParticipants.map((participant, index) => (
                <div key={participant.id} className={styles.participantCard}>
                  <div className={styles.participantHeader}>
                    <div className={styles.participantName}>
                      {participant.participant_name}
                    </div>
                    <div className={styles.participantNumber}>
                      #{index + 1}
                    </div>
                  </div>
                  <div className={styles.participantActions}>
                    <div className={styles.participantStatus}>
                      <span className={`${styles.status} ${styles[participant.status]}`}>
                        {participant.status}
                      </span>
                    </div>
                    {selectedTournament.status === 'setup' && (
                      <button
                        onClick={() => handleRemoveParticipant(participant.id, participant.participant_name)}
                        className={styles.dangerButton}
                        disabled={loading}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles.bracketsSection}>
          <h4>Tournament Brackets</h4>
          {tournamentBrackets.length > 0 ? (
            <div className={styles.bracketsList}>
              {Array.from(new Set(tournamentBrackets.map(b => b.round_number))).map(round => (
                <div key={round} className={styles.roundSection}>
                  <h5>Round {round}</h5>
                  {tournamentBrackets
                    .filter(b => b.round_number === round)
                    .map(bracket => (
                      <div key={bracket.id} className={styles.matchCard}>
                        <span>Match {bracket.match_number}</span>
                        <span>
                          {bracket.participant1_id ?
                            tournamentParticipants.find(p => p.id === bracket.participant1_id)?.participant_name || 'TBD'
                            : 'TBD'
                          } vs {
                          bracket.participant2_id ?
                            tournamentParticipants.find(p => p.id === bracket.participant2_id)?.participant_name || 'TBD'
                            : 'TBD'
                          }
                        </span>
                        <span className={`${styles.status} ${styles[bracket.match_status]}`}>
                          {bracket.match_status}
                        </span>
                      </div>
                    ))}
                </div>
              ))}
            </div>
          ) : (
            <p>No brackets generated yet.</p>
          )}
        </div>

        <div className={styles.tournamentControls}>
          {selectedTournament.status === 'setup' && tournamentParticipants.length >= 2 && (
            <button
              onClick={handleGenerateBrackets}
              className={styles.primaryButton}
              disabled={loading}
            >
              {tournamentBrackets.length > 0 ? 'Regenerate Brackets' : 'Generate Brackets'}
            </button>
          )}
          {selectedTournament.status === 'setup' && tournamentBrackets.length > 0 && (
            <button
              onClick={handleStartTournament}
              className={styles.primaryButton}
              disabled={loading}
            >
              Start Tournament
            </button>
          )}
          <button
            onClick={() => handleDeleteTournament(selectedTournament.id, selectedTournament.name, selectedTournament.status)}
            className={styles.dangerButton}
            disabled={loading}
          >
            Delete Tournament
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.tournamentAdmin}>

      {/* Market Filter */}
      <div className={styles.section}>
        <h3>Market</h3>
        <div className={styles.marketBar}>
          <div className={`${styles.formGroup} ${styles.centeredFormGroup}`}>
            <label className={styles.srOnly}>Market</label>
            <select
              value={selectedMarketId || ''}
              onChange={(e) => setSelectedMarketId(e.target.value || null)}
            >
              <option value="">All Markets</option>
              {markets.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setNewMarketModalOpen(true)}
            className={styles.secondaryButton}
            disabled={loading}
          >
            New Market
          </button>
        </div>
      </div>


      {/* New Tournament Modal */}
      <Modal isOpen={newTournamentModalOpen} onClose={() => setNewTournamentModalOpen(false)}>
        <div className={styles.section}>
          <h3>Create New Tournament</h3>
          <form onSubmit={handleCreateTournament} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Tournament Name</label>
              <input
                type="text"
                value={newTournament.name}
                onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                value={newTournament.description}
                onChange={(e) => setNewTournament({ ...newTournament, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Market</label>
              <select
                value={newTournament.market_id || selectedMarketId || ''}
                onChange={(e) => setNewTournament({ ...newTournament, market_id: e.target.value || null })}
              >
                <option value="">Unassigned</option>
                {markets.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>




            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className={styles.secondaryButton} onClick={() => setNewTournamentModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className={styles.primaryButton}>
                Create Tournament
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* New Market Modal */}
      <Modal isOpen={newMarketModalOpen} onClose={() => setNewMarketModalOpen(false)}>
        <div className={styles.section}>
          <h3>Create New Market</h3>
          <form onSubmit={handleCreateMarket} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Market Name</label>
              <input
                type="text"
                value={newMarketName}
                onChange={(e) => setNewMarketName(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" className={styles.secondaryButton} onClick={() => setNewMarketModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className={styles.primaryButton}>
                Create Market
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Edit Available Name Modal */}
      <Modal isOpen={editNameModalOpen} onClose={() => setEditNameModalOpen(false)}>
        <div className={styles.section}>
          <h3>Edit Available Name</h3>
          <form onSubmit={handleUpdateAvailableName} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Name</label>
              <input
                type="text"
                value={editName.name}
                onChange={(e) => setEditName({ ...editName, name: e.target.value })}
                placeholder="Technician name"
              />
            </div>
            <div className={styles.formGroup}>
              <label>Market</label>
              <select
                value={editName.market_id || ''}
                onChange={(e) => setEditName({ ...editName, market_id: e.target.value || null })}
              >
                <option value="">Unassigned</option>
                {markets.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setEditNameModalOpen(false)} className={styles.secondaryButton}>
                Cancel
              </button>
              <button type="submit" className={styles.primaryButton} disabled={loading}>
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </Modal>


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

      {selectedTournament ? (
        renderTournamentDetail()
      ) : (
        <>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'tournaments' ? styles.active : ''}`}
              onClick={() => setActiveTab('tournaments')}
            >
              Tournaments
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'names' ? styles.active : ''}`}
              onClick={() => setActiveTab('names')}
            >
              Available Names
            </button>
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'tournaments' && renderTournamentsTab()}
            {activeTab === 'names' && renderAvailableNamesTab()}
          </div>
        </>
      )}



      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmButtonStyle={confirmDialog.confirmButtonStyle || 'danger'}
        requireTextConfirmation={confirmDialog.requireTextConfirmation}
        textConfirmationValue={confirmDialog.textConfirmationValue}
      />
    </div>
  );
};

export default TournamentAdmin;