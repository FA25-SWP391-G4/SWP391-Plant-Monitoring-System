# 🌱 Plant Monitoring System# Plant Monitoring System



A comprehensive IoT-based plant monitoring and automated watering system with AI-powered plant health analysis, real-time sensor data tracking, and multi-language support.## Recent Updates



[![Node.js](https://img.shields.io/badge/Node.js-16+-green.svg)](https://nodejs.org/)- **Google OAuth Session Fix (2025-10-19)**: Fixed session persistence issues in the OAuth flow by implementing PostgreSQL-based session storage.

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue.svg)](https://www.postgresql.org/)- **Absolute URL Redirects (2025-10-18)**: Updated all OAuth redirects to use absolute URLs as required by Next.js middleware.

[![Next.js](https://img.shields.io/badge/Next.js-14+-black.svg)](https://nextjs.org/)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)## Prerequisites



## 📋 Table of Contents- Node.js 16+

- PostgreSQL 13+

- [Features](#features)- Python 3.8+ (for AI service)

- [Architecture](#architecture)

- [Prerequisites](#prerequisites)## Installation

- [Installation](#installation)

- [Configuration](#configuration)1. Clone the repository

- [Running the Application](#running-the-application)```bash

- [Testing](#testing)git clone https://github.com/FA25-SWP391-G4/SWP391-Plant-Monitoring-System.git

- [Project Structure](#project-structure)cd plant-system

- [API Documentation](#api-documentation)```

- [Authentication](#authentication)

- [Deployment](#deployment)2. Install backend dependencies

- [Troubleshooting](#troubleshooting)```bash

npm install

## ✨ Features```



### Core Functionality3. Install frontend dependencies

- 🌡️ **Real-time Monitoring**: Track soil moisture, temperature, humidity, and light levels```bash

- 💧 **Automated Watering**: Schedule-based and sensor-triggered wateringcd client

- 📊 **Analytics Dashboard**: Historical data visualization and trendsnpm install

- 🔔 **Smart Notifications**: Email and in-app alerts for plant health issuescd ..

- 🤖 **AI Analysis**: Machine learning-based plant health predictions```

- 📱 **Mobile Responsive**: Works seamlessly on desktop and mobile devices

4. Set up environment variables

### User Management```bash

- 👤 **User Authentication**: JWT-based auth with Google OAuth integrationcp .env.example .env

- 🔐 **Role-Based Access**: Regular, Premium, and Admin user roles```

- 💳 **Premium Subscriptions**: VNPay payment integrationEdit `.env` with your configuration values.

- 🌍 **Internationalization**: Support for English, Spanish, French, and Chinese

## Required Environment Variables

### IoT Integration

- 📡 **MQTT Protocol**: Real-time communication with ESP32 devices```

- ⚡ **Device Management**: Register and monitor multiple sensors# Database

- 🔧 **Hardware Control**: Remote pump control and threshold configurationDATABASE_URL=postgresql://username:password@localhost:5432/plant_system



## 🏗️ Architecture# Server

PORT=3010

```NODE_ENV=development

┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐FRONTEND_URL=http://localhost:3000

│   Next.js       │────▶│   Express API    │────▶│   PostgreSQL    │SESSION_SECRET=your-secure-random-string

│   Frontend      │     │   Backend        │     │   Database      │

└─────────────────┘     └──────────────────┘     └─────────────────┘# Authentication

                               │JWT_SECRET=your-jwt-secret

                               ├──────────────────────┐JWT_EXPIRES_IN=1h

                               ▼                      ▼

                        ┌─────────────┐      ┌──────────────┐# Google OAuth

                        │   Python    │      │   AWS IoT    │GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

                        │  AI Service │      │     Core     │GOOGLE_CLIENT_SECRET=your-client-secret

                        └─────────────┘      └──────────────┘GOOGLE_REDIRECT_URI=https://localhost:3000/api/auth/callback/google

                                                     │```

                                                     ▼

                                             ┌──────────────┐## Running the Application

                                             │   ESP32      │

                                             │   Devices    │### Development Mode

                                             └──────────────┘

``````bash

# Backend only

### Tech Stacknpm start



**Frontend:**# Frontend development

- Next.js 14 (React 18)cd client && npm run dev

- TypeScript

- Tailwind CSS# Full stack development

- i18next (Internationalization)npm run start:dev

- Axios```

- React Hook Form

### Production Mode

**Backend:**

- Node.js 16+```bash

- Express.js# Build frontend

- PostgreSQL 13+cd client && npm run build && cd ..

- JWT Authentication

- Nodemailer# Start production server

- MQTT.jsNODE_ENV=production npm start

- AWS IoT SDK```



~~## **AI Service: Testing**~~

~~- Python 3.8+~~  
~~- TensorFlow / PyTorch~~  
~~- Flask~~  
~~- NumPy / Pandas~~

~~```bash
# Run backend tests
npm test
```~~

~~## **DevOps: Testing**~~



## Project Structure

## 📦 Prerequisites

- `/controllers` - Express route controllers

Before you begin, ensure you have the following installed:- `/models` - Data models with PostgreSQL queries

- `/routes` - API route definitions

- **Node.js**: v16.0.0 or higher ([Download](https://nodejs.org/))- `/client/src` - React frontend application

- **PostgreSQL**: v13.0 or higher ([Download](https://www.postgresql.org/download/))- `/client/src/app` - Next.js app directory

- **Python**: v3.8 or higher (for AI service)- `/ai_service` - Python ML service

- **npm** or **yarn**: Latest version- `/docs` - Project documentation

- **Git**: For version control

## Authentication Flow

### Optional


- **AWS Account**: For AWS IoT Core integration

- **Google Cloud Console**: For OAuth integration1. Traditional email/password authentication

- **VNPay Account**: For payment processing2. Google OAuth login with state parameter for CSRF protection



## 🚀 Installation## Documentation



### 1. Clone the RepositorySee the `/docs` directory for detailed documentation on specific features:



```bash- [Google OAuth Implementation](./docs/GOOGLE_OAUTH_CONFIGURATION.md)

git clone https://github.com/FA25-SWP391-G4/SWP391-Plant-Monitoring-System.git- [Google OAuth Session Fix](./docs/GOOGLE_OAUTH_SESSION_FIX.md)

cd plant-system- [Environment Variables](./docs/ENVIRONMENT_VARIABLES.md)
```

### 2. Install Backend Dependencies

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```
### 4. Install Mobile Dependencies

```bash
cd app_client
npm install
npx expo install
cd ..
```

### 5. ~~Install AI Service Dependencies (Optional)~~

~~```bash
cd ai_service
pip install -r requirements.txt
cd ..
```~~

### 6. Set Up PostgreSQL Database

```bash
- Install Database Client JDBC (https://marketplace.visualstudio.com/items?itemName=cweijan.dbclient-jdbc)
- Install Postgre SQL (https://www.postgresql.org/)
```

```sql
-- Create database using mysql_schema.sql in PGAdmin(included in PostgreSQL setup)
```

```bash
- Use Database Client JDBC and connect to your SQL Server
- Match your port, username and password with PostgreSQL and .env
<img width="1146" height="620" alt="image" src="https://github.com/user-attachments/assets/0f4cd336-8d7b-40a6-8aef-c9e88ca81024" />

```


### 7. Configure Environment Variables

Create a `.env` file in the root directory


## ⚙️ Configuration

### Required Environment Variables

Create a `.env` in your main directory


## 🏃 Running the Application

### Development Mode

**Option 1: Start all services together (Recommended)**

```bash
# Windows
start-all.bat

# Linux/Mac
./start-all.sh
```

**Option 2: Start services individually**

```bash
# Backend API (Terminal 1)
npm start

# Frontend Development Server (Terminal 2)
cd client
npm run dev

# Mobile Development Server (Terminal 2)
cd app_client
npm start

~~# AI Service (Terminal 3 - Optional)~~
~~```bash
cd ai_service
python main.py
```~~


The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3010
~~**AI Service**: http://localhost:5000~~

### Production Mode

```bash
# Build frontend
cd client
npm run build
cd ..

# Start production server
NODE_ENV=production npm start
```

## 🧪 Testing

### Backend Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- controllers/authController.test.js

# Run tests in watch mode
npm test -- --watch
```

### Frontend Tests

```bash
cd client

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

### i18n Tests

```bash
# Run translation integrity tests
npm run test:i18n

# Windows
./run-i18n-tests.bat

# PowerShell
./run-i18n-tests.ps1
```

## 📁 Project Structure

```
plant-system/
├── ai_service/           
│   ├── app.py
│   ├── main.py
│   ├── requirements.txt
│   └── models/
├── app_client/                 
│   ├── App.js                  
│   ├── app.json
│   ├── package.json
│   ├── node_modules/
│   ├── .expo/
│   ├── assets/
│   └── src/
│       ├── hooks/
│       │   ├── useSensorPolling.js
│       │   └── useNotificationPermission.js
│       ├── services/
│       │   ├── plantService.js
│       │   └── exportService.js
│       ├── screens/
│       │   ├── SensorDashboard.js
│       │   ├── WateringHistory.js
│       │   └── Settings.js
│       ├── components/
│       │   └── SensorCard.js
│       ├── theme/
│       │   └── index.js
│       └── utils/
├── bin/                     # Server startup scripts
│   └── www
├── client/                  # Next.js frontend
│   ├── public/
│   ├── src/
│   │   ├── app/            # Next.js app directory
│   │   ├── components/     # React components
│   │   ├── i18n/          # Internationalization
│   │   ├── api/           # API client
│   │   └── utils/         # Utility functions
│   ├── package.json
│   └── next.config.mjs
├── config/                  # Configuration files
│   ├── db.js
│   ├── postgresql.js
│   └── vnpay.js
├── controllers/             # Route controllers (MVC)
│   ├── authController.js
│   ├── plantController.js
│   ├── dashboardController.js
│   ├── paymentController.js
│   └── ...
├── docs/                    # Documentation
│   ├── ENVIRONMENT_VARIABLES.md
│   ├── EMAIL_CONFIGURATION_GUIDE.md
│   └── DEPLOYMENT.md
├── middlewares/             # Express middlewares
│   ├── authMiddleware.js
│   └── errorHandler.js
├── models/                  # Data models
│   ├── User.js
│   ├── Plant.js
│   ├── Device.js
│   └── ...
├── routes/                  # API routes
│   ├── auth.js
│   ├── plants.js
│   └── ...
├── services/                # Business logic services
│   ├── emailService.js
│   ├── notificationService.js
│   └── ...
├── tests/                   # Test files
│   ├── controllers/
│   ├── models/
│   └── integration/
├── .env                     # Environment variables (not in git)
├── .env.example             # Example environment variables
├── app.js                   # Express app setup
├── docker-compose.yml       # Docker configuration
├── Dockerfile              # Docker image definition
├── jest.config.json        # Jest configuration
├── package.json            # Node.js dependencies
├── postgredb.sql           # Database schema
└── README.md               # This file
```

## 📚 API Documentation

### Authentication Endpoints

```
POST   /api/auth/register              - User registration
POST   /api/auth/login                 - User login
POST   /api/auth/logout                - User logout
POST   /api/auth/forgot-password       - Request password reset
POST   /api/auth/reset-password        - Reset password
GET    /api/auth/google/login          - Initiate Google OAuth
GET    /api/auth/google/callback       - Google OAuth callback
GET    /api/auth/me                    - Get current user
```

### Plant Management

```
GET    /api/plants                     - Get all user's plants
GET    /api/plants/:id                 - Get plant by ID
POST   /api/plants                     - Create new plant
PUT    /api/plants/:id                 - Update plant
DELETE /api/plants/:id                 - Delete plant
POST   /api/plants/:id/water           - Manual watering
GET    /api/plants/:id/history         - Get watering history
```

### Dashboard & Monitoring

```
GET    /api/dashboard                  - Get dashboard data
GET    /api/dashboard/summary          - Get summary statistics
GET    /api/sensor-data                - Get sensor data
GET    /api/notifications              - Get notifications
PUT    /api/notifications/:id/read     - Mark notification as read
```

### Payment (Premium Features)

```
GET    /api/payment/methods            - Get payment methods
POST   /api/payment/vnpay/create       - Create VNPay payment
GET    /api/payment/vnpay/return       - VNPay return URL
```

## 🔐 Authentication

The system supports two authentication methods:

### 1. JWT-based Authentication

- Email/password registration and login
- JWT tokens with 1-day expiration
- Secure password hashing with bcrypt
- Password reset via email

### 2. Google OAuth 2.0

- One-click Google sign-in
- Automatic account creation
- Secure state parameter for CSRF protection
- Session-based OAuth flow

For detailed authentication flow, see [docs/GOOGLE_OAUTH_CONFIGURATION.md](docs/GOOGLE_OAUTH_CONFIGURATION.md)

## 🚢 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment guide.


## 🐛 Troubleshooting

### Common Issues

**Database Connection Error**
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Test connection
psql -U username -d plant_monitoring_system
```

**Email Not Sending**
- Verify SMTP credentials in `.env`
- Check firewall settings for port 587
- See [docs/EMAIL_DEBUGGING_GUIDE.md](docs/EMAIL_DEBUGGING_GUIDE.md)

**Google OAuth Not Working**
- Verify redirect URIs in Google Console
- Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
- See [docs/GOOGLE_OAUTH_CONFIGURATION.md](docs/GOOGLE_OAUTH_CONFIGURATION.md)

**Frontend Build Errors**
```bash
# Clear cache and reinstall
cd client
rm -rf node_modules .next
npm install
npm run build
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

**SWP391 - Group 3**
- Frontend Development Team
- Backend Development Team
- IoT Integration Team
- AI/ML Development Team

## 📧 Contact

For questions or support, please contact:
- **GitHub Issues**: [Create an issue](https://github.com/FA25-SWP391-G4/SWP391-Plant-Monitoring-System/issues)

## 🙏 Acknowledgments

- Thanks to all contributors
- FPT University for project support
- Open source community for amazing tools and libraries

---

**Made with ❤️ by SWP391 Group 3**
