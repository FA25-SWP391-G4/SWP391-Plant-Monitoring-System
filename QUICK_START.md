# 🚀 Quick Start - Chạy Local Development

## Cách Nhanh Nhất (Khuyến Nghị)

### 1. Chuẩn Bị
```bash
# Clone repo (nếu chưa có)
git clone <your-repo>
cd plant-monitoring-system

# Cài đặt dependencies
npm install
cd ai-service && npm install && cd ..
```

### 2. Chạy Tất Cả Với 1 Lệnh
```bash
# Chạy development environment
npm run dev
```

Script này sẽ tự động:
- ✅ Kiểm tra prerequisites
- ✅ Tạo environment files
- ✅ Start PostgreSQL, Redis, MQTT với Docker
- ✅ Setup database
- ✅ Start tất cả services

### 3. Test Nhanh
```bash
# Trong terminal khác
npm run dev:quick
```

## Cách Manual (Nếu Docker Không Có)

### 1. Start Infrastructure
```bash
# PostgreSQL
# Windows: Download từ postgresql.org
# macOS: brew install postgresql && brew services start postgresql
# Linux: sudo apt install postgresql && sudo systemctl start postgresql

# Redis
# Windows: Download từ GitHub releases
# macOS: brew install redis && brew services start redis  
# Linux: sudo apt install redis-server && sudo systemctl start redis

# MQTT
# Windows: Download Mosquitto
# macOS: brew install mosquitto && brew services start mosquitto
# Linux: sudo apt install mosquitto && sudo systemctl start mosquitto
```

### 2. Setup Database
```bash
# Tạo database
createdb plant_monitoring

# Run migration
cd ai-service
node database/setup-ai-database.js
cd ..
```

### 3. Start Services
```bash
# Terminal 1 - AI Service
cd ai-service
npm start

# Terminal 2 - Main Server  
npm start

# Terminal 3 - Frontend (nếu có)
cd client
npm run dev
```

## 🌐 Truy Cập Ứng Dụng

Sau khi start thành công:

- **Frontend:** http://localhost:3000
- **AI Service:** http://localhost:3001
- **Main Server:** http://localhost:3010
- **API Docs:** http://localhost:3001/api/docs

### Trang AI Features
- **AI Chat:** http://localhost:3000/ai-chat
- **Disease Detection:** http://localhost:3000/disease-detection  
- **Irrigation Prediction:** http://localhost:3000/irrigation-prediction

### Management Tools
- **Database Admin:** http://localhost:8080 (Adminer)
- **Redis Admin:** http://localhost:8081 (Redis Commander)

## 🧪 Test Features

### Test Chatbot
```bash
curl -X POST http://localhost:3001/api/ai/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Cây của tôi có lá vàng", "userId": 1}'
```

### Test Health
```bash
curl http://localhost:3001/api/ai/health
curl http://localhost:3010/health
```

### Test Irrigation
```bash
curl -X POST http://localhost:3001/api/ai/irrigation/predict/1 \
  -H "Content-Type: application/json" \
  -d '{
    "sensorData": {
      "soilMoisture": 45,
      "temperature": 28,
      "humidity": 65,
      "lightLevel": 800
    }
  }'
```

## 🔧 Useful Commands

```bash
# Start chỉ infrastructure
npm run dev:infrastructure

# Stop infrastructure  
npm run dev:stop

# Test nhanh
npm run dev:quick

# Chạy full test suite
npm run test:system:comprehensive

# Quality assurance
node scripts/run-quality-assurance.js
```

## ⚠️ Troubleshooting

### Port đã được sử dụng
```bash
# Kiểm tra port
netstat -tulpn | grep :3001  # Linux/macOS
netstat -ano | findstr :3001  # Windows

# Kill process
kill -9 <PID>  # Linux/macOS
taskkill /PID <PID> /F  # Windows
```

### Database connection error
```bash
# Kiểm tra PostgreSQL
pg_isready -h localhost -p 5432

# Reset database
cd ai-service
node database/setup-ai-database.js --reset
```

### Redis connection error
```bash
# Test Redis
redis-cli ping
```

### MQTT connection error
```bash
# Test MQTT
mosquitto_pub -h localhost -t test -m "hello"
mosquitto_sub -h localhost -t test
```

## 🎯 Next Steps

1. **Cấu hình OpenRouter API Key** trong `ai-service/.env`
2. **Test các tính năng AI** qua web interface
3. **Chạy quality tests** trước khi deploy
4. **Deploy to production** khi sẵn sàng

## 📞 Cần Hỗ Trợ?

- Kiểm tra logs trong `logs/` directory
- Chạy `npm run dev:quick` để test connectivity
- Xem `LOCAL_DEVELOPMENT_GUIDE.md` để biết chi tiết
- Check health endpoints để debug issues

Happy coding! 🚀