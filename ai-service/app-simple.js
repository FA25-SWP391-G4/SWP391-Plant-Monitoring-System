const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Khởi tạo ứng dụng Express
const app = express();
const PORT = 3001;

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic health check
app.get('/api/ai/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0-simple',
    services: {
      database: { status: 'not_connected' },
      redis: { status: 'not_connected' },
      mqtt: { status: 'not_connected' },
      openrouter: { status: 'configured' },
      tensorflow: { status: 'disabled' }
    },
    message: 'AI Service running in simple mode'
  });
});

// Simple chatbot endpoint
app.post('/api/ai/chatbot/message', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!message || !userId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Message and userId are required'
        }
      });
    }
    
    // Simple plant-related response
    const plantKeywords = ['cây', 'lá', 'rễ', 'thân', 'hoa', 'quả', 'tưới', 'phân', 'bệnh', 'sâu'];
    const isPlantRelated = plantKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
    
    let response;
    if (isPlantRelated) {
      response = `Tôi hiểu bạn đang hỏi về "${message}". Đây là một câu hỏi về cây trồng. Trong môi trường thực tế, tôi sẽ sử dụng AI để phân tích và đưa ra lời khuyên chuyên môn. Hiện tại đang chạy ở chế độ đơn giản để test kết nối.`;
    } else {
      response = 'Xin lỗi, tôi chỉ có thể trả lời các câu hỏi liên quan đến cây trồng và chăm sóc cây. Bạn có thể hỏi về tưới nước, bệnh cây, phân bón, hoặc các vấn đề khác về cây trồng.';
    }
    
    res.json({
      success: true,
      response: response,
      confidence: 0.8,
      sessionId: `session_${userId}_${Date.now()}`,
      suggestedActions: ['Kiểm tra độ ẩm đất', 'Quan sát lá cây', 'Điều chỉnh lịch tưới'],
      relatedTopics: ['Chăm sóc cây', 'Tưới nước', 'Phân bón']
    });
    
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CHATBOT_ERROR',
        message: 'Có lỗi xảy ra khi xử lý tin nhắn'
      }
    });
  }
});

// Simple irrigation prediction
app.post('/api/ai/irrigation/predict/:plantId', (req, res) => {
  try {
    const { plantId } = req.params;
    const { sensorData } = req.body;
    
    if (!sensorData) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Sensor data is required'
        }
      });
    }
    
    // Simple prediction logic
    const { soilMoisture, temperature, humidity } = sensorData;
    const shouldWater = soilMoisture < 40 || (temperature > 30 && humidity < 50);
    const waterAmount = shouldWater ? Math.max(100, (50 - soilMoisture) * 10) : 0;
    
    res.json({
      success: true,
      prediction: {
        shouldWater: shouldWater,
        hoursUntilWater: shouldWater ? 0 : 12,
        waterAmount: waterAmount,
        confidence: 0.75,
        reasoning: shouldWater ? 
          'Độ ẩm đất thấp hoặc điều kiện khô hanh' : 
          'Độ ẩm đất đủ, không cần tưới ngay'
      },
      recommendations: [
        'Kiểm tra cảm biến độ ẩm',
        'Quan sát tình trạng lá cây',
        'Điều chỉnh lịch tưới theo thời tiết'
      ]
    });
    
  } catch (error) {
    console.error('Irrigation prediction error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'PREDICTION_ERROR',
        message: 'Có lỗi xảy ra khi dự đoán tưới nước'
      }
    });
  }
});

// Simple disease detection (without image processing)
app.post('/api/ai/disease/analyze', (req, res) => {
  try {
    res.json({
      success: true,
      analysisId: Date.now(),
      diseases: [
        {
          name: 'Không xác định được (chế độ đơn giản)',
          confidence: 0.5,
          severity: 'low',
          description: 'Cần cài đặt TensorFlow.js để phân tích hình ảnh'
        }
      ],
      treatments: [
        {
          method: 'Quan sát thêm',
          description: 'Theo dõi cây trong vài ngày tới',
          urgency: 'low'
        }
      ],
      preventionTips: [
        'Đảm bảo thoát nước tốt',
        'Tránh tưới nước lên lá',
        'Cung cấp đủ ánh sáng'
      ]
    });
    
  } catch (error) {
    console.error('Disease detection error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYSIS_ERROR',
        message: 'Có lỗi xảy ra khi phân tích bệnh cây'
      }
    });
  }
});

// API documentation
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'AI Service API - Simple Mode',
    version: '1.0.0-simple',
    description: 'Simplified AI service for testing connectivity',
    baseUrl: `http://localhost:${PORT}/api/ai`,
    endpoints: {
      'GET /api/ai/health': 'Health check',
      'POST /api/ai/chatbot/message': 'Simple chatbot',
      'POST /api/ai/irrigation/predict/:plantId': 'Basic irrigation prediction',
      'POST /api/ai/disease/analyze': 'Placeholder disease detection'
    },
    note: 'This is a simplified version for testing. Full AI features require additional setup.'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'AI Service - Simple Mode',
    version: '1.0.0-simple',
    status: 'running',
    description: 'Simplified AI service for testing connectivity and basic functionality',
    endpoints: {
      health: '/api/ai/health',
      docs: '/api/docs',
      chatbot: '/api/ai/chatbot/message',
      irrigation: '/api/ai/irrigation/predict/:plantId',
      disease: '/api/ai/disease/analyze'
    }
  });
});

// Error handling
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found',
      availableEndpoints: [
        '/api/ai/health',
        '/api/ai/chatbot/message',
        '/api/ai/irrigation/predict/:plantId',
        '/api/ai/disease/analyze',
        '/api/docs'
      ]
    }
  });
});

app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'Internal server error'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Service (Simple Mode) running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/ai/health`);
  console.log(`📖 Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`🤖 Chatbot: POST http://localhost:${PORT}/api/ai/chatbot/message`);
  console.log(`💧 Irrigation: POST http://localhost:${PORT}/api/ai/irrigation/predict/:plantId`);
  console.log(`🔬 Disease: POST http://localhost:${PORT}/api/ai/disease/analyze`);
  console.log(`\n✅ Server ready for testing!`);
});

module.exports = app;