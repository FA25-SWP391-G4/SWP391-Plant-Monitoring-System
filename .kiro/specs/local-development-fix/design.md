# Design Document - Local Development Fix

## Overview

Thiết kế giải pháp toàn diện để fix các vấn đề local development, đảm bảo toàn bộ dự án (main server, AI service, frontend) và 3 tính năng AI chính có thể chạy ổn định trên local environment.

## Architecture

### Current Issues Analysis

1. **Database Configuration Mismatch:**
   - Docker Compose: `plant_monitoring` database với password `password`
   - Environment files: `plant_system` database với password `123`
   - Inconsistent connection strings

2. **Environment Variables Issues:**
   - Missing Redis and MQTT configurations in some files
   - Inconsistent JWT secrets
   - Missing required AI service configurations

3. **Service Dependencies:**
   - AI service depends on main database
   - Frontend depends on both main server and AI service
   - No proper startup sequence handling

4. **AI Features Dependencies:**
   - OpenRouter API key configuration
   - Image upload path configuration
   - Database schema for AI features

### Solution Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Local Development Stack                   │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)     │  Main Server (Express)            │
│  Port: 3000             │  Port: 3010                       │
│  - AI Chat UI           │  - User Management                │
│  - Disease Detection UI │  - Plant Management               │
│  - Irrigation UI        │  - Authentication                 │
└─────────────────────────┴───────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    AI Service (Express)                     │
│                        Port: 3001                          │
│  - Chatbot API          - Disease Detection API            │
│  - Irrigation Prediction API                               │
│  - OpenRouter Integration                                  │
└─────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  Infrastructure Services                    │
│  PostgreSQL:5432    Redis:6379    MQTT:1883               │
│  - Unified Database: plant_monitoring                      │
│  - Consistent Credentials                                  │
│  - Proper Health Checks                                    │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Configuration Management

**Unified Environment Configuration:**
```javascript
// Standardized .env structure
{
  database: {
    url: "postgresql://postgres:password@localhost:5432/plant_monitoring",
    host: "localhost",
    port: 5432,
    user: "postgres", 
    password: "password",
    database: "plant_monitoring"
  },
  redis: {
    url: "redis://localhost:6379"
  },
  mqtt: {
    url: "mqtt://localhost:1883"
  },
  ai: {
    openRouterApiKey: "sk-or-v1-...",
    uploadPath: "./uploads",
    maxFileSize: 10485760
  }
}
```

**Configuration Validator:**
```javascript
class ConfigValidator {
  validateEnvironment()
  validateDatabaseConnection()
  validateRedisConnection()
  validateMqttConnection()
  validateAIServiceConfig()
}
```

### 2. Service Orchestration

**Startup Orchestrator:**
```javascript
class LocalDevOrchestrator {
  async startInfrastructure()    // Docker Compose
  async waitForInfrastructure()  // Health checks
  async setupDatabase()          // Schema migration
  async startApplications()      // Main + AI + Frontend
  async validateServices()       // End-to-end tests
}
```

**Service Health Monitor:**
```javascript
class HealthMonitor {
  checkPostgreSQL()
  checkRedis() 
  checkMQTT()
  checkMainServer()
  checkAIService()
  checkFrontend()
  checkAIFeatures()  // Test 3 AI features
}
```

### 3. AI Features Integration

**AI Service Manager:**
```javascript
class AIServiceManager {
  async initializeChatbot()           // OpenRouter setup
  async initializeImageRecognition()  // TensorFlow setup  
  async initializeIrrigationAI()      // ML models setup
  async validateAIFeatures()          // Test all 3 features
}
```

**AI Features Test Suite:**
```javascript
class AIFeaturesValidator {
  async testChatbot(sampleMessage)
  async testDiseaseDetection(sampleImage)
  async testIrrigationPrediction(sampleSensorData)
  async generateTestReport()
}
```

### 4. Development Workflow Tools

**Quick Start Script:**
```javascript
class QuickStarter {
  async checkPrerequisites()
  async fixConfigurationIssues()
  async startAllServices()
  async runHealthChecks()
  async showAccessInformation()
}
```

**Troubleshooting Assistant:**
```javascript
class TroubleshootingAssistant {
  async diagnosePortConflicts()
  async diagnoseDatabaseIssues()
  async diagnoseAIServiceIssues()
  async suggestSolutions()
  async autoFixCommonIssues()
}
```

## Data Models

### Configuration Schema

```javascript
const ConfigSchema = {
  environment: {
    nodeEnv: 'development',
    logLevel: 'debug'
  },
  database: {
    url: String,
    host: String,
    port: Number,
    user: String,
    password: String,
    database: String,
    ssl: Boolean
  },
  services: {
    mainServer: { port: 3010, host: 'localhost' },
    aiService: { port: 3001, host: 'localhost' },
    frontend: { port: 3000, host: 'localhost' }
  },
  ai: {
    openRouterApiKey: String,
    models: {
      chatbot: 'mistralai/mistral-7b-instruct',
      imageRecognition: 'local-tensorflow-model'
    },
    uploadPath: String,
    maxFileSize: Number
  }
}
```

### Health Check Schema

```javascript
const HealthCheckSchema = {
  timestamp: Date,
  services: {
    postgresql: { status: 'healthy|unhealthy', responseTime: Number },
    redis: { status: 'healthy|unhealthy', responseTime: Number },
    mqtt: { status: 'healthy|unhealthy', responseTime: Number },
    mainServer: { status: 'healthy|unhealthy', responseTime: Number },
    aiService: { status: 'healthy|unhealthy', responseTime: Number },
    frontend: { status: 'healthy|unhealthy', responseTime: Number }
  },
  aiFeatures: {
    chatbot: { status: 'working|failed', lastTest: Date },
    diseaseDetection: { status: 'working|failed', lastTest: Date },
    irrigationPrediction: { status: 'working|failed', lastTest: Date }
  }
}
```

## Error Handling

### Configuration Errors

```javascript
class ConfigurationError extends Error {
  constructor(missingConfig, suggestions) {
    super(`Missing configuration: ${missingConfig}`);
    this.suggestions = suggestions;
    this.autoFixable = true;
  }
}
```

### Service Startup Errors

```javascript
class ServiceStartupError extends Error {
  constructor(service, cause, troubleshootingSteps) {
    super(`Failed to start ${service}: ${cause}`);
    this.service = service;
    this.troubleshootingSteps = troubleshootingSteps;
  }
}
```

### AI Features Errors

```javascript
class AIFeatureError extends Error {
  constructor(feature, cause, testData) {
    super(`AI Feature ${feature} failed: ${cause}`);
    this.feature = feature;
    this.testData = testData;
    this.retryable = true;
  }
}
```

## Testing Strategy

### 1. Configuration Testing

```javascript
describe('Configuration Validation', () => {
  test('All environment files have consistent database config')
  test('All required environment variables are present')
  test('Database connection strings are valid')
  test('AI service configuration is complete')
})
```

### 2. Infrastructure Testing

```javascript
describe('Infrastructure Services', () => {
  test('PostgreSQL starts and accepts connections')
  test('Redis starts and responds to ping')
  test('MQTT broker starts and accepts pub/sub')
  test('All services pass health checks')
})
```

### 3. Application Services Testing

```javascript
describe('Application Services', () => {
  test('Main server starts and serves endpoints')
  test('AI service starts and serves AI endpoints')
  test('Frontend starts and renders pages')
  test('All services can communicate with each other')
})
```

### 4. AI Features Integration Testing

```javascript
describe('AI Features', () => {
  test('Chatbot responds to sample messages')
  test('Disease detection processes sample images')
  test('Irrigation prediction processes sensor data')
  test('All AI features work end-to-end through frontend')
})
```

### 5. End-to-End Workflow Testing

```javascript
describe('Complete Local Development Workflow', () => {
  test('Quick start script completes successfully')
  test('All services start in correct order')
  test('Health checks pass for all components')
  test('AI features are accessible through web interface')
  test('Developer can modify code and see changes')
})
```

## Implementation Phases

### Phase 1: Configuration Standardization
- Fix database configuration inconsistencies
- Standardize environment variables
- Create configuration validation

### Phase 2: Infrastructure Automation  
- Improve Docker Compose setup
- Add health checks and wait conditions
- Create infrastructure startup scripts

### Phase 3: Service Orchestration
- Create unified startup script
- Implement service dependency management
- Add comprehensive health monitoring

### Phase 4: AI Features Validation
- Implement AI features testing
- Create sample data for testing
- Add AI-specific health checks

### Phase 5: Developer Experience
- Create troubleshooting tools
- Add development workflow automation
- Implement quick restart and reset tools

## Success Metrics

1. **Startup Success Rate:** 100% successful startup on clean environment
2. **Configuration Consistency:** Zero configuration mismatches
3. **AI Features Availability:** All 3 AI features working locally
4. **Developer Productivity:** < 5 minutes from clone to running application
5. **Error Recovery:** Automatic detection and fixing of common issues