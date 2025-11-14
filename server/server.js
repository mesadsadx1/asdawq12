const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const Database = require('./database');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database
const db = new Database();

// Mock интерпретации (если Ollama недоступен)
const mockInterpretations = {
  default: `Благодарю вас за доверие. Ваш сон содержит важные символы, которые отражают внутренние процессы вашей психики. Каждый элемент сна - это метафора, созданная вашим подсознанием для передачи важного послания. Обратите внимание на эмоции, которые вы испытывали во сне.`,
  nightmare: `Кошмары часто являются способом психики справиться с подавленными страхами или стрессом. Они не предсказывают будущее, а отражают внутренние тревоги. Важно помнить, что даже пугающие образы - это метафоры вашего подсознания.`,
  recurring: `Повторяющиеся сны указывают на важную неразрешенную тему в вашей жизни. Психика настойчиво пытается привлечь ваше внимание к чему-то существенному. Такие сны часто прекращаются, когда человек осознает их послание.`,
  lucid: `Осознанные сны демонстрируют высокий уровень самосознания. Это может быть признаком вашего стремления к большему контролю над своей жизнью. Используйте эту возможность для самоисследования.`
};

// Routes
app.post('/api/auth', async (req, res) => {
  try {
    const { name, phone, birthdate } = req.body;
    const user = await db.createOrUpdateUser(name, phone, birthdate);
    res.json({ success: true, user });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/interpret', async (req, res) => {
  try {
    const { userId, message } = req.body;
    
    let interpretation;
    
    // Try Ollama first
    try {
      const response = await axios.post('http://localhost:11434/api/generate', {
        model: 'mistral',
        prompt: `Ты психолог-интерпретатор снов. Проанализируй этот сон с точки зрения психологии (не эзотерики): ${message}`,
        stream: false
      });
      interpretation = response.data.response;
    } catch (ollamaError) {
      // Fallback to mock
      const lowerMessage = message.toLowerCase();
      if (lowerMessage.includes('кошмар')) {
        interpretation = mockInterpretations.nightmare;
      } else if (lowerMessage.includes('повтор')) {
        interpretation = mockInterpretations.recurring;
      } else if (lowerMessage.includes('осознан')) {
        interpretation = mockInterpretations.lucid;
      } else {
        interpretation = mockInterpretations.default;
      }
    }
    
    // Save to database
    await db.saveDream(userId, message, interpretation);
    
    res.json({ 
      success: true, 
      interpretation
    });
    
  } catch (error) {
    console.error('Interpretation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Ошибка при интерпретации сна' 
    });
  }
});

app.get('/api/history/:userId', async (req, res) => {
  try {
    const history = await db.getUserHistory(req.params.userId);
    res.json({ success: true, history });
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✨ Server running on http://localhost:${PORT}`);
});