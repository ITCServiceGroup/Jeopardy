import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Detect if we're in a GitHub Pages environment
const isGitHubPages = window.location.hostname.includes('github.io');
console.log('Is GitHub Pages environment:', isGitHubPages);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>
      <App />
    </HashRouter>
  </React.StrictMode>
);
