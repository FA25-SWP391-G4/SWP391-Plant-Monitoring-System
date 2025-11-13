# ISTQB Standard Test Suite

## Test Structure Overview

This test suite follows ISTQB (International Software Testing Qualifications Board) standards with comprehensive coverage across all test levels.

## Test Levels (ISTQB)

### 1. Unit Tests (`unit/`)
- **Purpose**: Test individual components in isolation
- **Tools**: Jest
- **Coverage**: Models, Controllers, Services, Utilities
- **Mocking**: All external dependencies mocked

### 2. Integration Tests (`integration/`)
- **Purpose**: Test interactions between components
- **Tools**: Jest + Supertest
- **Coverage**: API routes, Database interactions, Service integrations
- **Environment**: Test database required

### 3. System Tests (`system/`)
- **Purpose**: Test complete system functionality
- **Tools**: Jest + Selenium WebDriver
- **Coverage**: End-to-end workflows, Multi-service integration
- **Environment**: Full stack running (Backend + Frontend + AI Service)

### 4. Acceptance Tests (`acceptance/`)
- **Purpose**: Validate business requirements and user stories
- **Tools**: Selenium WebDriver + Cucumber (BDD)
- **Coverage**: User scenarios, Business workflows
- **Environment**: Production-like environment

### 5. E2E Tests (`e2e/`)
- **Purpose**: Test complete user journeys across the application
- **Tools**: Selenium WebDriver
- **Coverage**: Critical user paths, Cross-browser testing
- **Browsers**: Chrome, Firefox, Edge

## Test Types (ISTQB)

- **Functional Testing**: Verifies system functions correctly
- **Non-Functional Testing**: Performance, security, usability
- **Regression Testing**: Ensures changes don't break existing functionality
- **Smoke Testing**: Basic health checks before full testing

## Running Tests

```bash
# All tests
npm run test:istqb

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# System tests
npm run test:system

# Acceptance tests
npm run test:acceptance

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## Test Naming Convention

- Test files: `*.test.js` or `*.spec.js`
- Test suites: `describe('ComponentName', () => {})`
- Test cases: `test('should do something when condition', () => {})`
- E2E tests: `*.e2e.js`

## Coverage Goals

- Unit Tests: 80%+ code coverage
- Integration Tests: All API endpoints
- System Tests: All critical workflows
- E2E Tests: All user-facing features

## Test Data Management

- Fixtures: `fixtures/`
- Mocks: `__mocks__/`
- Test data generators: `helpers/test-data-generator.js`

## Continuous Integration

Tests are automatically run on:
- Pull requests
- Pre-commit hooks
- Daily scheduled runs
- Production deployments
