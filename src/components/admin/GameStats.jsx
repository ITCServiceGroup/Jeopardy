import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import LoadingSpinner from '../LoadingSpinner';
import styles from './GameStats.module.css';

const GameStats = () => {
  const [stats, setStats] = useState(null);
  const [recentGames, setRecentGames] = useState([]);
  const [techTypes, setTechTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('all');

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    try {
      // Build date filter for time range
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          startDate = null;
      }

      // Fetch tech types
      const { data: techTypesData, error: techTypesError } = await supabase
        .from('tech_types')
        .select('*')
        .order('name');
      
      if (techTypesError) throw techTypesError;
      setTechTypes(techTypesData);

      // Fetch performance statistics
      const { data: statsData, error: statsError } = await supabase
        .from('tech_performance_stats')
        .select('*');

      if (statsError) throw statsError;
      setStats(statsData);

      // Fetch recent games
      let gamesQuery = supabase
        .from('game_sessions')
        .select(`
          id,
          player_name,
          final_score,
          start_time,
          tech_type_id,
          tech_types:tech_types(
            name
          )
        `)
        .order('start_time', { ascending: false })
        .limit(10);

      if (startDate) {
        gamesQuery = gamesQuery.gte('start_time', startDate.toISOString());
      }

      const { data: gamesData, error: gamesError } = await gamesQuery;
      if (gamesError) throw gamesError;

      // Fetch statistics for each game
      const gamesWithStats = await Promise.all(
        gamesData.map(async game => {
          const { data: statsData } = await supabase
            .from('game_statistics')
            .select('*')
            .eq('game_session_id', game.id);

          const totalQuestions = statsData?.length || 0;
          const correctAnswers = statsData?.filter(stat => stat.correct).length || 0;
          const accuracy = totalQuestions ? (correctAnswers / totalQuestions * 100).toFixed(1) : 0;
          
          // Calculate score from statistics using question_value
          const score = statsData?.reduce((total, stat) => {
            return total + (stat.correct ? stat.question_value : -stat.question_value);
          }, 0) || 0;

          return {
            ...game,
            accuracy: Number(accuracy),
            calculatedScore: score,
            correctAnswers,
            totalQuestions
          };
        })
      );

      setRecentGames(gamesWithStats);
    } catch (err) {
      setError('Error fetching statistics: ' + err.message);
      console.error('Detailed error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = {
      timeRange,
      stats,
      recentGames: recentGames.map(game => ({
        player: game.player_name,
        type: game.tech_types.name,
        score: game.calculatedScore,
        date: new Date(game.start_time).toLocaleDateString(),
        accuracy: game.accuracy,
        correct: game.correctAnswers,
        total: game.totalQuestions
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jeopardy-stats-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner message="Loading statistics..." />;

  if (error) {
    return (
      <div className={styles.errorMessage}>
        <p>{error}</p>
        <button onClick={fetchData}>Retry</button>
      </div>
    );
  }

  return (
    <div className={styles.gameStats}>
      <div className={styles.header}>
        <h2>Game Statistics</h2>
        <div className={styles.timeRange}>
          <label className={styles.timeRangeLabel}>Time Range:</label>
          <select 
            className={styles.timeRangeSelect}
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
        </div>
      </div>

      <div className={styles.statsGrid}>
        {stats?.map(techStats => (
          <div key={techStats.tech_type} className={styles.statsCard}>
            <h3 className={styles.techTypeTitle}>
              <span className={styles.techTypeIcon}>
                {techStats.tech_type[0]}
              </span>
              {techStats.tech_type} Tech Stats
            </h3>
            <div className={styles.statsContent}>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Total Games</span>
                <span className={styles.statValue}>{techStats.total_games}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Unique Players</span>
                <span className={styles.statValue}>{techStats.unique_players}</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Average Score</span>
                <span className={styles.statValue}>
                  {Math.round(techStats.average_score || 0)}
                </span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statLabel}>Success Rate</span>
                <span className={styles.statValue}>
                  {Math.round((techStats.correct_answer_rate || 0) * 100)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.recentGames}>
        <div className={styles.recentGamesHeader}>
          <h3>Recent Games</h3>
          <button 
            className={styles.exportButton}
            onClick={handleExport}
          >
            Export Stats
          </button>
        </div>

        {recentGames.length === 0 ? (
          <div className={styles.noData}>
            No games played yet
          </div>
        ) : (
          recentGames.map(game => (
            <div key={game.id} className={styles.gameRecord}>
              <div className={styles.gameHeader}>
                <span className={styles.playerName}>{game.player_name}</span>
                <span className={styles.gameType}>{game.tech_types.name}</span>
                <span className={styles.gameScore}>
                  Score: {game.calculatedScore}
                </span>
              </div>
              <div className={styles.gameDetails}>
                <span>
                  Accuracy: {game.accuracy}% ({game.correctAnswers}/{game.totalQuestions})
                </span>
                <span>
                  {new Date(game.start_time).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className={styles.performanceBar}>
                <div 
                  className={styles.performanceFill} 
                  style={{ width: `${game.accuracy}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GameStats;
