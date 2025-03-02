import { useState } from 'react';
import CategoryManager from './CategoryManager';
import QuestionManager from './QuestionManager';
import GameStats from './GameStats';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('categories');

  const renderContent = () => {
    switch (activeTab) {
      case 'categories':
        return <CategoryManager />;
      case 'questions':
        return <QuestionManager />;
      case 'stats':
        return <GameStats />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.adminDashboard}>
      <header className={styles.header}>
        <h1>Admin Dashboard</h1>
        <nav className={styles.nav}>
          <div className={styles.navGroup}>
            <button
              className={`${styles.navButton} ${activeTab === 'categories' ? styles.active : ''}`}
              onClick={() => setActiveTab('categories')}
            >
              Categories
            </button>
            <button
              className={`${styles.navButton} ${activeTab === 'questions' ? styles.active : ''}`}
              onClick={() => setActiveTab('questions')}
            >
              Questions
            </button>
            <button
              className={`${styles.navButton} ${activeTab === 'stats' ? styles.active : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              Statistics
            </button>
          </div>
          <a
            href="/"
            className={styles.backButton}
            onClick={(e) => {
              if (!confirm('Are you sure you want to leave the admin dashboard?')) {
                e.preventDefault();
              }
            }}
          >
            Return to Game
          </a>
        </nav>
      </header>

      <main className={styles.content}>
        {renderContent()}
      </main>

      <footer className={styles.footer}>
        <p>ITC Jeopardy Admin Dashboard • {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
};

export default AdminDashboard;
