import { useState } from 'react';
import CategoryManager from './CategoryManager';
import QuestionManager from './QuestionManager';
import GameStats from './GameStats';
import TournamentAdmin from './TournamentAdmin';
import ConfirmDialog from '../ConfirmDialog';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    requireTextConfirmation: false,
    textConfirmationValue: '',
    onConfirm: null
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'categories':
        return <CategoryManager />;
      case 'questions':
        return <QuestionManager />;
      case 'stats':
        return <GameStats />;
      case 'tournaments':
        return <TournamentAdmin />;
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
            <button
              className={`${styles.navButton} ${activeTab === 'tournaments' ? styles.active : ''}`}
              onClick={() => setActiveTab('tournaments')}
            >
              Tournaments
            </button>
          </div>
          <a
            href={import.meta.env.MODE === 'production' ? '/Jeopardy/' : '/'}
            className={styles.backButton}
            onClick={(e) => {
              e.preventDefault();
              setConfirmDialog({
                isOpen: true,
                title: 'Leave Admin Dashboard',
                message: 'Are you sure you want to leave the admin dashboard?',
                confirmText: 'Leave',
                confirmButtonStyle: 'danger',
                requireTextConfirmation: false,
                onConfirm: () => { window.location.href = (import.meta.env.MODE === 'production' ? '/Jeopardy/' : '/'); }
              });
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

      {/* Global confirm dialog */}
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

export default AdminDashboard;
