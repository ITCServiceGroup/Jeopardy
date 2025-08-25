import { useState, useEffect, useRef } from 'react';
import styles from './ConfirmDialog.module.css';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonStyle = 'danger', // 'danger', 'primary', 'secondary'
  requireTextConfirmation = false,
  textConfirmationValue = '',
  textConfirmationPlaceholder = 'Type to confirm...'
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isConfirmEnabled, setIsConfirmEnabled] = useState(false);

  // Enable/disable confirm button based on input
  useEffect(() => {
    if (requireTextConfirmation) {
      setIsConfirmEnabled(inputValue.trim() === textConfirmationValue);
    } else {
      setIsConfirmEnabled(true);
    }
  }, [inputValue, requireTextConfirmation, textConfirmationValue]);

  // Reset input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setIsConfirmEnabled(!requireTextConfirmation);
    }
  }, [isOpen, requireTextConfirmation]);



  const handleConfirm = () => {
    if (isConfirmEnabled) {
      onConfirm();
      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isConfirmEnabled) {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>

        <div className={styles.content}>
          <div className={styles.message}>
            {message.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>

          {requireTextConfirmation && (
            <div className={styles.inputSection}>
              <label className={styles.inputLabel}>
                Type "{textConfirmationValue}" to confirm:
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={textConfirmationPlaceholder}
                className={styles.input}
                autoFocus
              />
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button
            onClick={handleCancel}
            className={styles.cancelButton}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!isConfirmEnabled}
            className={`${styles.confirmButton} ${styles[confirmButtonStyle]} ${
              !isConfirmEnabled ? styles.disabled : ''
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;