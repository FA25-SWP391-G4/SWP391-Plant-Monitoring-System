# System Integration Documentation

## Overview

This document describes the complete system integration between the main Plant Monitoring System application and the AI Service. The integration provides seamless communication, real-time updates via MQTT, and comprehensive AI features.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Main Server   │    │   AI Service    │
│   (Next.js)     │◄──►│   (Express.js)  │◄──►│   (Express.js)  │
│   Port: 3000    │    │   Port: 3010    │    │   Port: 3001    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  MQTT Broker    │
                    │  (Mosquitto)    │
                    │  Port: 1883     │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Database      │
                    │   Port: 5432    │
                    └─────────────────┘
```

## Integration Components

### 1. System Integration Service
**File**: `services/systemIntegrationService.js`

Core service that manages:
- Cross-service communication
- MQTT message routing
- Service health monitoring
- Integration status tracking

### 2. AI Integration Routes
**File**: `routes/aiIntegration.js`

REST API endpoints for:
- `/api/ai-integration/status` - Get integration status
- `/api/ai-integration/test` - Test cross-service communication
- `/api/ai-integration/chatbot/message` - Send chatbot messages
- `/api/ai-integration/disease/analyze` - Analyze plant diseases
- `/api/ai-integration/irrigation/predict/:plantId` - Predict irrigation needs
- `/api/ai-integration/health` - Health check for all services

### 3. MQTT Integration
**Topics Structure**:
```javascript
ai/chatbot/request/{userId}      // Chatbot requests
ai/chatbot/response/{userId}     // Chatbot responses
ai/chatbot/typing/{userId}       // Typing indicators

ai/irrigation/prediction/{plantId}    // Irrigation predictions
ai/irrigation/recommendation/{plantId} // Irrigation recommendations
ai/irrigation/alert/{plantId}         // Urgent irrigation alerts

ai/disease/analysis/{plantId}    // Disease analysis results
ai/disease/alert/{plantId}       // Disease alerts

ai/system/status                 // System status updates
ai/system/model-update          // Model update notifications
```

## Setup Instructions

### 1. Environment Configuration

Create or update your `.env` file with:

```bash
# Service URLs
MAIN_SERVICE_URL=http://localhost:3010
AI_SERVICE_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/plant_monitoring

# MQTT
MQTT_URL=mqtt://localhost:1883

# JWT
JWT_SECRET=your_secure_jwt_secret_here

# AI Service (OpenRouter)
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=mistralai/mistral-7b-instruct
```

### 2. Install Dependencies

```bash
# Install main application dependencies
npm install

# Install AI service dependencies
cd ai-service
npm install
cd ..
```

### 3. Database Setup

```bash
# Run database migrations
npm run db:migrate

# Or manually run the AI schema migration
psql -d plant_monitoring -f ai-service/database/ai-schema-migration.sql
```

### 4. Start Services

```bash
# Option 1: Start all services together
npm run start:all

# Option 2: Start services individually
# Terminal 1: Main server
npm start

# Terminal 2: AI service
cd ai-service && npm start

# Terminal 3: Frontend
cd client && npm start
```

## Verification Scripts

### 1. MQTT Broker Verification
```bash
npm run integration:verify-mqtt
```
Tests MQTT broker connectivity, publish/subscribe functionality, and latency.

### 2. System Integration Test
```bash
npm run integration:test
```
Comprehensive test of all integration components including:
- Service health checks
- Cross-service communication
- MQTT messaging
- AI feature integration
- Performance baseline

### 3. Deployment Verification
```bash
node scripts/verifyDeployment.js
```
Verifies system is ready for production deployment.

### 4. Simple Integration Test
```bash
node tests/simpleIntegrationTest.js
```
Basic test to verify integration components are loaded and working.

## Integration Features

### 1. AI Chatbot Integration
- Real-time messaging via MQTT
- Context-aware responses using plant and sensor data
- Session management and conversation history
- Plant-specific guidance and recommendations

### 2. Disease Detection Integration
- Image upload and analysis
- Real-time results via MQTT
- Treatment recommendations
- Analysis history tracking

### 3. Irrigation Prediction Integration
- ML-based watering predictions
- Real-time sensor data integration
- Automated scheduling recommendations
- Alert system for urgent watering needs

### 4. Real-time Communication
- MQTT-based messaging for instant updates
- Typing indicators for chatbot
- Live prediction updates
- System status notifications

## Monitoring and Health Checks

### Health Check Endpoints
- `GET /health` - Main server health
- `GET /api/ai-integration/health` - Integration health
- `GET /api/ai-integration/status` - Integration status

### Monitoring Features
- Automatic service health monitoring
- Performance metrics tracking
- Error rate monitoring
- MQTT connection status
- Database connection health

## Error Handling

### Graceful Degradation
- AI service unavailable → Fallback responses
- MQTT disconnected → Polling fallback
- Database issues → Cached responses
- Network errors → Retry with exponential backoff

### Error Recovery
- Automatic service reconnection
- MQTT broker reconnection
- Database connection pooling
- Circuit breaker pattern for external APIs

## Security

### Authentication
- JWT-based authentication for protected endpoints
- API key validation for AI service
- Rate limiting on all endpoints

### Data Protection
- Input validation and sanitization
- File upload restrictions
- CORS configuration
- Request size limits

## Performance Optimization

### Caching
- Redis caching for AI predictions
- In-memory caching for frequent requests
- Model result caching
- Database query optimization

### Load Balancing
- Multiple AI service instances support
- Connection pooling
- Request queuing
- Resource monitoring

## Troubleshooting

### Common Issues

1. **MQTT Connection Failed**
   ```bash
   # Check if Mosquitto is running
   sudo systemctl status mosquitto
   
   # Start Mosquitto
   sudo systemctl start mosquitto
   ```

2. **AI Service Not Responding**
   ```bash
   # Check AI service logs
   cd ai-service && npm run logs
   
   # Restart AI service
   cd ai-service && npm restart
   ```

3. **Database Connection Issues**
   ```bash
   # Test database connection
   npm run db:test
   
   # Check PostgreSQL status
   sudo systemctl status postgresql
   ```

4. **Integration Endpoints Not Working**
   ```bash
   # Run integration test
   npm run integration:test
   
   # Check service logs
   npm run logs
   ```

### Debug Mode

Enable debug logging:
```bash
export LOG_LEVEL=debug
export NODE_ENV=development
```

### Log Files
- `logs/combined.log` - All application logs
- `logs/error.log` - Error logs only
- `logs/integration.log` - Integration-specific logs

## Production Deployment

### Pre-deployment Checklist
1. ✅ Run `node scripts/verifyDeployment.js`
2. ✅ Run `npm run integration:test`
3. ✅ Configure production environment variables
4. ✅ Set up SSL/HTTPS
5. ✅ Configure reverse proxy (nginx)
6. ✅ Set up monitoring and alerting
7. ✅ Configure backup procedures

### Production Environment Variables
```bash
NODE_ENV=production
PORT=3010
AI_SERVICE_PORT=3001

# Use production database
DATABASE_URL=postgresql://prod_user:secure_password@db_host:5432/plant_monitoring_prod

# Use secure JWT secret
JWT_SECRET=your_very_secure_production_jwt_secret_minimum_32_chars

# Configure CORS for production domain
CORS_ORIGIN=https://your-production-domain.com

# Enable SSL
SSL_ENABLED=true
SSL_CERT_PATH=./certs/server.crt
SSL_KEY_PATH=./certs/server.key

# Production MQTT broker
MQTT_URL=mqtt://production-mqtt-broker:1883
MQTT_USERNAME=prod_mqtt_user
MQTT_PASSWORD=secure_mqtt_password

# Production AI API keys
OPENROUTER_API_KEY=your_production_openrouter_key
```

### Docker Deployment
```yaml
# docker-compose.yml
version: '3.8'
services:
  main-server:
    build: .
    ports:
      - "3010:3010"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/plant_monitoring
      - AI_SERVICE_URL=http://ai-service:3001
      - MQTT_URL=mqtt://mosquitto:1883
    depends_on:
      - db
      - ai-service
      - mosquitto

  ai-service:
    build: ./ai-service
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/plant_monitoring
    depends_on:
      - db

  db:
    image: postgres:13
    environment:
      - POSTGRES_DB=plant_monitoring
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mosquitto:
    image: eclipse-mosquitto:2.0
    ports:
      - "1883:1883"
    volumes:
      - ./mqtt/mosquitto.conf:/mosquitto/config/mosquitto.conf

volumes:
  postgres_data:
```

## API Documentation

### Integration Status
```http
GET /api/ai-integration/status
```
Returns current integration status including service health and MQTT topics.

### Test Communication
```http
POST /api/ai-integration/test
```
Tests cross-service communication and returns results.

### Chatbot Message
```http
POST /api/ai-integration/chatbot/message
Content-Type: application/json

{
  "message": "How do I care for my tomato plant?",
  "userId": 1,
  "plantId": 1,
  "sessionId": "session-123"
}
```

### Disease Analysis
```http
POST /api/ai-integration/disease/analyze
Content-Type: multipart/form-data

image: [image file]
plantId: 1
userId: 1
```

### Irrigation Prediction
```http
POST /api/ai-integration/irrigation/predict/1
Content-Type: application/json

{
  "soilMoisture": 45,
  "temperature": 25,
  "humidity": 60,
  "lightLevel": 800
}
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review log files in the `logs/` directory
3. Run diagnostic scripts to identify issues
4. Check service health endpoints

## Version History

- **v1.0.0** - Initial system integration implementation
- **v1.1.0** - Added comprehensive testing and verification scripts
- **v1.2.0** - Enhanced error handling and monitoring
- **v1.3.0** - Production deployment optimization