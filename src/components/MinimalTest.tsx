import React, { useState, useEffect } from 'react';

export function MinimalTest() {
  const [status, setStatus] = useState('initializing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setStatus('mounting');
      // Test basic DOM access
      const root = document.getElementById('root');
      if (!root) {
        setError('Root element not found');
        return;
      }
      
      // Test classList operations
      const testDiv = document.createElement('div');
      if (testDiv.classList) {
        testDiv.classList.add('test');
        testDiv.classList.remove('test');
      }
      
      setStatus('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  if (error) {
    return (
      <div style={{ padding: 20, color: 'red' }}>
        <h2>Error during initialization:</h2>
        <pre>{error}</pre>
      </div>
    );
  }

  if (status === 'ready') {
    return (
      <div style={{ padding: 20 }}>
        <h1>Task Reward Hub</h1>
        <p>App initialized successfully!</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ padding: '10px 20px', marginTop: 20 }}
        >
          Reload
        </button>
      </div>
    );
  }

  return <div style={{ padding: 20 }}>Loading... ({status})</div>;
}
