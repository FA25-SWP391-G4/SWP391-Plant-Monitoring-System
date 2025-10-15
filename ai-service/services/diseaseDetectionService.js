const tf = require('@tensorflow/tfjs');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

/**
 * Disease Detection Service với TensorFlow.js
 * Sử dụng MobileNetV2 base model cho plant disease detection
 */
class DiseaseDetectionService {
  constructor() {
    this.model = null;
    this.isModelLoaded = false;
    this.supportedDiseases = {
      'healthy': {
        name: 'Cây khỏe mạnh',
        severity: 'none',
        description: 'Cây đang trong tình trạng khỏe mạnh, không có dấu hiệu bệnh tật'
      },
      'leaf_spot': {
        name: 'Đốm lá',
        severity: 'medium',
        description: 'Bệnh đốm lá do nấm, thường xuất hiện dưới dạng các đốm tròn trên lá'
      },
      'powdery_mildew': {
        name: 'Phấn trắng',
        severity: 'medium',
        description: 'Bệnh phấn trắng do nấm, tạo lớp phấn trắng trên bề mặt lá'
      },
      'rust': {
        name: 'Bệnh gỉ sắt',
        severity: 'high',
        description: 'Bệnh gỉ sắt tạo các đốm màu cam đỏ trên lá, có thể lan nhanh'
      },
      'bacterial_blight': {
        name: 'Cháy lá do vi khuẩn',
        severity: 'high',
        description: 'Bệnh do vi khuẩn gây cháy lá, lan nhanh trong điều kiện ẩm ướt'
      },
      'viral_mosaic': {
        name: 'Bệnh khảm virus',
        severity: 'high',
        description: 'Bệnh virus tạo các vệt khảm màu vàng xanh trên lá'
      },
      'nutrient_deficiency': {
        name: 'Thiếu dinh dưỡng',
        severity: 'low',
        description: 'Thiếu các chất dinh dưỡng cần thiết, thường biểu hiện qua màu sắc lá'
      },
      'pest_damage': {
        name: 'Sâu hại',
        severity: 'medium',
        description: 'Tổn thương do sâu bệnh gây ra, cần xử lý kịp thời'
      }
    };
    
    // Image processing parameters
    this.imageSize = 224; // MobileNetV2 input size
    this.confidenceThreshold = 0.6;
  }

  /**
   * Khởi tạo và load model
   */
  async initializeModel() {
    try {
      console.log('Initializing disease detection model...');
      
      // Tạo một model đơn giản cho demo (trong thực tế sẽ load pre-trained model)
      this.model = await this.createDemoModel();
      this.isModelLoaded = true;
      
      console.log('Disease detection model loaded successfully');
      return true;
    } catch (error) {
      console.error('Error initializing disease detection model:', error);
      this.isModelLoaded = false;
      return false;
    }
  }

  /**
   * Tạo demo model (trong thực tế sẽ load pre-trained MobileNetV2)
   */
  async createDemoModel() {
    // Tạo một model đơn giản cho demo
    const model = tf.sequential({
      layers: [
        tf.layers.conv2d({
          inputShape: [this.imageSize, this.imageSize, 3],
          filters: 32,
          kernelSize: 3,
          activation: 'relu'
        }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu' }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu' }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.5 }),
        tf.layers.dense({ 
          units: Object.keys(this.supportedDiseases).length, 
          activation: 'softmax' 
        })
      ]
    });

    // Compile model
    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });

    return model;
  }

  /**
   * Preprocessing ảnh cho model
   */
  async preprocessImage(imageBuffer) {
    try {
      // Resize và normalize ảnh bằng Sharp
      const processedBuffer = await sharp(imageBuffer)
        .resize(this.imageSize, this.imageSize)
        .removeAlpha()
        .toFormat('jpeg')
        .toBuffer();

      // Convert buffer thành tensor
      const imageTensor = tf.node.decodeImage(processedBuffer, 3)
        .expandDims(0)
        .div(255.0); // Normalize to [0,1]

      return imageTensor;
    } catch (error) {
      console.error('Error preprocessing image:', error);
      throw new Error('Không thể xử lý ảnh. Vui lòng kiểm tra định dạng ảnh.');
    }
  }

  /**
   * Data augmentation cho training (demo implementation)
   */
  async augmentImage(imageTensor) {
    // Random flip horizontal
    const flipped = tf.image.flipLeftRight(imageTensor);
    
    // Random brightness adjustment
    const brightened = tf.image.adjustBrightness(imageTensor, Math.random() * 0.2 - 0.1);
    
    // Random contrast adjustment
    const contrasted = tf.image.adjustContrast(brightened, 0.8 + Math.random() * 0.4);
    
    return contrasted;
  }

  /**
   * Phân tích bệnh cây từ ảnh
   */
  async analyzeDisease(imageBuffer) {
    try {
      if (!this.isModelLoaded) {
        await this.initializeModel();
      }

      if (!this.model) {
        throw new Error('Model chưa được khởi tạo');
      }

      // Preprocess image
      const imageTensor = await this.preprocessImage(imageBuffer);

      // Model prediction
      const predictions = await this.model.predict(imageTensor);
      const predictionData = await predictions.data();

      // Process predictions
      const results = this.processPredictions(predictionData);

      // Cleanup tensors
      imageTensor.dispose();
      predictions.dispose();

      return results;
    } catch (error) {
      console.error('Error analyzing disease:', error);
      throw error;
    }
  }

  /**
   * Xử lý kết quả predictions
   */
  processPredictions(predictionData) {
    const diseaseKeys = Object.keys(this.supportedDiseases);
    const results = [];

    // Tạo array các kết quả với confidence scores
    for (let i = 0; i < predictionData.length; i++) {
      const diseaseKey = diseaseKeys[i];
      const confidence = predictionData[i];
      
      if (confidence > this.confidenceThreshold) {
        results.push({
          diseaseKey,
          disease: this.supportedDiseases[diseaseKey],
          confidence: Math.round(confidence * 100) / 100,
          severity: this.supportedDiseases[diseaseKey].severity
        });
      }
    }

    // Sắp xếp theo confidence giảm dần
    results.sort((a, b) => b.confidence - a.confidence);

    // Nếu không có kết quả nào đạt threshold, trả về healthy với confidence thấp
    if (results.length === 0) {
      results.push({
        diseaseKey: 'healthy',
        disease: this.supportedDiseases['healthy'],
        confidence: 0.5,
        severity: 'none'
      });
    }

    return {
      diseases: results,
      primaryDisease: results[0],
      confidence: results[0].confidence,
      severity: results[0].severity,
      analysisTimestamp: new Date().toISOString()
    };
  }

  /**
   * Lấy thông tin về các bệnh được hỗ trợ
   */
  getSupportedDiseases() {
    return this.supportedDiseases;
  }

  /**
   * Kiểm tra model có sẵn sàng không
   */
  isReady() {
    return this.isModelLoaded && this.model !== null;
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.isModelLoaded = false;
    }
  }
}

module.exports = new DiseaseDetectionService();