const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');

// Tải biến môi trường
dotenv.config();

// Khởi tạo ứng dụng Express
const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Phục vụ tệp tĩnh từ thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const aiRoutes = require('./routes/aiRoutes');
app.use('/api/ai', aiRoutes);

// Route kiểm tra trạng thái
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ai-service',
    version: '1.0.0',
    timestamp: new Date()
  });
});

// Xử lý lỗi 404
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Không tìm thấy tài nguyên yêu cầu'
  });
});

// Xử lý lỗi chung
app.use((err, req, res, next) => {
  console.error('Lỗi server:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Lỗi server nội bộ'
  });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`AI Service đang chạy trên cổng ${PORT}`);
});

module.exports = app;