# AI Service Debug Guide

## 🚨 Troubleshooting Common Issues

### 1. Dependencies Issues

**Problem**: `Cannot find module` errors
**Solution**:
```bash
cd ai-service
npm install
# If that fails:
npm install --force
# Or clean install:
rm -rf node_modules package-lock.json
npm install
```

### 2. Database Connection Issues

**Problem**: Database connection errors
**Solution**: The system now uses mock data, no database required.

### 3. Port Already in Use

**Problem**: `EADDRINUSE: address already in use :::3001`
**Solution**:
```bash
# Kill process using port 3001
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F
# Or change port in .env file
PORT=3002
```

### 4. Module Loading Errors

**Problem**: `Error: Cannot find module`
**Solution**:
```bash
# Run debug script to identify missing modules
node debug-detailed.js
```

### 5. OpenRouter API Issues

**Problem**: Chatbot not responding
**Solution**: 
- Check if `OPENROUTER_API_KEY` is set in environment
- For testing, the system has fallback responses

## 🔧 Debug Scripts

### Quick Debug
```bash
node debug-detailed.js
```

### Step-by-Step Test
```bash
node test-step-by-step.js
```

### Full Setup and Test
```bash
node setup-and-test.js
```

### Quick API Test
```bash
node quick-test.js
```

## 📋 Testing Checklist

- [ ] Node.js installed (v16+)
- [ ] Dependencies installed (`npm install`)
- [ ] All files exist (check with debug script)
- [ ] No syntax errors
- [ ] Port 3001 available
- [ ] Environment variables set (optional)

## 🚀 Running the Service

### Development Mode
```bash
npm start
```

### Test Mode
```bash
node quick-test.js
```

### Debug Mode
```bash
node debug-detailed.js
```

## 📊 Expected Output

When everything works correctly, you should see:
```
🚀 AI Service đang chạy trên cổng 3001
✅ Health endpoint: OK
✅ Chatbot endpoint: OK
✅ All features working
```

## 🆘 Getting Help

If you still have issues:

1. Run `node debug-detailed.js` and share the output
2. Check the console for specific error messages
3. Verify all files exist in the correct locations
4. Try a clean install: `rm -rf node_modules && npm install`

## 🔍 Common Error Messages

### `Cannot find module 'express'`
- Run: `npm install express`

### `EADDRINUSE`
- Port 3001 is already in use
- Kill the process or change port

### `SyntaxError: Unexpected token`
- Check for syntax errors in JavaScript files
- Verify file encoding (should be UTF-8)

### `Error: listen EACCES`
- Permission denied
- Try running with administrator privileges

## 📝 Environment Variables

Create a `.env` file with:
```env
PORT=3001
NODE_ENV=development
OPENROUTER_API_KEY=your_key_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=plant_monitoring
DB_USER=postgres
DB_PASSWORD=postgres
```

**Note**: Database variables are optional as the system uses mock data.
