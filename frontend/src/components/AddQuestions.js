import React, { useState } from 'react';

const API_URL = 'http://localhost:5000/api';

function AddQuestions({ quizId, quizTitle, onFinish }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    question_text: '',
    question_type: 'text',
    answer_type: 'single',
    options: ['', ''],
    correct_options: [],
    image_url: '',
    points: 10
  });
  const [uploading, setUploading] = useState(false);

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, '']
    });
  };

  const updateOption = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const removeOption = (index) => {
    if (currentQuestion.options.length <= 2) {
      alert('Должно быть минимум 2 варианта ответа');
      return;
    }
    const newOptions = currentQuestion.options.filter((_, i) => i !== index);
    const newCorrect = currentQuestion.correct_options.filter(i => i !== index);
    setCurrentQuestion({
      ...currentQuestion,
      options: newOptions,
      correct_options: newCorrect
    });
  };

  const toggleCorrectOption = (index) => {
    if (currentQuestion.answer_type === 'single') {
      setCurrentQuestion({ ...currentQuestion, correct_options: [index] });
    } else {
      let newCorrect = [...currentQuestion.correct_options];
      if (newCorrect.includes(index)) {
        newCorrect = newCorrect.filter(i => i !== index);
      } else {
        newCorrect.push(index);
      }
      setCurrentQuestion({ ...currentQuestion, correct_options: newCorrect });
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);

    try {
      const res = await fetch(`${API_URL}/upload-image`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setCurrentQuestion({ ...currentQuestion, image_url: data.imageUrl });
      } else {
        alert('Ошибка загрузки');
      }
    } catch (err) {
      alert('Ошибка сервера');
    } finally {
      setUploading(false);
    }
  };

  const saveQuestion = async () => {
    if (!currentQuestion.question_text.trim()) {
      alert('Введите текст вопроса');
      return;
    }

    const filledOptions = currentQuestion.options.filter(opt => opt.trim());
    if (filledOptions.length < 2) {
      alert('Заполните минимум 2 варианта ответа');
      return;
    }

    if (currentQuestion.correct_options.length === 0) {
      alert('Выберите правильный ответ (нажмите "Правильный" у нужного варианта)');
      return;
    }

    const correctAnswers = currentQuestion.correct_options
      .map(i => currentQuestion.options[i])
      .join('|');

    const optionsText = currentQuestion.options.join('|');

    const questionData = {
      quiz_id: quizId,
      question_text: currentQuestion.question_text,
      question_type: currentQuestion.question_type,
      answer_type: currentQuestion.answer_type,
      options: optionsText,
      correct_answer: correctAnswers,
      points: currentQuestion.points,
      order_num: questions.length + 1,
      image_url: currentQuestion.image_url
    };

    try {
      const res = await fetch(`${API_URL}/add-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData)
      });
      const data = await res.json();
      
      if (data.success) {
        setQuestions([...questions, currentQuestion]);
        setCurrentQuestion({
          question_text: '',
          question_type: 'text',
          answer_type: 'single',
          options: ['', ''],
          correct_options: [],
          image_url: '',
          points: 10
        });
      } else {
        alert('Ошибка сохранения');
      }
    } catch (err) {
      alert('Ошибка сервера');
    }
  };

  return (
    <div className="add-questions-view">
      <div className="add-questions-card">
        <h2>Добавление вопросов</h2>
        <p className="quiz-name">{quizTitle}</p>
        
        {questions.length > 0 && (
          <div className="saved-questions">
            <p>Сохранено вопросов: {questions.length}</p>
            {questions.map((q, idx) => (
              <div key={idx} className="saved-question-item">
                <span>{idx + 1}. {q.question_text}</span>
                <span className="question-type-badge">
                  {q.answer_type === 'single' ? 'Один ответ' : 'Несколько ответов'}
                </span>
              </div>
            ))}
          </div>
        )}

        <hr />

        <h3>Новый вопрос</h3>

        <div className="form-group">
          <input
            type="text"
            className="question-input"
            placeholder="Введите текст вопроса"
            value={currentQuestion.question_text}
            onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
          />
        </div>

        <div className="form-group">
          <div className="type-buttons">
            <button
              type="button"
              className={currentQuestion.question_type === 'text' ? 'active' : ''}
              onClick={() => setCurrentQuestion({ ...currentQuestion, question_type: 'text', image_url: '' })}
            >
              Текстовый
            </button>
            <button
              type="button"
              className={currentQuestion.question_type === 'image' ? 'active' : ''}
              onClick={() => setCurrentQuestion({ ...currentQuestion, question_type: 'image' })}
            >
              С изображением
            </button>
          </div>
        </div>

        {currentQuestion.question_type === 'image' && (
          <div className="form-group">
            <label>Изображение</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
            {uploading && <p>Загрузка...</p>}
            {currentQuestion.image_url && (
              <div className="image-preview">
                <img src={currentQuestion.image_url} alt="preview" style={{ maxWidth: '100%', maxHeight: '150px', marginTop: '10px' }} />
                <button onClick={() => setCurrentQuestion({ ...currentQuestion, image_url: '' })}>Удалить</button>
              </div>
            )}
          </div>
        )}

        <div className="form-group">
          <div className="type-buttons">
            <button
              type="button"
              className={currentQuestion.answer_type === 'single' ? 'active' : ''}
              onClick={() => setCurrentQuestion({ ...currentQuestion, answer_type: 'single', correct_options: [] })}
            >
              Одиночный выбор
            </button>
            <button
              type="button"
              className={currentQuestion.answer_type === 'multiple' ? 'active' : ''}
              onClick={() => setCurrentQuestion({ ...currentQuestion, answer_type: 'multiple', correct_options: [] })}
            >
              Множественный выбор
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Баллы</label>
          <input
            type="number"
            className="points-input"
            value={currentQuestion.points}
            onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) })}
            min="1"
            max="100"
          />
        </div>

        <div className="form-group">
          <label>Варианты ответов</label>
          {currentQuestion.options.map((opt, idx) => (
            <div key={idx} className="option-row">
              <input
                type="text"
                className="option-input"
                placeholder={`Вариант ${idx + 1}`}
                value={opt}
                onChange={(e) => updateOption(idx, e.target.value)}
              />
              <button
                type="button"
                className={`correct-btn ${currentQuestion.correct_options.includes(idx) ? 'active' : ''}`}
                onClick={() => toggleCorrectOption(idx)}
              >
                Правильный
              </button>
              <button type="button" className="remove-btn" onClick={() => removeOption(idx)}>✗</button>
            </div>
          ))}
          <button type="button" className="add-option-btn" onClick={addOption}>+ Добавить вариант</button>
        </div>

        <button className="btn-save-question" onClick={saveQuestion}>
          Сохранить вопрос
        </button>

        <button className="btn-finish" onClick={onFinish}>
          Готово
        </button>
      </div>
    </div>
  );
}

export default AddQuestions;