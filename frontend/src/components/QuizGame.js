import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

function QuizGame({ roomCode, userName, userId, onFinish }) {
  const [gameState, setGameState] = useState('waiting');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [myScore, setMyScore] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    socket.emit('join-game', { roomCode, userId, userName });

    socket.on('game-started', () => {
      setGameState('question');
      setIsAnswered(false);
    });

    socket.on('new-question', (data) => {
      setCurrentQuestion(data);
      setTimeLeft(data.timeLimit);
      setSelectedAnswers([]);
      setGameState('question');
      setIsAnswered(false);
    });

    socket.on('timer-update', (time) => {
      setTimeLeft(time);
    });

    socket.on('question-result', ({ correct, pointsEarned }) => {
      if (correct) {
        setMyScore(prev => prev + pointsEarned);
      }
      setIsAnswered(true);
    });

    socket.on('leaderboard', (data) => {
      setLeaderboard(data);
      setGameState('leaderboard');
    });

    socket.on('game-finished', () => {
      setGameState('leaderboard');
    });

    return () => {
      socket.off('game-started');
      socket.off('new-question');
      socket.off('timer-update');
      socket.off('question-result');
      socket.off('leaderboard');
      socket.off('game-finished');
    };
  }, [roomCode, userId, userName]);

  const submitAnswer = () => {
      if (isAnswered) return;
      if (selectedAnswers.length === 0) return;

      let answerToSend;
      if (currentQuestion?.answerType === 'single') {
          answerToSend = selectedAnswers[0];
      } else {
          answerToSend = selectedAnswers; 
      }

      socket.emit('submit-answer', {
          roomCode,
          userId,
          questionId: currentQuestion.id,
          answer: answerToSend
      });
      setIsAnswered(true);
  };

  const toggleAnswer = (option) => {
    if (isAnswered) return;
    if (currentQuestion?.answerType === 'single') {
      setSelectedAnswers([option]);
    } else {
      setSelectedAnswers(prev =>
        prev.includes(option) ? prev.filter(a => a !== option) : [...prev, option]
      );
    }
  };

  if (gameState === 'waiting') {
    return (
      <div className="quiz-waiting">
        <h2>Ожидание начала квиза</h2>
        <p>Комната: {roomCode}</p>
        <p>Организатор скоро начнёт...</p>
      </div>
    );
  }

  if (gameState === 'leaderboard') {
    return (
      <div className="quiz-leaderboard">
        <h2>Результаты</h2>
        <div className="leaderboard-list">
          {leaderboard.map((player, idx) => (
            <div key={player.userId} className={`leaderboard-item ${player.userId === userId ? 'is-me' : ''}`}>
              <span className="rank">{idx + 1}</span>
              <span className="name">{player.name}</span>
              <span className="score">{player.score}</span>
            </div>
          ))}
        </div>
        <button className="btn-finish" onClick={onFinish}>На главную</button>
      </div>
    );
  }

  if (!currentQuestion) {
    return <div className="quiz-loading">Загрузка...</div>;
  }

  return (
    <div className="quiz-question">
      <div className="question-header">
        <span className="question-counter">Вопрос {currentQuestion.number} из {currentQuestion.total}</span>
        <div className="timer">⏱ {timeLeft} сек</div>
      </div>
      <h2>{currentQuestion.text}</h2>
      {currentQuestion.image && <img src={currentQuestion.image} alt="question" className="question-image" />}

      <div className="options-list">
        {currentQuestion.options.map((opt, idx) => (
          <label key={idx} className="quiz-option">
            <input
              type={currentQuestion.answerType === 'single' ? 'radio' : 'checkbox'}
              name="answer"
              value={opt}
              checked={currentQuestion.answerType === 'single'
                ? selectedAnswers[0] === opt
                : selectedAnswers.includes(opt)}
              onChange={() => toggleAnswer(opt)}
              disabled={isAnswered}
            />
            <span className="option-text">{opt}</span>
          </label>
        ))}
      </div>

      <button 
        className="btn-submit" 
        onClick={submitAnswer} 
        disabled={isAnswered || selectedAnswers.length === 0}
      >
        {isAnswered ? 'Ответ отправлен' : 'Ответить'}
      </button>
    </div>
  );
}

export default QuizGame;