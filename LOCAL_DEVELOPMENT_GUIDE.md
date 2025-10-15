# Hướng Dẫn Chạy Local Development - AI Features Integration

## 📋 Yêu Cầu Hệ Thống

### Phần Mềm Cần Thiết
- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **PostgreSQL** >= 13
- **Redis** >= 6.0
- **MQTT Broker** (Mosquitto)
- **Git**

### Tùy Chọn (Khuyến Nghị)
- **Docker & Docker Compose** (để chạy infrastructure)
- **Postman** hoặc **Thunder Client** (để test API)

## 🚀 Cách 1: Chạy Với Docker (Khuyến Nghị)

### Bước 1: Chuẩn Bị Environment Files

Tạo file `.env` trong thư mục gốc:
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/plant_monitoring

# Redis
REDIS_URL=redis://localhost:6379

# MQTT
MQTT_BROKER_URL=mqtt://localhost:1883

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# AI Service
OPENROUTER_API_KEY=your-openrouter-api-key-here

# Environment
NODE_ENV=development
```

Tạo file `ai-service/.env`:
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/plant_monitoring

# Redis
REDIS_URL=redis://localhost:6379

# MQTT
MQTT_BROKER_URL=mqtt://localhost:1883

# OpenRouter API
OPENROUTER_API_KEY=your-openrouter-api-key-here

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Server
PORT=3001
NODE_ENV=development

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760

# Performance
MODEL_CACHE_SIZE=1000
MAX_CONCURRENT_REQUESTS=50
```

### Bước 2: Chạy Infrastructure với Docker

```bash
# Tạo Docker Compose file cho development
docker-compose -f docker-compose.dev.yml up -d postgresql redis mosquitto
```

### Bước 3: Setup Database

```bash
# Chạy database migration
cd ai-service
node database/setup-ai-database.js
cd ..
```

### Bước 4: Install Dependencies

```bash
# Install dependencies cho main server
npm install

# Install dependencies cho AI service
cd ai-service
npm install
cd ..

# Install dependencies cho frontend (nếu có)
cd client
npm install
cd ..
```

### Bước 5: Chạy Services

Mở 3 terminal riêng biệt:

**Terminal 1 - AI Service:**
```bash
cd ai-service
npm run dev
# hoặc
node app.js
```

**Terminal 2 - Main Server:**
```bash
npm run dev
# hoặc
node app.js
```

**Terminal 3 - Frontend (nếu có):**
```bash
cd client
npm run dev
```

## 🔧 Cách 2: Chạy Manual (Không Docker)

### Bước 1: Cài Đặt PostgreSQL

**Windows:**
```bash
# Download và cài đặt từ https://www.postgresql.org/download/windows/
# Tạo database
createdb plant_monitoring
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
createdb plant_monitoring
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb plant_monitoring
```

### Bước 2: Cài Đặt Redis

**Windows:**
```bash
# Download từ https://github.com/microsoftarchive/redis/releases
# Hoặc dùng WSL
```

**macOS:**
```bash
brew install redis
brew services start redis
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### Bước 3: Cài Đặt MQTT Broker

**Windows:**
```bash
# Download Mosquitto từ https://mosquitto.org/download/
```

**macOS:**
```bash
brew install mosquitto
brew services start mosquitto
```

**Linux:**
```bash
sudo apt-get install mosquitto mosquitto-clients
sudo systemctl start mosquitto
```

### Bước 4: Cấu Hình Environment Variables

Cập nhật các file `.env` với thông tin kết nối thực tế của bạn.

### Bước 5: Chạy Services

Làm theo Bước 4 và 5 của Cách 1.

## 🧪 Test Hệ Thống

### Kiểm Tra Health Status

```bash
# Check AI Service
curl http://localhost:3001/api/ai/health

# Check Main Server
curl http://localhost:3010/health

# Check Frontend
curl http://localhost:3000
```

### Test AI Features

**1. Test Chatbot:**
```bash
curl -X POST http://localhost:3001/api/ai/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Cây của tôi có lá vàng, phải làm sao?",
    "userId": 1
  }'
```

**2. Test Disease Detection:**
```bash
curl -X POST http://localhost:3001/api/ai/disease/analyze \
  -F "image=@path/to/plant-image.jpg" \
  -F "userId=1"
```

**3. Test Irrigation Prediction:**
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

## 🌐 Truy Cập Ứng Dụng

- **Frontend:** http://localhost:3000
- **Main API:** http://localhost:3010
- **AI Service:** http://localhost:3001
- **API Documentation:** http://localhost:3001/api/docs

### Các Trang Chính

- **AI Chat:** http://localhost:3000/ai-chat
- **Disease Detection:** http://localhost:3000/disease-detection
- **Irrigation Prediction:** http://localhost:3000/irrigation-prediction

## 🔍 Debug và Troubleshooting

### Kiểm Tra Logs

```bash
# AI Service logs
tail -f ai-service/logs/app.log

# Main server logs
tail -f logs/app.log
```

### Kiểm Tra Database Connection

```bash
# Test PostgreSQL
psql -h localhost -U postgres -d plant_monitoring -c "SELECT NOW();"

# Test Redis
redis-cli ping
```

### Kiểm Tra MQTT

```bash
# Subscribe to test topic
mosquitto_sub -h localhost -t "test/topic"

# Publish test message
mosquitto_pub -h localhost -t "test/topic" -m "Hello MQTT"
```

### Common Issues

**1. Port đã được sử dụng:**
```bash
# Kiểm tra port đang sử dụng
netstat -tulpn | grep :3001
# Hoặc trên Windows
netstat -ano | findstr :3001
```

**2. Database connection error:**
- Kiểm tra PostgreSQL đang chạy
- Kiểm tra thông tin kết nối trong `.env`
- Kiểm tra database đã được tạo

**3. OpenRouter API error:**
- Kiểm tra API key trong `.env`
- Kiểm tra kết nối internet
- Kiểm tra quota API

## 🧪 Chạy Tests

### Unit Tests
```bash
# AI Service tests
cd ai-service
npm test

# Main server tests
npm test
```

### Integration Tests
```bash
# Chạy comprehensive tests
node tests/run-comprehensive-system-tests.js

# Chạy AI-specific tests
node tests/run-ai-e2e-tests.js
```

### Quality Assurance
```bash
# Chạy full QA suite
node scripts/run-quality-assurance.js

# Chạy individual checks
node scripts/security-audit.js
node scripts/performance-optimization.js
node scripts/user-acceptance-testing.js
```

## 📊 Monitoring (Optional)

### Chạy Monitoring Stack

```bash
# Setup monitoring
node monitoring/setup-monitoring.js

# Start monitoring services với Docker
docker-compose -f docker-compose.ai.yml up -d prometheus grafana
```

### Access Monitoring

- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3030 (admin/admin123)

## 🚀 Production Build

### Build cho Production

```bash
# Build AI service
cd ai-service
npm run build

# Build frontend
cd ../client
npm run build

# Build main server
cd ..
npm run build
```

### Deploy Local Production

```bash
# Chạy production deployment
./scripts/deploy.sh development

# Hoặc trên Windows
powershell -ExecutionPolicy Bypass -File scripts/deploy.ps1 -Environment development
```

## 📞 Hỗ Trợ

### Nếu gặp vấn đề:

1. **Kiểm tra logs** trong thư mục `logs/`
2. **Kiểm tra health endpoints** để xác định service nào có vấn đề
3. **Chạy individual tests** để isolate issues
4. **Kiểm tra environment variables** và database connections
5. **Restart services** theo thứ tự: Database → Redis → MQTT → AI Service → Main Server

### Useful Commands

```bash
# Restart tất cả services
pkill -f "node.*app.js"
# Sau đó start lại từng service

# Clear Redis cache
redis-cli FLUSHALL

# Reset database
cd ai-service
node database/setup-ai-database.js --reset
```

## 🎯 Next Steps

Sau khi hệ thống chạy thành công local:

1. **Test các tính năng AI** qua web interface
2. **Chạy quality assurance tests**
3. **Optimize performance** nếu cần
4. **Deploy to staging/production** khi sẵn sàng

Happy coding! 🚀