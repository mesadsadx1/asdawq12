import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAuth, setShowAuth] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('dreamUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setShowAuth(false);
    }
  }, []);

  const handleAuth = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = {
      id: Date.now(),
      name: formData.get('name'),
      phone: formData.get('phone'),
      birthdate: formData.get('birthdate')
    };
    
    setUser(userData);
    localStorage.setItem('dreamUser', JSON.stringify(userData));
    setShowAuth(false);
    
    // Отправка на сервер
    fetch('http://localhost:3001/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    }).catch(err => console.error(err));
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMsg = { type: 'user', content: inputMessage };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3001/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          message: inputMessage
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const aiMsg = { type: 'assistant', content: data.interpretation };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMsg = { 
        type: 'assistant', 
        content: 'Извините, произошла ошибка. Проверьте подключение к серверу.' 
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('dreamUser');
    setUser(null);
    setShowAuth(true);
    setMessages([]);
  };

  return (
    <div className="App">
      <AnimatePresence mode="wait">
        {showAuth ? (
          <motion.div 
            key="auth"
            className="auth-container"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <form onSubmit={handleAuth} className="auth-form">
              <h1 className="gradient-text">🌙 Dream Interpreter</h1>
              <p>Откройте тайны вашего подсознания</p>
              
              <input 
                name="name"
                type="text" 
                placeholder="Ваше имя" 
                required 
                className="input"
              />
              
              <input 
                name="phone"
                type="tel" 
                placeholder="+7 (999) 999-99-99" 
                required 
                className="input"
              />
              
              <input 
                name="birthdate"
                type="date" 
                required 
                className="input"
              />
              
              <button type="submit" className="btn btn-primary">
                Начать путешествие ✨
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            key="main"
            className="main-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <header className="header">
              <div className="logo">
                <span className="moon-icon">🌙</span>
                <h1>Dream Interpreter</h1>
              </div>
              <div className="user-info">
                <span>Привет, {user?.name}!</span>
                <button onClick={logout} className="btn btn-ghost">
                  Выйти
                </button>
              </div>
            </header>

            <div className="content">
              <div className="chat-container">
                <div className="messages">
                  {messages.length === 0 ? (
                    <div className="welcome">
                      <h2 className="gradient-text">Расскажите о своем сне</h2>
                      <p>Я помогу вам понять послание вашего подсознания</p>
                      
                      <div className="quick-actions">
                        <button 
                          className="quick-btn"
                          onClick={() => setInputMessage('Мне снятся кошмары')}
                        >
                          😱 Кошмары
                        </button>
                        <button 
                          className="quick-btn"
                          onClick={() => setInputMessage('У меня повторяющийся сон')}
                        >
                          🔄 Повторяющиеся
                        </button>
                        <button 
                          className="quick-btn"
                          onClick={() => setInputMessage('Что такое осознанные сны?')}
                        >
                          ✨ Осознанные
                        </button>
                        <button 
                          className="quick-btn"
                          onClick={() => setInputMessage('Что означают символы во сне?')}
                        >
                          💭 Символы
                        </button>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <motion.div 
                        key={idx}
                        className={`message ${msg.type}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {msg.content}
                      </motion.div>
                    ))
                  )}
                  
                  {loading && (
                    <div className="message assistant">
                      <div className="typing">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="input-area">
                  <textarea
                    className="message-input"
                    placeholder="Опишите свой сон..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button 
                    className="send-btn"
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || loading}
                  >
                    ➤
                  </button>
                </div>
              </div>

              <aside className="sidebar">
                <div className="card">
                  <h3>✨ Советы</h3>
                  <ul>
                    <li>Описывайте детали и эмоции</li>
                    <li>Упоминайте повторяющиеся элементы</li>
                    <li>Рассказывайте о своих ощущениях</li>
                  </ul>
                </div>
                
                <div className="card">
                  <h3>📊 Статистика</h3>
                  <p>Снов записано: {messages.filter(m => m.type === 'user').length}</p>
                </div>
              </aside>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;