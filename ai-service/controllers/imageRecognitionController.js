const fs = require('fs');
const path = require('path');
const axios = require('axios');
// Loại bỏ phụ thuộc vào sharp
// const sharp = require('sharp');
// Sử dụng mô phỏng thay vì kết nối PostgreSQL thực tế
// const { Pool } = require('pg');
require('dotenv').config();

// Kết nối PostgreSQL
// const pool = new Pool({
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
// });

// Mô phỏng lưu kết quả phân tích
const saveAnalysisResult = async (userId, plantId, imagePath, analysis) => {
  try {
    console.log(`[MÔ PHỎNG] Đã lưu kết quả phân tích cho user ${userId}, plant ${plantId}`);
    return {
      id: Math.floor(Math.random() * 1000),
      user_id: userId,
      plant_id: plantId,
      image_path: imagePath,
      analysis_result: analysis,
      created_at: new Date().toISOString()
    };
  } catch (error) {
    console.error('Lỗi khi lưu kết quả phân tích:', error);
    return null;
  }
};

// Hàm xử lý ảnh trước khi phân tích
const preprocessImage = async (imagePath) => {
  try {
    // Mô phỏng tiền xử lý ảnh thay vì sử dụng sharp
    console.log(`[MÔ PHỎNG] Đã xử lý ảnh: ${imagePath}`);
    const processedImagePath = imagePath.replace('.', '_processed.');
    
    // Tạo một bản sao đơn giản của file ảnh
    if (fs.existsSync(imagePath)) {
      fs.copyFileSync(imagePath, processedImagePath);
    }
    
    return processedImagePath;
  } catch (error) {
    console.error('Lỗi tiền xử lý ảnh:', error);
    return imagePath; // Trả về ảnh gốc nếu có lỗi
  }
};

// Phân tích ảnh bằng AI (giả lập)
async function analyzeImage(imagePath) {
  try {
    // Sử dụng phân tích giả lập để kiểm thử
    const fileName = path.basename(imagePath);
    const fileSize = fs.existsSync(imagePath) ? fs.statSync(imagePath).size : 1000;
    
    // Tạo một số ngẫu nhiên dựa trên tên file và kích thước
    const hash = fileName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) + fileSize;
    
    // Danh sách các loại bệnh và tình trạng cây
    const plantConditions = [
      'Khỏe mạnh',
      'Thiếu nước',
      'Thừa nước',
      'Bệnh đốm lá',
      'Bệnh thối rễ',
      'Thiếu dinh dưỡng',
      'Cháy lá do nắng',
      'Côn trùng gây hại'
    ];
    
    // Xác định tình trạng cây dựa trên tên file hoặc ngẫu nhiên
    let predictedClass = hash % plantConditions.length;
    if (fileName.includes('healthy') || fileName.includes('khoe')) {
      predictedClass = 0; // Khỏe mạnh
    } else if (fileName.includes('water') || fileName.includes('nuoc')) {
      predictedClass = 1; // Thiếu nước
    } else if (fileName.includes('spot') || fileName.includes('dom')) {
      predictedClass = 3; // Bệnh đốm lá
    }
    
    const condition = plantConditions[predictedClass] || 'Không xác định';
    const maxProb = (hash % 50 + 50) / 100; // 0.5 - 0.99
    const healthScore = Math.round(maxProb * 100);
    
    // Tạo đề xuất dựa trên tình trạng
    const recommendations = generateRecommendations(condition);
    
    console.log(`[TEST] Phân tích ảnh giả lập: ${condition} (${healthScore}%)`);
    
    return {
      condition: condition,
      healthScore: healthScore,
      confidence: maxProb.toFixed(4),
      recommendations: recommendations,
      detectedAt: new Date().toISOString(),
      imageId: path.basename(imagePath)
    };
  } catch (error) {
    console.error('Lỗi trong quá trình phân tích ảnh:', error);
    return fallbackAnalysis(imagePath);
  }
};

// Phân tích dự phòng khi không thể sử dụng mô hình AI
function fallbackAnalysis(imagePath) {
  // Phân tích đơn giản dựa trên tên file và kích thước
  const fileInfo = path.parse(imagePath);
  const fileStats = fs.statSync(imagePath);
  const fileSize = fileStats.size / (1024 * 1024); // Convert to MB
  
  // Phân loại cây dựa trên tên file (mô phỏng)
  let plantType = 'Không xác định';
  if (fileInfo.name.includes('tomato') || fileInfo.name.includes('ca-chua')) {
    plantType = 'Cà chua';
  } else if (fileInfo.name.includes('lettuce') || fileInfo.name.includes('xa-lach')) {
    plantType = 'Xà lách';
  } else if (fileInfo.name.includes('cucumber') || fileInfo.name.includes('dua-chuot')) {
    plantType = 'Dưa chuột';
  } else if (fileInfo.name.includes('pepper') || fileInfo.name.includes('ot')) {
    plantType = 'Ớt';
  }
  
  // Mô phỏng tình trạng cây
  const plantConditions = [
    'Khỏe mạnh',
    'Thiếu nước',
    'Thừa nước',
    'Bệnh đốm lá',
    'Thiếu dinh dưỡng'
  ];
  
  const condition = plantConditions[Math.floor(Math.random() * plantConditions.length)];
  const recommendations = generateRecommendations(condition);
  
  return {
    plantType: plantType,
    condition: condition,
    healthScore: Math.floor(Math.random() * 100),
    confidence: 0.65,
    recommendations: recommendations,
    detectedAt: new Date().toISOString(),
    imageId: path.basename(imagePath),
    analysisMethod: 'fallback',
    note: 'Phân tích dự phòng do không thể sử dụng mô hình AI'
  };
};

// Controller cho nhận diện hình ảnh
const imageRecognitionController = {
  // Phân tích hình ảnh cây trồng
  analyzeImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: true, message: 'Không tìm thấy file hình ảnh' });
      }

      const { plantId = 'unknown', userId = 'guest' } = req.body;
      const imagePath = req.file.path;
      
      // Tiền xử lý ảnh
      const processedImagePath = await preprocessImage(imagePath);
      
      // Phân tích ảnh sử dụng mô hình AI
      const analysisResult = await analyzeImage(processedImagePath);
      
      // Lưu kết quả phân tích
      await saveAnalysisResult(userId, plantId, imagePath, analysisResult);
      
      // Trả về kết quả
      return res.json({
        success: true,
        plantId,
        ...analysisResult
      });
      
    } catch (error) {
      console.error('Lỗi khi phân tích hình ảnh:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi phân tích hình ảnh'
      });
    }
  },

  // Lấy lịch sử phân tích ảnh
  getAnalysisHistory: async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: true, message: 'Thiếu thông tin người dùng' });
      }
      
      // Lấy lịch sử phân tích từ database
      const query = `
        SELECT * FROM image_analysis 
        WHERE user_id = $1 
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [userId]);
      
      return res.status(200).json({
        success: true,
        history: result.rows || []
      });
    } catch (error) {
      console.error('Lỗi lấy lịch sử phân tích:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi lấy lịch sử phân tích ảnh',
        details: error.message
      });
    }
  }
};

// Hàm phụ trợ cho phân tích ảnh
function generateRecommendations(condition) {
  let recommendations = [];
  
  switch (condition) {
    case 'Khỏe mạnh':
      recommendations = [
        'Tiếp tục chế độ chăm sóc hiện tại',
        'Kiểm tra định kỳ mỗi tuần'
      ];
      break;
    case 'Thiếu nước':
      recommendations = [
        'Tăng tần suất tưới nước',
        'Tưới vào buổi sáng sớm hoặc chiều muộn',
        'Kiểm tra độ ẩm đất thường xuyên'
      ];
      break;
    case 'Thừa nước':
      recommendations = [
        'Giảm tần suất tưới nước',
        'Đảm bảo đất có khả năng thoát nước tốt',
        'Kiểm tra hệ thống thoát nước'
      ];
      break;
    case 'Bị sâu bệnh':
      recommendations = [
        'Sử dụng thuốc trừ sâu tự nhiên',
        'Cách ly cây bị nhiễm bệnh',
        'Kiểm tra các cây xung quanh'
      ];
      break;
    case 'Thiếu dinh dưỡng':
      recommendations = [
        'Bổ sung phân bón hữu cơ',
        'Kiểm tra độ pH của đất',
        'Thay đổi chế độ bón phân'
      ];
      break;
  }
  
  return recommendations;
}

module.exports = imageRecognitionController;