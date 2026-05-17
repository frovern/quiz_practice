import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="card" style={{ textAlign: 'center' }}>
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="app-container">
        <LoginForm onLogin={handleLogin} />
      </div>
    );
  }

  return <Dashboard user={user} onLogout={handleLogout} />;
}

export default App;