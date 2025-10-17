@echo off
echo Starting Plant Monitoring System with AI Service...
echo.

REM Start AI Service in a new window
echo Starting AI Service...
start "AI Service" cmd /k "cd ai_service && npm start"

REM Wait a moment for AI service to start
timeout /t 3 /nobreak >nul

REM Start Main Application
echo Starting Main Application...
start "Main App" cmd /k "npm start"

echo.
echo Both services are starting...
echo - AI Service: http://localhost:8000
echo - Main App: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul