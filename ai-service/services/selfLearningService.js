/**
 * Self Learning Service - Tự học và cải tiến theo dữ liệu thực tế
 */

const sensorService = require('./sensorService');

class SelfLearningService {
  constructor() {
    this.learningData = [];
    this.models = {
      irrigation: { accuracy: 0.7, version: '1.0' },
      disease_detection: { accuracy: 0.8, version: '1.0' },
      growth_prediction: { accuracy: 0.75, version: '1.0' }
    };
    this.feedbackData = [];
    this.performanceMetrics = {};
    this.learningThresholds = {
      minDataPoints: 10,
      minAccuracyImprovement: 0.05,
      retrainingInterval: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
  }

  /**
   * Thu thập feedback từ người dùng
   */
  async collectFeedback(feedbackData) {
    try {
      const {
        plantId,
        predictionId,
        predictionType, // 'irrigation', 'disease', 'growth', 'health'
        actualOutcome,
        userRating, // 1-5 scale
        userComments,
        timestamp = new Date().toISOString()
      } = feedbackData;

      // Validate feedback data
      if (!plantId || !predictionType || !actualOutcome) {
        throw new Error('Thiếu thông tin feedback cần thiết');
      }

      // Lấy prediction gốc để so sánh
      const originalPrediction = await this.getOriginalPrediction(predictionId, predictionType);

      // Tính toán accuracy của prediction
      const accuracy = this.calculatePredictionAccuracy(originalPrediction, actualOutcome, predictionType);

      // Lưu feedback
      const feedback = {
        id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        plantId,
        predictionId,
        predictionType,
        originalPrediction,
        actualOutcome,
        accuracy,
        userRating,
        userComments,
        timestamp,
        processed: false
      };

      this.feedbackData.push(feedback);

      // Cập nhật performance metrics
      await this.updatePerformanceMetrics(predictionType, accuracy, userRating);

      // Kiểm tra xem có cần retrain model không
      await this.checkRetrainingNeed(predictionType);

      // Lưu learning data để cải thiện model
      await this.saveLearningData(feedback);

      return {
        success: true,
        feedbackId: feedback.id,
        message: 'Feedback đã được ghi nhận và sẽ được sử dụng để cải thiện hệ thống',
        currentAccuracy: this.models[predictionType]?.accuracy || 0,
        improvementSuggestions: await this.generateImprovementSuggestions(feedback)
      };
    } catch (error) {
      console.error('Lỗi khi thu thập feedback:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Phân tích và học từ dữ liệu lịch sử
   */
  async analyzeHistoricalData(plantId, analysisType = 'all') {
    try {
      // Lấy dữ liệu lịch sử
      const historicalData = await sensorService.getHistoricalData(plantId, 30);
      const wateringHistory = await sensorService.getWateringHistory(plantId, 50);
      const feedbackHistory = this.getFeedbackHistory(plantId);

      // Phân tích patterns
      const patterns = await this.identifyPatterns(historicalData, wateringHistory, feedbackHistory);

      // Phát hiện correlations
      const correlations = await this.findCorrelations(historicalData, wateringHistory);

      // Tạo insights
      const insights = await this.generateInsights(patterns, correlations, feedbackHistory);

      // Cập nhật model parameters
      const modelUpdates = await this.updateModelParameters(insights, analysisType);

      return {
        plantId,
        analysisType,
        timestamp: new Date().toISOString(),
        patterns,
        correlations,
        insights,
        modelUpdates,
        recommendations: await this.generateLearningRecommendations(insights)
      };
    } catch (error) {
      console.error('Lỗi phân tích dữ liệu lịch sử:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cải thiện model dựa trên feedback
   */
  async improveModel(modelType, improvementData = {}) {
    try {
      const {
        trainingData = [],
        validationData = [],
        hyperparameters = {},
        targetAccuracy = 0.85
      } = improvementData;

      // Lấy dữ liệu training từ feedback
      const feedbackTrainingData = this.prepareFeedbackTrainingData(modelType);
      const allTrainingData = [...trainingData, ...feedbackTrainingData];

      if (allTrainingData.length < this.learningThresholds.minDataPoints) {
        return {
          success: false,
          message: `Cần ít nhất ${this.learningThresholds.minDataPoints} điểm dữ liệu để cải thiện model`
        };
      }

      // Backup model hiện tại
      const currentModel = { ...this.models[modelType] };

      // Train model mới
      const newModel = await this.trainModel(modelType, allTrainingData, hyperparameters);

      // Validate model mới
      const validation = await this.validateModel(newModel, validationData);

      // So sánh performance
      const improvement = validation.accuracy - currentModel.accuracy;

      if (improvement >= this.learningThresholds.minAccuracyImprovement) {
        // Cập nhật model
        this.models[modelType] = {
          ...newModel,
          previousVersion: currentModel.version,
          improvementDate: new Date().toISOString(),
          improvementAmount: improvement
        };

        // Log improvement
        console.log(`Model ${modelType} improved by ${(improvement * 100).toFixed(2)}%`);

        return {
          success: true,
          modelType,
          previousAccuracy: currentModel.accuracy,
          newAccuracy: validation.accuracy,
          improvement,
          validationResults: validation,
          message: `Model ${modelType} đã được cải thiện thành công`
        };
      } else {
        return {
          success: false,
          message: `Cải thiện không đáng kể (${(improvement * 100).toFixed(2)}%), giữ nguyên model hiện tại`,
          currentAccuracy: currentModel.accuracy,
          attemptedAccuracy: validation.accuracy
        };
      }
    } catch (error) {
      console.error('Lỗi cải thiện model:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Tự động điều chỉnh parameters dựa trên performance
   */
  async autoTuneParameters(plantId, parameterType = 'irrigation') {
    try {
      // Lấy performance data gần đây
      const recentPerformance = await this.getRecentPerformance(plantId, parameterType);
      
      // Phân tích performance trends
      const trends = this.analyzePerformanceTrends(recentPerformance);
      
      // Xác định parameters cần điều chỉnh
      const parametersToAdjust = this.identifyParametersToAdjust(trends, parameterType);
      
      // Tính toán adjustments
      const adjustments = await this.calculateParameterAdjustments(parametersToAdjust, trends);
      
      // Áp dụng adjustments
      const results = await this.applyParameterAdjustments(plantId, adjustments);
      
      return {
        plantId,
        parameterType,
        timestamp: new Date().toISOString(),
        trends,
        adjustments,
        results,
        expectedImprovement: this.estimateImprovement(adjustments, trends)
      };
    } catch (error) {
      console.error('Lỗi auto-tune parameters:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Học từ các cây tương tự
   */
  async learnFromSimilarPlants(plantId) {
    try {
      // Tìm các cây tương tự
      const similarPlants = await this.findSimilarPlants(plantId);
      
      // Thu thập dữ liệu từ các cây tương tự
      const similarPlantsData = await this.collectSimilarPlantsData(similarPlants);
      
      // Phân tích best practices
      const bestPractices = await this.analyzeBestPractices(similarPlantsData);
      
      // Tạo recommendations
      const recommendations = await this.generateCrossPlantRecommendations(plantId, bestPractices);
      
      // Cập nhật model với knowledge từ similar plants
      const modelUpdates = await this.updateModelWithSimilarPlantData(plantId, similarPlantsData);
      
      return {
        plantId,
        similarPlants: similarPlants.map(p => ({ id: p.id, similarity: p.similarity })),
        bestPractices,
        recommendations,
        modelUpdates,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Lỗi học từ cây tương tự:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Các hàm hỗ trợ chính
  async getOriginalPrediction(predictionId, predictionType) {
    // Trong thực tế sẽ query từ database
    // Mô phỏng prediction data
    const mockPredictions = {
      irrigation: {
        needsWatering: true,
        recommendedAmount: 200,
        confidence: 0.8,
        predictedMoistureAfter: 65
      },
      disease: {
        diseaseDetected: false,
        confidence: 0.9,
        healthScore: 85
      },
      growth: {
        expectedGrowthRate: 0.5,
        predictedHeight: 25,
        confidence: 0.75
      }
    };
    
    return mockPredictions[predictionType] || {};
  }

  calculatePredictionAccuracy(prediction, actualOutcome, predictionType) {
    switch (predictionType) {
      case 'irrigation':
        return this.calculateIrrigationAccuracy(prediction, actualOutcome);
      case 'disease':
        return this.calculateDiseaseAccuracy(prediction, actualOutcome);
      case 'growth':
        return this.calculateGrowthAccuracy(prediction, actualOutcome);
      default:
        return 0.5; // Default neutral accuracy
    }
  }

  calculateIrrigationAccuracy(prediction, actual) {
    let accuracy = 0;
    
    // Accuracy cho việc dự đoán có cần tưới không
    if (prediction.needsWatering === actual.wasWateringNeeded) {
      accuracy += 0.4;
    }
    
    // Accuracy cho lượng nước khuyến nghị
    if (actual.actualWaterAmount && prediction.recommendedAmount) {
      const amountDiff = Math.abs(actual.actualWaterAmount - prediction.recommendedAmount);
      const amountAccuracy = Math.max(0, 1 - amountDiff / prediction.recommendedAmount);
      accuracy += amountAccuracy * 0.3;
    }
    
    // Accuracy cho dự đoán độ ẩm sau tưới
    if (actual.moistureAfterWatering && prediction.predictedMoistureAfter) {
      const moistureDiff = Math.abs(actual.moistureAfterWatering - prediction.predictedMoistureAfter);
      const moistureAccuracy = Math.max(0, 1 - moistureDiff / 100);
      accuracy += moistureAccuracy * 0.3;
    }
    
    return Math.min(1, accuracy);
  }

  calculateDiseaseAccuracy(prediction, actual) {
    let accuracy = 0;
    
    // Accuracy cho việc phát hiện bệnh
    if (prediction.diseaseDetected === actual.actualDiseasePresent) {
      accuracy += 0.6;
    }
    
    // Accuracy cho health score
    if (actual.actualHealthScore && prediction.healthScore) {
      const scoreDiff = Math.abs(actual.actualHealthScore - prediction.healthScore);
      const scoreAccuracy = Math.max(0, 1 - scoreDiff / 100);
      accuracy += scoreAccuracy * 0.4;
    }
    
    return Math.min(1, accuracy);
  }

  calculateGrowthAccuracy(prediction, actual) {
    let accuracy = 0;
    
    // Accuracy cho tốc độ phát triển
    if (actual.actualGrowthRate && prediction.expectedGrowthRate) {
      const rateDiff = Math.abs(actual.actualGrowthRate - prediction.expectedGrowthRate);
      const rateAccuracy = Math.max(0, 1 - rateDiff / prediction.expectedGrowthRate);
      accuracy += rateAccuracy * 0.5;
    }
    
    // Accuracy cho chiều cao dự đoán
    if (actual.actualHeight && prediction.predictedHeight) {
      const heightDiff = Math.abs(actual.actualHeight - prediction.predictedHeight);
      const heightAccuracy = Math.max(0, 1 - heightDiff / prediction.predictedHeight);
      accuracy += heightAccuracy * 0.5;
    }
    
    return Math.min(1, accuracy);
  }

  async updatePerformanceMetrics(predictionType, accuracy, userRating) {
    if (!this.performanceMetrics[predictionType]) {
      this.performanceMetrics[predictionType] = {
        totalPredictions: 0,
        totalAccuracy: 0,
        totalUserRating: 0,
        accuracyHistory: [],
        ratingHistory: []
      };
    }
    
    const metrics = this.performanceMetrics[predictionType];
    metrics.totalPredictions++;
    metrics.totalAccuracy += accuracy;
    metrics.totalUserRating += userRating;
    metrics.accuracyHistory.push({ accuracy, timestamp: new Date() });
    metrics.ratingHistory.push({ rating: userRating, timestamp: new Date() });
    
    // Keep only recent history (last 100 entries)
    if (metrics.accuracyHistory.length > 100) {
      metrics.accuracyHistory = metrics.accuracyHistory.slice(-100);
    }
    if (metrics.ratingHistory.length > 100) {
      metrics.ratingHistory = metrics.ratingHistory.slice(-100);
    }
    
    // Update model accuracy
    this.models[predictionType].accuracy = metrics.totalAccuracy / metrics.totalPredictions;
  }

  async checkRetrainingNeed(predictionType) {
    const metrics = this.performanceMetrics[predictionType];
    if (!metrics) return false;
    
    // Check if accuracy is declining
    const recentAccuracy = metrics.accuracyHistory.slice(-10);
    if (recentAccuracy.length >= 10) {
      const avgRecentAccuracy = recentAccuracy.reduce((sum, item) => sum + item.accuracy, 0) / recentAccuracy.length;
      const currentModelAccuracy = this.models[predictionType].accuracy;
      
      if (avgRecentAccuracy < currentModelAccuracy - 0.1) {
        console.log(`Model ${predictionType} needs retraining - accuracy declining`);
        await this.scheduleRetraining(predictionType);
        return true;
      }
    }
    
    // Check if enough time has passed since last training
    const lastTraining = this.models[predictionType].lastTraining || 0;
    const timeSinceTraining = Date.now() - lastTraining;
    
    if (timeSinceTraining > this.learningThresholds.retrainingInterval) {
      console.log(`Model ${predictionType} needs retraining - time interval reached`);
      await this.scheduleRetraining(predictionType);
      return true;
    }
    
    return false;
  }

  async saveLearningData(feedback) {
    this.learningData.push({
      id: `learning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'feedback',
      data: feedback,
      timestamp: new Date().toISOString(),
      processed: false
    });
    
    // Keep only recent learning data
    if (this.learningData.length > 1000) {
      this.learningData = this.learningData.slice(-1000);
    }
  }

  async generateImprovementSuggestions(feedback) {
    const suggestions = [];
    
    if (feedback.accuracy < 0.7) {
      suggestions.push({
        type: 'data_quality',
        message: 'Cải thiện chất lượng dữ liệu đầu vào',
        actions: [
          'Kiểm tra và hiệu chỉnh cảm biến',
          'Tăng tần suất thu thập dữ liệu',
          'Xác minh dữ liệu thời tiết'
        ]
      });
    }
    
    if (feedback.userRating < 3) {
      suggestions.push({
        type: 'user_experience',
        message: 'Cải thiện trải nghiệm người dùng',
        actions: [
          'Cung cấp giải thích rõ ràng hơn cho dự đoán',
          'Tăng độ chính xác của khuyến nghị',
          'Cải thiện giao diện người dùng'
        ]
      });
    }
    
    return suggestions;
  }

  // Pattern identification
  async identifyPatterns(historicalData, wateringHistory, feedbackHistory) {
    const patterns = {
      seasonal: this.identifySeasonalPatterns(historicalData),
      watering: this.identifyWateringPatterns(wateringHistory),
      feedback: this.identifyFeedbackPatterns(feedbackHistory),
      environmental: this.identifyEnvironmentalPatterns(historicalData)
    };
    
    return patterns;
  }

  identifySeasonalPatterns(data) {
    if (data.length < 30) return { message: 'Không đủ dữ liệu để phân tích mùa vụ' };
    
    const monthlyData = {};
    data.forEach(record => {
      const month = new Date(record.timestamp).getMonth();
      if (!monthlyData[month]) {
        monthlyData[month] = { temperature: [], moisture: [], humidity: [] };
      }
      monthlyData[month].temperature.push(record.temperature);
      monthlyData[month].moisture.push(record.soilMoisture);
      monthlyData[month].humidity.push(record.humidity);
    });
    
    const seasonalTrends = {};
    Object.keys(monthlyData).forEach(month => {
      const monthData = monthlyData[month];
      seasonalTrends[month] = {
        avgTemperature: monthData.temperature.reduce((a, b) => a + b, 0) / monthData.temperature.length,
        avgMoisture: monthData.moisture.reduce((a, b) => a + b, 0) / monthData.moisture.length,
        avgHumidity: monthData.humidity.reduce((a, b) => a + b, 0) / monthData.humidity.length
      };
    });
    
    return seasonalTrends;
  }

  identifyWateringPatterns(wateringHistory) {
    if (wateringHistory.length < 10) return { message: 'Không đủ dữ liệu tưới để phân tích' };
    
    // Phân tích tần suất tưới
    const intervals = [];
    for (let i = 1; i < wateringHistory.length; i++) {
      const interval = (new Date(wateringHistory[i-1].timestamp) - new Date(wateringHistory[i].timestamp)) / (1000 * 60 * 60);
      intervals.push(interval);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    // Phân tích lượng nước
    const amounts = wateringHistory.map(w => w.amount).filter(a => a > 0);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    
    // Phân tích thời gian tưới
    const hours = wateringHistory.map(w => new Date(w.timestamp).getHours());
    const hourFrequency = {};
    hours.forEach(hour => {
      hourFrequency[hour] = (hourFrequency[hour] || 0) + 1;
    });
    
    const preferredHours = Object.keys(hourFrequency)
      .sort((a, b) => hourFrequency[b] - hourFrequency[a])
      .slice(0, 3);
    
    return {
      averageInterval: avgInterval,
      averageAmount: avgAmount,
      preferredHours,
      totalWaterings: wateringHistory.length,
      consistency: this.calculateWateringConsistency(intervals)
    };
  }

  identifyFeedbackPatterns(feedbackHistory) {
    if (feedbackHistory.length < 5) return { message: 'Không đủ feedback để phân tích' };
    
    const patterns = {
      accuracyTrend: this.calculateAccuracyTrend(feedbackHistory),
      commonIssues: this.identifyCommonIssues(feedbackHistory),
      userSatisfaction: this.calculateUserSatisfaction(feedbackHistory)
    };
    
    return patterns;
  }

  identifyEnvironmentalPatterns(data) {
    if (data.length < 20) return { message: 'Không đủ dữ liệu môi trường để phân tích' };
    
    // Phân tích correlation giữa các yếu tố môi trường
    const correlations = {
      tempHumidity: this.calculateCorrelation(
        data.map(d => d.temperature),
        data.map(d => d.humidity)
      ),
      tempMoisture: this.calculateCorrelation(
        data.map(d => d.temperature),
        data.map(d => d.soilMoisture)
      ),
      humidityMoisture: this.calculateCorrelation(
        data.map(d => d.humidity),
        data.map(d => d.soilMoisture)
      )
    };
    
    return {
      correlations,
      optimalConditions: this.identifyOptimalConditions(data),
      stressConditions: this.identifyStressConditions(data)
    };
  }

  // Correlation analysis
  async findCorrelations(historicalData, wateringHistory) {
    const correlations = {};
    
    // Correlation giữa thời tiết và nhu cầu tưới
    if (historicalData.length > 10 && wateringHistory.length > 5) {
      correlations.weatherWatering = this.analyzeWeatherWateringCorrelation(historicalData, wateringHistory);
    }
    
    // Correlation giữa các thông số cảm biến
    if (historicalData.length > 20) {
      correlations.sensorParameters = this.analyzeSensorCorrelations(historicalData);
    }
    
    return correlations;
  }

  analyzeWeatherWateringCorrelation(historicalData, wateringHistory) {
    // Tạo daily aggregated data
    const dailyData = this.aggregateDataByDay(historicalData);
    const dailyWatering = this.aggregateWateringByDay(wateringHistory);
    
    // Tính correlation
    const correlations = {
      temperatureWatering: this.calculateCorrelationWithWatering(dailyData, dailyWatering, 'temperature'),
      humidityWatering: this.calculateCorrelationWithWatering(dailyData, dailyWatering, 'humidity'),
      moistureWatering: this.calculateCorrelationWithWatering(dailyData, dailyWatering, 'soilMoisture')
    };
    
    return correlations;
  }

  // Model training simulation
  async trainModel(modelType, trainingData, hyperparameters) {
    // Mô phỏng quá trình training
    console.log(`Training ${modelType} model with ${trainingData.length} data points...`);
    
    // Simulate training time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Calculate new accuracy based on training data quality
    const dataQuality = this.assessDataQuality(trainingData);
    const baseAccuracy = this.models[modelType].accuracy;
    const improvementPotential = Math.min(0.15, dataQuality * 0.2);
    const newAccuracy = Math.min(0.95, baseAccuracy + improvementPotential);
    
    return {
      accuracy: newAccuracy,
      version: this.incrementVersion(this.models[modelType].version),
      trainingDataSize: trainingData.length,
      hyperparameters,
      trainingDate: new Date().toISOString(),
      lastTraining: Date.now()
    };
  }

  async validateModel(model, validationData) {
    // Mô phỏng validation
    const validationAccuracy = model.accuracy * (0.95 + Math.random() * 0.1); // Slight variation
    
    return {
      accuracy: Math.min(0.95, validationAccuracy),
      precision: validationAccuracy * 0.98,
      recall: validationAccuracy * 0.96,
      f1Score: validationAccuracy * 0.97,
      validationDataSize: validationData.length
    };
  }

  // Parameter tuning
  async getRecentPerformance(plantId, parameterType) {
    // Mô phỏng recent performance data
    const performance = [];
    for (let i = 0; i < 30; i++) {
      performance.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        accuracy: 0.7 + Math.random() * 0.2,
        userSatisfaction: 3 + Math.random() * 2,
        efficiency: 0.6 + Math.random() * 0.3
      });
    }
    return performance;
  }

  analyzePerformanceTrends(performanceData) {
    const accuracyTrend = this.calculateTrend(performanceData.map(p => p.accuracy));
    const satisfactionTrend = this.calculateTrend(performanceData.map(p => p.userSatisfaction));
    const efficiencyTrend = this.calculateTrend(performanceData.map(p => p.efficiency));
    
    return {
      accuracy: accuracyTrend,
      userSatisfaction: satisfactionTrend,
      efficiency: efficiencyTrend,
      overall: (accuracyTrend.slope + satisfactionTrend.slope + efficiencyTrend.slope) / 3
    };
  }

  identifyParametersToAdjust(trends, parameterType) {
    const parametersToAdjust = [];
    
    if (trends.accuracy.slope < -0.01) {
      parametersToAdjust.push({
        parameter: 'prediction_threshold',
        reason: 'Accuracy đang giảm',
        currentValue: 0.7,
        adjustmentDirection: 'optimize'
      });
    }
    
    if (trends.efficiency.slope < -0.01) {
      parametersToAdjust.push({
        parameter: 'watering_frequency',
        reason: 'Hiệu quả đang giảm',
        currentValue: 24, // hours
        adjustmentDirection: 'increase'
      });
    }
    
    return parametersToAdjust;
  }

  async calculateParameterAdjustments(parametersToAdjust, trends) {
    const adjustments = [];
    
    parametersToAdjust.forEach(param => {
      let adjustment = {};
      
      switch (param.parameter) {
        case 'prediction_threshold':
          adjustment = {
            parameter: param.parameter,
            oldValue: param.currentValue,
            newValue: Math.max(0.5, Math.min(0.9, param.currentValue + (trends.accuracy.slope * -10))),
            reason: param.reason,
            expectedImpact: 'Cải thiện độ chính xác dự đoán'
          };
          break;
          
        case 'watering_frequency':
          adjustment = {
            parameter: param.parameter,
            oldValue: param.currentValue,
            newValue: Math.max(12, Math.min(48, param.currentValue * (1 - trends.efficiency.slope))),
            reason: param.reason,
            expectedImpact: 'Tối ưu hóa tần suất tưới'
          };
          break;
      }
      
      adjustments.push(adjustment);
    });
    
    return adjustments;
  }

  // Similar plants learning
  async findSimilarPlants(plantId) {
    // Mô phỏng tìm cây tương tự
    const currentPlant = await sensorService.getPlantInfo(plantId);
    
    const similarPlants = [
      { id: 'plant_001', similarity: 0.85, type: currentPlant.type, age: currentPlant.age + 5 },
      { id: 'plant_002', similarity: 0.78, type: currentPlant.type, age: currentPlant.age - 3 },
      { id: 'plant_003', similarity: 0.72, type: currentPlant.type, age: currentPlant.age + 10 }
    ];
    
    return similarPlants;
  }

  async collectSimilarPlantsData(similarPlants) {
    const data = {};
    
    for (const plant of similarPlants) {
      data[plant.id] = {
        plantInfo: plant,
        performance: {
          healthScore: 80 + Math.random() * 15,
          growthRate: 0.3 + Math.random() * 0.4,
          waterEfficiency: 0.7 + Math.random() * 0.2
        },
        bestPractices: [
          'Tưới vào buổi sáng sớm',
          'Kiểm tra độ ẩm đất hàng ngày',
          'Bón phân 2 tuần một lần'
        ]
      };
    }
    
    return data;
  }

  async analyzeBestPractices(similarPlantsData) {
    const allPractices = [];
    const performanceData = [];
    
    Object.values(similarPlantsData).forEach(plantData => {
      allPractices.push(...plantData.bestPractices);
      performanceData.push(plantData.performance);
    });
    
    // Tìm practices phổ biến nhất
    const practiceFrequency = {};
    allPractices.forEach(practice => {
      practiceFrequency[practice] = (practiceFrequency[practice] || 0) + 1;
    });
    
    const topPractices = Object.keys(practiceFrequency)
      .sort((a, b) => practiceFrequency[b] - practiceFrequency[a])
      .slice(0, 5);
    
    // Tính average performance
    const avgPerformance = {
      healthScore: performanceData.reduce((sum, p) => sum + p.healthScore, 0) / performanceData.length,
      growthRate: performanceData.reduce((sum, p) => sum + p.growthRate, 0) / performanceData.length,
      waterEfficiency: performanceData.reduce((sum, p) => sum + p.waterEfficiency, 0) / performanceData.length
    };
    
    return {
      topPractices,
      averagePerformance: avgPerformance,
      practiceFrequency
    };
  }

  // Utility functions
  calculateCorrelation(x, y) {
    if (x.length !== y.length || x.length === 0) return 0;
    
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  calculateTrend(values) {
    if (values.length < 2) return { slope: 0, direction: 'stable' };
    
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    return {
      slope,
      direction: slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable'
    };
  }

  assessDataQuality(data) {
    if (data.length === 0) return 0;
    
    let qualityScore = 0.5; // Base score
    
    // Check data completeness
    const completeness = data.filter(d => d && Object.keys(d).length > 0).length / data.length;
    qualityScore += completeness * 0.3;
    
    // Check data variety
    const uniqueValues = new Set(data.map(d => JSON.stringify(d))).size;
    const variety = Math.min(1, uniqueValues / (data.length * 0.8));
    qualityScore += variety * 0.2;
    
    return Math.min(1, qualityScore);
  }

  incrementVersion(currentVersion) {
    const parts = currentVersion.split('.');
    const minor = parseInt(parts[1]) + 1;
    return `${parts[0]}.${minor}`;
  }

  prepareFeedbackTrainingData(modelType) {
    return this.feedbackData
      .filter(f => f.predictionType === modelType && !f.processed)
      .map(f => ({
        input: f.originalPrediction,
        output: f.actualOutcome,
        accuracy: f.accuracy,
        weight: f.userRating / 5 // Use user rating as training weight
      }));
  }

  getFeedbackHistory(plantId) {
    return this.feedbackData.filter(f => f.plantId === plantId);
  }

  calculateWateringConsistency(intervals) {
    if (intervals.length < 3) return 0.5;
    
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((acc, interval) => acc + Math.pow(interval - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean; // Coefficient of variation
    
    return Math.max(0, 1 - cv); // Lower CV = higher consistency
  }

  async scheduleRetraining(modelType) {
    console.log(`Scheduling retraining for ${modelType} model`);
    // In real implementation, this would trigger a background job
    setTimeout(() => {
      this.improveModel(modelType);
    }, 5000);
  }

  async generateInsights(patterns, correlations, feedbackHistory) {
    const insights = [];
    
    // Seasonal insights
    if (patterns.seasonal && typeof patterns.seasonal === 'object') {
      insights.push({
        type: 'seasonal',
        title: 'Xu hướng theo mùa',
        description: 'Phát hiện các pattern theo mùa trong dữ liệu',
        actionable: true,
        recommendations: ['Điều chỉnh lịch tưới theo mùa', 'Chuẩn bị cho thay đổi thời tiết']
      });
    }
    
    // Correlation insights
    if (correlations.sensorParameters) {
      insights.push({
        type: 'correlation',
        title: 'Mối quan hệ giữa các thông số',
        description: 'Phát hiện correlation giữa nhiệt độ, độ ẩm và nhu cầu tưới',
        actionable: true,
        recommendations: ['Sử dụng multiple sensors để dự đoán chính xác hơn']
      });
    }
    
    return insights;
  }

  async updateModelParameters(insights, analysisType) {
    const updates = [];
    
    insights.forEach(insight => {
      if (insight.actionable) {
        updates.push({
          parameter: `${insight.type}_weight`,
          oldValue: 1.0,
          newValue: 1.2,
          reason: insight.description
        });
      }
    });
    
    return updates;
  }

  async generateLearningRecommendations(insights) {
    return insights
      .filter(insight => insight.actionable)
      .map(insight => ({
        priority: 'medium',
        category: insight.type,
        title: insight.title,
        actions: insight.recommendations
      }));
  }

  // Additional utility methods would be implemented here...
  
  // Missing helper methods
  identifyOptimalConditions(data) {
    if (data.length < 5) return { message: 'Không đủ dữ liệu để xác định điều kiện tối ưu' };
    
    // Tìm điều kiện tối ưu dựa trên dữ liệu
    const avgTemp = data.reduce((sum, d) => sum + d.temperature, 0) / data.length;
    const avgHumidity = data.reduce((sum, d) => sum + d.humidity, 0) / data.length;
    const avgMoisture = data.reduce((sum, d) => sum + d.soilMoisture, 0) / data.length;
    
    return {
      temperature: { min: avgTemp - 3, max: avgTemp + 3 },
      humidity: { min: avgHumidity - 10, max: avgHumidity + 10 },
      soilMoisture: { min: avgMoisture - 5, max: avgMoisture + 5 }
    };
  }

  identifyStressConditions(data) {
    if (data.length < 5) return { message: 'Không đủ dữ liệu để xác định điều kiện stress' };
    
    // Tìm các điều kiện gây stress
    const extremeTemp = data.filter(d => d.temperature > 35 || d.temperature < 15);
    const lowMoisture = data.filter(d => d.soilMoisture < 20);
    const highHumidity = data.filter(d => d.humidity > 80);
    
    return {
      temperatureStress: extremeTemp.length / data.length,
      moistureStress: lowMoisture.length / data.length,
      humidityStress: highHumidity.length / data.length
    };
  }

  aggregateDataByDay(historicalData) {
    const dailyData = {};
    
    historicalData.forEach(record => {
      const date = new Date(record.timestamp).toDateString();
      if (!dailyData[date]) {
        dailyData[date] = {
          temperature: [],
          humidity: [],
          soilMoisture: []
        };
      }
      
      dailyData[date].temperature.push(record.temperature);
      dailyData[date].humidity.push(record.humidity);
      dailyData[date].soilMoisture.push(record.soilMoisture);
    });
    
    // Calculate averages for each day
    const result = {};
    Object.keys(dailyData).forEach(date => {
      const dayData = dailyData[date];
      result[date] = {
        temperature: dayData.temperature.reduce((a, b) => a + b, 0) / dayData.temperature.length,
        humidity: dayData.humidity.reduce((a, b) => a + b, 0) / dayData.humidity.length,
        soilMoisture: dayData.soilMoisture.reduce((a, b) => a + b, 0) / dayData.soilMoisture.length
      };
    });
    
    return result;
  }

  aggregateWateringByDay(wateringHistory) {
    const dailyWatering = {};
    
    wateringHistory.forEach(watering => {
      const date = new Date(watering.timestamp).toDateString();
      if (!dailyWatering[date]) {
        dailyWatering[date] = {
          totalAmount: 0,
          count: 0
        };
      }
      
      dailyWatering[date].totalAmount += watering.amount;
      dailyWatering[date].count++;
    });
    
    return dailyWatering;
  }

  calculateCorrelationWithWatering(dailyData, dailyWatering, parameter) {
    const dates = Object.keys(dailyData).filter(date => dailyWatering[date]);
    
    if (dates.length < 3) return 0;
    
    const paramValues = dates.map(date => dailyData[date][parameter]);
    const wateringValues = dates.map(date => dailyWatering[date].totalAmount);
    
    return this.calculateCorrelation(paramValues, wateringValues);
  }

  analyzeSensorCorrelations(historicalData) {
    if (historicalData.length < 10) return { message: 'Không đủ dữ liệu để phân tích correlation' };
    
    const correlations = {};
    const parameters = ['temperature', 'humidity', 'soilMoisture', 'lightLevel'];
    
    // Calculate correlations between all parameter pairs
    for (let i = 0; i < parameters.length; i++) {
      for (let j = i + 1; j < parameters.length; j++) {
        const param1 = parameters[i];
        const param2 = parameters[j];
        
        const values1 = historicalData.map(d => d[param1]).filter(v => v != null);
        const values2 = historicalData.map(d => d[param2]).filter(v => v != null);
        
        if (values1.length > 5 && values2.length > 5) {
          const correlation = this.calculateCorrelation(values1, values2);
          correlations[`${param1}_${param2}`] = {
            correlation,
            strength: Math.abs(correlation) > 0.7 ? 'strong' : 
                     Math.abs(correlation) > 0.4 ? 'medium' : 'weak'
          };
        }
      }
    }
    
    return correlations;
  }

  getModelStatus() {
    return {
      models: this.models,
      performanceMetrics: this.performanceMetrics,
      learningDataSize: this.learningData.length,
      feedbackDataSize: this.feedbackData.length,
      lastUpdate: new Date().toISOString()
    };
  }
}

module.exports = new SelfLearningService();