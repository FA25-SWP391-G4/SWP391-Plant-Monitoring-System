@echo off
echo Starting Plant Monitoring System with AI Chatbot...
echo.

REM Set environment variables
set AI_SERVICE_URL=http://localhost:8000
set AI_SERVICE_PORT=8000
set JWT_SECRET=demo_jwt_secret_for_testing
set NODE_ENV=development

echo Starting AI Service on port 8000...
start /B "AI Service" cmd /c "cd ai_service && node app.js"

echo Waiting for AI Service to start...
timeout /t 3 /nobreak >nul

echo Starting Main App on port 3010...
start /B "Main App" cmd /c "npm start"

echo Waiting for Main App to start...
timeout /t 5 /nobreak >nul

echo.
echo 🚀 System started! You can now:
echo - Visit the main app: http://localhost:3010
echo - Access AI chatbot: http://localhost:3000/ai/chat
echo - Check AI service health: http://localhost:8000/health
echo.
echo Press Ctrl+C to stop all services
echo.

REM Keep the script running
pause
