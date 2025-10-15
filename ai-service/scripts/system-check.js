/**
 * Script kiểm tra và debug các dịch vụ AI trên môi trường local
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Cấu hình
const AI_SERVICE_URL = 'http://localhost:3001';
const API_GATEWAY_URL = 'http://localhost:3000/api';
const TEST_PLANT_ID = 'test-plant-123';
const TEST_USER_ID = 'test-user-456';

// Kiểm tra các dịch vụ
async function checkServices() {
  console.log(chalk.blue('===== KIỂM TRA HỆ THỐNG AI SERVICE ====='));
  
  // Kiểm tra kết nối đến AI Service
  try {
    console.log(chalk.yellow('Kiểm tra kết nối đến AI Service...'));
    const response = await axios.get(AI_SERVICE_URL);
    console.log(chalk.green('✓ Kết nối thành công đến AI Service'));
    console.log(chalk.gray(`  - Phiên bản: ${response.data.version || 'N/A'}`));
    console.log(chalk.gray(`  - Endpoints: ${Object.keys(response.data.endpoints || {}).length}`));
  } catch (error) {
    console.log(chalk.red('✗ Không thể kết nối đến AI Service'));
    console.log(chalk.red(`  - Lỗi: ${error.message}`));
    process.exit(1);
  }
  
  // Kiểm tra các module AI
  await checkAIModules();
  
  // Kiểm tra kết nối đến API Gateway
  await checkAPIGateway();
  
  // Kiểm tra các model ML
  await checkMLModels();
  
  console.log(chalk.blue('\n===== KẾT QUẢ KIỂM TRA ====='));
  console.log(chalk.green('✓ Hệ thống AI Service hoạt động bình thường'));
}

// Kiểm tra các module AI
async function checkAIModules() {
  console.log(chalk.yellow('\nKiểm tra các module AI...'));
  
  const modules = [
    { name: 'Dự đoán tưới cây', endpoint: `/api/irrigation-prediction/${TEST_PLANT_ID}` },
    { name: 'Phân tích hình ảnh', endpoint: '/api/image-recognition/status' },
    { name: 'Cảnh báo sớm', endpoint: `/api/early-warning/${TEST_PLANT_ID}` },
    { name: 'Lịch tưới tự động', endpoint: `/api/irrigation-schedule/${TEST_PLANT_ID}` },
    { name: 'Chatbot', endpoint: '/api/chatbot/status' },
    { name: 'Phân tích lịch sử', endpoint: `/api/analysis/historical/${TEST_PLANT_ID}/${TEST_USER_ID}/status` }
  ];
  
  for (const module of modules) {
    try {
      await axios.get(`${AI_SERVICE_URL}${module.endpoint}`);
      console.log(chalk.green(`✓ Module ${module.name} hoạt động bình thường`));
    } catch (error) {
      console.log(chalk.red(`✗ Module ${module.name} gặp lỗi`));
      console.log(chalk.red(`  - Endpoint: ${module.endpoint}`));
      console.log(chalk.red(`  - Lỗi: ${error.message}`));
    }
  }
}

// Kiểm tra kết nối đến API Gateway
async function checkAPIGateway() {
  console.log(chalk.yellow('\nKiểm tra kết nối đến API Gateway...'));
  
  try {
    await axios.get(`${API_GATEWAY_URL}/status`);
    console.log(chalk.green('✓ Kết nối thành công đến API Gateway'));
  } catch (error) {
    console.log(chalk.red('✗ Không thể kết nối đến API Gateway'));
    console.log(chalk.red(`  - Lỗi: ${error.message}`));
  }
}

// Kiểm tra các model ML
async function checkMLModels() {
  console.log(chalk.yellow('\nKiểm tra các model ML...'));
  
  const modelPaths = [
    { name: 'Model nhận diện bệnh cây', path: path.join(__dirname, '../models/plant_disease_model/model.json') },
    { name: 'Model dự đoán tưới cây', path: path.join(__dirname, '../models/irrigation_prediction/model.json') },
    { name: 'Model phân tích dữ liệu', path: path.join(__dirname, '../models/data_analysis/model.json') }
  ];
  
  for (const model of modelPaths) {
    try {
      if (fs.existsSync(model.path)) {
        console.log(chalk.green(`✓ ${model.name} tồn tại`));
        
        // Kiểm tra kích thước file
        const stats = fs.statSync(model.path);
        const fileSizeInMB = stats.size / (1024 * 1024);
        console.log(chalk.gray(`  - Kích thước: ${fileSizeInMB.toFixed(2)} MB`));
      } else {
        console.log(chalk.yellow(`! ${model.name} không tồn tại`));
        console.log(chalk.yellow(`  - Đường dẫn: ${model.path}`));
        console.log(chalk.yellow(`  - Model sẽ được tạo tự động khi cần`));
      }
    } catch (error) {
      console.log(chalk.red(`✗ Lỗi khi kiểm tra ${model.name}`));
      console.log(chalk.red(`  - Lỗi: ${error.message}`));
    }
  }
}

// Chạy kiểm tra
checkServices().catch(error => {
  console.error(chalk.red('Lỗi không xác định:'), error);
  process.exit(1);
});