const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// Load environment variables from root directory
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// TensorFlow.js initialization (optional)
let aiUtils = null;
try {
  aiUtils = require('./services/aiUtils');
} catch (error) {
  console.warn('⚠️  AI Utils not available:', error.message);
}

const app = express();
const PORT = process.env.AI_SERVICE_PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3010', 'http://localhost:5000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/watering-prediction', require('./routes/watering'));
app.use('/api/disease-recognition', require('./routes/disease'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'plant-monitoring-ai-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('AI Service Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal AI service error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'AI service endpoint not found'
  });
});

app.listen(PORT, async () => {
  console.log(`🤖 AI Service running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  // Initialize AI infrastructure (optional)
  console.log('🧠 Initializing AI infrastructure...');
  
  if (aiUtils) {
    try {
      const tfInitialized = await aiUtils.initializeTensorFlow();
      if (tfInitialized) {
        console.log('✅ TensorFlow.js initialized successfully');
        console.log('✅ AI Service ready (full ML mode)');
      } else {
        console.log('⚠️  TensorFlow.js initialization failed - using fallback mode');
        console.log('✅ AI Service ready (fallback mode)');
      }
    } catch (error) {
      console.warn('⚠️  TensorFlow.js error:', error.message);
      console.log('✅ AI Service ready (chatbot-only mode)');
    }
  } else {
    console.log('✅ AI Service ready (chatbot-only mode)');
  }
});

module.exports = app;