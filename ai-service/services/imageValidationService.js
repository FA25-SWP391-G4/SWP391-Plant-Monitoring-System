const tf = require('@tensorflow/tfjs-node');
const sharp = require('sharp');
const path = require('path');

/**
 * Image Validation Service
 * Validates images for plant content and technical requirements
 */
class ImageValidationService {
  constructor() {
    this.plantDetectionModel = null;
    this.isModelLoaded = false;
    
    // Technical validation parameters
    this.allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.minFileSize = 1024; // 1KB
    this.minDimensions = { width: 100, height: 100 };
    this.maxDimensions = { width: 4096, height: 4096 };
    
    // Plant detection parameters
    this.plantConfidenceThreshold = 0.6;
    this.rejectedCategories = [
      'person', 'people', 'human', 'face',
      'animal', 'cat', 'dog', 'bird',
      'food', 'meal', 'dish',
      'building', 'house', 'car', 'vehicle',
      'furniture', 'chair', 'table',
      'electronics', 'phone', 'computer',
      'sky', 'cloud', 'landscape'
    ];
  }

  /**
   * Khởi tạo plant detection model
   */
  async initializeModel() {
    try {
      console.log('Initializing plant detection model...');
      
      // Tạo demo model cho plant detection
      this.plantDetectionModel = await this.createPlantDetectionModel();
      this.isModelLoaded = true;
      
      console.log('Plant detection model loaded successfully');
      return true;
    } catch (error) {
      console.error('Error initializing plant detection model:', error);
      this.isModelLoaded = false;
      return false;
    }
  }

  /**
   * Tạo demo plant detection model
   */
  async createPlantDetectionModel() {
    // Tạo model đơn giản để detect plant/non-plant
    const model = tf.sequential({
      layers: [
        tf.layers.conv2d({
          inputShape: [224, 224, 3],
          filters: 16,
          kernelSize: 3,
          activation: 'relu'
        }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.conv2d({ filters: 32, kernelSize: 3, activation: 'relu' }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 2, activation: 'softmax' }) // plant vs non-plant
      ]
    });

    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Validate technical requirements của file
   */
  async validateTechnical(file) {
    const errors = [];

    // Check file existence
    if (!file) {
      errors.push('Không có file được tải lên');
      return { isValid: false, errors };
    }

    // Check MIME type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      errors.push(`Chỉ chấp nhận file ảnh (${this.allowedMimeTypes.join(', ')})`);
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push(`Kích thước file không được vượt quá ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    if (file.size < this.minFileSize) {
      errors.push('File quá nhỏ, có thể bị lỗi');
    }

    // Check image dimensions if buffer is available
    if (file.buffer) {
      try {
        const metadata = await sharp(file.buffer).metadata();
        
        if (metadata.width < this.minDimensions.width || metadata.height < this.minDimensions.height) {
          errors.push(`Ảnh quá nhỏ. Kích thước tối thiểu: ${this.minDimensions.width}x${this.minDimensions.height}px`);
        }

        if (metadata.width > this.maxDimensions.width || metadata.height > this.maxDimensions.height) {
          errors.push(`Ảnh quá lớn. Kích thước tối đa: ${this.maxDimensions.width}x${this.maxDimensions.height}px`);
        }

        // Check if image is corrupted
        if (!metadata.format) {
          errors.push('File ảnh bị lỗi hoặc không đúng định dạng');
        }
      } catch (error) {
        errors.push('Không thể đọc thông tin ảnh. File có thể bị lỗi.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Detect plant content trong ảnh
   */
  async validatePlantContent(imageBuffer) {
    try {
      if (!this.isModelLoaded) {
        await this.initializeModel();
      }

      if (!this.plantDetectionModel) {
        // Fallback: basic validation without ML
        return await this.basicPlantValidation(imageBuffer);
      }

      // Preprocess image
      const imageTensor = await this.preprocessForPlantDetection(imageBuffer);

      // Model prediction
      const predictions = await this.plantDetectionModel.predict(imageTensor);
      const predictionData = await predictions.data();

      // Process results
      const plantProbability = predictionData[1]; // Index 1 for plant class
      const isPlant = plantProbability > this.plantConfidenceThreshold;

      // Cleanup
      imageTensor.dispose();
      predictions.dispose();

      return {
        isPlant,
        confidence: Math.round(plantProbability * 100) / 100,
        message: isPlant 
          ? 'Ảnh chứa cây hoặc lá cây' 
          : 'Ảnh không chứa cây hoặc lá cây rõ ràng'
      };
    } catch (error) {
      console.error('Error in plant content validation:', error);
      // Fallback to basic validation
      return await this.basicPlantValidation(imageBuffer);
    }
  }

  /**
   * Basic plant validation without ML (fallback)
   */
  async basicPlantValidation(imageBuffer) {
    try {
      // Analyze image colors for green content (basic heuristic)
      const { dominant } = await sharp(imageBuffer)
        .resize(100, 100)
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Simple green detection heuristic
      const greenPixels = this.countGreenPixels(dominant.data);
      const totalPixels = 100 * 100;
      const greenRatio = greenPixels / totalPixels;

      const isPlant = greenRatio > 0.1; // At least 10% green pixels

      return {
        isPlant,
        confidence: Math.min(greenRatio * 2, 0.8), // Cap at 0.8 for basic detection
        message: isPlant 
          ? 'Ảnh có thể chứa cây (phát hiện màu xanh lá)' 
          : 'Ảnh không có đủ màu xanh lá để xác định là cây'
      };
    } catch (error) {
      console.error('Error in basic plant validation:', error);
      return {
        isPlant: true, // Default to true if can't validate
        confidence: 0.5,
        message: 'Không thể xác định nội dung ảnh, cho phép xử lý'
      };
    }
  }

  /**
   * Count green pixels in image data
   */
  countGreenPixels(imageData) {
    let greenPixels = 0;
    
    for (let i = 0; i < imageData.length; i += 3) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      
      // Check if pixel is greenish
      if (g > r && g > b && g > 50) {
        greenPixels++;
      }
    }
    
    return greenPixels;
  }

  /**
   * Preprocess image cho plant detection
   */
  async preprocessForPlantDetection(imageBuffer) {
    try {
      const processedBuffer = await sharp(imageBuffer)
        .resize(224, 224)
        .removeAlpha()
        .toFormat('jpeg')
        .toBuffer();

      const imageTensor = tf.node.decodeImage(processedBuffer, 3)
        .expandDims(0)
        .div(255.0);

      return imageTensor;
    } catch (error) {
      console.error('Error preprocessing image for plant detection:', error);
      throw new Error('Không thể xử lý ảnh cho plant detection');
    }
  }

  /**
   * Reject inappropriate content
   */
  async rejectInappropriateContent(imageBuffer) {
    // Trong thực tế, đây sẽ sử dụng một content classification model
    // Hiện tại return basic validation
    
    try {
      // Basic content analysis
      const metadata = await sharp(imageBuffer).metadata();
      
      // Check for obvious non-plant indicators
      const warnings = [];
      
      // Very small images might be icons or logos
      if (metadata.width < 200 || metadata.height < 200) {
        warnings.push('Ảnh có kích thước nhỏ, có thể không phải ảnh cây thực tế');
      }

      // Very wide or very tall images might be screenshots
      const aspectRatio = metadata.width / metadata.height;
      if (aspectRatio > 3 || aspectRatio < 0.33) {
        warnings.push('Tỷ lệ ảnh không phù hợp cho ảnh cây trồng');
      }

      return {
        isAppropriate: warnings.length === 0,
        warnings,
        message: warnings.length === 0 
          ? 'Ảnh phù hợp để phân tích' 
          : 'Ảnh có thể không phù hợp để phân tích bệnh cây'
      };
    } catch (error) {
      console.error('Error in content appropriateness check:', error);
      return {
        isAppropriate: true,
        warnings: [],
        message: 'Không thể kiểm tra nội dung, cho phép xử lý'
      };
    }
  }

  /**
   * Complete validation pipeline
   */
  async validateImage(file) {
    const validationResult = {
      isValid: false,
      errors: [],
      warnings: [],
      plantDetection: null,
      contentCheck: null
    };

    try {
      // Step 1: Technical validation
      const technicalValidation = await this.validateTechnical(file);
      if (!technicalValidation.isValid) {
        validationResult.errors.push(...technicalValidation.errors);
        return validationResult;
      }

      // Step 2: Plant content validation
      const plantValidation = await this.validatePlantContent(file.buffer);
      validationResult.plantDetection = plantValidation;
      
      if (!plantValidation.isPlant) {
        validationResult.errors.push(
          'Ảnh không chứa cây hoặc lá cây. Vui lòng chụp ảnh lá/cây rõ ràng.'
        );
        return validationResult;
      }

      if (plantValidation.confidence < this.plantConfidenceThreshold) {
        validationResult.warnings.push(
          `Độ tin cậy thấp (${Math.round(plantValidation.confidence * 100)}%). Kết quả có thể không chính xác.`
        );
      }

      // Step 3: Content appropriateness check
      const contentCheck = await this.rejectInappropriateContent(file.buffer);
      validationResult.contentCheck = contentCheck;
      
      if (!contentCheck.isAppropriate) {
        validationResult.warnings.push(...contentCheck.warnings);
      }

      // Final validation
      validationResult.isValid = validationResult.errors.length === 0;
      
      return validationResult;
    } catch (error) {
      console.error('Error in image validation pipeline:', error);
      validationResult.errors.push('Lỗi trong quá trình xác thực ảnh');
      return validationResult;
    }
  }

  /**
   * Get validation statistics
   */
  getValidationStats() {
    return {
      allowedMimeTypes: this.allowedMimeTypes,
      maxFileSize: this.maxFileSize,
      minDimensions: this.minDimensions,
      maxDimensions: this.maxDimensions,
      plantConfidenceThreshold: this.plantConfidenceThreshold,
      modelLoaded: this.isModelLoaded
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.plantDetectionModel) {
      this.plantDetectionModel.dispose();
      this.plantDetectionModel = null;
      this.isModelLoaded = false;
    }
  }
}

module.exports = new ImageValidationService();