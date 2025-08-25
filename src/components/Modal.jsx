import styles from './Modal.module.css';

const Modal = ({ isOpen, onClose, children, variant = 'admin', allowClose = true }) => {
  if (!isOpen) return null;

  const contentClassName = `${styles.modalContent} ${variant === 'game' ? styles.gameModal : styles.adminModal}`;
  const closeButtonClassName = `${styles.closeButton} ${variant === 'game' ? styles.gameCloseButton : styles.adminCloseButton}`;

  return (
    <div className={styles.modalOverlay} onClick={allowClose ? onClose : undefined}>
      <div className={contentClassName} onClick={e => e.stopPropagation()}>
        {allowClose && (
          <button className={closeButtonClassName} onClick={onClose}>×</button>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;
