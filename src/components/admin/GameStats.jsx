import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import styles from './GameStats.module.css';
import ConfirmDialog from '../ConfirmDialog';

const GameStats = () => {
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    requireTextConfirmation: false,
    textConfirmationValue: '',
    onConfirm: null
  });
  const performDeleteGame = async (id) => {
    try {
      const { error } = await supabase
        .from('game_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchStats();
    } catch (err) {
      setError('Error deleting game: ' + err.message);
    }
  };

  const handleDeleteGame = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Game',
      message: 'Are you sure you want to delete this game record? This action cannot be undone.',
      confirmText: 'DELETE',
      confirmButtonStyle: 'danger',
      requireTextConfirmation: true,
      textConfirmationValue: 'DELETE',
      onConfirm: () => performDeleteGame(id)
    });
  };

  const [stats, setStats] = useState([]);
  const [timeRange, setTimeRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      let query = supabase
        .from('game_sessions')
        .select(`
          id,
          start_time,
          end_time,
          player1_name,
          player2_name,
          player1_score,
          player2_score,
          winner,
          tech_type:tech_types(name)
        `)
        .order('end_time', { ascending: false });

      const now = new Date();
      if (timeRange === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        query = query.gte('start_time', today);
      } else if (timeRange === 'week') {
        const lastWeek = new Date(now.setDate(now.getDate() - 7)).toISOString();
        query = query.gte('start_time', lastWeek);
      } else if (timeRange === 'month') {
        const lastMonth = new Date(now.setMonth(now.getMonth() - 1)).toISOString();
        query = query.gte('start_time', lastMonth);
      }

      const { data, error } = await query;
      if (error) throw error;
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculatePerformanceStats = () => {
    if (!stats.length) return null;

    return {
      totalGames: stats.length,
      averageScore: (stats.reduce((acc, game) =>
        acc + Math.max(game.player1_score || 0, game.player2_score || 0), 0) / stats.length).toFixed(2),
      uniquePlayers: new Set([
        ...stats.map(game => game.player1_name),
        ...stats.map(game => game.player2_name)
      ]).size,
      highestScore: Math.max(
        ...stats.map(game => Math.max(game.player1_score || 0, game.player2_score || 0))
      ),
      gamesCompleted: stats.filter(game => game.end_time).length
    };
  };

  const performanceStats = calculatePerformanceStats();

  return (
    <div className={styles.gameStats}>
      <header className={styles.header}>
        <h2>Game Statistics</h2>
        <div className={styles.timeRange}>
          <label className={styles.timeRangeLabel}>Time Range:</label>
          <select
            className={styles.timeRangeSelect}
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
        </div>
      </header>

      {loading && <div>Loading statistics...</div>}
      {error && <div className="error">Error: {error}</div>}

      {performanceStats && (
        <div className={styles.statsGrid}>
          <div className={styles.statsCard}>
            <h3>Total Games</h3>
            <div className={styles.statValue}>{performanceStats.totalGames}</div>
          </div>
          <div className={styles.statsCard}>
            <h3>Average High Score</h3>
            <div className={styles.statValue}>{performanceStats.averageScore}</div>
          </div>
          <div className={styles.statsCard}>
            <h3>Unique Players</h3>
            <div className={styles.statValue}>{performanceStats.uniquePlayers}</div>
          </div>
          <div className={styles.statsCard}>
            <h3>Highest Score</h3>
            <div className={styles.statValue}>{performanceStats.highestScore}</div>
          </div>
        </div>
      )}

      <div className={styles.recentGames}>
        <div className={styles.recentGamesHeader}>
          <h3>Recent Games</h3>
        </div>
        {stats.map((game) => (
          <div key={game.id} className={styles.gameRecord}>
            <div className={styles.gameHeader}>
              <div className={styles.playerName}>
                {game.player1_name} vs {game.player2_name}
              </div>
              <div className={styles.gameType}>{game.tech_type?.name} Tech</div>
            </div>
            <div className={styles.gameDetails}>
              <span>
                Score: {game.player1_score || 0} - {game.player2_score || 0}
              </span>
              <span>
                Winner: {game.winner ? (game.winner === 1 ? game.player1_name : game.player2_name) : 'In Progress'}
              </span>
              <span>
                {new Date(game.start_time).toLocaleDateString()}
              </span>
              <button
                onClick={() => handleDeleteGame(game.id)}
                className={styles.deleteButton}
              >
                Delete Game
              </button>
            </div>
            <div className={styles.performanceBar}>
              <div
                className={styles.performanceFill}
                style={{
                  width: `${(Math.max(game.player1_score || 0, game.player2_score || 0) / performanceStats.highestScore) * 100}%`
                }}
              />
            </div>
          </div>
        ))}
        {!stats.length && (
          <div className={styles.noData}>
            No games played during this time period
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        requireTextConfirmation={confirmDialog.requireTextConfirmation}
        textConfirmationValue={confirmDialog.textConfirmationValue}
      />
    </div>
  );
};

export default GameStats;
