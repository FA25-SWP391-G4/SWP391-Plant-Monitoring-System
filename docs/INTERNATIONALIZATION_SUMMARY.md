# Plant Monitoring System - Internationalization (i18n) Implementation

## Overview

This document provides a summary of the internationalization (i18n) implementation in the Plant Monitoring System project (UC31: Manage Multi-Language Settings). The implementation includes both frontend and backend components to support multiple languages, with initial support for English and Vietnamese.

## Implementation Components

### 1. Frontend Implementation

#### i18n Configuration
- Created `client/src/i18n/i18n.js` - Core i18n configuration with language detection
- Added i18next packages to `package.json`:
  - i18next
  - react-i18next
  - i18next-browser-languagedetector
  - i18next-http-backend

#### Translation Resources
- Created language resource files:
  - `client/src/i18n/locales/en/translation.json` - English translations
  - `client/src/i18n/locales/vi/translation.json` - Vietnamese translations
- Organized translations by feature areas (common, navigation, zones)

#### Components
- Created `LanguageSwitcher.jsx` component for switching between languages
- Integrated language switcher in the Navbar
- Updated `Zones.jsx` to use translations instead of hardcoded text

#### Integration
- Initialized i18n in the application entry point `index.js`
- Used `useTranslation` hook in components to access translations
- Implemented language preference persistence via localStorage
- Added backend API integration for authenticated users

### 2. Backend Implementation

#### Database
- Added `language_preference` column to `Users` table
- Created database migration file `migrations/add_language_preference_column.sql`
- Updated User model to include language preference field

#### API Endpoints
- Created `languageController.js` with language management functions:
  - `getLanguagePreferences` - Get user's language preference
  - `updateLanguagePreferences` - Update user's language preference
  - `getAvailableLanguages` - Get all available languages
- Created `language.js` routes file with API endpoints:
  - `GET /api/language/available` - Public endpoint for available languages
  - `GET /api/language/preferences` - Get user's language preference (authenticated)
  - `PUT /api/language/preferences` - Update user's language preference (authenticated)
- Registered routes in `app.js`

### 3. Testing Implementation

#### Frontend Tests
- Created `frontend-rendering-i18n.test.js` to test components with different languages
- Tests include:
  - Navbar rendering with English and Vietnamese
  - Zones page rendering with English and Vietnamese
  - Language switching functionality

#### Backend Tests
- Created `language-api.test.js` to test language API endpoints
- Tests include:
  - Getting available languages
  - Getting user language preferences
  - Updating user language preferences
  - Handling invalid language codes
  - Authentication requirements for protected endpoints

#### Integration Tests
- Created `frontend-backend-mapping.test.js` to test API endpoint mapping

## Usage

### For Users
1. Users can switch languages using the language dropdown in the navbar
2. Language preference is saved in localStorage for non-authenticated users
3. Language preference is saved in the database for authenticated users
4. UI automatically updates with the selected language

### For Developers
1. Add new translations to the language resource files
2. Use the `useTranslation` hook in components:
   ```jsx
   const { t } = useTranslation();
   // ...
   <h3>{t('zones.title')}</h3>
   ```
3. Add new languages by:
   - Adding new translation files in `locales/` folder
   - Updating the i18n configuration
   - Adding the language to the backend available languages list

## Next Steps
1. Extend i18n support to all pages (currently only Zones and Navbar)
2. Add additional languages as needed
3. Implement RTL (Right-to-Left) support for languages that require it
4. Consider adding server-side language detection for improved SEO

## Conclusion
The internationalization implementation provides a solid foundation for multi-language support in the Plant Monitoring System. It satisfies the requirements for UC31 (Manage Multi-Language Settings) and allows for easy extension to support additional languages in the future.