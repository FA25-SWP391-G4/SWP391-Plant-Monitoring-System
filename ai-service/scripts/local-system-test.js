/**
 * Script kiểm tra hệ thống trên môi trường local
 * Chạy: node local-system-test.js
 */

const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');

// Cấu hình
const config = {
  aiServiceUrl: 'http://localhost:3001',
  apiGatewayUrl: 'http://localhost:3000',
  plantServiceUrl: 'http://localhost:3002',
  sensorServiceUrl: 'http://localhost:3003',
  dashboardUrl: 'http://localhost:3001/dashboard.html',
  testPlantId: 'plant-123',
  testDeviceId: 'device-456',
  testUserId: 'user-789'
};

// Tạo interface readline để tương tác với người dùng
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Hàm trợ giúp để log
const log = {
  info: (message) => console.log(chalk.blue(`[INFO] ${message}`)),
  success: (message) => console.log(chalk.green(`[SUCCESS] ${message}`)),
  warning: (message) => console.log(chalk.yellow(`[WARNING] ${message}`)),
  error: (message) => console.log(chalk.red(`[ERROR] ${message}`)),
  title: (message) => console.log(chalk.bgBlue.white(`\n${message}\n`))
};

// Hàm kiểm tra kết nối đến service
async function checkServiceConnection(name, url) {
  try {
    log.info(`Kiểm tra kết nối đến ${name}...`);
    const response = await axios.get(`${url}/health`, { timeout: 5000 });
    if (response.status === 200) {
      log.success(`Kết nối thành công đến ${name}`);
      return true;
    } else {
      log.warning(`Kết nối đến ${name} không ổn định: ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Không thể kết nối đến ${name}: ${error.message}`);
    return false;
  }
}

// Kiểm tra các file mô hình ML
function checkMLModels() {
  log.title('KIỂM TRA MÔ HÌNH ML');
  
  const modelDir = path.join(__dirname, '../models');
  
  if (!fs.existsSync(modelDir)) {
    log.warning(`Thư mục mô hình không tồn tại: ${modelDir}`);
    return false;
  }
  
  const expectedModels = [
    'plant-disease-model.h5',
    'irrigation-prediction-model.pkl',
    'early-warning-model.pkl'
  ];
  
  let allModelsExist = true;
  
  for (const model of expectedModels) {
    const modelPath = path.join(modelDir, model);
    if (fs.existsSync(modelPath)) {
      const stats = fs.statSync(modelPath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      log.success(`Mô hình ${model} tồn tại (${fileSizeInMB.toFixed(2)} MB)`);
    } else {
      log.error(`Mô hình ${model} không tồn tại`);
      allModelsExist = false;
    }
  }
  
  return allModelsExist;
}

// Kiểm tra API phân tích hình ảnh
async function testImageAnalysis() {
  log.title('KIỂM TRA PHÂN TÍCH HÌNH ẢNH');
  
  try {
    log.info('Gửi yêu cầu phân tích hình ảnh mẫu...');
    
    // Sử dụng hình ảnh mẫu hoặc URL hình ảnh
    const response = await axios.post(`${config.aiServiceUrl}/api/ai/analyze-image`, {
      imageUrl: 'https://example.com/sample-plant-image.jpg',
      plantId: config.testPlantId
    });
    
    if (response.data && response.data.analysis) {
      log.success('Phân tích hình ảnh thành công');
      console.log(chalk.cyan('Kết quả:'), response.data.analysis);
      return true;
    } else {
      log.warning('Phân tích hình ảnh không trả về kết quả đầy đủ');
      return false;
    }
  } catch (error) {
    log.error(`Lỗi khi phân tích hình ảnh: ${error.message}`);
    return false;
  }
}

// Kiểm tra API dự đoán tưới cây
async function testIrrigationPrediction() {
  log.title('KIỂM TRA DỰ ĐOÁN TƯỚI CÂY');
  
  try {
    log.info('Gửi yêu cầu dự đoán lịch tưới...');
    
    const response = await axios.post(`${config.aiServiceUrl}/api/ai/predict-irrigation`, {
      plantId: config.testPlantId,
      sensorData: {
        soilMoisture: 35,
        temperature: 28,
        humidity: 65,
        lightIntensity: 800
      }
    });
    
    if (response.data && response.data.prediction) {
      log.success('Dự đoán lịch tưới thành công');
      console.log(chalk.cyan('Kết quả:'), response.data.prediction);
      return true;
    } else {
      log.warning('Dự đoán lịch tưới không trả về kết quả đầy đủ');
      return false;
    }
  } catch (error) {
    log.error(`Lỗi khi dự đoán lịch tưới: ${error.message}`);
    return false;
  }
}

// Kiểm tra API chatbot
async function testChatbot() {
  log.title('KIỂM TRA CHATBOT');
  
  try {
    log.info('Gửi yêu cầu đến chatbot...');
    
    const response = await axios.post(`${config.aiServiceUrl}/api/ai/chatbot`, {
      userId: config.testUserId,
      plantId: config.testPlantId,
      message: 'Cây của tôi có lá vàng, tôi nên làm gì?',
      language: 'vi'
    });
    
    if (response.data && response.data.reply) {
      log.success('Chatbot trả lời thành công');
      console.log(chalk.cyan('Câu hỏi:'), 'Cây của tôi có lá vàng, tôi nên làm gì?');
      console.log(chalk.cyan('Trả lời:'), response.data.reply);
      return true;
    } else {
      log.warning('Chatbot không trả về kết quả đầy đủ');
      return false;
    }
  } catch (error) {
    log.error(`Lỗi khi gọi chatbot: ${error.message}`);
    return false;
  }
}

// Kiểm tra kết nối IoT
async function testIoTConnection() {
  log.title('KIỂM TRA KẾT NỐI IOT');
  
  try {
    log.info('Kiểm tra trạng thái thiết bị IoT...');
    
    const response = await axios.get(`${config.aiServiceUrl}/api/iot/device-status/${config.testDeviceId}`);
    
    if (response.data && response.data.status) {
      log.success('Kiểm tra trạng thái thiết bị IoT thành công');
      console.log(chalk.cyan('Trạng thái:'), response.data.status);
      console.log(chalk.cyan('Chi tiết:'), response.data);
      return true;
    } else {
      log.warning('Kiểm tra trạng thái thiết bị IoT không trả về kết quả đầy đủ');
      return false;
    }
  } catch (error) {
    log.error(`Lỗi khi kiểm tra trạng thái thiết bị IoT: ${error.message}`);
    return false;
  }
}

// Kiểm tra tích hợp giữa các module
async function testModuleIntegration() {
  log.title('KIỂM TRA TÍCH HỢP GIỮA CÁC MODULE');
  
  try {
    log.info('Kiểm tra luồng dữ liệu từ cảm biến đến phân tích và đề xuất...');
    
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
    
    if (!sensorResponse.data.success) {
      log.error('Không thể gửi dữ liệu cảm biến');
      return false;
    }
    
    log.success('Gửi dữ liệu cảm biến thành công');
    
    // 2. Kiểm tra phân tích dữ liệu
    log.info('2. Kiểm tra phân tích dữ liệu...');
    const analysisResponse = await axios.get(`${config.aiServiceUrl}/api/ai/analyze-sensor-data/${config.testPlantId}`);
    
    if (!analysisResponse.data.analysis) {
      log.error('Không thể phân tích dữ liệu cảm biến');
      return false;
    }
    
    log.success('Phân tích dữ liệu cảm biến thành công');
    
    // 3. Kiểm tra đề xuất tưới cây
    log.info('3. Kiểm tra đề xuất tưới cây...');
    const recommendationResponse = await axios.get(`${config.aiServiceUrl}/api/ai/irrigation-recommendation/${config.testPlantId}`);
    
    if (!recommendationResponse.data.recommendation) {
      log.error('Không thể lấy đề xuất tưới cây');
      return false;
    }
    
    log.success('Lấy đề xuất tưới cây thành công');
    console.log(chalk.cyan('Đề xuất:'), recommendationResponse.data.recommendation);
    
    return true;
  } catch (error) {
    log.error(`Lỗi khi kiểm tra tích hợp giữa các module: ${error.message}`);
    return false;
  }
}

// Mở dashboard
function openDashboard() {
  log.title('MỞ BẢNG ĐIỀU KHIỂN');
  
  log.info(`Mở bảng điều khiển tại: ${config.dashboardUrl}`);
  
  // Mở URL trong trình duyệt mặc định
  const command = process.platform === 'win32' 
    ? `start ${config.dashboardUrl}`
    : (process.platform === 'darwin' 
      ? `open ${config.dashboardUrl}` 
      : `xdg-open ${config.dashboardUrl}`);
  
  exec(command, (error) => {
    if (error) {
      log.error(`Không thể mở bảng điều khiển: ${error.message}`);
    } else {
      log.success('Đã mở bảng điều khiển trong trình duyệt');
    }
  });
}

// Kiểm tra và khởi động các dịch vụ nếu cần
async function checkAndStartServices() {
  log.title('KIỂM TRA VÀ KHỞI ĐỘNG DỊCH VỤ');
  
  // Kiểm tra AI Service
  const aiServiceRunning = await checkServiceConnection('AI Service', config.aiServiceUrl);
  if (!aiServiceRunning) {
    log.warning('AI Service không hoạt động. Bạn có muốn khởi động không? (y/n)');
    const answer = await new Promise(resolve => rl.question('', resolve));
    
    if (answer.toLowerCase() === 'y') {
      log.info('Đang khởi động AI Service...');
      // Khởi động AI Service
      exec('cd .. && npm run start:ai-service', (error, stdout, stderr) => {
        if (error) {
          log.error(`Không thể khởi động AI Service: ${error.message}`);
        } else {
          log.success('Đã khởi động AI Service');
        }
      });
    }
  }
  
  // Kiểm tra API Gateway
  const apiGatewayRunning = await checkServiceConnection('API Gateway', config.apiGatewayUrl);
  if (!apiGatewayRunning) {
    log.warning('API Gateway không hoạt động. Bạn có muốn khởi động không? (y/n)');
    const answer = await new Promise(resolve => rl.question('', resolve));
    
    if (answer.toLowerCase() === 'y') {
      log.info('Đang khởi động API Gateway...');
      // Khởi động API Gateway
      exec('cd .. && npm run start:api-gateway', (error, stdout, stderr) => {
        if (error) {
          log.error(`Không thể khởi động API Gateway: ${error.message}`);
        } else {
          log.success('Đã khởi động API Gateway');
        }
      });
    }
  }
}

// Hàm chính để chạy tất cả các kiểm tra
async function runAllTests() {
  log.title('BẮT ĐẦU KIỂM TRA HỆ THỐNG');
  
  try {
    // Kiểm tra và khởi động các dịch vụ
    await checkAndStartServices();
    
    // Kiểm tra các mô hình ML
    const mlModelsOk = checkMLModels();
    
    // Kiểm tra các API
    const imageAnalysisOk = await testImageAnalysis();
    const irrigationPredictionOk = await testIrrigationPrediction();
    const chatbotOk = await testChatbot();
    const iotConnectionOk = await testIoTConnection();
    
    // Kiểm tra tích hợp
    const integrationOk = await testModuleIntegration();
    
    // Mở dashboard
    openDashboard();
    
    // Tổng kết
    log.title('KẾT QUẢ KIỂM TRA');
    
    console.log(chalk.cyan('Mô hình ML:'), mlModelsOk ? chalk.green('OK') : chalk.red('Lỗi'));
    console.log(chalk.cyan('Phân tích hình ảnh:'), imageAnalysisOk ? chalk.green('OK') : chalk.red('Lỗi'));
    console.log(chalk.cyan('Dự đoán tưới cây:'), irrigationPredictionOk ? chalk.green('OK') : chalk.red('Lỗi'));
    console.log(chalk.cyan('Chatbot:'), chatbotOk ? chalk.green('OK') : chalk.red('Lỗi'));
    console.log(chalk.cyan('Kết nối IoT:'), iotConnectionOk ? chalk.green('OK') : chalk.red('Lỗi'));
    console.log(chalk.cyan('Tích hợp giữa các module:'), integrationOk ? chalk.green('OK') : chalk.red('Lỗi'));
    
    const overallStatus = (mlModelsOk && imageAnalysisOk && irrigationPredictionOk && 
                          chatbotOk && iotConnectionOk && integrationOk);
    
    console.log('\n' + chalk.cyan('Trạng thái tổng thể:'), 
                overallStatus ? chalk.green('HỆ THỐNG HOẠT ĐỘNG TỐT') : chalk.yellow('HỆ THỐNG CẦN ĐƯỢC KIỂM TRA THÊM'));
    
    if (!overallStatus) {
      console.log(chalk.yellow('\nGợi ý khắc phục:'));
      if (!mlModelsOk) console.log('- Kiểm tra lại các file mô hình ML trong thư mục models');
      if (!imageAnalysisOk) console.log('- Kiểm tra API phân tích hình ảnh và mô hình liên quan');
      if (!irrigationPredictionOk) console.log('- Kiểm tra API dự đoán tưới cây và mô hình liên quan');
      if (!chatbotOk) console.log('- Kiểm tra cấu hình OpenRouter API và Mistral 7B trong chatbotController.js');
      if (!iotConnectionOk) console.log('- Kiểm tra kết nối đến các thiết bị IoT và cấu hình liên quan');
      if (!integrationOk) console.log('- Kiểm tra luồng dữ liệu và tích hợp giữa các module');
    }
    
  } catch (error) {
    log.error(`Lỗi khi chạy kiểm tra: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Chạy tất cả các kiểm tra
runAllTests();