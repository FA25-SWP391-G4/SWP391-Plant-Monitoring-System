const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8000;

// Basic middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'plant-monitoring-ai-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Basic chatbot endpoint
app.post('/api/chatbot/query', (req, res) => {
  const { message } = req.body;
  
  res.json({
    success: true,
    data: {
      response: `Test response to: ${message}`,
      chat_id: `test_${Date.now()}`,
      timestamp: new Date(),
      isPlantRelated: true,
      confidence: 0.9,
      source: 'test-service',
      model: 'test-model'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🤖 Test AI Service running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
