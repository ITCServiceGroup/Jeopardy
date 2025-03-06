import React from 'react';
import styles from './Modal.module.css';

const Modal = ({ isOpen, onClose, children, variant = 'admin' }) => {
  if (!isOpen) return null;

  const contentClassName = `${styles.modalContent} ${variant === 'game' ? styles.gameModal : styles.adminModal}`;
  const closeButtonClassName = `${styles.closeButton} ${variant === 'game' ? styles.gameCloseButton : styles.adminCloseButton}`;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={contentClassName} onClick={e => e.stopPropagation()}>
        <button className={closeButtonClassName} onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
