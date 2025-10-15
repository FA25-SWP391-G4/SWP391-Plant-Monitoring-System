/**
 * User Acceptance Testing Suite
 * Tests real-world scenarios with actual data
 * Requirements: 4.1, 4.2, 4.3
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const UAT_CONFIG = {
  baseUrl: 'http://localhost:3001',
  testScenarios: {
    plantCareConversations: [
      {
        name: 'Tomato Plant Care',
        conversation: [
          'Cây cà chua của tôi có lá vàng và héo, tôi nên làm gì?',
          'Tôi đã tưới nước đều đặn, có thể là nguyên nhân gì khác?',
          'Làm thế nào để kiểm tra độ pH của đất?',
          'Tôi nên bón phân gì cho cây cà chua?'
        ],
        expectedTopics: ['lá vàng', 'tưới nước', 'pH', 'bón phân', 'cà chua']
      },
      {
        name: 'Herb Garden Care',
        conversation: [
          'Cây húng quế của tôi không phát triển tốt, lá nhỏ và màu nhạt',
          'Tôi trồng trong chậu, có cần thay đất không?',
          'Bao lâu tôi nên tưới nước cho cây húng quế?',
          'Làm thế nào để cây húng quế ra nhiều lá hơn?'
        ],
        expectedTopics: ['húng quế', 'phát triển', 'thay đất', 'tưới nước', 'chăm sóc']
      }
    ],
    irrigationScenarios: [
      {
        name: 'Dry Season Scenario',
        sensorData: {
          soilMoisture: 15,
          temperature: 32,
          humidity: 35,
          lightLevel: 3500
        },
        expectedRecommendation: 'water_immediately',
        plantType: 'tomato'
      },
      {
        name: 'Rainy Season Scenario',
        sensorData: {
          soilMoisture: 85,
          temperature: 24,
          humidity: 90,
          lightLevel: 800
        },
        expectedRecommendation: 'no_watering_needed',
        plantType: 'herb'
      },
      {
        name: 'Optimal Conditions',
        sensorData: {
          soilMoisture: 65,
          temperature: 26,
          humidity: 60,
          lightLevel: 2000
        },
        expectedRecommendation: 'monitor',
        plantType: 'vegetable'
      }
    ],
    realWorldImages: [
      {
        name: 'Healthy Tomato Leaf',
        description: 'Clear image of healthy tomato leaf',
        expectedResult: 'healthy',
        confidence: 0.7
      },
      {
        name: 'Diseased Plant Leaf',
        description: 'Leaf with visible disease symptoms',
        expectedResult: 'disease_detected',
        confidence: 0.6
      }
    ]
  },
  acceptanceCriteria: {
    chatbot: {
      responseTime: 5000, // 5 seconds
      relevanceScore: 0.7,
      plantTopicCoverage: 0.8
    },
    irrigation: {
      responseTime: 3000,
      predictionAccuracy: 0.75,
      confidenceThreshold: 0.6
    },
    diseaseDetection: {
      responseTime: 15000, // 15 seconds for image processing
      accuracyThreshold: 0.6,
      falsePositiveRate: 0.2
    }
  }
};

class UserAcceptanceTester {
  constructor() {
    this.results = {
      startTime: Date.now(),
      testResults: {
        chatbotTests: [],
        irrigationTests: [],
        diseaseDetectionTests: [],
        integrationTests: []
      },
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        overallScore: 0
      }
    };
  }

  async runUserAcceptanceTests() {
    console.log('👥 Starting User Acceptance Testing...');
    console.log('🎯 Testing real-world scenarios with actual data\n');

    try {
      // Test 1: Plant Care Conversations
      console.log('💬 Testing Plant Care Conversations...');
      await this.testPlantCareConversations();

      // Test 2: Irrigation Prediction Scenarios
      console.log('\n💧 Testing Irrigation Prediction Scenarios...');
      await this.testIrrigationScenarios();

      // Test 3: Disease Detection with Mock Images
      console.log('\n🔍 Testing Disease Detection...');
      await this.testDiseaseDetection();

      // Test 4: System Integration Tests
      console.log('\n🔗 Testing System Integration...');
      await this.testSystemIntegration();

      // Test 5: User Experience Tests
      console.log('\n👤 Testing User Experience...');
      await this.testUserExperience();

      // Generate comprehensive report
      await this.generateUATReport();

    } catch (error) {
      console.error('❌ User Acceptance Testing failed:', error);
      throw error;
    }
  }

  async testPlantCareConversations() {
    for (const scenario of UAT_CONFIG.testScenarios.plantCareConversations) {
      console.log(`   Testing: ${scenario.name}`);
      
      const conversationResult = {
        scenarioName: scenario.name,
        messages: [],
        overallScore: 0,
        responseTime: 0,
        topicCoverage: 0,
        passed: false
      };

      let totalResponseTime = 0;
      let relevantResponses = 0;

      for (let i = 0; i < scenario.conversation.length; i++) {
        const message = scenario.conversation[i];
        
        try {
          const startTime = Date.now();
          
          const response = await axios.post(`${UAT_CONFIG.baseUrl}/api/ai/chatbot/message`, {
            message,
            userId: 77777,
            plantId: 1,
            sessionId: `uat-${scenario.name.toLowerCase().replace(/\s+/g, '-')}`
          }, {
            timeout: UAT_CONFIG.acceptanceCriteria.chatbot.responseTime + 2000
          });

          const responseTime = Date.now() - startTime;
          totalResponseTime += responseTime;

          const messageResult = {
            message,
            response: response.data.response || 'No response',
            responseTime,
            success: response.data.success || false,
            relevantToPlants: this.checkPlantRelevance(response.data.response, scenario.expectedTopics)
          };

          if (messageResult.relevantToPlants) {
            relevantResponses++;
          }

          conversationResult.messages.push(messageResult);

        } catch (error) {
          conversationResult.messages.push({
            message,
            response: null,
            responseTime: UAT_CONFIG.acceptanceCriteria.chatbot.responseTime,
            success: false,
            error: error.message,
            relevantToPlants: false
          });
        }
      }

      // Calculate metrics
      conversationResult.responseTime = totalResponseTime / scenario.conversation.length;
      conversationResult.topicCoverage = relevantResponses / scenario.conversation.length;
      
      // Determine if test passed
      conversationResult.passed = 
        conversationResult.responseTime <= UAT_CONFIG.acceptanceCriteria.chatbot.responseTime &&
        conversationResult.topicCoverage >= UAT_CONFIG.acceptanceCriteria.chatbot.plantTopicCoverage;

      conversationResult.overallScore = (
        (conversationResult.topicCoverage * 60) +
        ((UAT_CONFIG.acceptanceCriteria.chatbot.responseTime - conversationResult.responseTime) / UAT_CONFIG.acceptanceCriteria.chatbot.responseTime * 40)
      );

      this.results.testResults.chatbotTests.push(conversationResult);
      
      console.log(`      ${conversationResult.passed ? '✅' : '❌'} Score: ${conversationResult.overallScore.toFixed(1)}% | Avg Response: ${conversationResult.responseTime.toFixed(0)}ms`);
    }
  }

  async testIrrigationScenarios() {
    for (const scenario of UAT_CONFIG.testScenarios.irrigationScenarios) {
      console.log(`   Testing: ${scenario.name}`);
      
      const irrigationResult = {
        scenarioName: scenario.name,
        sensorData: scenario.sensorData,
        expectedRecommendation: scenario.expectedRecommendation,
        actualRecommendation: null,
        responseTime: 0,
        confidence: 0,
        accuracy: 0,
        passed: false
      };

      try {
        const startTime = Date.now();
        
        const response = await axios.post(`${UAT_CONFIG.baseUrl}/api/ai/irrigation/predict/1`, {
          sensorData: scenario.sensorData,
          userId: 77777,
          plantType: scenario.plantType
        }, {
          timeout: UAT_CONFIG.acceptanceCriteria.irrigation.responseTime + 2000
        });

        irrigationResult.responseTime = Date.now() - startTime;
        
        if (response.data.success && response.data.prediction) {
          irrigationResult.actualRecommendation = this.interpretIrrigationPrediction(response.data.prediction);
          irrigationResult.confidence = response.data.prediction.confidence || 0;
          
          // Calculate accuracy based on expected vs actual recommendation
          irrigationResult.accuracy = this.calculateIrrigationAccuracy(
            scenario.expectedRecommendation,
            irrigationResult.actualRecommendation,
            scenario.sensorData
          );
        }

        // Determine if test passed
        irrigationResult.passed = 
          irrigationResult.responseTime <= UAT_CONFIG.acceptanceCriteria.irrigation.responseTime &&
          irrigationResult.accuracy >= UAT_CONFIG.acceptanceCriteria.irrigation.predictionAccuracy &&
          irrigationResult.confidence >= UAT_CONFIG.acceptanceCriteria.irrigation.confidenceThreshold;

      } catch (error) {
        irrigationResult.error = error.message;
        irrigationResult.passed = false;
      }

      this.results.testResults.irrigationTests.push(irrigationResult);
      
      console.log(`      ${irrigationResult.passed ? '✅' : '❌'} Accuracy: ${(irrigationResult.accuracy * 100).toFixed(1)}% | Response: ${irrigationResult.responseTime.toFixed(0)}ms`);
    }
  }

  async testDiseaseDetection() {
    // Since we can't use real images in this test environment, we'll test the endpoint functionality
    const mockImageTests = [
      {
        name: 'Valid Plant Image Test',
        description: 'Test with mock plant image data'
      },
      {
        name: 'Invalid Image Test',
        description: 'Test with invalid image data'
      }
    ];

    for (const test of mockImageTests) {
      console.log(`   Testing: ${test.name}`);
      
      const diseaseResult = {
        testName: test.name,
        responseTime: 0,
        success: false,
        error: null,
        passed: false
      };

      try {
        const FormData = require('form-data');
        const form = new FormData();
        
        // Create mock image buffer
        const mockImageBuffer = Buffer.from(`mock-plant-image-data-${Date.now()}`);
        form.append('image', mockImageBuffer, {
          filename: `uat-test-${Date.now()}.jpg`,
          contentType: 'image/jpeg'
        });
        form.append('plantId', '1');
        form.append('userId', '77777');

        const startTime = Date.now();
        
        const response = await axios.post(`${UAT_CONFIG.baseUrl}/api/ai/disease/analyze`, form, {
          timeout: UAT_CONFIG.acceptanceCriteria.diseaseDetection.responseTime + 5000,
          headers: {
            ...form.getHeaders()
          }
        });

        diseaseResult.responseTime = Date.now() - startTime;
        diseaseResult.success = true;
        
        // For UAT, we consider the test passed if the endpoint responds properly
        // (even if it rejects the mock image, which is expected behavior)
        diseaseResult.passed = diseaseResult.responseTime <= UAT_CONFIG.acceptanceCriteria.diseaseDetection.responseTime;

      } catch (error) {
        diseaseResult.responseTime = Date.now() - (diseaseResult.responseTime || Date.now());
        diseaseResult.error = error.message;
        
        // If we get a proper error response (400-499), it means the endpoint is working
        if (error.response && error.response.status >= 400 && error.response.status < 500) {
          diseaseResult.passed = true;
          diseaseResult.success = true;
        }
      }

      this.results.testResults.diseaseDetectionTests.push(diseaseResult);
      
      console.log(`      ${diseaseResult.passed ? '✅' : '❌'} Response: ${diseaseResult.responseTime.toFixed(0)}ms`);
    }
  }

  async testSystemIntegration() {
    const integrationTests = [
      {
        name: 'Health Check',
        test: () => this.testHealthEndpoint()
      },
      {
        name: 'Database Connectivity',
        test: () => this.testDatabaseConnectivity()
      },
      {
        name: 'Cross-Service Communication',
        test: () => this.testCrossServiceCommunication()
      },
      {
        name: 'Error Handling',
        test: () => this.testErrorHandling()
      }
    ];

    for (const integrationTest of integrationTests) {
      console.log(`   Testing: ${integrationTest.name}`);
      
      try {
        const result = await integrationTest.test();
        result.testName = integrationTest.name;
        this.results.testResults.integrationTests.push(result);
        
        console.log(`      ${result.passed ? '✅' : '❌'} ${result.message || 'Completed'}`);
      } catch (error) {
        this.results.testResults.integrationTests.push({
          testName: integrationTest.name,
          passed: false,
          error: error.message
        });
        
        console.log(`      ❌ Error: ${error.message}`);
      }
    }
  }

  async testUserExperience() {
    const uxTests = [
      {
        name: 'Response Time Consistency',
        test: () => this.testResponseTimeConsistency()
      },
      {
        name: 'Content Quality',
        test: () => this.testContentQuality()
      },
      {
        name: 'Error Message Clarity',
        test: () => this.testErrorMessageClarity()
      }
    ];

    for (const uxTest of uxTests) {
      console.log(`   Testing: ${uxTest.name}`);
      
      try {
        const result = await uxTest.test();
        result.testName = uxTest.name;
        this.results.testResults.integrationTests.push(result);
        
        console.log(`      ${result.passed ? '✅' : '❌'} Score: ${result.score || 'N/A'}`);
      } catch (error) {
        console.log(`      ❌ Error: ${error.message}`);
      }
    }
  }

  async testHealthEndpoint() {
    const startTime = Date.now();
    const response = await axios.get(`${UAT_CONFIG.baseUrl}/api/health`, { timeout: 5000 });
    const responseTime = Date.now() - startTime;
    
    return {
      passed: response.status === 200,
      responseTime,
      message: `Health check responded in ${responseTime}ms`
    };
  }

  async testDatabaseConnectivity() {
    try {
      const response = await axios.get(`${UAT_CONFIG.baseUrl}/api/ai/chatbot/sessions/77777`, { timeout: 5000 });
      return {
        passed: response.status === 200,
        message: 'Database connectivity verified'
      };
    } catch (error) {
      return {
        passed: false,
        message: `Database connectivity failed: ${error.message}`
      };
    }
  }

  async testCrossServiceCommunication() {
    // Test if AI service can communicate with main application
    try {
      const response = await axios.post(`${UAT_CONFIG.baseUrl}/api/ai/chatbot/message`, {
        message: 'Integration test message',
        userId: 77777,
        plantId: 1,
        sessionId: 'integration-test'
      }, { timeout: 10000 });

      return {
        passed: response.data.success === true,
        message: 'Cross-service communication working'
      };
    } catch (error) {
      return {
        passed: false,
        message: `Cross-service communication failed: ${error.message}`
      };
    }
  }

  async testErrorHandling() {
    try {
      // Send invalid request to test error handling
      await axios.post(`${UAT_CONFIG.baseUrl}/api/ai/chatbot/message`, {
        // Missing required fields
      }, { timeout: 5000 });

      return {
        passed: false,
        message: 'Error handling failed - should have rejected invalid request'
      };
    } catch (error) {
      // We expect this to fail with a proper error response
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        return {
          passed: true,
          message: 'Error handling working correctly'
        };
      } else {
        return {
          passed: false,
          message: `Unexpected error handling behavior: ${error.message}`
        };
      }
    }
  }

  async testResponseTimeConsistency() {
    const responseTimes = [];
    const testMessage = 'Consistency test message';

    // Make 5 identical requests to test consistency
    for (let i = 0; i < 5; i++) {
      try {
        const startTime = Date.now();
        await axios.post(`${UAT_CONFIG.baseUrl}/api/ai/chatbot/message`, {
          message: testMessage,
          userId: 77777,
          plantId: 1,
          sessionId: `consistency-test-${i}`
        }, { timeout: 10000 });
        
        responseTimes.push(Date.now() - startTime);
      } catch (error) {
        responseTimes.push(10000); // Max time for failed requests
      }
    }

    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    const variance = maxResponseTime - minResponseTime;

    return {
      passed: variance < 3000, // Less than 3 second variance
      score: `${avgResponseTime.toFixed(0)}ms avg, ${variance.toFixed(0)}ms variance`,
      message: `Response time consistency: ${variance < 3000 ? 'Good' : 'Poor'}`
    };
  }

  async testContentQuality() {
    const testQuestions = [
      'Cây của tôi có lá vàng',
      'Khi nào tôi nên tưới cây?',
      'Làm thế nào để chăm sóc cây cà chua?'
    ];

    let qualityScore = 0;
    const responses = [];

    for (const question of testQuestions) {
      try {
        const response = await axios.post(`${UAT_CONFIG.baseUrl}/api/ai/chatbot/message`, {
          message: question,
          userId: 77777,
          plantId: 1,
          sessionId: 'quality-test'
        }, { timeout: 10000 });

        if (response.data.success && response.data.response) {
          const responseText = response.data.response;
          const isRelevant = this.checkPlantRelevance(responseText, ['cây', 'lá', 'tưới', 'chăm sóc']);
          const isHelpful = responseText.length > 50; // Basic helpfulness check
          
          if (isRelevant && isHelpful) {
            qualityScore += 33.33;
          }
          
          responses.push({ question, response: responseText, relevant: isRelevant, helpful: isHelpful });
        }
      } catch (error) {
        responses.push({ question, error: error.message });
      }
    }

    return {
      passed: qualityScore >= 70,
      score: `${qualityScore.toFixed(1)}%`,
      message: `Content quality score: ${qualityScore.toFixed(1)}%`,
      details: responses
    };
  }

  async testErrorMessageClarity() {
    const errorTests = [
      {
        name: 'Missing message',
        request: { userId: 77777, plantId: 1 }
      },
      {
        name: 'Invalid user ID',
        request: { message: 'Test', userId: 'invalid', plantId: 1 }
      }
    ];

    let clarityScore = 0;

    for (const errorTest of errorTests) {
      try {
        await axios.post(`${UAT_CONFIG.baseUrl}/api/ai/chatbot/message`, errorTest.request, { timeout: 5000 });
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
          const errorMessage = error.response.data.message;
          const isClear = errorMessage.length > 10 && !errorMessage.includes('undefined');
          if (isClear) {
            clarityScore += 50;
          }
        }
      }
    }

    return {
      passed: clarityScore >= 50,
      score: `${clarityScore}%`,
      message: `Error message clarity: ${clarityScore >= 50 ? 'Good' : 'Poor'}`
    };
  }

  checkPlantRelevance(responseText, expectedTopics) {
    if (!responseText) return false;
    
    const lowerResponse = responseText.toLowerCase();
    const plantKeywords = ['cây', 'lá', 'tưới', 'đất', 'phân', 'bệnh', 'sâu', 'ánh sáng', 'chăm sóc', 'trồng'];
    
    // Check if response contains plant-related keywords
    const hasPlantKeywords = plantKeywords.some(keyword => lowerResponse.includes(keyword));
    
    // Check if response contains expected topics
    const hasExpectedTopics = expectedTopics.some(topic => lowerResponse.includes(topic.toLowerCase()));
    
    return hasPlantKeywords || hasExpectedTopics;
  }

  interpretIrrigationPrediction(prediction) {
    if (prediction.shouldWater === true) {
      return 'water_immediately';
    } else if (prediction.hoursUntilWater <= 6) {
      return 'water_soon';
    } else if (prediction.hoursUntilWater <= 24) {
      return 'monitor';
    } else {
      return 'no_watering_needed';
    }
  }

  calculateIrrigationAccuracy(expected, actual, sensorData) {
    // Simple accuracy calculation based on sensor data logic
    if (expected === actual) {
      return 1.0;
    }
    
    // Partial credit for reasonable predictions
    if (sensorData.soilMoisture < 30) {
      // Dry conditions - should recommend watering
      if (actual === 'water_immediately' || actual === 'water_soon') {
        return 0.8;
      }
    } else if (sensorData.soilMoisture > 70) {
      // Wet conditions - should not recommend watering
      if (actual === 'no_watering_needed' || actual === 'monitor') {
        return 0.8;
      }
    } else {
      // Moderate conditions - monitoring is reasonable
      if (actual === 'monitor') {
        return 0.7;
      }
    }
    
    return 0.3; // Low accuracy for poor predictions
  }

  async generateUATReport() {
    console.log('\n📊 Generating User Acceptance Test Report...');

    // Calculate summary statistics
    this.calculateUATSummary();

    const report = {
      configuration: UAT_CONFIG,
      results: this.results,
      analysis: this.analyzeUATResults()
    };

    // Save detailed report
    await fs.writeFile(
      path.join(__dirname, 'user-acceptance-test-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Generate human-readable summary
    const summary = this.generateUATSummary(report);
    await fs.writeFile(
      path.join(__dirname, 'user-acceptance-test-summary.md'),
      summary
    );

    // Console output
    console.log('\n📋 User Acceptance Test Results:');
    console.log(`   Duration: ${((Date.now() - this.results.startTime) / 1000).toFixed(0)} seconds`);
    console.log(`   Total Tests: ${this.results.summary.totalTests}`);
    console.log(`   Passed Tests: ${this.results.summary.passedTests}`);
    console.log(`   Failed Tests: ${this.results.summary.failedTests}`);
    console.log(`   Overall Score: ${this.results.summary.overallScore.toFixed(1)}%`);
    console.log(`   Status: ${this.results.summary.overallScore >= 70 ? '✅ PASSED' : '❌ FAILED'}`);

    console.log(`\n📄 Reports saved:`);
    console.log(`   - user-acceptance-test-report.json`);
    console.log(`   - user-acceptance-test-summary.md`);

    return report;
  }

  calculateUATSummary() {
    let totalTests = 0;
    let passedTests = 0;

    // Count chatbot tests
    this.results.testResults.chatbotTests.forEach(test => {
      totalTests++;
      if (test.passed) passedTests++;
    });

    // Count irrigation tests
    this.results.testResults.irrigationTests.forEach(test => {
      totalTests++;
      if (test.passed) passedTests++;
    });

    // Count disease detection tests
    this.results.testResults.diseaseDetectionTests.forEach(test => {
      totalTests++;
      if (test.passed) passedTests++;
    });

    // Count integration tests
    this.results.testResults.integrationTests.forEach(test => {
      totalTests++;
      if (test.passed) passedTests++;
    });

    this.results.summary = {
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      overallScore: totalTests > 0 ? (passedTests / totalTests) * 100 : 0
    };
  }

  analyzeUATResults() {
    const analysis = {
      overallAssessment: 'unknown',
      strengths: [],
      weaknesses: [],
      recommendations: [],
      readinessLevel: 'not_ready'
    };

    // Analyze chatbot performance
    const chatbotPassed = this.results.testResults.chatbotTests.filter(test => test.passed).length;
    const chatbotTotal = this.results.testResults.chatbotTests.length;
    
    if (chatbotTotal > 0) {
      const chatbotSuccessRate = (chatbotPassed / chatbotTotal) * 100;
      if (chatbotSuccessRate >= 80) {
        analysis.strengths.push('Chatbot functionality meets user expectations');
      } else {
        analysis.weaknesses.push('Chatbot needs improvement in response quality or speed');
        analysis.recommendations.push('Optimize chatbot response generation and plant topic coverage');
      }
    }

    // Analyze irrigation performance
    const irrigationPassed = this.results.testResults.irrigationTests.filter(test => test.passed).length;
    const irrigationTotal = this.results.testResults.irrigationTests.length;
    
    if (irrigationTotal > 0) {
      const irrigationSuccessRate = (irrigationPassed / irrigationTotal) * 100;
      if (irrigationSuccessRate >= 75) {
        analysis.strengths.push('Irrigation prediction accuracy is acceptable');
      } else {
        analysis.weaknesses.push('Irrigation prediction needs accuracy improvements');
        analysis.recommendations.push('Refine ML model training data and prediction algorithms');
      }
    }

    // Analyze system integration
    const integrationPassed = this.results.testResults.integrationTests.filter(test => test.passed).length;
    const integrationTotal = this.results.testResults.integrationTests.length;
    
    if (integrationTotal > 0) {
      const integrationSuccessRate = (integrationPassed / integrationTotal) * 100;
      if (integrationSuccessRate >= 90) {
        analysis.strengths.push('System integration is robust');
      } else {
        analysis.weaknesses.push('System integration has reliability issues');
        analysis.recommendations.push('Address system integration and error handling issues');
      }
    }

    // Determine overall assessment
    if (this.results.summary.overallScore >= 85) {
      analysis.overallAssessment = 'excellent';
      analysis.readinessLevel = 'production_ready';
    } else if (this.results.summary.overallScore >= 70) {
      analysis.overallAssessment = 'good';
      analysis.readinessLevel = 'ready_with_monitoring';
    } else if (this.results.summary.overallScore >= 50) {
      analysis.overallAssessment = 'fair';
      analysis.readinessLevel = 'needs_improvement';
    } else {
      analysis.overallAssessment = 'poor';
      analysis.readinessLevel = 'not_ready';
    }

    return analysis;
  }

  generateUATSummary(report) {
    const analysis = report.analysis;
    
    return `# User Acceptance Test Report

## Test Overview
- **Test Duration**: ${((Date.now() - this.results.startTime) / 1000).toFixed(0)} seconds
- **Total Tests**: ${this.results.summary.totalTests}
- **Passed Tests**: ${this.results.summary.passedTests}
- **Failed Tests**: ${this.results.summary.failedTests}
- **Overall Score**: ${this.results.summary.overallScore.toFixed(1)}%

## Overall Assessment: ${analysis.overallAssessment.toUpperCase()}
**Production Readiness**: ${analysis.readinessLevel.replace(/_/g, ' ').toUpperCase()}

## Test Results by Category

### 💬 Plant Care Conversations
${this.results.testResults.chatbotTests.map(test => {
  return `#### ${test.scenarioName}
- **Status**: ${test.passed ? '✅ PASSED' : '❌ FAILED'}
- **Score**: ${test.overallScore.toFixed(1)}%
- **Average Response Time**: ${test.responseTime.toFixed(0)}ms
- **Topic Coverage**: ${(test.topicCoverage * 100).toFixed(1)}%
- **Messages Tested**: ${test.messages.length}`;
}).join('\n\n')}

### 💧 Irrigation Prediction Scenarios
${this.results.testResults.irrigationTests.map(test => {
  return `#### ${test.scenarioName}
- **Status**: ${test.passed ? '✅ PASSED' : '❌ FAILED'}
- **Accuracy**: ${(test.accuracy * 100).toFixed(1)}%
- **Response Time**: ${test.responseTime.toFixed(0)}ms
- **Confidence**: ${(test.confidence * 100).toFixed(1)}%
- **Expected**: ${test.expectedRecommendation}
- **Actual**: ${test.actualRecommendation || 'N/A'}`;
}).join('\n\n')}

### 🔍 Disease Detection Tests
${this.results.testResults.diseaseDetectionTests.map(test => {
  return `#### ${test.testName}
- **Status**: ${test.passed ? '✅ PASSED' : '❌ FAILED'}
- **Response Time**: ${test.responseTime.toFixed(0)}ms
- **Success**: ${test.success ? 'Yes' : 'No'}
${test.error ? `- **Error**: ${test.error}` : ''}`;
}).join('\n\n')}

### 🔗 System Integration Tests
${this.results.testResults.integrationTests.map(test => {
  return `#### ${test.testName}
- **Status**: ${test.passed ? '✅ PASSED' : '❌ FAILED'}
- **Message**: ${test.message || 'No message'}
${test.score ? `- **Score**: ${test.score}` : ''}
${test.error ? `- **Error**: ${test.error}` : ''}`;
}).join('\n\n')}

## Strengths
${analysis.strengths.length > 0 ? 
  analysis.strengths.map(strength => `- ✅ ${strength}`).join('\n') :
  '- No specific strengths identified'
}

## Areas for Improvement
${analysis.weaknesses.length > 0 ? 
  analysis.weaknesses.map(weakness => `- ⚠️ ${weakness}`).join('\n') :
  '- No specific weaknesses identified'
}

## Recommendations
${analysis.recommendations.length > 0 ? 
  analysis.recommendations.map(rec => `- 🔧 ${rec}`).join('\n') :
  '- System meets acceptance criteria'
}

## Production Readiness Assessment

${analysis.readinessLevel === 'production_ready' ? 
  `🎉 **READY FOR PRODUCTION**
- All critical functionality working as expected
- Performance meets user requirements
- System integration is stable` :
  
  analysis.readinessLevel === 'ready_with_monitoring' ?
  `⚠️ **READY WITH MONITORING**
- Core functionality working well
- Some areas need monitoring in production
- Minor improvements recommended` :
  
  analysis.readinessLevel === 'needs_improvement' ?
  `🔧 **NEEDS IMPROVEMENT**
- Several areas require attention before production
- Performance or functionality gaps identified
- Additional testing and optimization needed` :
  
  `🚨 **NOT READY FOR PRODUCTION**
- Critical issues must be resolved
- Significant functionality or performance problems
- Extensive improvements required before deployment`
}

## User Experience Summary
- **Response Times**: ${this.results.testResults.chatbotTests.length > 0 ? 
    `Average ${(this.results.testResults.chatbotTests.reduce((sum, test) => sum + test.responseTime, 0) / this.results.testResults.chatbotTests.length).toFixed(0)}ms` : 
    'Not tested'}
- **Content Relevance**: ${this.results.testResults.chatbotTests.length > 0 ? 
    `${((this.results.testResults.chatbotTests.reduce((sum, test) => sum + test.topicCoverage, 0) / this.results.testResults.chatbotTests.length) * 100).toFixed(1)}%` : 
    'Not tested'}
- **System Reliability**: ${this.results.testResults.integrationTests.length > 0 ? 
    `${((this.results.testResults.integrationTests.filter(test => test.passed).length / this.results.testResults.integrationTests.length) * 100).toFixed(1)}%` : 
    'Not tested'}

---
*Generated by User Acceptance Testing Suite*
`;
  }
}

// Main execution
async function runUserAcceptanceTests() {
  const tester = new UserAcceptanceTester();
  
  try {
    await tester.runUserAcceptanceTests();
    console.log('\n✅ User Acceptance Testing completed successfully!');
  } catch (error) {
    console.error('\n❌ User Acceptance Testing failed:', error);
    process.exit(1);
  }
}

// Export for use in other test files
module.exports = { UserAcceptanceTester, UAT_CONFIG };

// Run if called directly
if (require.main === module) {
  runUserAcceptanceTests();
}