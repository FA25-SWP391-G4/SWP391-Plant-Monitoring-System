# AI Service - Hệ thống Giám sát Cây trồng Thông minh

## Tổng quan

AI Service là một microservice toàn diện cung cấp các tính năng AI tiên tiến cho hệ thống giám sát cây trồng thông minh. Hệ thống sử dụng các thuật toán machine learning và AI models để tối ưu hóa việc chăm sóc cây trồng.

## 🌟 Tính năng chính

### 1. **Dự báo nhu cầu tưới cây thông minh**
- Sử dụng AI để dự đoán chính xác thời điểm và lượng nước cần tưới
- Tích hợp dữ liệu cảm biến, thời tiết và lịch sử tưới
- Độ chính xác cao với confidence score

### 2. **Phân tích và cảnh báo sớm tình trạng cây trồng**
- Phát hiện sớm các vấn đề về sức khỏe cây trồng
- Cảnh báo nguy cơ bệnh, thiếu nước, stress nhiệt độ
- Phân tích xu hướng và anomaly detection

### 3. **Tối ưu lịch tưới tự động**
- Thuật toán Genetic Algorithm, Reinforcement Learning
- Tối ưu hóa theo nhiều tiêu chí: hiệu quả nước, sức khỏe cây, chi phí
- Tự động điều chỉnh theo điều kiện thực tế

### 4. **Phân tích dữ liệu lịch sử và đề xuất chăm sóc**
- Phân tích patterns và correlations từ dữ liệu lịch sử
- Đề xuất chăm sóc cá nhân hóa cho từng loại cây
- Insights và recommendations thông minh

### 5. **Nhận diện tình trạng cây qua ảnh**
- Phát hiện bệnh cây qua hình ảnh
- Đánh giá sức khỏe và giai đoạn phát triển
- So sánh ảnh theo thời gian để theo dõi tiến triển

### 6. **Tự học và cải tiến theo dữ liệu thực tế**
- Thu thập feedback từ người dùng
- Tự động retrain models khi cần thiết
- Học từ các cây tương tự để cải thiện dự đoán

### 7. **Tự động hóa quá trình tưới cây**
- Điều khiển thiết bị tưới tự động
- Safety limits và error handling
- Multiple automation modes: Smart, Scheduled, Sensor-based

### 8. **Chatbot hỗ trợ người dùng**
- Sử dụng Mistral 7B Instruct qua OpenRouter API
- Tư vấn chăm sóc cây trồng thông minh
- Tích hợp dữ liệu cảm biến real-time

## 🚀 Cài đặt và Chạy

### Yêu cầu hệ thống
- Node.js >= 16.0.0
- npm >= 8.0.0
- PostgreSQL (optional, cho production)

### Cài đặt dependencies
```bash
cd ai-service
npm install
```

### Cấu hình môi trường
Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

Cập nhật các biến môi trường:
```env
# API Configuration
PORT=3001
APP_URL=http://localhost:3001

# OpenRouter API (Mistral 7B)
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=mistralai/mistral-7b-instruct

# Database (Optional)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=plant_monitoring

# Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Chạy service
```bash
# Development mode
npm run dev

# Production mode
npm start

# Run tests
npm test
```

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api/ai
```

### Main Endpoints

#### 🤖 Chatbot
```http
POST /api/ai/chatbot/message
GET /api/ai/chatbot/history/:sessionId
GET /api/ai/chatbot/sessions/:userId
```

#### 💧 Irrigation Prediction
```http
POST /api/ai/irrigation/predict/:plantId
POST /api/ai/irrigation/optimize/:plantId
GET /api/ai/irrigation/history/:plantId
```

#### ⚠️ Early Warning
```http
POST /api/ai/warning/analyze/:plantId
GET /api/ai/warning/alerts/:plantId
GET /api/ai/warning/dashboard/:plantId
```

#### 📸 Image Recognition
```http
POST /api/ai/image/analyze
GET /api/ai/image/history/:userId/:plantId?
POST /api/ai/image/compare
```

#### 🧠 Self Learning
```http
POST /api/ai/learning/feedback
GET /api/ai/learning/analyze/:plantId
POST /api/ai/learning/improve/:modelType
```

#### 🔄 Automation
```http
POST /api/ai/automation/setup/:plantId
POST /api/ai/automation/start/:automationId
GET /api/ai/automation/dashboard
```

### Example Usage

#### Dự báo tưới cây
```javascript
const response = await fetch('/api/ai/irrigation/predict/plant123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    options: {
      includeWeather: true,
      confidenceThreshold: 0.8
    }
  })
});

const prediction = await response.json();
console.log(prediction.prediction.needsWatering);
```

#### Gửi tin nhắn chatbot
```javascript
const response = await fetch('/api/ai/chatbot/message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Cây của tôi có vẻ héo, tôi nên làm gì?",
    userId: "user123",
    plantId: "plant123",
    language: "vi"
  })
});

const chatResponse = await response.json();
console.log(chatResponse.response);
```

#### Thiết lập automation
```javascript
const response = await fetch('/api/ai/automation/setup/plant123', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    enabled: true,
    mode: 'smart',
    triggers: [
      {
        type: 'ai_prediction',
        threshold: 0.7
      }
    ],
    actions: [
      {
        type: 'irrigation',
        amount: 200
      }
    ],
    constraints: {
      maxWaterPerDay: 1000,
      allowedTimeRanges: [{ start: '06:00', end: '20:00' }]
    }
  })
});
```

## 🏗️ Kiến trúc

### Microservice Architecture
```
ai-service/
├── controllers/          # API Controllers
│   ├── chatbotController.js
│   ├── irrigationPredictionController.js
│   ├── earlyWarningController.js
│   ├── selfLearningController.js
│   ├── automationController.js
│   └── imageRecognitionController.js
├── services/            # Business Logic
│   ├── aiPredictionService.js
│   ├── earlyWarningService.js
│   ├── irrigationOptimizationService.js
│   ├── selfLearningService.js
│   ├── automationService.js
│   └── sensorService.js
├── models/              # Data Models
├── routes/              # API Routes
├── utils/               # Utilities
└── config/              # Configuration
```

### AI Models & Algorithms

#### 1. Irrigation Prediction
- **Reinforcement Learning**: Q-Learning cho tối ưu hóa tưới
- **Genetic Algorithm**: Tối ưu lịch tưới đa mục tiêu
- **Rule-based System**: Fallback logic dựa trên rules

#### 2. Early Warning System
- **Anomaly Detection**: Statistical và pattern-based
- **Risk Assessment**: Multi-factor risk analysis
- **Trend Analysis**: Time series analysis

#### 3. Image Recognition
- **CNN Models**: Plant disease detection
- **Transfer Learning**: Pre-trained models fine-tuning
- **Image Processing**: OpenCV, Sharp

#### 4. Self Learning
- **Online Learning**: Continuous model improvement
- **Feedback Integration**: User feedback processing
- **Cross-plant Learning**: Knowledge transfer

## 🔧 Configuration

### AI Model Settings
```javascript
// ai-service/config/ai-models.js
module.exports = {
  irrigation: {
    algorithm: 'reinforcement_learning',
    learningRate: 0.1,
    discountFactor: 0.9,
    explorationRate: 0.1
  },
  earlyWarning: {
    alertThresholds: {
      critical: 0.9,
      high: 0.7,
      medium: 0.5
    }
  },
  automation: {
    safetyLimits: {
      maxWaterPerDay: 2000,
      maxWaterPerHour: 500,
      minTimeBetweenIrrigations: 7200000
    }
  }
};
```

### OpenRouter API Configuration
```javascript
// Mistral 7B Instruct configuration
const OPENROUTER_CONFIG = {
  model: 'mistralai/mistral-7b-instruct',
  temperature: 0.7,
  max_tokens: 800,
  top_p: 0.9
};
```

## 📊 Monitoring & Health Check

### Health Check Endpoint
```http
GET /health
```

Response:
```json
{
  "status": "OK",
  "version": "2.0.0",
  "uptime": 3600,
  "features": {
    "chatbot": "active",
    "imageRecognition": "active",
    "irrigationPrediction": "active",
    "earlyWarning": "active",
    "selfLearning": "active",
    "automation": "active"
  },
  "models": {
    "irrigation": { "status": "loaded", "accuracy": 0.85 },
    "disease_detection": { "status": "loaded", "accuracy": 0.82 }
  }
}
```

### Performance Metrics
```http
GET /api/ai/statistics
```

## 🧪 Testing

### Run Tests
```bash
# All tests
npm test

# Specific test suites
npm run test:chatbot
npm run test:irrigation
npm run test:image
```

### Test Coverage
- Unit tests cho tất cả services
- Integration tests cho API endpoints
- Mock data cho development

## 🚀 Deployment

### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Environment Variables
```bash
# Production environment
NODE_ENV=production
PORT=3001
OPENROUTER_API_KEY=your_production_key
DB_HOST=your_db_host
DB_PASSWORD=your_secure_password
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

- 📧 Email: support@plant-monitoring.com
- 📖 Documentation: `/api/docs`
- 🐛 Issues: GitHub Issues
- 💬 Chat: Slack #ai-service

## 🔄 Changelog

### v2.0.0 (Current)
- ✅ Comprehensive AI service với 8 tính năng chính
- ✅ Mistral 7B Instruct chatbot integration
- ✅ Advanced irrigation optimization algorithms
- ✅ Self-learning capabilities
- ✅ Automated irrigation control
- ✅ Enhanced early warning system

### v1.0.0
- ✅ Basic chatbot functionality
- ✅ Simple irrigation prediction
- ✅ Image recognition prototype