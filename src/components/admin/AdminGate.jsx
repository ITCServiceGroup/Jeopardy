import { useState, useEffect } from 'react';

// Simple hardcoded password gate for Admin routes
// To change the password, edit the value below
const ADMIN_PASSWORD = 'ITCPass1999!';
const STORAGE_KEY = 'admin_authed_v1';

export default function AdminGate({ children }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      setAuthed(true);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
      setAuthed(true);
      setError('');
    } else {
      setError('Incorrect password');
    }
  };

  if (authed) {
    return children;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #e2e8f0 0%, #f8fafc 100%)',
      padding: '2rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
        padding: '1.5rem 1.5rem 1.75rem'
      }}>
        <h1 style={{ margin: 0, marginBottom: '0.25rem', fontSize: '1.5rem', color: '#1a2533' }}>Admin Access</h1>
        <p style={{ marginTop: 0, color: '#475569' }}>Enter the admin password to continue.</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <input
            type="password"
            placeholder="Password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              padding: '0.75rem 0.9rem',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              outline: 'none',
              fontSize: '1rem'
            }}
          />
          {error && (
            <div style={{ color: '#b91c1c', fontSize: '0.95rem' }}>{error}</div>
          )}
          <button type="submit" style={{
            padding: '0.75rem 1rem',
            borderRadius: 8,
            background: '#2563eb',
            color: 'white',
            border: 'none',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}>Unlock Dashboard</button>
          <a href={import.meta.env.MODE === 'production' ? '/Jeopardy/' : '/'} style={{
            textAlign: 'center',
            color: '#1f2937',
            textDecoration: 'none',
            marginTop: '0.25rem'
          }}>Return to Game</a>
        </form>
      </div>
    </div>
  );
}

