import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function QuizHost({ quizId, roomCode, userId, onFinish, onCancel }) {
  const [players, setPlayers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [gameActive, setGameActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isWaitingForNext, setIsWaitingForNext] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [gameFinished, setGameFinished] = useState(false);
  const [finalLeaderboard, setFinalLeaderboard] = useState([]);
  const [quizTitle, setQuizTitle] = useState('');

  useEffect(() => {
    fetch(`http://localhost:5000/api/quiz-questions/${quizId}`)
      .then(res => res.json())
      .then(data => setQuestions(data))
      .catch(err => console.error('Ошибка загрузки вопросов', err));
    
    fetch(`http://localhost:5000/api/quiz-info/${quizId}`)
      .then(res => res.json())
      .then(data => {
        setTimePerQuestion(data.time_per_question || 30);
        setQuizTitle(data.title || 'Квиз');
      })
      .catch(err => console.error('Ошибка загрузки настроек', err));

    socket.emit('host-room', { roomCode, userId, quizId });

    socket.on('players-update', (playersList) => {
      setPlayers(playersList);
    });

    socket.on('timer-update', (time) => {
      setTimeLeft(time);
    });

    socket.on('question-finished', () => {
      setIsWaitingForNext(true);
      setTimeout(() => {
        setIsWaitingForNext(false);
      }, 1500);
    });

    socket.on('new-question', (data) => {
      setCurrentQuestionIndex(data.number - 1);
      setIsWaitingForNext(false);
    });

    socket.on('leaderboard', (data) => {
      setFinalLeaderboard(data);
      setGameFinished(true);
    });

    socket.on('game-finished', () => {
      setGameFinished(true);
    });

    socket.on('game-started', () => {
      setGameActive(true);
    });

    return () => {
      socket.off('players-update');
      socket.off('timer-update');
      socket.off('question-finished');
      socket.off('new-question');
      socket.off('leaderboard');
      socket.off('game-finished');
      socket.off('game-started');
    };
  }, [quizId, roomCode, userId]);

  const startGame = () => {
    if (questions.length === 0) {
      alert('Нет вопросов в квизе');
      return;
    }
    socket.emit('start-game', { 
      roomCode, 
      questions,
      timePerQuestion: timePerQuestion,
      quizId: quizId,
      quizTitle: quizTitle
    });
  };

  if (gameFinished) {
    return (
      <div className="quiz-leaderboard">
        <h2>Результаты квиза</h2>
        <div className="leaderboard-list">
          {finalLeaderboard.length === 0 ? (
            <p>Нет результатов</p>
          ) : (
            finalLeaderboard.map((player, idx) => (
              <div key={player.userId} className={`leaderboard-item ${player.userId === userId ? 'is-me' : ''}`}>
                <span className="rank">{idx + 1}</span>
                <span className="name">{player.name}</span>
                <span className="score">{player.score}</span>
              </div>
            ))
          )}
        </div>
        <button className="btn-finish" onClick={onFinish}>На главную</button>
      </div>
    );
  }

  if (!gameActive) {
    return (
      <div className="quiz-host-waiting">
        <h2>Комната {roomCode}</h2>
        <div className="players-list">
          <h3>Участники ({players.length})</h3>
          {players.length === 0 && <p>Ожидание подключения...</p>}
          {players.map(p => (
            <div key={p.userId}>{p.name}</div>
          ))}
        </div>
        <button className="btn-start" onClick={startGame} disabled={players.length === 0}>
          Начать квиз
        </button>
        <button className="btn-back" onClick={onCancel}>Отменить</button>
      </div>
    );
  }

  return (
    <div className="quiz-host-active">
      <h2>
        Вопрос {currentQuestionIndex + 1} из {questions.length}
      </h2>
      
      <div className="players-list">
        <h3>Участники ({players.length})</h3>
        {players.map(p => (
          <div key={p.userId} className="player-score">
            {p.name} — <span className="score">{p.score || 0} баллов</span>
          </div>
        ))}
      </div>

      <div className="host-timer-info">
        ⏱ До конца вопроса: {timeLeft} сек
      </div>
      
      {isWaitingForNext && (
        <p className="waiting-text">Ожидание следующего вопроса...</p>
      )}
    </div>
  );
}

export default QuizHost;