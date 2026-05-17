import React, { useState } from 'react';

const API_URL = 'http://localhost:5000/api';

function LoginForm({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('participant');
  const [message, setMessage] = useState('');

  const showMessage = (text, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isLogin && !name) {
      showMessage('Введите имя', true);
      return;
    }
    if (!email || !password) {
      showMessage('Заполните email и пароль', true);
      return;
    }

    const endpoint = isLogin ? '/login' : '/register';
    const body = isLogin 
      ? { email, password }
      : { name, email, password, role };

    try {
      const res = await fetch(API_URL + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      
      if (data.success) {
        if (isLogin) {
          localStorage.setItem('user', JSON.stringify(data.user));
          onLogin(data.user);
        } else {
          showMessage('Регистрация успешна! Теперь войдите.');
          setIsLogin(true);
          setName('');
          setEmail('');
          setPassword('');
        }
      } else {
        showMessage(data.message || 'Ошибка', true);
      }
    } catch (err) {
      showMessage('Ошибка подключения к серверу', true);
    }
  };

  return (
    <div className="card">
      <h1>QuizRoom</h1>
      <p className="subtitle">платформа для проведения квизов</p>

      <div className="tabs">
        <button className={`tab ${isLogin ? 'active' : ''}`} onClick={() => setIsLogin(true)}>
          Войти
        </button>
        <button className={`tab ${!isLogin ? 'active' : ''}`} onClick={() => setIsLogin(false)}>
          Регистрация
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="form-group">
            <label>Имя</label>
            <input
              type="text"
              placeholder="Иван Петров"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Пароль</label>
          <input
            type="password"
            placeholder="********"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {!isLogin && (
          <div className="form-group">
            <label>Роль</label>
            <div className="role-buttons">
              <button
                type="button"
                className={`role-btn ${role === 'participant' ? 'active' : ''}`}
                onClick={() => setRole('participant')}
              >
                <div>
                  <div className="role-title">Участник</div>
                  <div className="role-desc">прохождение квизов</div>
                </div>
              </button>
              <button
                type="button"
                className={`role-btn ${role === 'organizer' ? 'active' : ''}`}
                onClick={() => setRole('organizer')}
              >
                <div>
                  <div className="role-title">Организатор</div>
                  <div className="role-desc">создание квизов</div>
                </div>
              </button>
            </div>
          </div>
        )}

        <button type="submit" className="btn btn-primary btn-block">
          {isLogin ? 'Войти' : 'Создать аккаунт'}
        </button>
      </form>

      {message && (
        <div className={message.isError ? 'error-message' : 'success-message'}>
          {message.text}
        </div>
      )}
    </div>
  );
}

export default LoginForm;