# Testing Framework Guide

## Overview

This project uses a modern testing framework combining Jest and Selenium WebDriver for comprehensive testing coverage:

- **Unit Tests**: Fast, isolated tests for individual functions and components
- **Integration Tests**: API endpoint testing with database interactions
- **UI Tests**: End-to-end browser automation using Selenium WebDriver

## Test Structure

```
tests/
├── unit/                    # Unit tests (fast, mocked dependencies)
│   ├── controllers/         # Controller logic tests
│   ├── models/             # Data model tests
│   ├── services/           # Service layer tests
│   └── utils/              # Utility function tests
├── integration/            # Integration tests (API + database)
│   ├── auth/               # Authentication flow tests
│   ├── admin/              # Admin functionality tests
│   ├── plants/             # Plant management tests
│   └── payments/           # Payment system tests
├── ui/                     # UI tests (Selenium WebDriver)
│   ├── admin/              # Admin dashboard tests
│   ├── auth/               # Login/registration tests
│   ├── plants/             # Plant management UI tests
│   ├── setup/              # Selenium configuration
│   └── pages/              # Page Object Model classes
└── __mocks__/              # Jest mock implementations
```

## Running Tests

### All Tests
```bash
npm test                    # Run all test suites
npm run test:all           # Sequential run: unit -> integration -> UI
```

### Specific Test Types
```bash
npm run test:unit          # Unit tests only (fastest)
npm run test:integration   # Integration tests only
npm run test:ui            # UI tests only (slowest)
```

### Watch Mode (Development)
```bash
npm run test:watch         # Watch all tests
npm run test:watch:unit    # Watch unit tests only
npm run test:watch:integration  # Watch integration tests only
npm run test:watch:ui      # Watch UI tests only
```

### Coverage Reports
```bash
npm run test:coverage      # Coverage for all tests
npm run test:coverage:unit # Coverage for unit tests only
npm run test:coverage:integration # Coverage for integration tests only
```

## Test Configuration

### Jest Configuration (`jest.config.json`)

Multi-project configuration supporting different test environments:

```json
{
  "projects": [
    {
      "displayName": "Unit Tests",
      "testMatch": ["<rootDir>/tests/unit/**/*.test.js"],
      "testEnvironment": "node",
      "setupFilesAfterEnv": ["<rootDir>/tests/setup/test-setup.js"]
    },
    {
      "displayName": "Integration Tests", 
      "testMatch": ["<rootDir>/tests/integration/**/*.test.js"],
      "testEnvironment": "node",
      "setupFilesAfterEnv": ["<rootDir>/tests/setup/test-setup.js"]
    },
    {
      "displayName": "UI Tests",
      "testMatch": ["<rootDir>/tests/ui/**/*.test.js"],
      "testEnvironment": "node",
      "setupFilesAfterEnv": ["<rootDir>/tests/ui/setup/selenium.setup.js"],
      "testTimeout": 30000
    }
  ]
}
```

## Writing Tests

### Unit Tests

Use mocking for external dependencies:

```javascript
// tests/unit/controllers/authController.test.js
const { register } = require('../../../controllers/authController');
const User = require('../../../models/User');
const SystemLog = require('../../../models/SystemLog');

jest.mock('../../../models/User');
jest.mock('../../../models/SystemLog');

describe('AuthController', () => {
  it('should register a new user', async () => {
    User.findByEmail.mockResolvedValue(null);
    User.create.mockResolvedValue({ id: 1, email: 'test@test.com' });
    
    // Test implementation
  });
});
```

### Integration Tests

Test real API endpoints with supertest:

```javascript
// tests/integration/auth/auth.test.js
const request = require('supertest');
const app = require('../../../app');

describe('Authentication Integration', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@test.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });
      
    expect(response.status).toBe(201);
    expect(response.body.token).toBeDefined();
  });
});
```

### UI Tests

Use Page Object Model pattern with Selenium:

```javascript
// tests/ui/auth/login.test.js
const { Builder } = require('selenium-webdriver');
const LoginPage = require('../pages/LoginPage');

describe('Login UI', () => {
  let driver, loginPage;

  beforeAll(async () => {
    driver = await new Builder().forBrowser('chrome').build();
    loginPage = new LoginPage(driver);
  });

  it('should login successfully with valid credentials', async () => {
    await loginPage.navigate();
    await loginPage.login('admin@test.com', 'admin123');
    
    const isLoggedIn = await loginPage.isLoggedIn();
    expect(isLoggedIn).toBe(true);
  });

  afterAll(async () => {
    await driver.quit();
  });
});
```

## Page Object Model

UI tests use Page Object Model for maintainable test code:

```javascript
// tests/ui/pages/LoginPage.js
class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailInput = By.id('email');
    this.passwordInput = By.id('password');
    this.loginButton = By.css('button[type="submit"]');
  }

  async login(email, password) {
    await this.driver.findElement(this.emailInput).sendKeys(email);
    await this.driver.findElement(this.passwordInput).sendKeys(password);
    await this.driver.findElement(this.loginButton).click();
  }
}
```

## Browser Configuration

### Chrome (Default)
```javascript
const driver = await new Builder().forBrowser('chrome').build();
```

### Chrome Headless (CI/CD)
```javascript
const chrome = require('selenium-webdriver/chrome');
const options = new chrome.Options().addArguments('--headless');
const driver = await new Builder()
  .forBrowser('chrome')
  .setChromeOptions(options)
  .build();
```

### Firefox
```javascript
const driver = await new Builder().forBrowser('firefox').build();
```

## Test Data Management

### Database Setup
Integration and UI tests use a test database configured in `.env.test`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/plant_system_test
NODE_ENV=test
```

### Test Data Cleanup
Tests automatically clean up data using setup/teardown hooks:

```javascript
beforeEach(async () => {
  await db.query('TRUNCATE TABLE users CASCADE');
});
```

## Debugging Tests

### Screenshots (UI Tests)
Automatic screenshots on test failures:

```javascript
afterEach(async function() {
  if (this.currentTest.state === 'failed') {
    await takeScreenshot(driver, this.currentTest.title);
  }
});
```

### Verbose Logging
```bash
DEBUG=true npm run test:ui  # Enable debug logging
```

### Browser DevTools
```javascript
// Keep browser open for debugging
const options = new chrome.Options().addArguments('--auto-open-devtools-for-tabs');
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:ui
```

## Test Coverage

Aim for the following coverage targets:
- **Unit Tests**: 90%+ for business logic
- **Integration Tests**: 80%+ for API endpoints  
- **UI Tests**: 70%+ for critical user flows

## Best Practices

1. **Fast Feedback**: Run unit tests first (fastest)
2. **Isolation**: Each test should be independent
3. **Descriptive Names**: Test names should describe behavior
4. **Arrange-Act-Assert**: Clear test structure
5. **Mock External Dependencies**: In unit tests
6. **Real Dependencies**: In integration tests
7. **Page Object Model**: For UI test maintainability
8. **Screenshot on Failure**: For UI test debugging
9. **Parallel Execution**: Where possible
10. **Clean Database**: Between integration tests

## Troubleshooting

### Common Issues

1. **Selenium Driver Path**: Ensure chromedriver/geckodriver in PATH
2. **Port Conflicts**: Use different ports for test server
3. **Database Connections**: Ensure test database is accessible
4. **Timeout Issues**: Increase timeout for slow operations
5. **Browser Version**: Keep browser and driver versions compatible

### Debug Commands
```bash
# Check if drivers are installed correctly
npx chromedriver --version
npx geckodriver --version

# Run tests with verbose output
npm run test:ui -- --verbose

# Run specific test file
npm test -- tests/ui/auth/login.test.js
```

## Migration from Legacy Tests

Legacy tests have been moved to `tests-deprecated/` with migration documentation. The new framework provides:

- ✅ Better organization and separation of concerns
- ✅ Modern tooling with Jest and Selenium WebDriver
- ✅ Page Object Model for maintainable UI tests
- ✅ Comprehensive mocking and stubbing
- ✅ Coverage reporting and CI/CD integration
- ✅ Parallel execution and faster feedback loops

For any questions about the testing framework, refer to this guide or check the example test files in each directory.