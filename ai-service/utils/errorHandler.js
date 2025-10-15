const winston = require('winston');
const path = require('path');

// Tạo logger với Winston
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ai-service' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/error.log'), 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs to console in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Error categories theo design document
const ERROR_CATEGORIES = {
  AI_SERVICE_UNAVAILABLE: {
    code: 'AI_001',
    message: 'Dịch vụ AI tạm thời không khả dụng',
    statusCode: 503,
    fallback: true,
    retryable: true
  },
  MODEL_INFERENCE_FAILED: {
    code: 'AI_002', 
    message: 'Không thể phân tích dữ liệu',
    statusCode: 500,
    fallback: true,
    retryable: false
  },
  INSUFFICIENT_DATA: {
    code: 'AI_003',
    message: 'Không đủ dữ liệu để phân tích chính xác',
    statusCode: 400,
    fallback: false,
    retryable: false
  },
  IMAGE_PROCESSING_FAILED: {
    code: 'AI_004',
    message: 'Không thể xử lý ảnh',
    statusCode: 400,
    fallback: false,
    retryable: false
  },
  VALIDATION_ERROR: {
    code: 'AI_005',
    message: 'Dữ liệu đầu vào không hợp lệ',
    statusCode: 400,
    fallback: false,
    retryable: false
  },
  RATE_LIMIT_EXCEEDED: {
    code: 'AI_006',
    message: 'Đã vượt quá giới hạn số lượng yêu cầu',
    statusCode: 429,
    fallback: false,
    retryable: true
  },
  AUTHENTICATION_FAILED: {
    code: 'AI_007',
    message: 'Xác thực không thành công',
    statusCode: 401,
    fallback: false,
    retryable: false
  },
  AUTHORIZATION_FAILED: {
    code: 'AI_008',
    message: 'Không có quyền truy cập',
    statusCode: 403,
    fallback: false,
    retryable: false
  },
  DATABASE_ERROR: {
    code: 'AI_009',
    message: 'Lỗi cơ sở dữ liệu',
    statusCode: 500,
    fallback: true,
    retryable: true
  },
  EXTERNAL_API_ERROR: {
    code: 'AI_010',
    message: 'Lỗi API bên ngoài',
    statusCode: 502,
    fallback: true,
    retryable: true
  }
};

// Custom Error Classes
class AIServiceError extends Error {
  constructor(category, details = {}, originalError = null) {
    const errorInfo = ERROR_CATEGORIES[category] || ERROR_CATEGORIES.MODEL_INFERENCE_FAILED;
    
    super(errorInfo.message);
    this.name = 'AIServiceError';
    this.code = errorInfo.code;
    this.category = category;
    this.statusCode = errorInfo.statusCode;
    this.fallback = errorInfo.fallback;
    this.retryable = errorInfo.retryable;
    this.details = details;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    Error.captureStackTrace(this, AIServiceError);
  }
}

// Fallback response generators
const FallbackResponses = {
  chatbot: {
    general: {
      success: false,
      response: "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc liên hệ chuyên gia về cây trồng để được hỗ trợ tốt nhất.",
      fallback: true,
      suggestions: [
        "Kiểm tra độ ẩm đất bằng cách nhúng ngón tay xuống đất 2-3cm",
        "Quan sát lá cây để phát hiện dấu hiệu bất thường",
        "Đảm bảo cây nhận đủ ánh sáng phù hợp với loại cây"
      ]
    },
    plantCare: {
      success: false,
      response: "Hiện tại tôi không thể phân tích chi tiết, nhưng đây là một số lời khuyên cơ bản về chăm sóc cây:",
      fallback: true,
      basicTips: [
        "Tưới nước khi đất khô, tránh tưới quá nhiều",
        "Đặt cây ở nơi có ánh sáng phù hợp",
        "Kiểm tra sâu bệnh thường xuyên",
        "Bón phân định kỳ theo loại cây"
      ]
    }
  },
  
  diseaseDetection: {
    general: {
      success: false,
      message: "Không thể phân tích ảnh lúc này. Vui lòng thử lại với ảnh rõ nét hơn hoặc liên hệ chuyên gia.",
      fallback: true,
      recommendations: [
        "Chụp ảnh lá trong điều kiện ánh sáng tốt",
        "Đảm bảo lá cây chiếm phần lớn khung hình",
        "Tránh chụp ảnh mờ hoặc quá tối",
        "Nếu nghi ngờ có bệnh, hãy tách cây khỏi các cây khác"
      ]
    }
  },
  
  irrigationPrediction: {
    general: {
      success: false,
      message: "Không thể tính toán dự báo tưới nước. Áp dụng quy tắc cơ bản:",
      fallback: true,
      basicRules: [
        "Kiểm tra độ ẩm đất bằng tay",
        "Tưới khi đất khô ở độ sâu 2-3cm",
        "Tưới vào buổi sáng sớm hoặc chiều mát",
        "Điều chỉnh theo thời tiết và mùa"
      ]
    }
  }
};

// Graceful degradation strategies
const GracefulDegradation = {
  // Chatbot fallback to rule-based responses
  chatbotFallback: (userMessage, context = {}) => {
    logger.warn('Chatbot falling back to rule-based response', { 
      userMessage: userMessage.substring(0, 100),
      context 
    });
    
    const message = userMessage.toLowerCase();
    
    // Plant care keywords
    if (message.includes('tưới') || message.includes('nước')) {
      return {
        ...FallbackResponses.chatbot.plantCare,
        response: "Về việc tưới nước: " + FallbackResponses.chatbot.plantCare.response,
        specificTips: [
          "Kiểm tra độ ẩm đất trước khi tưới",
          "Tưới từ từ để nước thấm đều",
          "Tránh tưới lên lá để phòng bệnh"
        ]
      };
    }
    
    if (message.includes('bệnh') || message.includes('vàng') || message.includes('héo')) {
      return {
        ...FallbackResponses.chatbot.plantCare,
        response: "Về vấn đề sức khỏe cây: " + FallbackResponses.chatbot.plantCare.response,
        specificTips: [
          "Kiểm tra lá có đốm bất thường không",
          "Cách ly cây nếu nghi ngờ có bệnh",
          "Cải thiện thông gió xung quanh cây"
        ]
      };
    }
    
    return FallbackResponses.chatbot.general;
  },
  
  // Disease detection fallback to basic validation
  diseaseDetectionFallback: (imageInfo = {}) => {
    logger.warn('Disease detection falling back to basic validation', { imageInfo });
    
    return {
      ...FallbackResponses.diseaseDetection.general,
      imageValidation: {
        isValid: true,
        suggestions: [
          "Ảnh nên chụp trong điều kiện ánh sáng tự nhiên",
          "Lá cây nên chiếm ít nhất 70% khung hình",
          "Tránh chụp ảnh có bóng đổ hoặc phản quang"
        ]
      }
    };
  },
  
  // Irrigation prediction fallback to sensor-based rules
  irrigationPredictionFallback: (sensorData = {}) => {
    logger.warn('Irrigation prediction falling back to rule-based system', { sensorData });
    
    const { soilMoisture = 50, temperature = 25, humidity = 60 } = sensorData;
    
    let shouldWater = false;
    let reason = "Dựa trên quy tắc cơ bản";
    
    if (soilMoisture < 30) {
      shouldWater = true;
      reason = "Độ ẩm đất thấp";
    } else if (soilMoisture < 40 && temperature > 30) {
      shouldWater = true;
      reason = "Độ ẩm đất thấp và nhiệt độ cao";
    }
    
    return {
      ...FallbackResponses.irrigationPrediction.general,
      prediction: {
        shouldWater,
        confidence: 0.6,
        reason,
        sensorBased: true,
        recommendations: shouldWater ? 
          ["Tưới nước nhẹ nhàng", "Kiểm tra lại sau 2-3 giờ"] :
          ["Tiếp tục theo dõi", "Kiểm tra lại sau 6-8 giờ"]
      }
    };
  }
};

// Error logging function
const logError = (error, context = {}) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    code: error.code || 'UNKNOWN',
    category: error.category || 'UNKNOWN',
    statusCode: error.statusCode || 500,
    timestamp: new Date().toISOString(),
    context
  };
  
  if (error.statusCode >= 500) {
    logger.error('Server Error', errorData);
  } else if (error.statusCode >= 400) {
    logger.warn('Client Error', errorData);
  } else {
    logger.info('Error Info', errorData);
  }
};

// Express error handler middleware
const errorHandlerMiddleware = (err, req, res, next) => {
  // Log the error
  logError(err, {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  // Handle AIServiceError
  if (err instanceof AIServiceError) {
    const response = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        category: err.category,
        retryable: err.retryable,
        timestamp: err.timestamp
      }
    };
    
    // Add fallback response if available
    if (err.fallback) {
      const endpoint = req.originalUrl.split('/').pop();
      
      if (endpoint.includes('chatbot')) {
        response.fallback = GracefulDegradation.chatbotFallback(
          req.body.message || '', 
          req.body
        );
      } else if (endpoint.includes('disease')) {
        response.fallback = GracefulDegradation.diseaseDetectionFallback(
          req.file || {}
        );
      } else if (endpoint.includes('irrigation')) {
        response.fallback = GracefulDegradation.irrigationPredictionFallback(
          req.body.sensorData || {}
        );
      }
    }
    
    // Add details for development
    if (process.env.NODE_ENV === 'development' && err.details) {
      response.error.details = err.details;
    }
    
    return res.status(err.statusCode).json(response);
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'AI_005',
        message: 'Dữ liệu đầu vào không hợp lệ',
        details: err.message
      }
    });
  }
  
  // Handle multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'AI_004',
        message: 'File quá lớn. Kích thước tối đa là 10MB'
      }
    });
  }
  
  // Handle database errors
  if (err.code && err.code.startsWith('23')) { // PostgreSQL error codes
    return res.status(500).json({
      success: false,
      error: {
        code: 'AI_009',
        message: 'Lỗi cơ sở dữ liệu',
        retryable: true
      }
    });
  }
  
  // Default error handler
  const response = {
    success: false,
    error: {
      code: 'AI_002',
      message: 'Đã xảy ra lỗi không xác định',
      retryable: false,
      timestamp: new Date().toISOString()
    }
  };
  
  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack;
  }
  
  res.status(500).json(response);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Retry mechanism for external API calls
const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger.warn(`Retry attempt ${attempt} failed, retrying in ${delay}ms`, {
        error: error.message,
        attempt,
        maxRetries
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

module.exports = {
  logger,
  ERROR_CATEGORIES,
  AIServiceError,
  FallbackResponses,
  GracefulDegradation,
  logError,
  errorHandlerMiddleware,
  asyncHandler,
  retryWithBackoff
};