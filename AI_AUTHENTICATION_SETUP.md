# AI Service Authentication Integration Guide

## Quick Setup Instructions

### 1. AI Service Setup (ai_service/simple-server.js)

Add authentication to your AI service:

```javascript
// At the top of your AI service file
const { aiAuthMiddleware, aiPremiumMiddleware, aiOptionalAuthMiddleware } = require('../ai-auth-config');

// Apply authentication to protected routes
app.use('/api/chatbot', aiAuthMiddleware, aiPremiumMiddleware);
app.use('/api/image-recognition', aiAuthMiddleware, aiPremiumMiddleware);
app.use('/api/irrigation', aiAuthMiddleware);
app.use('/api/irrigation-schedule', aiAuthMiddleware, aiPremiumMiddleware);
app.use('/api/historical-analysis', aiAuthMiddleware, aiPremiumMiddleware);
app.use('/api/self-learning', aiAuthMiddleware);

// Test endpoints use optional auth
app.use('/api/test/*', aiOptionalAuthMiddleware);
```

### 2. Backend Routes Update (routes/ai.js)

Replace your current route handlers with the authenticated versions:

```javascript
// Replace your existing route handlers with these
const authenticatedAIRoutes = require('../backend-ai-auth-config');

// Update your routes
router.get('/health', authenticatedAIRoutes.health);
router.post('/chatbot', authenticatedAIRoutes.chatbot);
router.post('/image-recognition', upload.single('image'), authenticatedAIRoutes.imageRecognition);
router.post('/irrigation', authenticatedAIRoutes.irrigation);
router.post('/irrigation-schedule', authenticatedAIRoutes.irrigationSchedule);
router.post('/historical-analysis', authenticatedAIRoutes.historicalAnalysis);
router.post('/self-learning', authenticatedAIRoutes.selfLearning);
```

### 3. Frontend API Update (client/src/api/aiApi.js)

Replace your current aiApi with the authenticated version:

```javascript
// Replace your existing aiApi export
import authenticatedAiApi from '../../../frontend-ai-auth-config';
export default authenticatedAiApi;
```

### 4. Environment Variables

Add these to your .env files:
```bash
# Main Backend .env
JWT_SECRET=your-secret-key-here
AI_SERVICE_URL=http://localhost:3001

# AI Service .env
JWT_SECRET=your-secret-key-here
AI_SERVICE_PORT=3001
```

## Authentication Flow

1. **User Login**: User authenticates with main backend, receives JWT token
2. **Frontend Request**: Frontend includes JWT token in Authorization header
3. **Backend Proxy**: Backend forwards token to AI service
4. **AI Service**: AI service validates JWT and checks premium status
5. **Response**: AI service returns data or authentication error

## Error Handling

The system handles these authentication scenarios:

- **No Token**: Returns 401 with login required message
- **Invalid Token**: Returns 401 with invalid token message
- **Expired Token**: Returns 401 with token expired message
- **No Premium**: Returns 403 with premium required message
- **Service Down**: Returns 503 with service unavailable message

## Testing

Test the authentication with these scenarios:

```bash
# Test without authentication
curl http://localhost:3010/api/ai/chatbot -X POST -H "Content-Type: application/json" -d '{"message":"test"}'

# Test with valid token
curl http://localhost:3010/api/ai/chatbot -X POST -H "Content-Type: application/json" -H "Authorization: Bearer YOUR_JWT_TOKEN" -d '{"message":"test"}'

# Test health endpoint (no auth required)
curl http://localhost:3010/api/ai/health
```

## Premium Features

These endpoints require premium subscription:
- `/api/chatbot`
- `/api/image-recognition`
- `/api/irrigation-schedule`
- `/api/historical-analysis`

These endpoints require basic authentication only:
- `/api/irrigation`
- `/api/self-learning`

## Frontend Usage Examples

```javascript
// In your React components
import aiApi from '../api/aiApi';

// Chatbot usage
const handleChatMessage = async (message) => {
  const result = await aiApi.chatWithAI(message);
  
  if (!result.success) {
    if (result.requiresLogin) {
      // Redirect to login
      navigate('/login');
    } else if (result.requiresPremium) {
      // Show premium upgrade modal
      showPremiumModal();
    } else {
      // Show error message
      showError(result.error);
    }
    return;
  }
  
  // Handle successful response
  setResponse(result.data);
};

// Image recognition usage
const handleImageUpload = async (file) => {
  const result = await aiApi.analyzeImage(file);
  
  if (!result.success) {
    // Handle errors as above
    return;
  }
  
  // Handle successful analysis
  setAnalysis(result.data);
};
```

## Security Notes

1. **JWT Secret**: Use a strong, unique JWT secret for production
2. **Token Expiration**: Tokens expire after 1 hour by default
3. **Premium Check**: Premium status is validated on each request
4. **Rate Limiting**: Consider adding rate limiting for AI endpoints
5. **File Upload**: Image uploads are limited by multer configuration

## Troubleshooting

**"Authentication required" errors**:
- Check if JWT token is present in localStorage
- Verify token hasn't expired
- Ensure JWT_SECRET matches between services

**"Premium required" errors**:
- Check user's premium status in database
- Verify premium middleware is working
- Test with a premium user account

**"Service unavailable" errors**:
- Check if AI service is running on correct port
- Verify network connectivity between services
- Check AI service logs for errors