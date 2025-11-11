# Modern Testing Framework - Jest + Selenium

This directory contains the modern testing framework using Jest for unit/integration tests and Selenium WebDriver for UI testing.

## 🏗️ Test Structure

```
tests/
├── unit/                      # Unit tests for individual components
│   ├── controllers/          # Controller unit tests
│   ├── models/              # Model unit tests
│   └── services/            # Service unit tests
├── integration/             # API integration tests
│   ├── auth/               # Authentication API tests
│   ├── admin/              # Admin API tests
│   ├── payment/            # Payment integration tests
│   └── ai/                 # AI service integration tests
├── ui/                     # Selenium UI tests
│   ├── setup/              # Selenium configuration
│   ├── utils/              # Base page classes and utilities
│   ├── auth/               # Authentication UI tests
│   ├── admin/              # Admin panel UI tests
│   └── dashboard/          # Dashboard UI tests
└── setup.js               # Global test configuration
```

## 🚀 Installation & Setup

### Prerequisites
- Node.js 16+ 
- Chrome or Firefox browser
- PostgreSQL database (for integration tests)

### Install Dependencies
```bash
npm install --save-dev selenium-webdriver @types/selenium-webdriver chromedriver geckodriver jest-environment-node
```

### Environment Variables
Create a `.env.test` file:
```env
NODE_ENV=test
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@localhost:5432/plant_system_test
SELENIUM_TIMEOUT=10000
```

## 🧪 Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm test -- --selectProjects "Unit Tests"
```

### UI Tests Only
```bash
npm test -- --selectProjects "UI Tests (Selenium)"
```

### Specific Test Files
```bash
# Run login UI tests
npm test tests/ui/auth/login.test.js

# Run admin dashboard tests
npm test tests/ui/admin/admin-dashboard.test.js

# Run authentication unit tests
npm test tests/unit/controllers/authController.test.js
```

### With Coverage
```bash
npm test -- --coverage
```

### Headless Mode
```bash
CI=true npm test
```

### Watch Mode
```bash
npm test -- --watch
```

## 📋 Test Categories

### 1. Unit Tests (`/tests/unit/`)
- **Controllers**: Test individual controller methods
- **Models**: Test database models and methods
- **Services**: Test business logic services
- **Utilities**: Test helper functions

Example:
```javascript
const AuthController = require('../../../controllers/authController');
const User = require('../../../models/User');

describe('AuthController', () => {
  test('should register new user', async () => {
    // Test implementation
  });
});
```

### 2. Integration Tests (`/tests/integration/`)
- **API Endpoints**: Test complete request/response cycles
- **Database Operations**: Test database interactions
- **External Services**: Test third-party integrations

Example:
```javascript
const request = require('supertest');
const app = require('../../../app');

describe('POST /auth/register', () => {
  test('should create new user account', async () => {
    const response = await request(app)
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!'
      });
    
    expect(response.status).toBe(201);
  });
});
```

### 3. UI Tests (`/tests/ui/`)
- **Page Object Model**: Maintainable UI test structure
- **Cross-browser Testing**: Chrome, Firefox support
- **Responsive Testing**: Mobile, tablet, desktop viewports
- **User Workflows**: End-to-end user scenarios

Example:
```javascript
const SeleniumSetup = require('../setup/selenium.setup');
const LoginPage = require('./LoginPage');

describe('Login UI Tests', () => {
  let driver, loginPage;

  beforeAll(async () => {
    const setup = new SeleniumSetup();
    driver = await setup.initializeDriver('chrome');
    loginPage = new LoginPage(driver);
  });

  test('should login with valid credentials', async () => {
    await loginPage.navigateToLogin();
    await loginPage.login('user@test.com', 'password');
    await loginPage.waitForLoginSuccess();
    
    const url = await loginPage.getCurrentUrl();
    expect(url).toContain('/dashboard');
  });
});
```

## 🛠️ Page Object Model

UI tests use the Page Object Model pattern for maintainability:

### Base Page Class
```javascript
class BasePage {
  constructor(driver) {
    this.driver = driver;
  }
  
  async findElement(locator) { /* ... */ }
  async clickElement(locator) { /* ... */ }
  async typeText(locator, text) { /* ... */ }
}
```

### Specific Page Classes
```javascript
class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailInput = By.css('input[type="email"]');
    this.passwordInput = By.css('input[type="password"]');
    this.loginButton = By.css('button[type="submit"]');
  }
  
  async login(email, password) {
    await this.typeText(this.emailInput, email);
    await this.typeText(this.passwordInput, password);
    await this.clickElement(this.loginButton);
  }
}
```

## 📊 Test Coverage

The framework provides comprehensive coverage tracking:

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
npm run coverage:report
```

Coverage includes:
- **Line Coverage**: Percentage of code lines executed
- **Function Coverage**: Percentage of functions called
- **Branch Coverage**: Percentage of code branches taken
- **Statement Coverage**: Percentage of statements executed

## 🔧 Configuration

### Jest Configuration
The `jest.config.json` supports multiple test projects:

```json
{
  "projects": [
    {
      "displayName": "Unit Tests",
      "testMatch": ["<rootDir>/tests/unit/**/*.test.js"]
    },
    {
      "displayName": "UI Tests (Selenium)",
      "testMatch": ["<rootDir>/tests/ui/**/*.test.js"],
      "maxWorkers": 1
    }
  ]
}
```

### Selenium Configuration
Browser configuration in `selenium.setup.js`:

```javascript
// Chrome with custom options
const chromeOptions = new chrome.Options();
chromeOptions.addArguments('--headless');
chromeOptions.addArguments('--no-sandbox');
chromeOptions.addArguments('--window-size=1920,1080');
```

## 📈 Test Data Management

### Test Database
- Separate test database: `plant_system_test`
- Automatic cleanup between tests
- Seed data for consistent testing

### Mock Data
```javascript
const mockUser = {
  email: 'test@example.com',
  password: 'Password123!',
  role: 'Admin'
};
```

### Test Utilities
```javascript
// Create test user
const createTestUser = async (userData) => {
  // Implementation
};

// Clear test database
const clearTestData = async () => {
  // Implementation
};
```

## 🚨 Error Handling & Debugging

### Screenshot Capture
Automatic screenshots on test failures:
```javascript
afterEach(async () => {
  if (testFailed) {
    await seleniumSetup.takeScreenshot(`failed-${testName}`);
  }
});
```

### Logging
Comprehensive test logging:
```javascript
console.log('🧪 Test started:', testName);
console.error('❌ Test failed:', error);
console.log('✅ Test passed:', testName);
```

### Debugging Tips
1. **Increase timeouts** for slow operations
2. **Use headful mode** during development
3. **Add sleep/waits** for dynamic content
4. **Inspect elements** with browser dev tools
5. **Check console logs** for JavaScript errors

## 📝 Writing New Tests

### 1. Unit Test Template
```javascript
const ComponentToTest = require('../../../path/to/component');

describe('ComponentToTest', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  test('should perform expected behavior', () => {
    // Arrange
    const input = 'test input';
    
    // Act
    const result = ComponentToTest.method(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

### 2. UI Test Template
```javascript
const SeleniumSetup = require('../setup/selenium.setup');
const PageObject = require('./PageObject');

describe('Feature UI Tests', () => {
  let seleniumSetup, driver, pageObject;

  beforeAll(async () => {
    seleniumSetup = new SeleniumSetup();
    driver = await seleniumSetup.initializeDriver();
    pageObject = new PageObject(driver);
  });

  afterAll(async () => {
    await seleniumSetup.cleanup();
  });

  test('should perform user interaction', async () => {
    await pageObject.navigateToPage();
    await pageObject.performAction();
    
    const result = await pageObject.getResult();
    expect(result).toBe('expected');
  });
});
```

## 🎯 Best Practices

### Test Organization
- **Group related tests** in describe blocks
- **Use descriptive test names** that explain behavior
- **Keep tests independent** - no shared state
- **Mock external dependencies** appropriately

### Page Objects
- **Single responsibility** per page class
- **Descriptive locator names** 
- **Reusable methods** for common actions
- **Error handling** for element interactions

### Test Data
- **Use factories** for creating test data
- **Parameterized tests** for multiple scenarios
- **Clean up** test data after tests
- **Avoid hardcoded values** in tests

### Performance
- **Parallel execution** for unit tests
- **Sequential execution** for UI tests
- **Efficient selectors** (ID > Class > XPath)
- **Minimal wait times** with smart waits

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test -- --selectProjects "Unit Tests"
      
      - name: Run UI tests
        run: CI=true npm test -- --selectProjects "UI Tests (Selenium)"
        env:
          APP_URL: http://localhost:3000
```

## 📞 Support & Documentation

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Selenium WebDriver**: https://selenium-dev.github.io/documentation/
- **Testing Best Practices**: Refer to `/TESTING_CHECKLIST.md`
- **Project Issues**: Submit GitHub issues for framework problems

## 🔄 Migration from Old Tests

Old tests have been moved to `/tests-deprecated/` and should be gradually migrated to this new framework structure. Reference the deprecated tests for business logic but implement using the new patterns shown here.