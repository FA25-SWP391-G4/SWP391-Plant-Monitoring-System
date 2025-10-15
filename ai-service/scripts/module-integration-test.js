/**
 * Script kiểm tra tích hợp giữa các module
 * Chạy: node module-integration-test.js
 */

const axios = require('axios');
const chalk = require('chalk');

// Cấu hình
const config = {
  aiServiceUrl: 'http://localhost:3001',
  apiGatewayUrl: 'http://localhost:3000',
  plantServiceUrl: 'http://localhost:3002',
  sensorServiceUrl: 'http://localhost:3003',
  testPlantId: 'plant-123',
  testDeviceId: 'device-456',
  testUserId: 'user-789'
};

// Hàm trợ giúp để log
const log = {
  info: (message) => console.log(chalk.blue(`[INFO] ${message}`)),
  success: (message) => console.log(chalk.green(`[SUCCESS] ${message}`)),
  warning: (message) => console.log(chalk.yellow(`[WARNING] ${message}`)),
  error: (message) => console.log(chalk.red(`[ERROR] ${message}`)),
  title: (message) => console.log(chalk.bgBlue.white(`\n${message}\n`))
};

// Kiểm tra luồng dữ liệu từ cảm biến đến phân tích và đề xuất
async function testSensorToAnalysisFlow() {
  log.title('KIỂM TRA LUỒNG DỮ LIỆU: CẢM BIẾN -> PHÂN TÍCH -> ĐỀ XUẤT');
  
  try {
    // Mô phỏng dữ liệu cảm biến
    const sensorData = {
      soilMoisture: 30,
      temperature: 29,
      humidity: 60,
      lightIntensity: 750,
      timestamp: new Date().toISOString()
    };
    
    // 1. Gửi dữ liệu cảm biến
    log.info('1. Gửi dữ liệu cảm biến...');
    const sensorResponse = await axios.post(`${config.sensorServiceUrl}/api/sensors/data`, {
      deviceId: config.testDeviceId,
      plantId: config.testPlantId,
      data: sensorData
    });
    
    log.success('Gửi dữ liệu cảm biến thành công');
    
    // 2. Kiểm tra phân tích dữ liệu
    log.info('2. Kiểm tra phân tích dữ liệu...');
    const analysisResponse = await axios.get(`${config.aiServiceUrl}/api/ai/analyze-sensor-data/${config.testPlantId}`);
    
    log.success('Phân tích dữ liệu cảm biến thành công');
    console.log(chalk.cyan('Kết quả phân tích:'), analysisResponse.data.analysis);
    
    // 3. Kiểm tra đề xuất tưới cây
    log.info('3. Kiểm tra đề xuất tưới cây...');
    const recommendationResponse = await axios.get(`${config.aiServiceUrl}/api/ai/irrigation-recommendation/${config.testPlantId}`);
    
    log.success('Lấy đề xuất tưới cây thành công');
    console.log(chalk.cyan('Đề xuất:'), recommendationResponse.data.recommendation);
    
    return true;
  } catch (error) {
    log.error(`Lỗi khi kiểm tra luồng dữ liệu: ${error.message}`);
    return false;
  }
}

// Kiểm tra luồng từ phân tích hình ảnh đến chatbot
async function testImageToChatbotFlow() {
  log.title('KIỂM TRA LUỒNG: PHÂN TÍCH HÌNH ẢNH -> CHATBOT');
  
  try {
    // 1. Phân tích hình ảnh
    log.info('1. Gửi yêu cầu phân tích hình ảnh...');
    const imageResponse = await axios.post(`${config.aiServiceUrl}/api/ai/analyze-image`, {
      imageUrl: 'https://example.com/sample-plant-image.jpg',
      plantId: config.testPlantId
    });
    
    log.success('Phân tích hình ảnh thành công');
    console.log(chalk.cyan('Kết quả phân tích:'), imageResponse.data.analysis);
    
    // 2. Gửi kết quả phân tích đến chatbot
    log.info('2. Gửi kết quả phân tích đến chatbot...');
    const chatbotResponse = await axios.post(`${config.aiServiceUrl}/api/ai/chatbot`, {
      userId: config.testUserId,
      plantId: config.testPlantId,
      message: `Hình ảnh cây của tôi cho thấy: ${imageResponse.data.analysis.summary}. Tôi nên làm gì?`,
      language: 'vi'
    });
    
    log.success('Chatbot trả lời thành công');
    console.log(chalk.cyan('Câu hỏi:'), `Hình ảnh cây của tôi cho thấy: ${imageResponse.data.analysis.summary}. Tôi nên làm gì?`);
    console.log(chalk.cyan('Trả lời:'), chatbotResponse.data.reply);
    
    return true;
  } catch (error) {
    log.error(`Lỗi khi kiểm tra luồng phân tích hình ảnh đến chatbot: ${error.message}`);
    return false;
  }
}

// Kiểm tra luồng từ dự đoán tưới đến lịch tưới tự động
async function testPredictionToScheduleFlow() {
  log.title('KIỂM TRA LUỒNG: DỰ ĐOÁN TƯỚI -> LỊCH TƯỚI TỰ ĐỘNG');
  
  try {
    // 1. Dự đoán lịch tưới
    log.info('1. Gửi yêu cầu dự đoán lịch tưới...');
    const predictionResponse = await axios.post(`${config.aiServiceUrl}/api/ai/predict-irrigation`, {
      plantId: config.testPlantId,
      sensorData: {
        soilMoisture: 35,
        temperature: 28,
        humidity: 65,
        lightIntensity: 800
      }
    });
    
    log.success('Dự đoán lịch tưới thành công');
    console.log(chalk.cyan('Kết quả dự đoán:'), predictionResponse.data.prediction);
    
    // 2. Tạo lịch tưới tự động
    log.info('2. Tạo lịch tưới tự động dựa trên dự đoán...');
    const scheduleResponse = await axios.post(`${config.aiServiceUrl}/api/ai/create-irrigation-schedule`, {
      plantId: config.testPlantId,
      deviceId: config.testDeviceId,
      prediction: predictionResponse.data.prediction
    });
    
    log.success('Tạo lịch tưới tự động thành công');
    console.log(chalk.cyan('Lịch tưới:'), scheduleResponse.data.schedule);
    
    return true;
  } catch (error) {
    log.error(`Lỗi khi kiểm tra luồng dự đoán đến lịch tưới: ${error.message}`);
    return false;
  }
}

// Kiểm tra tích hợp API Gateway với các service
async function testApiGatewayIntegration() {
  log.title('KIỂM TRA TÍCH HỢP API GATEWAY');
  
  try {
    // 1. Kiểm tra API Gateway đến AI Service
    log.info('1. Kiểm tra API Gateway đến AI Service...');
    const aiResponse = await axios.get(`${config.apiGatewayUrl}/api/ai/health`);
    
    log.success('Kết nối API Gateway đến AI Service thành công');
    
    // 2. Kiểm tra API Gateway đến Plant Service
    log.info('2. Kiểm tra API Gateway đến Plant Service...');
    const plantResponse = await axios.get(`${config.apiGatewayUrl}/api/plants/health`);
    
    log.success('Kết nối API Gateway đến Plant Service thành công');
    
    // 3. Kiểm tra API Gateway đến Sensor Service
    log.info('3. Kiểm tra API Gateway đến Sensor Service...');
    const sensorResponse = await axios.get(`${config.apiGatewayUrl}/api/sensors/health`);
    
    log.success('Kết nối API Gateway đến Sensor Service thành công');
    
    return true;
  } catch (error) {
    log.error(`Lỗi khi kiểm tra tích hợp API Gateway: ${error.message}`);
    return false;
  }
}

// Hàm chính để chạy tất cả các kiểm tra
async function runAllTests() {
  log.title('BẮT ĐẦU KIỂM TRA TÍCH HỢP GIỮA CÁC MODULE');
  
  try {
    // Kiểm tra các luồng tích hợp
    const sensorToAnalysisOk = await testSensorToAnalysisFlow();
    const imageToChatbotOk = await testImageToChatbotFlow();
    const predictionToScheduleOk = await testPredictionToScheduleFlow();
    const apiGatewayIntegrationOk = await testApiGatewayIntegration();
    
    // Tổng kết
    log.title('KẾT QUẢ KIỂM TRA TÍCH HỢP');
    
    console.log(chalk.cyan('Luồng Cảm biến -> Phân tích -> Đề xuất:'), sensorToAnalysisOk ? chalk.green('OK') : chalk.red('Lỗi'));
    console.log(chalk.cyan('Luồng Phân tích hình ảnh -> Chatbot:'), imageToChatbotOk ? chalk.green('OK') : chalk.red('Lỗi'));
    console.log(chalk.cyan('Luồng Dự đoán tưới -> Lịch tưới tự động:'), predictionToScheduleOk ? chalk.green('OK') : chalk.red('Lỗi'));
    console.log(chalk.cyan('Tích hợp API Gateway:'), apiGatewayIntegrationOk ? chalk.green('OK') : chalk.red('Lỗi'));
    
    const overallStatus = (sensorToAnalysisOk && imageToChatbotOk && predictionToScheduleOk && apiGatewayIntegrationOk);
    
    console.log('\n' + chalk.cyan('Trạng thái tích hợp tổng thể:'), 
                overallStatus ? chalk.green('TÍCH HỢP HOẠT ĐỘNG TỐT') : chalk.yellow('TÍCH HỢP CẦN ĐƯỢC KIỂM TRA THÊM'));
    
    if (!overallStatus) {
      console.log(chalk.yellow('\nGợi ý khắc phục:'));
      if (!sensorToAnalysisOk) console.log('- Kiểm tra luồng dữ liệu từ cảm biến đến phân tích và đề xuất');
      if (!imageToChatbotOk) console.log('- Kiểm tra luồng từ phân tích hình ảnh đến chatbot');
      if (!predictionToScheduleOk) console.log('- Kiểm tra luồng từ dự đoán tưới đến lịch tưới tự động');
      if (!apiGatewayIntegrationOk) console.log('- Kiểm tra tích hợp API Gateway với các service');
    }
    
    return overallStatus;
  } catch (error) {
    log.error(`Lỗi khi chạy kiểm tra tích hợp: ${error.message}`);
    return false;
  }
}

// Chạy tất cả các kiểm tra
runAllTests();