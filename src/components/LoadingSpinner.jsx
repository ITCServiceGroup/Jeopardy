import '../styles/LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Loading...', className = '', theme = 'dark' }) => {
  return (
    <div className={`loading-container ${theme === 'light' ? 'light' : ''} ${className}`}>
      <div className="loading-spinner">
        <div className="spinner-ring"></div>
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
