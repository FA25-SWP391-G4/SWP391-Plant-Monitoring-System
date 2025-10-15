@echo off
echo 📦 Installing All Dependencies for AI Features Integration
echo ========================================================

echo.
echo 🔧 Installing main project dependencies...
call npm install

echo.
echo 🤖 Installing AI service dependencies...
cd ai-service
call npm install
cd ..

echo.
echo 🌐 Installing frontend dependencies (if exists)...
if exist client\package.json (
    cd client
    call npm install
    cd ..
) else (
    echo Frontend directory not found, skipping...
)

echo.
echo ✅ All dependencies installed successfully!
echo.
echo 🚀 You can now run the application:
echo   - Full development: npm run dev
echo   - AI Service only: cd ai-service && npm start
echo   - Main Server only: npm start
echo.
pause