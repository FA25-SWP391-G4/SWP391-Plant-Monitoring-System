# 🚀 Chạy Local Development - Hướng Dẫn Đơn Giản

## Cách Nhanh Nhất

### Option 1: Chạy Batch File (Windows)
```bash
# Double-click file hoặc chạy trong Command Prompt
start-local.bat
```

### Option 2: Chạy PowerShell Script
```powershell
# Mở PowerShell as Administrator và chạy:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\start-local.ps1
```

### Option 3: Manual Commands

**Bước 1: Mở Command Prompt/PowerShell**

**Bước 2: Navigate đến project folder**
```bash
cd "path\to\your\SWP391-Plant-Monitoring-System"
```

**Bước 3: Install dependencies**
```bash
npm install
cd ai-service
npm install
cd ..
```

**Bước 4: Start infrastructure**
```bash
docker-compose -f docker-compose.dev.yml up -d
```

**Bước 5: Start services (mở 3 terminal riêng biệt)**

Terminal 1 - AI Service:
```bash
cd ai-service
npm start
```

Terminal 2 - Main Server:
```bash
npm start
```

Terminal 3 - Frontend (nếu có):
```bash
cd client
npm run dev
```

## 🌐 Truy Cập Ứng Dụng

Sau khi tất cả services chạy:

- **AI Service:** http://localhost:3001
- **Main Server:** http://localhost:3010  
- **Frontend:** http://localhost:3000
- **API Documentation:** http://localhost:3001/api/docs

## 🧪 Test Hệ Thống

### Test Health Check
```bash
# Mở terminal mới
curl http://localhost:3001/api/ai/health
curl http://localhost:3010/health
```

### Test AI Features
```bash
# Test nhanh tất cả
node scripts/quick-test.js

# Test chatbot đơn giản
node ai-service/test-chatbot-simple.js
```

### Test qua Web Browser

1. **AI Chat:** http://localhost:3000/ai-chat
2. **Disease Detection:** http://localhost:3000/disease-detection
3. **Irrigation Prediction:** http://localhost:3000/irrigation-prediction

## 🔧 Troubleshooting

### Nếu Docker không chạy được:
```bash
# Cài đặt PostgreSQL, Redis, MQTT manual
# Xem LOCAL_DEVELOPMENT_GUIDE.md để biết chi tiết
```

### Nếu port bị conflict:
```bash
# Kiểm tra port đang sử dụng
netstat -ano | findstr :3001
netstat -ano | findstr :3010

# Kill process nếu cần
taskkill /PID <PID> /F
```

### Nếu thiếu dependencies:
```bash
npm install
cd ai-service && npm install
cd client && npm install  # nếu có frontend
```

## 🛑 Stop Services

1. **Close tất cả terminal windows**
2. **Stop Docker containers:**
```bash
docker-compose -f docker-compose.dev.yml down
```

## 📞 Cần Hỗ Trợ?

- Check logs trong terminal windows
- Xem `LOCAL_DEVELOPMENT_GUIDE.md` để biết chi tiết
- Chạy `node scripts/quick-test.js` để test connectivity

Happy coding! 🚀