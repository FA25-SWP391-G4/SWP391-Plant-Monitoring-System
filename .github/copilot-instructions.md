# Plant Monitoring System - AI Agent Guide

## Architecture Overview

This is a full-stack plant monitoring system with the following components:

1. **Backend**: Node.js/Express API server with PostgreSQL database
2. **Frontend**: React SPA with internationalization support
3. **AI Service**: Python microservice for plant analysis and predictions
4. **IoT Integration**: MQTT-based communication with sensor devices

### Key Directory Structure

- `/controllers` - Express route controllers (MVC pattern)
- `/models` - Data models with PostgreSQL queries
- `/routes` - API route definitions
- `/client/src` - React frontend application
- `/client/src/i18n` - Internationalization resources
- `/ai_service` - Python ML service for plant analysis
- `/tests` - Jest test suite for backend API

## Database Schema

PostgreSQL database with the following key models:

- `User`: User accounts with authentication data
- `Plant`: Plant definitions with thresholds and settings
- `Device`: IoT devices like sensors and pumps
- `SensorData`: Time-series data from sensors
- `WateringHistory`: Records of plant watering events
- `PumpSchedule`: Automated watering rules
- `Payment`: Premium subscription payments
- `AIModel`: ML model metadata for plant analysis
- `SystemLog`: Application logging and monitoring

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