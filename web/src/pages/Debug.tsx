import React from 'react';

const Debug: React.FC = () => {
  console.log('🔍 Debug page loaded');
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🔍 Page de Debug</h1>
      <p>Si vous voyez cette page, l'application React fonctionne !</p>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h3>Informations de Debug :</h3>
        <ul>
          <li>Timestamp: {new Date().toLocaleString()}</li>
          <li>URL: {window.location.href}</li>
          <li>User Agent: {navigator.userAgent}</li>
        </ul>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Navigation :</h3>
        <a href="/dashboard" style={{ marginRight: '10px', color: 'blue' }}>Dashboard</a>
        <a href="/login" style={{ marginRight: '10px', color: 'blue' }}>Login</a>
        <a href="/test-supabase-connection" style={{ marginRight: '10px', color: 'blue' }}>Test Supabase</a>
      </div>
    </div>
  );
};

export default Debug;
