import React, { useState } from 'react';
import AddQuestions from './AddQuestions';

const API_URL = 'http://localhost:5000/api';

function CreateQuiz({ userId, onBack }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [createdQuiz, setCreatedQuiz] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
      const res = await fetch(`${API_URL}/create-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          category, 
          time_per_question: timePerQuestion, 
          created_by: userId, 
          room_code: roomCode 
        })
      });
      const data = await res.json();
      if (data.success) {
        setCreatedQuiz({ id: data.quiz_id, title, room_code: roomCode });
      } else {
        alert('Ошибка создания');
      }
    } catch (err) {
      alert('Ошибка сервера');
    }
  };

  if (createdQuiz) {
    return <AddQuestions quizId={createdQuiz.id} quizTitle={createdQuiz.title} onFinish={onBack} />;
  }

  return (
    <div className="create-quiz-view">
      <button className="btn-back" onClick={onBack}>← Назад</button>
      <div className="card">
        <h2>Создание квиза</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Название квиза</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Категория</label>
            <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="IT, Спорт, Кино..." />
          </div>
          <div className="form-group">
            <label>Время на вопрос (сек)</label>
            <input type="number" value={timePerQuestion} onChange={(e) => setTimePerQuestion(e.target.value)} min="5" max="120" />
          </div>
          <button type="submit" className="btn btn-primary btn-block">Создать квиз и добавить вопросы</button>
        </form>
      </div>
    </div>
  );
}

export default CreateQuiz;