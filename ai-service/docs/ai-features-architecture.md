# Kiến trúc AI Microservice - Hệ thống Giám sát Cây trồng Thông minh

## Tổng quan Tính năng AI

### 1. Dự báo nhu cầu tưới cây thông minh
- **Mô tả**: Phân tích dữ liệu cảm biến, thời tiết và lịch sử để dự báo chính xác thời điểm cần tưới
- **API**: `/api/ai/irrigation/predict`
- **Model**: Regression model với time series analysis

### 2. Phân tích và cảnh báo sớm tình trạng cây trồng
- **Mô tả**: Phát hiện sớm các vấn đề về sức khỏe cây trồng
- **API**: `/api/ai/early-warning`
- **Model**: Classification model với anomaly detection

### 3. Tối ưu lịch tưới tự động
- **Mô tả**: Tạo lịch tưới tối ưu dựa trên AI
- **API**: `/api/ai/irrigation/optimize`
- **Model**: Optimization algorithm với reinforcement learning

### 4. Phân tích dữ liệu lịch sử và đề xuất chăm sóc
- **Mô tả**: Phân tích xu hướng và đưa ra khuyến nghị chăm sóc
- **API**: `/api/ai/historical-analysis`
- **Model**: Time series analysis với pattern recognition

### 5. Nhận diện tình trạng cây qua ảnh
- **Mô tả**: Phân tích hình ảnh để nhận diện bệnh và tình trạng cây
- **API**: `/api/ai/image-recognition`
- **Model**: CNN với transfer learning (ResNet/EfficientNet)

### 6. Tự học và cải tiến theo dữ liệu thực tế
- **Mô tả**: Hệ thống học từ feedback và cải thiện độ chính xác
- **API**: `/api/ai/self-learning`
- **Model**: Online learning với feedback loop

### 7. Tự động hóa quá trình tưới cây
- **Mô tả**: Điều khiển hệ thống tưới tự động dựa trên AI
- **API**: `/api/ai/automation`
- **Model**: Decision tree với rule-based system

### 8. Chatbot hỗ trợ người dùng
- **Mô tả**: Trợ lý AI sử dụng Mistral 7B Instruct qua OpenRouter
- **API**: `/api/ai/chatbot`
- **Model**: Mistral 7B Instruct (OpenRouter API)

## Kiến trúc Microservice

```
ai-service/
├── controllers/           # API Controllers
├── services/             # Business Logic
├── models/               # AI Models & Database Models
├── utils/                # Utilities
├── middleware/           # Middleware
├── config/               # Configuration
└── routes/               # API Routes
```

## Tech Stack

- **Backend**: Node.js + Express
- **AI/ML**: TensorFlow.js, Python integration
- **Database**: PostgreSQL
- **API**: OpenRouter (Mistral 7B)
- **Image Processing**: Sharp, Canvas
- **Real-time**: WebSocket
- **Monitoring**: Custom metrics