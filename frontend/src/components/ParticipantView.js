import React, { useState, useEffect } from 'react';
import QuizGame from './QuizGame';

const API_URL = 'http://localhost:5000/api';

function ParticipantView({ user }) {
  const [roomCode, setRoomCode] = useState('');
  const [availableQuizzes, setAvailableQuizzes] = useState([]);
  const [gameRoom, setGameRoom] = useState(null);

  useEffect(() => {
    fetchAvailableQuizzes();
  }, []);

  const fetchAvailableQuizzes = async () => {
    try {
      const res = await fetch(`${API_URL}/available-quizzes`);
      const data = await res.json();
      setAvailableQuizzes(data);
    } catch (err) {
      console.error('Ошибка загрузки доступных квизов');
    }
  };

  const handleJoinByCode = () => {
    if (!roomCode.trim()) {
      alert('Введите код комнаты');
      return;
    }
    setGameRoom({ code: roomCode.toUpperCase() });
  };

  const handleJoinQuiz = (roomCode) => {
    setGameRoom({ code: roomCode });
  };

  if (gameRoom) {
    return (
      <QuizGame
        roomCode={gameRoom.code}
        userName={user.name}
        userId={user.id}
        onFinish={() => setGameRoom(null)}
      />
    );
  }

  return (
    <div className="participant-view">
      <div className="welcome-section">
        <h2 className="welcome-title">Добро пожаловать, {user.name}!</h2>
      </div>

      <div className="join-by-code">
        <h3>Войти в комнату</h3>
        <div className="code-input-group">
          <input
            type="text"
            placeholder="КОД КОМНАТЫ"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            maxLength="10"
          />
          <button className="btn-join" onClick={handleJoinByCode}>Войти</button>
        </div>
      </div>

      <div className="quizzes-list">
        <h3>Доступные квизы</h3>
        {availableQuizzes.length === 0 ? (
          <p className="empty-list">Нет доступных квизов</p>
        ) : (
          availableQuizzes.map(quiz => (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-info">
                <h4>{quiz.title}</h4>
                <p className="quiz-meta">{quiz.category || 'Без категории'}</p>
                <p className="quiz-code">Код: {quiz.room_code}</p>
              </div>
              <div className="quiz-actions">
                <button className="btn-join" onClick={() => handleJoinQuiz(quiz.room_code)}>
                  Присоединиться
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ParticipantView;