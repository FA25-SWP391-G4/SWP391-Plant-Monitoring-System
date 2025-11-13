# Running ISTQB Tests

## Prerequisites

```bash
cd tests-istqb
npm install
```

## Environment Setup

Create a `.env` file in `tests-istqb/` directory:

```env
NODE_ENV=test
TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/plant_system_test
TEST_API_URL=http://localhost:5000
TEST_BASE_URL=http://localhost:3000
JWT_SECRET=test-jwt-secret
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### Acceptance Tests
```bash
npm run test:acceptance
```

### Coverage Report
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

## Running Specific Test Categories

### Models
```bash
npm run test:models
```

### Controllers
```bash
npm run test:controllers
```

### Services
```bash
npm run test:services
```

### Frontend
```bash
npm run test:frontend
```

### AI Service
```bash
npm run test:ai-service
```

## Cross-Browser E2E Testing

### Chrome
```bash
npm run selenium:chrome
```

### Firefox
```bash
npm run selenium:firefox
```

### Edge
```bash
npm run selenium:edge
```

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/tests.yml
name: ISTQB Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: plant_system_test
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd tests-istqb
          npm install
      
      - name: Run unit tests
        run: |
          cd tests-istqb
          npm run test:unit
      
      - name: Run integration tests
        run: |
          cd tests-istqb
          npm run test:integration
      
      - name: Generate coverage report
        run: |
          cd tests-istqb
          npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./tests-istqb/coverage/lcov.info
```

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Create test database
psql -U postgres -c "CREATE DATABASE plant_system_test;"
```

### Selenium WebDriver Issues
```bash
# Install Chrome/Firefox drivers
npm install chromedriver geckodriver
```

### Port Already in Use
```bash
# Kill processes on port 3000 and 5000
npx kill-port 3000 5000
```

## Best Practices

1. **Run tests before committing**
2. **Maintain 80%+ coverage**
3. **Update tests when adding features**
4. **Review failed tests immediately**
5. **Keep test data isolated**
6. **Clean up after each test**
7. **Use descriptive test names**
8. **Mock external dependencies**
