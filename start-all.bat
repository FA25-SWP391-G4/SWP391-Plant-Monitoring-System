@echo off
echo ===== Starting Plant Monitoring System =====

echo Starting backend server...
start cmd /k "npm start"

echo Starting AI service...
start cmd /k "npm run start:ai"

echo Opening frontend in browser...
timeout /t 5
start http://localhost:3000

echo All services started!