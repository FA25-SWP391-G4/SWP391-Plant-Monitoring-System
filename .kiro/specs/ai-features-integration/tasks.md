# Implementation Plan

- [x] 1. Setup Core Infrastructure và Database Schema






  - Tạo enhanced database schema cho AI features (ai_analyses, ai_feedback, plant_disease_images, ai_models)
  - Cập nhật chat_histories table với các cột mới (session_id, plant_context, ai_confidence, topic_category)
  - Setup database indexes cho performance optimization
  - Cấu hình MQTT client integration trong AI service
  - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2_

- [x] 2. Implement Chatbot AI với OpenRouter Integration





  - [x] 2.1 Setup OpenRouter API integration với Mistral 7B


    - Cấu hình OpenRouter API client với error handling và retry logic
    - Implement fallback system khi API không khả dụng
    - Tạo system prompt chuyên về cây trồng với scope limitation
    - _Requirements: 1.1, 1.3, 4.4_

  - [x] 2.2 Implement chatbot controller với Express.js


    - Tạo POST /api/ai/chatbot/message endpoint
    - Implement context management với sensor data và plant info
    - Tích hợp MQTT real-time responses và typing indicators
    - Xử lý session management và conversation history
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [x] 2.3 Implement content filtering và scope restriction


    - Tạo logic từ chối câu hỏi không liên quan đến cây trồng
    - Implement plant-specific guidance và recommendations
    - Tích hợp với disease detection feature suggestions
    - _Requirements: 1.3, 1.6_

  - [x] 2.4 Write unit tests cho chatbot functionality






    - Test plant-related question responses
    - Test non-plant question rejection
    - Test context integration với sensor data
    - Test MQTT integration và real-time responses
    - _Requirements: 1.1, 1.3, 4.2_

- [x] 3. Implement Disease Detection với TensorFlow.js





  - [x] 3.1 Setup TensorFlow.js model và image processing pipeline


    - Cấu hình MobileNetV2 base model cho plant disease detection
    - Implement image preprocessing (resize, normalize, augmentation)
    - Setup supported diseases classification system
    - _Requirements: 3.1, 3.2_

  - [x] 3.2 Implement content validation và plant detection


    - Tạo plant detection model để validate ảnh chứa cây/lá
    - Implement technical validation (file type, size, format)
    - Tạo logic từ chối ảnh không liên quan đến cây trồng
    - _Requirements: 3.3, 3.4_

  - [x] 3.3 Create disease detection Express.js endpoints


    - Implement POST /api/ai/disease/analyze với multer file upload
    - Tạo GET /api/ai/disease/history/:plantId endpoint
    - Implement treatment recommendations system
    - Tích hợp MQTT real-time analysis results
    - _Requirements: 3.1, 3.2, 3.5_

  - [x] 3.4 Implement image storage và analysis logging


    - Setup secure image storage với encryption
    - Implement analysis results logging trong database
    - Tạo feedback system cho user accuracy confirmation
    - _Requirements: 5.1, 5.4_

  - [x] 3.5 Write unit tests cho disease detection






    - Test image validation và plant detection
    - Test disease classification accuracy
    - Test content filtering và rejection logic
    - Test MQTT integration cho real-time results
    - _Requirements: 3.1, 3.3, 3.4_

- [x] 4. Implement Irrigation Prediction với ML Model





  - [x] 4.1 Develop ML prediction model với TensorFlow.js


    - Tạo irrigation prediction model với sensor data inputs
    - Implement feature engineering cho environmental factors
    - Setup plant-specific prediction algorithms
    - _Requirements: 2.1, 2.5_

  - [x] 4.2 Create irrigation prediction Express.js endpoints


    - Implement POST /api/ai/irrigation/predict/:plantId
    - Tạo intelligent scheduling system
    - Implement weather forecast integration
    - Setup confidence scoring và explanation system
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 4.3 Implement MQTT real-time irrigation alerts


    - Setup sensor data monitoring qua MQTT
    - Implement urgent watering alerts với high confidence
    - Tạo prediction publishing system
    - Tích hợp với existing irrigation system
    - _Requirements: 2.3, 4.1_

  - [x] 4.4 Implement caching và performance optimization


    - Setup Redis caching cho prediction results
    - Implement model optimization và quantization
    - Tạo batch processing cho multiple predictions
    - _Requirements: 4.1, 4.5_

  - [x] 4.5 Write unit tests cho irrigation prediction






    - Test prediction accuracy với mock sensor data
    - Test weather integration và schedule adjustment
    - Test MQTT alerts và real-time updates
    - Test caching và performance optimization
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 5. Implement Security và Error Handling





  - [x] 5.1 Setup comprehensive error handling system


    - Implement graceful degradation strategies
    - Tạo fallback responses cho AI service failures
    - Setup detailed logging với Winston
    - Implement user-friendly error messages
    - _Requirements: 4.2, 4.4_

  - [x] 5.2 Implement security measures


    - Setup rate limiting cho AI endpoints (100 requests/minute)
    - Implement input validation và sanitization
    - Tạo JWT authentication cho protected endpoints
    - Setup CORS configuration cho frontend domains
    - _Requirements: 5.2, 5.5_

  - [x] 5.3 Implement data protection và privacy


    - Setup image encryption và secure storage
    - Implement chat history encryption
    - Tạo data retention policies
    - Setup user data deletion functionality
    - _Requirements: 5.1, 5.3, 5.4_

  - [x] 5.4 Write security và error handling tests






    - Test rate limiting và authentication
    - Test error handling và fallback systems
    - Test data encryption và privacy measures
            - Test input validation và sanitization
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 6. Create Frontend Components với Next.js




  - [x] 6.1 Build AI Chat Interface component





    - Tạo responsive chat UI với typing indicators
    - Implement MQTT real-time message updates
    - Tích hợp sensor data display trong chat context
    - Setup conversation history và session management
    - _Requirements: 1.1, 1.2, 1.5_

  - [x] 6.2 Create Disease Detection UI component





    - Build image upload interface với drag-and-drop
    - Implement real-time analysis progress indicators
    - Tạo disease results display với treatment recommendations
    - Setup analysis history và feedback system
    - _Requirements: 3.1, 3.2, 3.5_

  - [x] 6.3 Build Irrigation Prediction Dashboard





    - Tạo prediction visualization với charts
    - Implement real-time MQTT updates display
    - Build scheduling interface với calendar integration
    - Setup alert notifications và recommendations
    - _Requirements: 2.1, 2.4, 2.3_

  - [x] 6.4 Implement MQTT client integration trong frontend


    - Setup MQTT client cho real-time updates
    - Implement topic subscription management
    - Tạo connection status indicators
    - Setup automatic reconnection logic
    - _Requirements: 4.1, 1.1, 2.3, 3.1_

- [x] 7. Integration Testing và Performance Optimization




  - [x] 7.1 Implement end-to-end testing





    - Test complete AI workflows từ frontend đến backend
    - Test MQTT real-time communication
    - Test database operations và data consistency
    - Test file upload và image processing pipeline
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 7.2 Performance optimization và caching





    - Implement Redis caching strategies
    - Setup model lazy loading và optimization
    - Optimize database queries với proper indexing
    - Implement WebWorker cho heavy computations
    - _Requirements: 4.1, 4.5_

  - [x] 7.3 Setup monitoring và analytics


    - Implement key metrics tracking (response time, accuracy, user satisfaction)
    - Setup structured logging với Winston
    - Tạo AI inference logging cho model improvement
    - Implement user interaction analytics
    - _Requirements: 4.2, 4.5_

  - [x] 7.4 Comprehensive system testing






    - Load testing với 100 concurrent users
    - Performance testing cho response times
    - Memory usage monitoring và optimization
    - User acceptance testing với real data
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 8. Final Integration và Deployment Preparation




  - [x] 8.1 Complete system integration





    - Tích hợp tất cả AI components với main application
    - Test cross-service communication
    - Verify MQTT broker configuration
    - Setup production environment variables
    - _Requirements: 4.3, 4.5_

  - [x] 8.2 Documentation và deployment setup


    - Tạo API documentation cho AI endpoints
    - Setup Docker Compose configuration
    - Implement health check endpoints
    - Tạo deployment scripts và monitoring setup
    - _Requirements: 4.2, 4.5_

  - [x] 8.3 Final testing và quality assurance


    - Complete security audit
    - Final performance optimization
    - User acceptance testing
    - Production readiness checklist
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2_