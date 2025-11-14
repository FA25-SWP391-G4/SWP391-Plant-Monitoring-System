# Environment Variables Documentation

This document provides a comprehensive list of all environment variables used in the Plant Monitoring System. All hardcoded values have been removed from the codebase and replaced with environment variables.

## Database Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://username:password@localhost:5432/plant_system` |

## Server Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `3010` |
| `NODE_ENV` | Node environment | `development`, `production` |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:3000` |

## Authentication & Security

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT token generation | `your-secret-key` |
| `JWT_EXPIRES_IN` | JWT token expiration time | `1h` |
| `REFRESH_TOKEN_SECRET` | Secret for refresh tokens | `refresh-secret-key` |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiration | `7d` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `your-client-id.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `your-client-secret` |

## Email Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_HOST` | SMTP server host | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP server port | `587` |
| `EMAIL_USER` | SMTP username | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | SMTP password or app password | `your-app-password` |
| `EMAIL_FROM` | Email sender address | `no-reply@plantsystem.com` |

## Next.js Frontend

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3010` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google client ID for frontend | `your-client-id.apps.googleusercontent.com` |

## VNPay Payment Gateway

| Variable | Description | Example |
|----------|-------------|---------|
| `VNPAY_TMN_CODE` | VNPay terminal ID | `CGW7KJK7` |
| `VNPAY_HASH_SECRET` | VNPay hash secret | `VGTLQQIUPSSO4ERSSAMGVFS5RRSGBEHT` |
| `VNPAY_URL` | VNPay payment URL | `https://sandbox.vnpayment.vn/paymentv2/vpcpay.html` |
| `VNPAY_RETURN_URL` | Return URL after payment | `http://localhost:3010/payment/vnpay-return` |
| `VNPAY_IPN_URL` | Instant Payment Notification URL | `http://localhost:3010/payment/vnpay-ipn` |

## AI Service

| Variable | Description | Example |
|----------|-------------|---------|
| `AI_SERVICE_URL` | AI microservice URL | `http://localhost:5000` |
| `AI_MODEL_VERSION` | Version of AI model to use | `v1.0.0` |

## IoT Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `MQTT_BROKER_URL` | MQTT broker URL | `mqtt://localhost:1883` |
| `MQTT_USERNAME` | MQTT broker username | `mqtt-user` |
| `MQTT_PASSWORD` | MQTT broker password | `mqtt-password` |
| `MQTT_CLIENT_ID` | MQTT client identifier | `plant-system-server` |

## Development & Debug

| Variable | Description | Example |
|----------|-------------|---------|
| `DEBUG` | Debug output level | `plant-system:*` |
| `LOG_LEVEL` | Application logging level | `info` |

## Example .env File

```env
# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/plant_system

# Server Configuration
PORT=3010
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Authentication & Security
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=refresh-token-secret-key
REFRESH_TOKEN_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=no-reply@plantsystem.com

# Next.js Frontend
NEXT_PUBLIC_API_URL=http://localhost:3010
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# VNPay Payment Gateway
VNPAY_TMN_CODE=your-terminal-id
VNPAY_HASH_SECRET=your-hash-secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:3010/payment/vnpay-return
VNPAY_IPN_URL=http://localhost:3010/payment/vnpay-ipn

# AI Service
AI_SERVICE_URL=http://localhost:5000
AI_MODEL_VERSION=v1.0.0

# IoT Configuration
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=mqtt-user
MQTT_PASSWORD=mqtt-password
MQTT_CLIENT_ID=plant-system-server

# Development & Debug
DEBUG=plant-system:*
LOG_LEVEL=info
```

## Best Practices

1. **Never commit .env files** to version control
2. Use `.env.example` as a template for required variables
3. Always validate environment variables on application startup
4. Use default values only for non-sensitive development settings
5. Use different environment variables for different environments (dev/staging/prod)