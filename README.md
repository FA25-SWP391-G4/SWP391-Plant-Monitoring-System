# Plant Monitoring System

## Recent Updates

- **Google OAuth Session Fix (2025-10-19)**: Fixed session persistence issues in the OAuth flow by implementing PostgreSQL-based session storage.
- **Absolute URL Redirects (2025-10-18)**: Updated all OAuth redirects to use absolute URLs as required by Next.js middleware.

## Prerequisites

- Node.js 16+
- PostgreSQL 13+
- Python 3.8+ (for AI service)

## Installation

1. Clone the repository
```bash
git clone https://github.com/FA25-SWP391-G4/SWP391-Plant-Monitoring-System.git
cd plant-system
```

2. Install backend dependencies
```bash
npm install
```

3. Install frontend dependencies
```bash
cd client
npm install
cd ..
```

4. Set up environment variables
```bash
cp .env.example .env
```
Edit `.env` with your configuration values.

## Required Environment Variables

```
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/plant_system

# Server
PORT=3010
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SESSION_SECRET=your-secure-random-string

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=1h

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://localhost:3000/api/auth/callback/google
```

## Running the Application

### Development Mode

```bash
# Backend only
npm start

# Frontend development
cd client && npm run dev

# Full stack development
npm run start:dev
```

### Production Mode

```bash
# Build frontend
cd client && npm run build && cd ..

# Start production server
NODE_ENV=production npm start
```

## Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd client && npm test
```

## Project Structure

- `/controllers` - Express route controllers
- `/models` - Data models with PostgreSQL queries
- `/routes` - API route definitions
- `/client/src` - React frontend application
- `/client/src/app` - Next.js app directory
- `/ai_service` - Python ML service
- `/docs` - Project documentation

## Authentication Flow

The application supports both JWT-based authentication and Google OAuth 2.0 integration:

1. Traditional email/password authentication
2. Google OAuth login with state parameter for CSRF protection

## Documentation

See the `/docs` directory for detailed documentation on specific features:

- [Google OAuth Implementation](./docs/GOOGLE_OAUTH_CONFIGURATION.md)
- [Google OAuth Session Fix](./docs/GOOGLE_OAUTH_SESSION_FIX.md)
- [Environment Variables](./docs/ENVIRONMENT_VARIABLES.md)