# AI Integration Design Document

## Overview

This design document outlines the comprehensive integration of three AI features into the existing Plant Monitoring System:

1. **AI Chatbot** - Using OpenRouter API with Mistral 7B Instruct model
2. **Watering Prediction** - ML-based irrigation forecasting 
3. **Plant Disease Recognition** - Computer vision for plant health analysis

The design leverages the existing Node.js/Express backend, Next.js frontend, and PostgreSQL database while adding AI processing capabilities directly within the Express backend using TensorFlow.js and OpenRouter API.

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────────────────────────┐
│   Next.js       │    │   Node.js Backend (Express)        │
│   Frontend      │◄──►│   ┌─────────────────────────────┐   │
│                 │    │   │  AI Processing Module       │   │
└─────────────────┘    │   │  - TensorFlow.js Models     │   │
         │              │   │  - OpenRouter Integration   │   │
         │              │   │  - Image Processing         │   │
         ▼              │   └─────────────────────────────┘   │
┌─────────────────┐    └─────────────────────────────────────┘
│   Browser       │                       │
│   Storage       │                       │
└─────────────────┘                       ▼
                            ┌─────────────────────────────────┐
                            │   External Services             │
                            │   ┌─────────────────────────┐   │
                            │   │  PostgreSQL Database    │   │
                            │   └─────────────────────────┘   │
                            │   ┌─────────────────────────┐   │
                            │   │  OpenRouter API         │   │
                            │   └─────────────────────────┘   │
                            └─────────────────────────────────┘
```

### Service Communication Flow

1. **Frontend → Backend**: REST API calls for AI features
2. **Backend AI Module**: Direct TensorFlow.js model inference
3. **Backend → OpenRouter**: API calls for chatbot functionality
4. **Backend → Database**: Store AI results and history

## Components and Interfaces

### 1. AI Chatbot Component

#### Frontend Component (`AIChatbot.jsx`)
- **Purpose**: Interactive chat interface for plant care assistance
- **Features**:
  - Real-time messaging interface
  - Conversation history
  - Plant context awareness
  - Typing indicators
  - Message persistence

#### Backend Integration (`/api/ai/chatbot`)
- **Endpoint**: `POST /api/ai/chatbot`
- **Authentication**: Required (JWT)
- **Request Format**:
```json
{
  "message": "How often should I water my tomato plant?",
  "plant_id": 123,
  "conversation_id": "uuid-string",
  "context": {
    "plant_type": "tomato",
    "current_moisture": 45,
    "last_watering": "2024-10-15T10:30:00Z"
  }
}
```

#### Backend AI Implementation
- **Model**: Mistral 7B Instruct via OpenRouter API
- **Integration**: Direct API calls from Express backend
- **Context Management**: Plant-specific knowledge injection
- **Response Processing**: Structured plant care advice

### 2. Watering Prediction Component

#### Frontend Component (`AIWateringPrediction.jsx`)
- **Purpose**: Display ML-based watering recommendations
- **Features**:
  - Prediction timeline (next 7 days)
  - Confidence indicators
  - Weather integration
  - Manual override options

#### Backend Integration (`/api/ai/watering-prediction`)
- **Endpoint**: `POST /api/ai/watering-prediction`
- **Request Format**:
```json
{
  "plant_id": 123,
  "sensor_data": {
    "moisture": 45,
    "temperature": 24.5,
    "humidity": 60,
    "light": 800
  }
}
```

#### ML Model Architecture
- **Framework**: TensorFlow.js for Node.js
- **Algorithm**: Neural Network (Dense layers)
- **Features**: 
  - Current sensor readings (moisture, temperature, humidity, light)
  - Historical sensor data (7-day window)
  - Plant type characteristics
  - Time-based patterns (hour of day, day of week)
- **Training Data**: Historical watering events + sensor readings
- **Output**: Watering recommendation with confidence scores
- **Model Format**: TensorFlow.js compatible (.json + .bin files)

### 3. Plant Disease Recognition Component

#### Frontend Component (`AIImageRecognition.jsx`)
- **Purpose**: Upload and analyze plant images for disease detection
- **Features**:
  - Image upload with preview
  - Real-time analysis progress
  - Disease identification results
  - Treatment recommendations
  - History of analyzed images

#### Backend Integration (`/api/ai/image-recognition`)
- **Endpoint**: `POST /api/ai/image-recognition`
- **File Upload**: Multer middleware for image processing
- **Request Format**: Multipart form data with image file

#### Computer Vision Pipeline
- **Framework**: TensorFlow.js for Node.js
- **Model**: MobileNetV2-based CNN optimized for local inference
- **Preprocessing**: 
  - Image resizing (224x224)
  - Normalization (0-1 range)
  - Sharp.js for image processing
- **Classes**: 10+ common plant diseases + healthy classification
- **Model Format**: TensorFlow.js compatible (.json + .bin files)
- **Output**: Disease probability scores + treatment suggestions

## Data Models

### Enhanced Database Schema

#### New Tables

```sql
-- AI Chat History
CREATE TABLE chat_history (
    chat_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    plant_id INTEGER REFERENCES plants(plant_id),
    conversation_id UUID DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    context JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI Predictions
CREATE TABLE ai_predictions (
    prediction_id SERIAL PRIMARY KEY,
    plant_id INTEGER REFERENCES plants(plant_id),
    prediction_type VARCHAR(50) NOT NULL, -- 'watering', 'disease', 'health'
    input_data JSONB NOT NULL,
    prediction_result JSONB NOT NULL,
    confidence_score DECIMAL(5,4),
    model_version VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Image Analysis History
CREATE TABLE image_analysis (
    analysis_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    plant_id INTEGER REFERENCES plants(plant_id),
    image_path VARCHAR(255) NOT NULL,
    analysis_result JSONB NOT NULL,
    disease_detected VARCHAR(100),
    confidence_score DECIMAL(5,4),
    treatment_suggestions TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Extended Existing Tables

```sql
-- Add AI preferences to users table
ALTER TABLE users ADD COLUMN ai_preferences JSONB DEFAULT '{}';

-- Add AI metadata to plants table  
ALTER TABLE plants ADD COLUMN ai_model_data JSONB DEFAULT '{}';
```

### API Response Formats

#### Chatbot Response
```json
{
  "success": true,
  "data": {
    "response": "Based on your tomato plant's current moisture level of 45%, I recommend watering in 2-3 days...",
    "conversation_id": "uuid-string",
    "suggestions": [
      "Check soil moisture daily",
      "Monitor for yellowing leaves"
    ],
    "confidence": 0.92
  }
}
```

#### Prediction Response
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "date": "2024-10-17",
        "should_water": true,
        "confidence": 0.87,
        "recommended_amount": 250,
        "reasoning": "Low moisture + high temperature forecast"
      }
    ],
    "model_version": "v1.2.0"
  }
}
```

#### Disease Recognition Response
```json
{
  "success": true,
  "data": {
    "disease_detected": "Early Blight",
    "confidence": 0.94,
    "severity": "moderate",
    "treatment_suggestions": [
      "Apply copper-based fungicide",
      "Improve air circulation",
      "Remove affected leaves"
    ],
    "prevention_tips": [
      "Water at soil level",
      "Avoid overhead watering"
    ]
  }
}
```

## Error Handling

### Frontend Error Management
- **Network Errors**: Retry mechanism with exponential backoff
- **API Errors**: User-friendly error messages
- **Image Upload Errors**: File size/format validation
- **Offline Support**: Cache recent predictions and conversations

### Backend Error Handling
- **AI Service Unavailable**: Fallback to cached responses
- **Model Loading Errors**: Graceful degradation
- **Rate Limiting**: OpenRouter API quota management
- **Database Errors**: Transaction rollback and logging

### AI Service Error Handling
- **Model Inference Errors**: Default predictions with low confidence
- **OpenRouter API Errors**: Retry with exponential backoff
- **Image Processing Errors**: Format validation and preprocessing fallbacks

## Testing Strategy

### Unit Testing
- **Frontend Components**: Jest + React Testing Library
- **Backend APIs**: Jest + Supertest
- **AI Module**: Jest with TensorFlow.js mocking
- **Database Models**: PostgreSQL test database

### Integration Testing
- **API Integration**: End-to-end API flow testing
- **AI Model Testing**: Prediction accuracy validation
- **Image Processing**: Sample image analysis verification

### Performance Testing
- **Response Time**: < 3s for predictions, < 5s for image analysis
- **Concurrent Users**: Support 50+ simultaneous AI requests
- **Memory Usage**: Monitor ML model memory consumption

### Security Testing
- **Input Validation**: Prevent injection attacks
- **File Upload Security**: Image format validation
- **API Rate Limiting**: Prevent abuse
- **Data Privacy**: Ensure user data protection

## Deployment Configuration

### Environment Variables
```env
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# AI Model Configuration
WATERING_MODEL_PATH=./ai_models/watering_prediction
DISEASE_MODEL_PATH=./ai_models/disease_recognition

# Image Storage
IMAGE_UPLOAD_PATH=./uploads/images
MAX_IMAGE_SIZE=10485760  # 10MB

# TensorFlow.js Configuration
TFJS_BACKEND=cpu
TFJS_PLATFORM=node
```

### Package Dependencies
```json
{
  "dependencies": {
    "@tensorflow/tfjs-node": "^4.10.0",
    "sharp": "^0.32.0",
    "axios": "^1.12.2",
    "multer": "^2.0.2"
  }
}
```

### Local Development Setup
1. **Node.js Environment**: Node.js 18+ with npm
2. **Dependencies**: TensorFlow.js Node, Sharp for image processing
3. **Model Storage**: Local filesystem in `./ai_models/` directory
4. **API Keys**: Development OpenRouter account
5. **TensorFlow.js**: CPU backend for local inference

## Performance Considerations

### Optimization Strategies
- **Model Caching**: Keep loaded TensorFlow.js models in memory
- **Response Caching**: Cache frequent predictions for 1 hour
- **Image Compression**: Sharp.js for optimized image processing
- **Async Processing**: Non-blocking AI inference with async/await

### Scalability Planning
- **Memory Management**: Efficient TensorFlow.js model loading
- **CPU Optimization**: Use TensorFlow.js CPU backend optimizations
- **Model Versioning**: Support multiple model versions in filesystem
- **Caching Strategy**: In-memory caching for frequently used models

### Monitoring and Metrics
- **Response Times**: Track AI service performance
- **Accuracy Metrics**: Monitor prediction quality
- **Usage Analytics**: Track feature adoption
- **Error Rates**: Monitor and alert on failures

## Security and Privacy

### Data Protection
- **Image Storage**: Secure file storage with access controls
- **Conversation Privacy**: Encrypt chat history
- **Model Security**: Protect proprietary ML models
- **API Security**: Rate limiting and authentication

### Compliance Considerations
- **Data Retention**: Configurable retention policies
- **User Consent**: Clear AI feature opt-in/opt-out
- **Data Export**: Allow users to export their AI data
- **Audit Logging**: Track AI feature usage for compliance