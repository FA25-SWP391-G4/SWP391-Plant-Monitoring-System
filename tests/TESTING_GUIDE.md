# Plant Monitoring System Testing Guide

This guide provides comprehensive instructions for testing the Plant Monitoring System, including backend API endpoints, frontend rendering, and language support (internationalization).

## Prerequisites

1. **Node.js and npm**: Install Node.js 16+ and npm 8+ from [nodejs.org](https://nodejs.org/)
2. **PostgreSQL**: Setup PostgreSQL database with appropriate tables
3. **Environment Setup**: Configure environment variables in `.env` file

## Database Migration for Language Support

Before running tests, apply the language preference column migration:

```bash
# Navigate to project root
cd c:\Users\l\OneDrive\DUE\Project\SWP391-Plant-Monitoring-System\plant-system

# Connect to your PostgreSQL database and run the migration
psql -U your_username -d your_database -f migrations/add_language_preference_column.sql
```

## Installing Dependencies

```bash
# Install backend dependencies
cd c:\Users\l\OneDrive\DUE\Project\SWP391-Plant-Monitoring-System\plant-system
npm install

# Install frontend dependencies
cd client
npm install
```

## Running Backend Tests

Backend tests check API endpoints, database operations, and business logic:

```bash
# From the plant-system directory
npm test
```

This will run all tests including:
- Frontend-Backend mapping tests
- Language API tests
- Auth and user management tests
- Email and password reset tests

## Running Frontend Tests

Frontend tests verify component rendering, state management, and internationalization:

```bash
# From the plant-system/client directory
npm test
```

This will run tests for React components, including i18n rendering tests.

## Manual Testing

### Backend API Endpoints

Test the language API endpoints using cURL or Postman:

1. **Get Available Languages**:
   ```
   GET http://localhost:3010/api/language/available
   ```

2. **Get User Language Preference** (requires authentication):
   ```
   GET http://localhost:3010/api/language/preferences
   Authorization: Bearer YOUR_TOKEN
   ```

3. **Update User Language Preference** (requires authentication):
   ```
   PUT http://localhost:3010/api/language/preferences
   Authorization: Bearer YOUR_TOKEN
   Content-Type: application/json
   
   {"language": "vi"}
   ```

### Frontend Internationalization

1. Run the React application:
   ```bash
   cd client
   npm start
   ```

2. Test language switching:
   - Look for the language switcher dropdown in the top-right corner
   - Switch between English and Vietnamese
   - Verify that UI text changes throughout the application
   - Check that language preference persists after page reload
   - Verify that authenticated users have their language preference stored in the backend

## Test Coverage

The test suite provides coverage for:

1. **Frontend-Backend Mapping**:
   - Verifies that frontend pages correctly map to backend API endpoints
   - Ensures backend has routes for all frontend API calls

2. **Frontend Rendering with i18n**:
   - Verifies that components render correctly with different language settings
   - Tests language switching functionality

3. **Language API**:
   - Tests retrieving available languages
   - Tests getting and updating user language preferences
   - Verifies authentication requirements for protected endpoints

## Troubleshooting

- **Missing Node.js**: Install Node.js from [nodejs.org](https://nodejs.org/)
- **Database Connection Issues**: Verify PostgreSQL connection settings in `config/db.js`
- **Test Failures**: Check for missing dependencies or database migration issues
- **i18n Issues**: Verify translation files in `client/src/i18n/locales/`

## Adding Support for More Languages

1. Add new translation file in `client/src/i18n/locales/`
2. Update `client/src/i18n/i18n.js` to include the new language
3. Update `controllers/languageController.js` to include the new language in available languages
4. Add tests for the new language in `tests/frontend-rendering-i18n.test.js`