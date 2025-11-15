# Plant Monitoring System - AI Agent Guide

## Architecture Overview

This is a full-stack IoT plant monitoring system with AI integration and multi-service architecture:

1. **Backend**: Express.js API (app.js) with PostgreSQL database and JWT authentication
2. **Frontend**: Next.js 14 (React 18) with TypeScript, Radix UI, and Tailwind CSS
3. **AI Service**: Python microservice with TensorFlow for plant health predictions
4. **IoT Layer**: MQTT broker integration supporting both local and AWS IoT Core
5. **Payments**: VNPay integration for premium subscriptions

### Critical Directory Structure

- `/models` - 16 PostgreSQL models with comprehensive relationships and validation
- `/controllers` - Business logic layer following MVC pattern with error handling
- `/middlewares` - Authentication, rate limiting, access control, and security
- `/routes` - RESTful API definitions with 22 endpoint groups
- `/client/src` - Next.js frontend with app router structure
- `/client/src/i18n/locales` - 7 language support (en, es, fr, ja, kr, vi, zh)
- `/ai_service` - Standalone Python service with rule-based and ML predictions
- `/mqtt` - IoT device communication layer with AWS IoT fallback
- `/tests` - Jest testing framework with UI, integration, and unit tests

### Data Models & Relationships

Core PostgreSQL models with foreign key relationships:
- `User` (1) → (N) `Plant`, `Device`, `Payment`, `ChatHistory`
- `Plant` (1) → (N) `SensorData`, `WateringHistory`, `PumpSchedule`
- `Zone` (1) → (N) `Plant` (geographical grouping)
- `Device` (1) → (N) `SensorData` (ESP32 sensors)
- `AIModel` & `AIPrediction` for ML model management

## Critical Developer Workflows

### Setup & Installation

```bash
# Backend setup
npm install
npm run test:setup  # Tests and sets up PostgreSQL connection

# Frontend setup
cd client && npm install

# AI service setup
cd ai_service && pip install -r requirements.txt
```

### Running the Application

```bash
# Backend only
npm start

# Frontend development
cd client && npm start

# Full stack development
npm run start:dev

# AI service
cd ai_service && python main.py
```

### Testing

```bash
# Backend tests
npm test

# i18n tests
npm run test:i18n
./run-i18n-tests.bat  # Windows
./run-i18n-tests.ps1  # PowerShell
```

## Project-Specific Conventions

### API Structure

1. **Routes** (`/routes/*.js`): Define endpoints and HTTP methods
2. **Controllers** (`/controllers/*.js`): Implement business logic
3. **Models** (`/models/*.js`): Database interaction with PostgreSQL
4. **Middleware** (`/middlewares/*.js`): Request preprocessing, auth, validation

### Error Handling Pattern

```javascript
try {
  // Operation logic
} catch (error) {
  // Log error using SystemLog model
  await SystemLog.error('component', 'operation', error.message);
  return res.status(500).json({ error: 'User-friendly message' });
}
```

### Authentication Flow

- JWT-based authentication with token expiration
- Tokens stored in Authorization header
- Password reset via email using time-limited tokens
- Required middleware: `authMiddleware.js` for protected routes

### Internationalization Pattern

- Translation files in `client/src/i18n/locales/*/translation.json`
- Hierarchical structure with sections: common, navigation, zones, etc.
- Format variables use double curly braces: `{{variable}}`
- Language codes: en, es, fr, zh

## Testing Approach

1. **Model Tests**: Validate database operations
2. **Controller Tests**: API endpoint functionality 
3. **Integration Tests**: End-to-end API workflows
4. **i18n Tests**: Translation file consistency

## Key Integration Points

1. **Frontend-Backend**: Axios client at `client/src/api/axiosClient.js`
2. **Authentication**: JWT validation in `middlewares/authMiddleware.js`
3. **Database**: PostgreSQL connection in `config/db.js`
4. **AI Service**: REST API integration at `/controllers/aiController.js`
5. **IoT Communication**: MQTT broker in `/controllers/iotController.js`
6. **Payment**: VNPay integration in `/controllers/paymentController.js`

## Common Issues & Solutions

1. **PostgreSQL Connection**: Ensure DATABASE_URL in .env is correct
2. **JWT Auth**: Check token expiration (default: 1 hour)
3. **i18n Missing Keys**: Run i18n integrity checker: `node scripts/i18n-integrity-checker.js`
4. **Test Failures**: Check PostgreSQL mock in `__mocks__` directory
5. **AI Service Errors**: Verify TensorFlow installation and model paths
6. **Data Integrity**: All data must come from APIs, if failed, retry fetching or return error