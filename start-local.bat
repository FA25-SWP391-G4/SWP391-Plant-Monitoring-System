@echo off
echo 🚀 Starting AI Features Integration - Local Development
echo ========================================================

echo.
echo 📋 Checking prerequisites...
node --version
npm --version

echo.
echo 🔧 Installing dependencies...
call npm install
cd ai-service
call npm install
cd ..

echo.
echo 🗄️ Starting infrastructure (PostgreSQL, Redis, MQTT)...
docker-compose -f docker-compose.dev.yml up -d

echo.
echo ⏳ Waiting for infrastructure to be ready...
timeout /t 15 /nobreak

echo.
echo 🤖 Starting AI Service...
start "AI Service" cmd /k "cd ai-service && npm start"

echo.
echo ⏳ Waiting for AI Service to start...
timeout /t 5 /nobreak

echo.
echo 🖥️ Starting Main Server...
start "Main Server" cmd /k "npm start"

echo.
echo ⏳ Waiting for Main Server to start...
timeout /t 5 /nobreak

echo.
echo 🌐 Starting Frontend (if available)...
if exist client\package.json (
    start "Frontend" cmd /k "cd client && npm run dev"
)

echo.
echo 🎉 All services started!
echo ========================================================
echo 🌐 Access URLs:
echo   Frontend:        http://localhost:3000
echo   Main Server:     http://localhost:3010
echo   AI Service:      http://localhost:3001
echo   API Docs:        http://localhost:3001/api/docs
echo.
echo 🧪 Test Commands:
echo   Health Check:    curl http://localhost:3001/api/ai/health
echo   Quick Test:      node scripts/quick-test.js
echo.
echo 🛑 To stop services: Close all command windows and run:
echo   docker-compose -f docker-compose.dev.yml down
echo ========================================================

pause