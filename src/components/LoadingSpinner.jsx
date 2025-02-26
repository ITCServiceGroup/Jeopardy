import '../styles/LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Loading...', className = '' }) => {
  return (
    <div className={`loading-container ${className}`}>
      <div className="loading-spinner">
        <div className="spinner-ring"></div>
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
