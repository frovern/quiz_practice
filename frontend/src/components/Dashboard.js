import React, { useState } from 'react';
import OrganizerView from './OrganizerView';
import ParticipantView from './ParticipantView';
import Profile from './Profile';
import CreateQuiz from './CreateQuiz';

function Dashboard({ user, onLogout }) {
  const [activeView, setActiveView] = useState('home');

  const renderContent = () => {
    if (activeView === 'profile') {
      return <Profile user={user} onBack={() => setActiveView('home')} />;
    }
    if (activeView === 'createQuiz') {
      return <CreateQuiz userId={user.id} onBack={() => setActiveView('home')} />;
    }
    if (user.role === 'organizer') {
      return <OrganizerView userId={user.id} onCreate={() => setActiveView('createQuiz')} />;
    }
    return <ParticipantView user={user} />;
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="logo">QuizRoom</h1>
        <div className="header-right">
          <button className="btn-lk" onClick={() => setActiveView('profile')}>
            Личный кабинет
          </button>
          <button className="btn-logout" onClick={onLogout}>
            Выйти
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        {renderContent()}
      </div>
    </div>
  );
}

export default Dashboard;