# Plant Monitoring AI Service

AI microservice for the Plant Monitoring System that handles:
- 🤖 **AI Chatbot** - Plant care assistance using OpenRouter API with Mistral 7B Instruct
- 💧 **Watering Prediction** - ML-based irrigation forecasting (to be implemented)
- 🌿 **Disease Recognition** - Computer vision for plant health analysis (to be implemented)

## Features

### ✅ Implemented
- **AI Chatbot with OpenRouter Integration**
  - Plant-specific query filtering
  - Conversation history management
  - Rate limiting and error handling
  - Fallback responses for offline mode
  - JWT authentication
  - Context-aware responses

### 🚧 To Be Implemented
- Watering prediction using sensor data
- Plant disease recognition from images
- Advanced ML model integration

## API Endpoints

### Chatbot
- `POST /api/chatbot/query` - Process chatbot query
- `GET /api/chatbot/conversation/:id` - Get conversation history
- `GET /api/chatbot/history` - Get user's chat history
- `GET /api/chatbot/status` - Get service status

### Watering Prediction (Placeholder)
- `POST /api/watering-prediction/predict` - Predict watering needs

### Disease Recognition (Placeholder)
- `POST /api/disease-recognition/analyze` - Analyze plant image

### Health Check
- `GET /health` - Service health status

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   Copy `.env` and update the following:
   ```env
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   DATABASE_URL=postgresql://user:password@localhost:5432/plant_monitoring
   JWT_SECRET=your_jwt_secret_key_here
   ```

3. **Start the service:**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

## Architecture

```
ai_service/
├── app.js                 # Main application entry point
├── controllers/           # Request handlers
│   └── chatbotController.js
├── models/               # Data models
│   └── ChatHistory.js
├── routes/               # API routes
│   ├── chatbot.js
│   ├── watering.js
│   └── disease.js
├── services/             # Business logic
│   └── openRouterService.js
└── tests/                # Test files
    └── chatbot.test.js
```

## Integration with Main App

The main application forwards AI requests to this microservice:

```javascript
// Main app routes/ai.js
router.post('/chatbot', authenticate, async (req, res) => {
  const response = await axios.post(`${AI_SERVICE_URL}/api/chatbot/query`, req.body, {
    headers: { 'Authorization': req.headers.authorization }
  });
  res.json(response.data);
});
```

## Configuration

### Environment Variables
- `AI_SERVICE_PORT` - Service port (default: 8000)
- `DATABASE_URL` - PostgreSQL connection string
- `OPENROUTER_API_KEY` - OpenRouter API key for chatbot
- `OPENROUTER_MODEL` - AI model to use (default: mistralai/mistral-7b-instruct)
- `JWT_SECRET` - JWT secret for token verification
- `ALLOWED_ORIGINS` - CORS allowed origins

### OpenRouter Configuration
- **Model**: Mistral 7B Instruct
- **Max Tokens**: 1000
- **Temperature**: 0.7
- **Rate Limiting**: 1 request/second with exponential backoff

## Usage Examples

### Chatbot Query
```bash
curl -X POST http://localhost:5000/api/chatbot/query \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How often should I water my tomato plants?",
    "context": {
      "plantType": "tomato",
      "currentMoisture": 45,
      "temperature": 24
    }
  }'
```

### Service Status
```bash
curl -X GET http://localhost:5000/api/chatbot/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Development

### Adding New AI Features
1. Create controller in `controllers/`
2. Create route in `routes/`
3. Add route to `app.js`
4. Create tests in `tests/`

### Testing
```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/chatbot.test.js
```

## Deployment

The service can be deployed as a standalone microservice:

1. **Docker** (recommended)
2. **PM2** for process management
3. **Direct Node.js** deployment

## Monitoring

- Health check endpoint: `/health`
- Service status: `/api/chatbot/status`
- Logs: Console output with structured logging

## Security

- JWT token verification for all endpoints
- CORS configuration
- Helmet.js security headers
- Input validation with express-validator
- Rate limiting on OpenRouter API calls