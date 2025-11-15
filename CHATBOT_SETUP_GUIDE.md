# AI Chatbot Setup Guide

## 🎯 Overview
The Plant Monitoring System includes an AI-powered chatbot that provides plant care advice and answers user questions. The chatbot runs as a separate microservice that communicates with the main application.

## 📋 Prerequisites
- Node.js installed (version 14 or higher)
- Project dependencies installed
- Environment variables configured

## 🚀 Quick Start

### Option 1: Using the Automated Startup Script
```bash
# Run the automated startup script
start-chatbot-system.bat
```

### Option 2: Manual Startup
```bash
# Terminal 1: Start AI Service
cd ai_service
node app.js

# Terminal 2: Start Main Application  
cd ..
npm start
```

### Option 3: Using Test Service (for development)
```bash
# Terminal 1: Start Test AI Service
node test-ai-service.js

# Terminal 2: Start Main Application
npm start
```

## 🔧 Configuration

### Environment Variables (.env file)
```env
# AI Service Configuration
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_PORT=8000
JWT_SECRET=your_jwt_secret_here
NODE_ENV=development

# Optional: OpenRouter API for advanced AI responses
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=mistralai/mistral-7b-instruct
```

## 🧪 Testing the System

### 1. Health Check
```bash
# Check AI Service
curl http://localhost:8000/health

# Check Main App
curl http://localhost:3010/api/ai/status
```

### 2. Chatbot Test
```bash
# Test AI Service directly
curl -X POST http://localhost:8000/api/chatbot/query \
  -H "Content-Type: application/json" \
  -d '{"message": "How often should I water my plants?"}'

# Test through Main App
curl -X POST http://localhost:3010/api/ai/test/chatbot \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message"}'
```

### 3. Run Verification Script
```bash
node verify-chatbot.js
```

## 🌐 Access Points

### Web Interface
- **Main Application**: http://localhost:3000
- **AI Chatbot Page**: http://localhost:3000/ai/chat
- **Plant Detail with Chat**: http://localhost:3000/plant-detail/[id]?chat=true

### API Endpoints
- **AI Service Health**: http://localhost:8000/health
- **Chatbot Query**: POST http://localhost:8000/api/chatbot/query
- **Main App Chatbot**: POST http://localhost:3010/api/ai/chatbot

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Main App       │    │   AI Service    │
│   (React)       │◄──►│   (Port 3010)    │◄──►│   (Port 8000)   │
│                 │    │                  │    │                 │
│ - Chat UI       │    │ - Auth Middleware│    │ - OpenRouter    │
│ - Plant Context │    │ - Route Proxy    │    │ - Smart Responses│
│ - History       │    │ - Error Handling │    │ - Rate Limiting │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🔍 Troubleshooting

### Common Issues

#### 1. AI Service Not Starting
```bash
# Check if port 8000 is available
netstat -an | findstr :8000

# Install dependencies
cd ai_service && npm install

# Check Node.js version
node --version
```

#### 2. Chatbot Not Responding
- Verify AI service is running on port 8000
- Check environment variables in .env file
- Look at console logs for error messages
- Test with the verification script

#### 3. Authentication Issues
- Ensure JWT_SECRET is set in .env
- Check that user has Ultimate subscription or Admin role
- Verify token is being sent in Authorization header

#### 4. CORS Issues
- Check ALLOWED_ORIGINS in environment
- Verify frontend URL matches allowed origins

### Debug Mode
```bash
# Enable debug logging
set DEBUG=*
set NODE_ENV=development

# Start services with debug output
node test-ai-service.js
```

## 📱 Features

### Chatbot Capabilities
- ✅ Plant care advice (Vietnamese & English)
- ✅ Disease identification help
- ✅ Watering schedule recommendations
- ✅ Context-aware responses
- ✅ Conversation history
- ✅ Rate limiting
- ✅ Fallback responses when API unavailable

### User Access Control
- 🔒 Ultimate subscription required for full access
- 🔒 Admin users have full access
- 🔒 Authentication via JWT tokens
- 🔒 Rate limiting (15 requests/minute)

## 🚀 Production Deployment

### Environment Setup
```env
NODE_ENV=production
AI_SERVICE_URL=https://your-domain.com:8000
OPENROUTER_API_KEY=your_production_api_key
JWT_SECRET=your_secure_jwt_secret
```

### Security Considerations
- Use HTTPS in production
- Secure your JWT_SECRET
- Configure proper CORS origins
- Set up API rate limiting
- Monitor service health

## 📞 Support

If you encounter issues:
1. Check the console logs for error messages
2. Run the verification script (`node verify-chatbot.js`)
3. Verify all environment variables are set
4. Ensure both services are running on correct ports
5. Check network connectivity between services

## 🔄 Next Steps

Once the chatbot is running:
1. Test the web interface at http://localhost:3000/ai/chat
2. Try plant-specific questions
3. Upload plant images for analysis
4. Check conversation history functionality
5. Verify integration with plant sensor data
