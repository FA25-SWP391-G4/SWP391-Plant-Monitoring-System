@echo off
echo 🚀 Starting Plant Monitoring System with AI Chatbot...
echo.

REM Kill any existing node processes on our ports
echo 🔄 Stopping existing services...
taskkill /F /IM node.exe 2>nul

REM Wait a moment for processes to stop
timeout /t 2 /nobreak >nul

REM Set environment variables
set AI_SERVICE_URL=http://localhost:8000
set AI_SERVICE_PORT=8000
set JWT_SECRET=demo_jwt_secret_for_testing
set NODE_ENV=development
set ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

echo 🤖 Starting AI Service on port 8000...
start "AI Service" cmd /k "cd /d %~dp0ai_service && node app.js"

REM Wait for AI service to start
echo ⏳ Waiting for AI Service to start...
timeout /t 3 /nobreak >nul

echo 🌐 Starting Backend on port 3010...
start "Backend" cmd /k "cd /d %~dp0 && npm start"

REM Wait for backend to start
echo ⏳ Waiting for Backend to start...
timeout /t 4 /nobreak >nul

echo 💻 Starting Frontend on port 3000...
start "Frontend" cmd /k "cd /d %~dp0\client && npm run dev"

REM Wait for frontend to start
echo ⏳ Waiting for Frontend to start...
timeout /t 5 /nobreak >nul

echo.
echo ✅ All services started!
echo.
echo 📱 Access Points:
echo    Frontend:     http://localhost:3000
echo    Backend:      http://localhost:3010
echo    AI Service:   http://localhost:8000
echo.
echo 🤖 AI Chatbot:   http://localhost:3000/ai/chat
echo 🔍 Health Check: http://localhost:8000/health
echo.
echo 💡 To test the connection, run: node test-frontend-ai-connection.js
echo.
echo ⚠️  Note: You need Ultimate subscription or Admin role to use AI features
echo.
pause
