import React, { useState, useEffect, useCallback } from 'react';
import QuizHost from './QuizHost';

const API_URL = 'http://localhost:5000/api';

function OrganizerView({ userId, onCreate }) {
  const [myQuizzes, setMyQuizzes] = useState([]);
  const [activeHost, setActiveHost] = useState(null);

  const fetchMyQuizzes = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/my-quizzes/${userId}`);
      const data = await res.json();
      setMyQuizzes(data);
    } catch (err) {
      console.error('Ошибка загрузки квизов');
    }
  }, [userId]);

  useEffect(() => {
    fetchMyQuizzes();
  }, [fetchMyQuizzes]);

  const handleDeleteQuiz = async (quizId, quizTitle) => {
    if (!window.confirm(`Удалить квиз "${quizTitle}"? Все вопросы тоже будут удалены.`)) {
      return;
    }
    try {
      const res = await fetch(`${API_URL}/delete-quiz/${quizId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchMyQuizzes();
      } else {
        alert('Ошибка удаления');
      }
    } catch (err) {
      alert('Ошибка сервера');
    }
  };

  if (activeHost) {
    return (
      <QuizHost
        quizId={activeHost.quizId}
        roomCode={activeHost.roomCode}
        userId={userId}
        onFinish={() => {
          setActiveHost(null);
          fetchMyQuizzes();
        }}
        onCancel={async () => {
          try {
            await fetch(`${API_URL}/reset-quiz-status/${activeHost.roomCode}`, { method: 'PUT' });
          } catch (err) {
            console.error('Ошибка сброса статуса');
          }
          setActiveHost(null);
          fetchMyQuizzes();
        }}
      />
    );
  }

  return (
    <div className="organizer-view">
      <div className="actions-row">
        <button className="btn-create" onClick={onCreate}>
          + Создать квиз
        </button>
      </div>
      <div className="quizzes-list">
        <h3>Мои квизы</h3>
        {myQuizzes.length === 0 ? (
          <p className="empty-list">У вас пока нет созданных квизов</p>
        ) : (
          myQuizzes.map(quiz => (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-info">
                <h4>{quiz.title}</h4>
                <p className="quiz-meta">Категория: {quiz.category || 'Без категории'} • Время: {quiz.time_per_question} сек</p>
                <p className="quiz-code">Код комнаты: <span className="code">{quiz.room_code}</span></p>
              </div>
              <div className="quiz-actions">
                <button
                  className="btn-run"
                  onClick={() => setActiveHost({ quizId: quiz.id, roomCode: quiz.room_code })}
                >
                  Запустить
                </button>
                <button 
                  className="btn-delete" 
                  onClick={() => handleDeleteQuiz(quiz.id, quiz.title)}
                >
                  Удалить
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default OrganizerView;