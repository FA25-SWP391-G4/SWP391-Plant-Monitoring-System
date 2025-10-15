# AI Features Integration - Local Development Startup Script
# PowerShell version for Windows

Write-Host "🚀 Starting AI Features Integration - Local Development" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green

Write-Host "`n📋 Checking prerequisites..." -ForegroundColor Blue
node --version
npm --version

Write-Host "`n🔧 Installing dependencies..." -ForegroundColor Blue
npm install
Set-Location ai-service
npm install
Set-Location ..

Write-Host "`n🗄️ Starting infrastructure (PostgreSQL, Redis, MQTT)..." -ForegroundColor Blue
docker-compose -f docker-compose.dev.yml up -d

Write-Host "`n⏳ Waiting for infrastructure to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host "`n🤖 Starting AI Service..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location ai-service; npm start"

Write-Host "`n⏳ Waiting for AI Service to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`n🖥️ Starting Main Server..." -ForegroundColor Blue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"

Write-Host "`n⏳ Waiting for Main Server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`n🌐 Starting Frontend (if available)..." -ForegroundColor Blue
if (Test-Path "client\package.json") {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location client; npm run dev"
}

Write-Host "`n🎉 All services started!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
Write-Host "🌐 Access URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:        http://localhost:3000" -ForegroundColor White
Write-Host "  Main Server:     http://localhost:3010" -ForegroundColor White
Write-Host "  AI Service:      http://localhost:3001" -ForegroundColor White
Write-Host "  API Docs:        http://localhost:3001/api/docs" -ForegroundColor White

Write-Host "`n🧪 Test Commands:" -ForegroundColor Cyan
Write-Host "  Health Check:    curl http://localhost:3001/api/ai/health" -ForegroundColor White
Write-Host "  Quick Test:      node scripts/quick-test.js" -ForegroundColor White

Write-Host "`n🛑 To stop services: Close all PowerShell windows and run:" -ForegroundColor Red
Write-Host "  docker-compose -f docker-compose.dev.yml down" -ForegroundColor White
Write-Host "========================================================" -ForegroundColor Green

Read-Host "Press Enter to continue..."