const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const chatbotController = require('./controllers/chatbotController');

// Khởi tạo ứng dụng Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/image-recognition', require('./routes/imageRecognition'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/irrigation', require('./routes/irrigation'));
app.use('/api/irrigation-schedule', require('./routes/irrigationSchedule'));
app.use('/api/historical-analysis', require('./routes/historicalAnalysis'));
app.use('/api/self-learning', require('./routes/selfLearning'));

// Chatbot UI route
app.get('/chatbot', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chatbot.html'));
});

// API giả lập dữ liệu cảm biến cho giao diện
app.get('/api/sensor-data', chatbotController.simulateData);

// API giả lập dữ liệu cảm biến cho giao diện
app.get('/api/chatbot/simulate-data', chatbotController.simulateData);

// Trang chủ API
app.get('/', (req, res) => {
  res.json({
    message: 'Chào mừng đến với AI Service API',
    endpoints: {
      imageRecognition: '/api/image-recognition',
      chatbot: '/api/chatbot',
      irrigation: '/api/irrigation',
      irrigationSchedule: '/api/irrigation-schedule',
      historicalAnalysis: '/api/historical-analysis',
      selfLearning: '/api/self-learning'
    },
    ui: {
      chatbot: '/chatbot'
    }
  });
});

// Xử lý lỗi 404
app.use((req, res, next) => {
  res.status(404).json({
    error: true,
    message: 'Không tìm thấy endpoint'
  });
});

// Xử lý lỗi
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: 'Đã xảy ra lỗi server',
    details: err.message
  });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`AI Service đang chạy trên cổng ${PORT}`);
});

module.exports = app;