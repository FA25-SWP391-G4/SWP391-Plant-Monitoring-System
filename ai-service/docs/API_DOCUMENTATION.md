# AI Service API Documentation

## Overview
AI Service cung cấp các tính năng AI cho hệ thống Plant Monitoring, bao gồm Chatbot AI, Disease Detection, và Irrigation Prediction.

**Base URL**: `http://localhost:3001/api/ai`
**Authentication**: JWT Bearer Token (cho protected endpoints)

## Endpoints

### Chatbot AI

#### POST /api/ai/chatbot/message
Gửi tin nhắn đến AI chatbot chuyên về cây trồng.

**Request Body:**
```json
{
  "message": "string (required)",
  "userId": "number (required)",
  "plantId": "number (optional)",
  "sessionId": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "response": "string",
  "confidence": "number (0-1)",
  "sessionId": "string",
  "suggestedActions": ["string"],
  "relatedTopics": ["string"]
}
```

**MQTT Topics:**
- Request: `ai/chatbot/request/{userId}`
- Response: `ai/chatbot/response/{userId}`
- Typing: `ai/chatbot/typing/{userId}`

#### GET /api/ai/chatbot/history/:sessionId
Lấy lịch sử chat của một phiên.

**Response:**
```json
{
  "success": true,
  "messages": [
    {
      "id": "number",
      "message": "string",
      "response": "string",
      "timestamp": "ISO string",
      "confidence": "number"
    }
  ]
}
```

#### GET /api/ai/chatbot/sessions/:userId
Danh sách phiên chat của người dùng.

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "sessionId": "string",
      "lastMessage": "string",
      "timestamp": "ISO string",
      "messageCount": "number"
    }
  ]
}
```

### Disease Detection

#### POST /api/ai/disease/analyze
Phân tích ảnh để nhận diện bệnh cây.

**Request:** Multipart form-data
- `image`: File (JPEG, PNG, WebP, max 10MB)
- `plantId`: number (optional)
- `userId`: number (required)

**Response:**
```json
{
  "success": true,
  "analysisId": "number",
  "diseases": [
    {
      "name": "string",
      "confidence": "number (0-1)",
      "severity": "low|medium|high",
      "description": "string"
    }
  ],
  "treatments": [
    {
      "method": "string",
      "description": "string",
      "urgency": "low|medium|high"
    }
  ],
  "preventionTips": ["string"]
}
```

**MQTT Topics:**
- Analysis: `ai/disease/analysis/{plantId}`
- Alert: `ai/disease/alert/{plantId}`

#### GET /api/ai/disease/history/:plantId
Lịch sử phân tích bệnh của cây.

**Response:**
```json
{
  "success": true,
  "analyses": [
    {
      "id": "number",
      "diseases": ["object"],
      "confidence": "number",
      "timestamp": "ISO string",
      "imagePath": "string"
    }
  ]
}
```

### Irrigation Prediction

#### POST /api/ai/irrigation/predict/:plantId
Dự báo nhu cầu tưới nước cho cây.

**Request Body:**
```json
{
  "sensorData": {
    "soilMoisture": "number",
    "temperature": "number",
    "humidity": "number",
    "lightLevel": "number"
  },
  "weatherForecast": "object (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "prediction": {
    "shouldWater": "boolean",
    "hoursUntilWater": "number",
    "waterAmount": "number (ml)",
    "confidence": "number (0-1)",
    "reasoning": "string"
  },
  "recommendations": ["string"]
}
```

**MQTT Topics:**
- Prediction: `ai/irrigation/prediction/{plantId}`
- Recommendation: `ai/irrigation/recommendation/{plantId}`
- Alert: `ai/irrigation/alert/{plantId}`

#### POST /api/ai/irrigation/schedule/:plantId
Tạo lịch tưới thông minh.

**Request Body:**
```json
{
  "preferences": {
    "wateringTimes": ["string (HH:MM)"],
    "excludeDays": ["string"],
    "maxWaterPerDay": "number"
  }
}
```

**Response:**
```json
{
  "success": true,
  "schedule": [
    {
      "date": "ISO string",
      "time": "string (HH:MM)",
      "waterAmount": "number",
      "confidence": "number"
    }
  ]
}
```

### Health Check

#### GET /api/ai/health
Kiểm tra trạng thái hệ thống AI.

**Response:**
```json
{
  "status": "healthy|degraded|unhealthy",
  "services": {
    "openrouter": "connected|disconnected",
    "tensorflow": "loaded|error",
    "mqtt": "connected|disconnected",
    "database": "connected|disconnected"
  },
  "uptime": "number (seconds)",
  "version": "string"
}
```

## Error Responses

Tất cả endpoints trả về error theo format:

```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": "object (optional)"
  }
}
```

### Common Error Codes
- `AI_001`: AI Service Unavailable
- `AI_002`: Model Inference Failed
- `AI_003`: Insufficient Data
- `AI_004`: Image Processing Failed
- `AUTH_001`: Authentication Required
- `RATE_001`: Rate Limit Exceeded

## Rate Limiting
- 100 requests per minute per user
- 10 image uploads per minute per user
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## MQTT Integration

### Connection
- Broker: `mqtt://localhost:1883`
- Client ID: `ai-service-{timestamp}`
- Keep Alive: 60 seconds

### Topic Structure
```
ai/
├── chatbot/
│   ├── request/{userId}
│   ├── response/{userId}
│   └── typing/{userId}
├── disease/
│   ├── analysis/{plantId}
│   └── alert/{plantId}
├── irrigation/
│   ├── prediction/{plantId}
│   ├── recommendation/{plantId}
│   └── alert/{plantId}
└── system/
    ├── status
    └── model-update
```

## Authentication

Protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

Token should contain:
- `userId`: number
- `role`: string
- `exp`: expiration timestamp

## Examples

### Chatbot Example
```bash
curl -X POST http://localhost:3001/api/ai/chatbot/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "message": "Cây của tôi có lá vàng, phải làm sao?",
    "userId": 1,
    "plantId": 123
  }'
```

### Disease Detection Example
```bash
curl -X POST http://localhost:3001/api/ai/disease/analyze \
  -H "Authorization: Bearer <token>" \
  -F "image=@plant_leaf.jpg" \
  -F "userId=1" \
  -F "plantId=123"
```

### Irrigation Prediction Example
```bash
curl -X POST http://localhost:3001/api/ai/irrigation/predict/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "sensorData": {
      "soilMoisture": 45,
      "temperature": 28,
      "humidity": 65,
      "lightLevel": 800
    }
  }'
```