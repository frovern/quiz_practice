import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api';

function Profile({ user, onBack }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        let url;
        if (user.role === 'participant') {
          url = `${API_URL}/my-history/${user.id}`;
        } else {
          url = `${API_URL}/my-organized/${user.id}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        console.error('Ошибка загрузки истории', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user.id, user.role]);

  if (loading) {
    return (
      <div className="profile-view">
        <button className="btn-back" onClick={onBack}>← Назад</button>
        <div className="card">
          <p>Загрузка истории...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-view">
      <button className="btn-back" onClick={onBack}>← Назад</button>
      <div className="card">
        <h2>Личный кабинет</h2>
        
        <div className="profile-info">
          <div className="profile-row">
            <span className="profile-label">Имя:</span>
            <span className="profile-value">{user.name}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Email:</span>
            <span className="profile-value">{user.email}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Роль:</span>
            <span className="profile-value">{user.role === 'organizer' ? 'Организатор' : 'Участник'}</span>
          </div>
        </div>
        <h3>{user.role === 'participant' ? 'История участия' : 'Проведённые квизы'}</h3>
        
        {history.length === 0 ? (
          <p className="empty-history">Пока нет записей</p>
        ) : (
          <div className="history-list">
            {history.map((item, idx) => (
              <div key={idx} className="history-item">
                <div className="history-title">{item.quiz_title || item.title}</div>
                <div className="history-details">
                  <span className="history-date">{new Date(item.played_at).toLocaleDateString()}</span>
                  {user.role === 'participant' ? (
                    <>
                      <span className="history-score">Баллы: {item.score} / {item.max_score}</span>
                      <span className="history-rank">Место: {item.rank_position}</span>
                    </>
                  ) : (
                    <>
                      <span className="history-players">Участников: {item.participants_count || '-'}</span>
                      <span className="history-winner">Победитель: {item.winner_name || '-'}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;