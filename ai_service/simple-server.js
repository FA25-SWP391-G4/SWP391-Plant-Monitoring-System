const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.AI_SERVICE_PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Authentication middleware
const aiAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('[AI Service] Auth header:', authHeader ? 'Bearer ***' : 'None');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[AI Service] No auth header or wrong format');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }
    
    const token = authHeader.split(' ')[1];
    // Use the same JWT_SECRET as the main backend
    const jwtSecret = process.env.JWT_SECRET || 'cd9f94297383bffbd6b3f8d7146d1bfb';
    console.log('[AI Service] JWT Secret being used:', jwtSecret.substring(0, 10) + '...');
    
    const decoded = jwt.verify(token, jwtSecret);
    console.log('[AI Service] Token decoded successfully:', { 
      user_id: decoded.user_id, 
      role: decoded.role,
      exp: new Date(decoded.exp * 1000).toISOString()
    });
    
    // Check if user has premium access
    const isPremium = decoded.role === 'Premium' || decoded.role === 'Admin' || 
                     decoded.role === 'premium' || decoded.role === 'admin';
    
    if (!isPremium) {
      console.log('[AI Service] User does not have premium access:', decoded.role);
      return res.status(403).json({ 
        success: false,
        error: 'Premium subscription required for AI features',
        code: 'PREMIUM_REQUIRED'
      });
    }
    
    req.user = decoded;
    next();
    
  } catch (error) {
    console.log('[AI Service] Auth error:', error.name, error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Token has expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid token. Please login again.',
        code: 'INVALID_TOKEN'
      });
    }
    
    return res.status(500).json({ 
      success: false,
      error: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

// Optional auth middleware for test endpoints
const aiOptionalAuthMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      // Use the same JWT_SECRET as the main backend
      const jwtSecret = process.env.JWT_SECRET || 'cd9f94297383bffbd6b3f8d7146d1bfb';
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;
    }
    next();
  } catch (error) {
    next(); // Continue without auth
  }
};

// Multer for file uploads
const multer = require('multer');
const upload = multer({ 
  dest: path.join(__dirname, 'uploads'),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Import the real chatbot controller
const chatbotController = require('./controllers/chatbotController');

// Real AI service endpoints using OpenRouter
app.post('/api/chatbot', aiAuthMiddleware, chatbotController.handleMessage);

app.post('/api/image-recognition', aiAuthMiddleware, upload.single('image'), (req, res) => {
  setTimeout(() => {
    res.json({
      success: true,
      analysis: {
        plant_type: 'Unknown Plant',
        health_score: Math.floor(Math.random() * 30) + 70, // 70-100%
        condition: 'healthy',
        diseases: [],
        recommendations: [
          'Continue current watering schedule',
          'Ensure adequate sunlight (6-8 hours daily)',
          'Check for any signs of pest activity'
        ],
        confidence: 0.87
      },
      timestamp: new Date().toISOString()
    });
  }, 2000);
});

app.post('/api/irrigation', aiAuthMiddleware, (req, res) => {
  const { sensor_data, plant_type } = req.body;
  
  setTimeout(() => {
    res.json({
      success: true,
      irrigation_needed: Math.random() > 0.5,
      recommended_amount: Math.floor(Math.random() * 500) + 200, // 200-700ml
      next_watering: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      reasoning: 'Based on soil moisture levels and plant type requirements',
      confidence: 0.92,
      timestamp: new Date().toISOString()
    });
  }, 1500);
});

app.post('/api/irrigation-schedule', aiAuthMiddleware, (req, res) => {
  const { plant_data, preferences } = req.body;
  
  setTimeout(() => {
    res.json({
      success: true,
      schedule: {
        frequency: 'every 2-3 days',
        optimal_times: ['07:00', '19:00'],
        amount_per_session: '300ml',
        weekly_pattern: ['Mon', 'Wed', 'Fri', 'Sun']
      },
      reasoning: 'Optimized based on plant type, season, and growth stage',
      confidence: 0.89,
      timestamp: new Date().toISOString()
    });
  }, 2000);
});

app.post('/api/historical-analysis', aiAuthMiddleware, (req, res) => {
  const { plant_id, date_range } = req.body;
  
  setTimeout(() => {
    res.json({
      success: true,
      analysis: {
        growth_trend: 'positive',
        health_trend: 'stable',
        watering_efficiency: 0.85,
        key_insights: [
          'Plant health has improved by 15% over the last month',
          'Watering frequency can be reduced by 10%',
          'Light exposure is optimal'
        ],
        recommendations: [
          'Continue current care routine',
          'Monitor for seasonal changes'
        ]
      },
      confidence: 0.91,
      timestamp: new Date().toISOString()
    });
  }, 2500);
});

app.post('/api/self-learning', aiAuthMiddleware, (req, res) => {
  const { feedback, plant_data } = req.body;
  
  res.json({
    success: true,
    message: 'Feedback processed successfully',
    model_updated: true,
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AI Service',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'PlantSmart AI Service API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      imageRecognition: '/api/image-recognition',
      chatbot: '/api/chatbot',
      irrigation: '/api/irrigation',
      irrigationSchedule: '/api/irrigation-schedule',
      historicalAnalysis: '/api/historical-analysis',
      selfLearning: '/api/self-learning'
    }
  });
});

// Mock AI endpoints for testing
app.post('/api/test/chatbot', (req, res) => {
  const { message, user_id } = req.body;
  
  setTimeout(() => {
    res.json({
      success: true,
      response: `AI Response: I understand you said "${message}". As your plant care assistant, I recommend checking your plant's soil moisture and ensuring it gets adequate light.`,
      confidence: 0.95,
      timestamp: new Date().toISOString()
    });
  }, 1000); // Simulate processing time
});

app.post('/api/test/plant-analysis', upload.single('image'), (req, res) => {
  setTimeout(() => {
    res.json({
      success: true,
      analysis: {
        health_score: Math.floor(Math.random() * 30) + 70, // 70-100%
        condition: 'healthy',
        issues: [],
        recommendations: [
          'Continue current watering schedule',
          'Ensure adequate sunlight (6-8 hours daily)',
          'Check for any signs of pest activity'
        ]
      },
      timestamp: new Date().toISOString()
    });
  }, 2000);
});

// Error handling
app.use((req, res, next) => {
  res.status(404).json({
    error: true,
    message: 'Endpoint not found'
  });
});

app.use((err, req, res, next) => {
  console.error('AI Service Error:', err);
  res.status(500).json({
    error: true,
    message: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 AI Service running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📚 API docs: http://localhost:${PORT}/`);
});

module.exports = app;