# Shared Resources Architecture

This document explains how shared resources are organized between the main application and AI service.

## 📁 Directory Structure

```
Project Root/
├── ai_models/                    # Shared AI Models
│   ├── config.json              # Model configuration
│   ├── watering_prediction/     # Watering prediction model
│   │   ├── README.md
│   │   ├── model.json           # (to be added)
│   │   ├── weights.bin          # (to be added)
│   │   └── classes.json         # (to be added)
│   └── disease_recognition/     # Disease recognition model
│       ├── README.md
│       ├── model.json           # (to be added)
│       ├── weights.bin          # (to be added)
│       └── classes.json         # (to be added)
├── uploads/                     # Shared File Storage
│   └── images/                  # Permanent image storage
├── ai_service/                  # AI Microservice
│   ├── temp/images/             # Temporary processing
│   ├── uploads/images/          # Local processing cache
│   └── ...
└── main app files...
```

## 🔄 Resource Flow

### **AI Models:**
1. **Storage**: `ai_models/` (project root)
2. **Access**: Both main app and AI service can read
3. **Management**: Centralized model versioning and updates

### **Image Processing:**
1. **Upload**: Main app receives image uploads
2. **Processing**: AI service processes in `ai_service/temp/images/`
3. **Storage**: Permanent storage in `uploads/images/` (project root)
4. **Cleanup**: Temporary files removed after processing

## ⚙️ Environment Configuration

### **Main App (.env):**
```env
# AI Service Configuration
AI_SERVICE_URL=http://localhost:8000

# Shared Resources
SHARED_AI_MODELS_PATH=./ai_models
SHARED_UPLOADS_PATH=./uploads
```

### **AI Service (.env):**
```env
# AI Model Configuration (shared resources)
WATERING_MODEL_PATH=../ai_models/watering_prediction
DISEASE_MODEL_PATH=../ai_models/disease_recognition
AI_CONFIG_PATH=../ai_models/config.json

# Image Storage Configuration
IMAGE_UPLOAD_PATH=./uploads/images          # Local cache
IMAGE_PROCESSING_TEMP=./temp/images         # Temporary processing
SHARED_IMAGE_STORAGE=../uploads/images      # Permanent shared storage
```

## 🔒 Benefits

1. **No Duplication**: Single source of truth for models and images
2. **Consistency**: Same models used by both services
3. **Efficiency**: No need to sync data between services
4. **Scalability**: Easy to add more AI services sharing same resources
5. **Maintenance**: Centralized model updates and storage management

## 🚀 Usage

### **Starting Services:**
```bash
# Use the provided script
start-with-ai-service.bat

# Or manually:
cd ai_service && npm start  # Port 8000
npm start                   # Port 3000 (main app)
```

### **Model Updates:**
1. Place new model files in `ai_models/[model_type]/`
2. Update `ai_models/config.json` if needed
3. Restart AI service to load new models

### **Image Access:**
- **Main App**: Direct access to `uploads/images/`
- **AI Service**: Processes in temp, stores in shared location
- **Frontend**: Serves images from `uploads/images/` via main app