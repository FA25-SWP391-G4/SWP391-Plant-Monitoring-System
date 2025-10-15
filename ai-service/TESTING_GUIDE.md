# AI Service Testing Guide

## 🚀 Quick Start Testing

### 1. Debug First (Recommended)
```bash
cd ai-service
node debug-detailed.js
```

### 2. Install Dependencies
```bash
npm install
# If that fails:
npm install --force
```

### 3. Start AI Service
```bash
npm start
```

### 4. Run Tests

#### Quick Test
```bash
node quick-test.js
```

#### Comprehensive Test
```bash
node comprehensive-test.js
```

#### Step-by-Step Test
```bash
node test-step-by-step.js
```

#### Full Setup and Test
```bash
node setup-and-test.js
```

## 📋 Test Coverage

### ✅ Core Features Tested

1. **🤖 Chatbot với OpenRouter API**
   - Basic message handling
   - Context-aware responses
   - Error handling
   - Integration with plant data

2. **📸 Image Recognition**
   - Plant disease detection
   - Image analysis with AI models
   - Analysis history tracking
   - Fallback mechanisms

3. **💧 Smart Irrigation Prediction**
   - AI-powered watering predictions
   - Schedule optimization
   - Weather integration
   - Confidence scoring

4. **⚠️ Early Warning System**
   - Risk analysis and alerts
   - Anomaly detection
   - Trend analysis
   - Health scoring

5. **🤖 Automation**
   - Automated irrigation control
   - IoT device integration
   - Schedule management
   - Performance monitoring

6. **🧠 Self Learning**
   - Feedback collection
   - Model improvement
   - Performance tracking
   - Auto-tuning

7. **📊 Historical Analysis**
   - Data trend analysis
   - Care recommendations
   - Pattern recognition
   - Growth tracking

## 🔧 Debug Scripts

### Debug Detailed
```bash
node debug-detailed.js
```
- Checks Node.js version
- Verifies file existence
- Tests module loading
- Identifies specific errors

### Test Step by Step
```bash
node test-step-by-step.js
```
- Tests each component individually
- Identifies which part fails
- Provides detailed error information

### Setup and Test
```bash
node setup-and-test.js
```
- Installs dependencies
- Tests step by step
- Starts service
- Tests API endpoints

## 🚨 Troubleshooting

### Common Issues

1. **Dependencies not installed**
   ```bash
   npm install --force
   ```

2. **Port already in use**
   ```bash
   # Kill process on port 3001
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F
   ```

3. **Module not found**
   ```bash
   node debug-detailed.js
   ```

4. **Database connection errors**
   - System uses mock data, no database required

### Error Messages

- `Cannot find module`: Run `npm install`
- `EADDRINUSE`: Port 3001 is busy
- `SyntaxError`: Check JavaScript syntax
- `EACCES`: Permission denied

## 📊 Expected Results

### Successful Test Output
```
🚀 AI Service đang chạy trên cổng 3001
✅ Health Check - Status: OK
✅ Chatbot - Response length: 150 chars
✅ Irrigation Prediction - Needs watering: false, Confidence: 85%
✅ Early Warning - Alerts: 2, Health Score: 78
✅ Automation - Active automations: 3
✅ Self Learning - Feedback collected successfully
✅ Historical Analysis - Analysis data: Yes
✅ Image Recognition - Image analysis endpoint working
✅ System Statistics - Features tracked: 7
✅ Integration Test - Multiple endpoints working together

🎉 ALL TESTS PASSED!
✅ AI Service is working perfectly!
```

## 🌐 Access Points

- **Main Service**: http://localhost:3001
- **Chatbot UI**: http://localhost:3001/chatbot
- **Dashboard**: http://localhost:3001/dashboard
- **Health Check**: http://localhost:3001/health
- **API Documentation**: http://localhost:3001/api/ai

## 📝 Environment Variables

Create `.env` file:
```env
PORT=3001
NODE_ENV=development
OPENROUTER_API_KEY=your_key_here
```

**Note**: Database variables are optional as system uses mock data.

## 🔍 Manual Testing

### Test Chatbot
```bash
curl -X POST http://localhost:3001/api/ai/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message":"Cây của tôi cần tưới nước không?","userId":"test","plantId":"1"}'
```

### Test Irrigation Prediction
```bash
curl -X POST http://localhost:3001/api/ai/irrigation/predict/1 \
  -H "Content-Type: application/json" \
  -d '{"options":{"includeConfidence":true}}'
```

### Test Health Check
```bash
curl http://localhost:3001/health
```

## 📈 Performance Metrics

- **Response Time**: < 2 seconds for most endpoints
- **Success Rate**: > 95% for all features
- **Memory Usage**: < 100MB typical
- **CPU Usage**: < 10% typical

## 🆘 Getting Help

1. Run `node debug-detailed.js` first
2. Check console output for specific errors
3. Verify all files exist in correct locations
4. Try clean install: `rm -rf node_modules && npm install`
5. Check port availability: `netstat -ano | findstr :3001`

## 🎯 Success Criteria

All tests should pass with:
- ✅ Health Check: OK
- ✅ Chatbot: Response received
- ✅ Irrigation Prediction: Prediction generated
- ✅ Early Warning: Analysis completed
- ✅ Automation: Dashboard loaded
- ✅ Self Learning: Feedback processed
- ✅ Historical Analysis: Data analyzed
- ✅ Image Recognition: Endpoint working
- ✅ System Statistics: Metrics collected
- ✅ Integration Test: Multiple endpoints working

## 📋 Test Coverage

### ✅ Core Features Tested

1. **🤖 Chatbot với OpenRouter API**
   - Basic message handling
   - Context-aware responses
   - Error handling
   - Integration with plant data

2. **📸 Image Recognition**
   - Plant disease detection
   - Image analysis with AI models
   - Analysis history tracking
   - Fallback mechanisms

3. **💧 Smart Irrigation Prediction**
   - AI-powered watering predictions
   - Schedule optimization
   - Weather integration
   - Confidence scoring

4. **⚠️ Early Warning System**
   - Risk analysis and alerts
   - Anomaly detection
   - Trend analysis
   - Health scoring

5. **🤖 Automation System**
   - Smart automation setup
   - IoT device integration
   - Safety limits and constraints
   - Real-time monitoring

6. **🧠 Self-Learning System**
   - Feedback collection
   - Model improvement
   - Performance tracking
   - Continuous optimization

7. **📊 Historical Analysis**
   - Data pattern analysis
   - Trend prediction
   - Care recommendations
   - Performance metrics

## 🔧 Debugging Tools

### Health Check
```bash
curl http://localhost:3001/health
```

### Test Individual Features
```bash
# Chatbot
curl -X POST http://localhost:3001/api/ai/chatbot/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Cây của tôi cần tưới nước không?", "userId": "test", "plantId": "1"}'

# Irrigation Prediction
curl -X POST http://localhost:3001/api/ai/irrigation/predict/1 \
  -H "Content-Type: application/json" \
  -d '{"options": {"includeConfidence": true}}'

# Early Warning
curl -X POST http://localhost:3001/api/ai/warning/analyze/1 \
  -H "Content-Type: application/json" \
  -d '{"options": {"includeTrends": true}}'
```

## 📊 Expected Results

### ✅ Success Indicators
- All API endpoints return `success: true`
- Response times < 5 seconds
- Proper error handling for invalid inputs
- Mock data generation working correctly
- Fallback mechanisms functioning

### ⚠️ Common Issues
1. **Service not running**: Start with `npm start`
2. **Port conflicts**: Check if port 3001 is available
3. **Dependencies missing**: Run `npm install`
4. **API key issues**: Check OpenRouter API configuration

## 🛠️ Configuration

### Environment Variables
Create `.env` file in `ai-service` directory:
```env
PORT=3001
NODE_ENV=development
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=mistralai/mistral-7b-instruct
```

### Dependencies
Key dependencies that should be installed:
- `axios` - HTTP client
- `express` - Web framework
- `multer` - File upload handling
- `sharp` - Image processing
- `@tensorflow/tfjs-node` - AI models
- `mongoose` - Database ORM
- `openai` - AI API client

## 📈 Performance Benchmarks

### Response Times
- Health Check: < 100ms
- Chatbot: < 3s
- Image Analysis: < 5s
- Irrigation Prediction: < 2s
- Early Warning: < 3s
- Automation: < 1s

### Success Rates
- Target: > 95% success rate
- Fallback mechanisms: 100% availability
- Error handling: Comprehensive coverage

## 🔍 Troubleshooting

### Service Won't Start
1. Check if port 3001 is available
2. Verify all dependencies are installed
3. Check for syntax errors in code
4. Review environment variables

### API Calls Failing
1. Verify service is running on correct port
2. Check request format and headers
3. Review error messages in console
4. Test with simple endpoints first

### AI Features Not Working
1. Check OpenRouter API key configuration
2. Verify model files are present
3. Test with mock data first
4. Review service logs for errors

## 📝 Test Reports

Test results are automatically saved to:
- `test-report.json` - Detailed test results
- Console output - Real-time feedback
- Service logs - Debug information

## 🎯 Next Steps

After successful testing:
1. Deploy to production environment
2. Set up monitoring and alerting
3. Configure real database connections
4. Implement actual AI model training
5. Set up CI/CD pipeline for automated testing
