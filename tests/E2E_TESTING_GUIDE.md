# AI Features End-to-End Testing Guide

This guide covers the comprehensive end-to-end testing suite for the AI features integration in the Plant Monitoring System.

## Overview

The E2E testing suite validates complete workflows from frontend to backend, including:

- **Chatbot AI workflows** - Message processing, context integration, MQTT real-time updates
- **Disease Detection pipelines** - Image upload, validation, processing, and analysis
- **Irrigation Prediction systems** - Sensor data analysis, ML predictions, scheduling
- **Database operations** - Data consistency, concurrent operations, referential integrity
- **MQTT real-time communication** - Message ordering, connection handling, topic management
- **File upload and processing** - Image validation, storage, security, and performance

## Test Structure

```
tests/
├── ai-features-e2e.test.js           # Main AI workflows E2E tests
├── mqtt-realtime-e2e.test.js         # MQTT communication tests
├── database-consistency-e2e.test.js  # Database integrity tests
├── file-upload-pipeline-e2e.test.js  # File processing tests
├── run-ai-e2e-tests.js              # Individual test runner
├── run-complete-e2e-suite.js        # Complete suite orchestrator
├── e2e-test-config.js               # Centralized configuration
├── e2e-test-setup.js                # Global test setup
├── jest.e2e.config.js               # Jest configuration
└── E2E_TESTING_GUIDE.md             # This guide
```

## Prerequisites

### System Requirements

- Node.js >= 14.0.0
- PostgreSQL database
- MQTT broker (Mosquitto)
- AI Service running on port 3001
- Main Server running on port 3010

### Dependencies

Install required dependencies:

```bash
npm install
```

Additional E2E testing dependencies:
- `supertest` - HTTP testing
- `form-data` - File upload testing
- `mqtt` - MQTT client testing
- `pg` - PostgreSQL testing

### Environment Setup

1. **Database Setup**
   ```bash
   # Create test database
   createdb plant_monitoring_test
   
   # Run database migrations
   node ai-service/database/setup-ai-database.js
   ```

2. **Environment Variables**
   ```bash
   # .env file
   NODE_ENV=test
   DB_NAME=plant_monitoring_test
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   
   # AI Service
   AI_SERVICE_URL=http://localhost:3001
   MAIN_SERVER_URL=http://localhost:3010
   MQTT_BROKER_URL=mqtt://localhost:1883
   ```

3. **Services**
   ```bash
   # Start MQTT broker
   mosquitto -c mqtt/mosquitto.conf
   
   # Start AI service
   cd ai-service && node app.js
   
   # Start main server
   node app.js
   ```

## Running Tests

### Quick Start

Run the complete E2E test suite:

```bash
npm run test:e2e:complete
```

### Individual Test Suites

Run specific test suites:

```bash
# AI features integration tests
npm run test:e2e:ai

# MQTT real-time communication tests
npm run test:e2e:mqtt

# Database consistency tests
npm run test:e2e:db

# File upload pipeline tests
npm run test:e2e:upload
```

### Manual Test Execution

```bash
# Run with Jest directly
npx jest tests/ai-features-e2e.test.js --runInBand --detectOpenHandles

# Run with custom timeout
npx jest tests/mqtt-realtime-e2e.test.js --testTimeout=60000

# Run with verbose output
npx jest tests/database-consistency-e2e.test.js --verbose
```

## Test Configuration

### Configuration File

The `e2e-test-config.js` file contains centralized configuration:

```javascript
module.exports = {
  services: {
    aiService: 'http://localhost:3001',
    mainServer: 'http://localhost:3010',
    mqttBroker: 'mqtt://localhost:1883'
  },
  timeouts: {
    default: 30000,
    long: 60000,
    serviceStartup: 45000
  },
  performance: {
    chatbot: { maxResponseTime: 5000 },
    diseaseDetection: { maxProcessingTime: 15000 },
    irrigationPrediction: { maxPredictionTime: 3000 }
  }
};
```

### Environment-Specific Overrides

Configure different environments:

```javascript
environments: {
  ci: {
    timeouts: { default: 45000 },
    performance: { chatbot: { maxResponseTime: 10000 } }
  }
}
```

## Test Categories

### 1. AI Features Integration Tests

**File**: `ai-features-e2e.test.js`

Tests complete AI workflows:

- **Chatbot conversations** with context integration
- **Disease detection** from image upload to analysis
- **Irrigation predictions** with sensor data
- **Cross-service data consistency**
- **Error handling and recovery**
- **Performance under load**

Key test scenarios:
```javascript
describe('Chatbot AI Complete Workflow', () => {
  test('should handle complete chatbot conversation with MQTT real-time updates');
  test('should reject non-plant questions and maintain conversation context');
  test('should integrate sensor data in chatbot responses');
});
```

### 2. MQTT Real-time Communication Tests

**File**: `mqtt-realtime-e2e.test.js`

Tests MQTT integration:

- **Real-time message delivery**
- **Topic subscription management**
- **Message ordering and reliability**
- **Connection recovery**
- **High-frequency message handling**

Key test scenarios:
```javascript
describe('Chatbot MQTT Integration', () => {
  test('should publish typing indicators and responses via MQTT');
  test('should handle multiple concurrent chatbot sessions via MQTT');
});
```

### 3. Database Consistency Tests

**File**: `database-consistency-e2e.test.js`

Tests data integrity:

- **Cross-service data consistency**
- **Concurrent operations handling**
- **Transaction rollback on failures**
- **Referential integrity**
- **Data validation and constraints**

Key test scenarios:
```javascript
describe('Cross-Service Data Integrity', () => {
  test('should maintain data consistency across all AI operations');
  test('should handle concurrent database operations without deadlocks');
});
```

### 4. File Upload Pipeline Tests

**File**: `file-upload-pipeline-e2e.test.js`

Tests image processing:

- **File format validation**
- **Plant content detection**
- **Image processing pipeline**
- **Secure storage**
- **Access control**

Key test scenarios:
```javascript
describe('File Upload Validation', () => {
  test('should accept valid image formats (JPEG, PNG, WebP)');
  test('should reject files exceeding size limit');
});
```

## Test Data Management

### Test User and Plant IDs

Tests use IDs starting from 9000 to avoid conflicts:

```javascript
const testUserId = 9001;
const testPlantId = 9001;
```

### Database Cleanup

Automatic cleanup after tests:

```javascript
afterAll(async () => {
  await cleanupTestData(); // Removes test data with IDs >= 9000
});
```

### Test Assets

Test images are created programmatically:

```javascript
// Create test JPEG image
const testImage = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46,
  // ... JPEG header bytes
  0xFF, 0xD9
]);
```

## Performance Testing

### Load Testing

Tests handle concurrent operations:

```javascript
test('should handle multiple concurrent users', async () => {
  const numUsers = 10;
  const promises = [];
  
  for (let i = 0; i < numUsers; i++) {
    promises.push(sendChatbotMessage(`User ${i} message`));
  }
  
  const results = await Promise.all(promises);
  // Verify all requests succeeded
});
```

### Performance Thresholds

Configurable performance expectations:

```javascript
performance: {
  chatbot: { maxResponseTime: 5000 },      // 5 seconds
  diseaseDetection: { maxProcessingTime: 15000 }, // 15 seconds
  irrigationPrediction: { maxPredictionTime: 3000 } // 3 seconds
}
```

## Error Handling

### Service Failures

Tests validate graceful degradation:

```javascript
test('should handle AI service failures with proper fallback', async () => {
  // Simulate service failure
  const response = await request(AI_SERVICE)
    .post('/api/ai/chatbot/message')
    .send({ simulateFailure: true });
    
  expect(response.body.success).toBe(true); // Should use fallback
});
```

### Network Issues

Tests handle connection problems:

```javascript
test('should handle MQTT connection recovery', async () => {
  mqttClient.end(true); // Force disconnect
  // ... test reconnection logic
});
```

## Reporting

### Test Reports

Generated reports include:

- **JSON Report**: `tests/reports/complete-e2e-report.json`
- **HTML Report**: `tests/reports/complete-e2e-report.html`
- **Markdown Summary**: `tests/reports/complete-e2e-summary.md`

### Report Contents

- Test execution summary
- Individual suite results
- Performance metrics
- Error details
- Environment information

### Sample Report Structure

```json
{
  "summary": {
    "total": 45,
    "passed": 43,
    "failed": 2,
    "duration": "5.2 minutes"
  },
  "suites": {
    "AI Features Integration": {
      "success": true,
      "tests": { "total": 15, "passed": 15, "failed": 0 }
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Service Connection Failures**
   ```bash
   # Check if services are running
   curl http://localhost:3001/health
   curl http://localhost:3010/health
   ```

2. **Database Connection Issues**
   ```bash
   # Test database connection
   psql -h localhost -U postgres -d plant_monitoring_test -c "SELECT 1;"
   ```

3. **MQTT Broker Issues**
   ```bash
   # Test MQTT connection
   mosquitto_pub -h localhost -t test/topic -m "test message"
   ```

4. **Port Conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :3001
   netstat -tulpn | grep :1883
   ```

### Debug Mode

Run tests with debug output:

```bash
DEBUG=* npm run test:e2e:ai
```

### Test Isolation

Run tests in isolation:

```bash
npx jest tests/ai-features-e2e.test.js --runInBand --no-cache
```

## CI/CD Integration

### GitHub Actions

Example workflow:

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm install
      
      - name: Start MQTT broker
        run: |
          sudo apt-get update
          sudo apt-get install mosquitto
          mosquitto -c mqtt/mosquitto.conf &
      
      - name: Run E2E tests
        run: npm run test:e2e:complete
        env:
          NODE_ENV: ci
          DB_HOST: localhost
          DB_USER: postgres
          DB_PASSWORD: postgres
```

### Docker Integration

Run tests in Docker:

```dockerfile
FROM node:16
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "run", "test:e2e:complete"]
```

## Best Practices

### Test Organization

1. **Group related tests** in describe blocks
2. **Use descriptive test names** that explain the scenario
3. **Keep tests independent** - each test should work in isolation
4. **Clean up after tests** to avoid side effects

### Performance Considerations

1. **Use appropriate timeouts** for different test types
2. **Run tests serially** (`--runInBand`) to avoid conflicts
3. **Monitor resource usage** during test execution
4. **Set realistic performance thresholds**

### Error Handling

1. **Test both success and failure scenarios**
2. **Validate error messages** are user-friendly
3. **Ensure graceful degradation** when services fail
4. **Test recovery mechanisms**

### Data Management

1. **Use consistent test data ranges** (IDs >= 9000)
2. **Clean up test data** after execution
3. **Avoid hardcoded values** - use configuration
4. **Create minimal test data** needed for each test

## Contributing

### Adding New Tests

1. **Follow naming convention**: `*-e2e.test.js`
2. **Use the test configuration**: Import from `e2e-test-config.js`
3. **Include proper cleanup**: Clean up test data and resources
4. **Document test scenarios**: Add clear descriptions

### Test Structure Template

```javascript
describe('New Feature E2E Tests', () => {
  beforeAll(async () => {
    // Setup test environment
  });
  
  afterAll(async () => {
    // Cleanup test data
  });
  
  beforeEach(() => {
    // Reset test state
  });
  
  describe('Feature Workflow', () => {
    test('should handle normal operation', async () => {
      // Test implementation
    });
    
    test('should handle error conditions', async () => {
      // Error testing
    });
  });
});
```

### Code Review Checklist

- [ ] Tests cover both success and failure scenarios
- [ ] Proper cleanup of test data and resources
- [ ] Appropriate timeouts for test operations
- [ ] Clear and descriptive test names
- [ ] No hardcoded values - use configuration
- [ ] Tests are independent and can run in any order
- [ ] Performance thresholds are realistic
- [ ] Error messages are validated

## Support

For issues with the E2E testing suite:

1. Check the troubleshooting section above
2. Review test logs in `tests/logs/`
3. Examine test reports in `tests/reports/`
4. Run individual test suites to isolate issues
5. Verify all prerequisites are met

The E2E testing suite ensures the AI features work correctly across the entire system, providing confidence in the integration and reliability of the plant monitoring system's AI capabilities.