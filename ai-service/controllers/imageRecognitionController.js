/**
 * Controller xử lý nhận diện tình trạng cây qua hình ảnh
 */

const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');
const axios = require('axios');
// const sharp = require('sharp');
// const tf = require('@tensorflow/tfjs-node');

// Cấu hình lưu trữ file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'plant-image-' + uniqueSuffix + ext);
  }
});

// Cấu hình upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file hình ảnh'), false);
    }
  }
});

// Mô phỏng lưu kết quả phân tích
const saveAnalysisResult = async (userId, plantId, imagePath, analysis) => {
  try {
    // Trong môi trường thực tế, sẽ lưu vào database
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

// Tiền xử lý hình ảnh (mô phỏng)
const preprocessImage = async (imagePath) => {
  try {
    // Mô phỏng tiền xử lý hình ảnh
    console.log(`Preprocessing image: ${imagePath}`);
    
    // Trong thực tế sẽ sử dụng sharp để resize và xử lý ảnh
    // const imageBuffer = await sharp(imagePath).resize(224, 224).toBuffer();
    
    return {
      width: 224,
      height: 224,
      channels: 3,
      processed: true
    };
  } catch (error) {
    console.error('Lỗi khi tiền xử lý hình ảnh:', error);
    throw error;
  }
};

// Phân tích hình ảnh sử dụng mô hình AI
const analyzeImageWithAI = async (imagePath) => {
  try {
    // Tiền xử lý hình ảnh
    const processedImage = await preprocessImage(imagePath);
    
    // Trong môi trường thực tế, sẽ tải mô hình đã huấn luyện
    // const model = await tf.loadLayersModel('file://path/to/model/model.json');
    
    // Mô phỏng phân tích với AI
    console.log('Đang phân tích hình ảnh với AI...');
    
    // Phân tích màu sắc của hình ảnh để mô phỏng kết quả
    const imageStats = await analyzeImageColors(imagePath);
    
    // Mô phỏng kết quả phân tích dựa trên thống kê màu sắc
    const result = simulateAIAnalysis(imageStats);
    
    return {
      ...result,
      analysisMethod: 'ai',
      confidence: 0.85 + Math.random() * 0.1
    };
  } catch (error) {
    console.error('Lỗi khi phân tích hình ảnh với AI:', error);
    // Sử dụng phân tích dự phòng nếu AI thất bại
    return fallbackAnalysis(imagePath);
  }
};

// Phân tích màu sắc của hình ảnh (mô phỏng)
const analyzeImageColors = async (imagePath) => {
  try {
    // Mô phỏng phân tích màu sắc
    console.log(`Analyzing colors for: ${imagePath}`);
    
    // Trong thực tế sẽ sử dụng sharp để phân tích thống kê màu sắc
    // const stats = await sharp(imagePath).stats();
    
    // Tạo dữ liệu mô phỏng dựa trên tên file
    const fileName = path.basename(imagePath).toLowerCase();
    let redMean = 100 + Math.random() * 50;
    let greenMean = 120 + Math.random() * 60;
    let blueMean = 80 + Math.random() * 40;
    
    // Điều chỉnh dựa trên tên file để mô phỏng các tình trạng khác nhau
    if (fileName.includes('healthy') || fileName.includes('green')) {
      greenMean += 30;
    } else if (fileName.includes('disease') || fileName.includes('sick')) {
      redMean += 40;
      greenMean -= 20;
    } else if (fileName.includes('dry') || fileName.includes('yellow')) {
      redMean += 20;
      blueMean += 15;
      greenMean -= 10;
    }
    
    const greenness = greenMean / (redMean + blueMean + 0.01);
    const contrast = 15 + Math.random() * 20;
    
    return {
      redMean,
      greenMean,
      blueMean,
      greenness,
      contrast
    };
  } catch (error) {
    console.error('Lỗi khi phân tích màu sắc hình ảnh:', error);
    return {
      redMean: 128,
      greenMean: 128,
      blueMean: 128,
      greenness: 0.5,
      contrast: 20
    };
  }
};

// Mô phỏng phân tích AI dựa trên thống kê màu sắc
const simulateAIAnalysis = (imageStats) => {
  const { greenness, contrast, redMean, blueMean } = imageStats;
  
  // Xác định tình trạng cây dựa trên chỉ số xanh
  let condition = 'Khỏe mạnh';
  let healthScore = 85;
  let diseaseDetected = false;
  let diseaseName = null;
  let diseaseConfidence = 0;
  let growthStage = 'Trưởng thành';
  
  // Phân tích tình trạng dựa trên màu sắc
  if (greenness < 0.8) {
    // Thiếu dinh dưỡng hoặc bị bệnh nếu không đủ xanh
    healthScore = Math.max(30, Math.round(greenness * 100));
    
    if (redMean > 150 && greenness < 0.6) {
      condition = 'Bị bệnh đốm lá';
      diseaseDetected = true;
      diseaseName = 'Bệnh đốm lá';
      diseaseConfidence = 0.7 + Math.random() * 0.2;
      healthScore -= 20;
    } else if (blueMean > 150 && greenness < 0.7) {
      condition = 'Thiếu nước';
      healthScore -= 15;
    } else {
      condition = 'Thiếu dinh dưỡng';
      healthScore -= 10;
    }
  } else if (contrast < 15) {
    // Độ tương phản thấp có thể là dấu hiệu của bệnh phấn trắng
    condition = 'Bị bệnh phấn trắng';
    diseaseDetected = true;
    diseaseName = 'Bệnh phấn trắng';
    diseaseConfidence = 0.65 + Math.random() * 0.2;
    healthScore -= 25;
  } else if (greenness > 1.2) {
    // Quá xanh có thể là dấu hiệu của thừa phân đạm
    condition = 'Thừa phân đạm';
    healthScore -= 5;
  }
  
  // Xác định giai đoạn phát triển dựa trên kích thước và màu sắc
  if (contrast > 30) {
    growthStage = 'Đang phát triển';
  } else if (greenness > 1.0) {
    growthStage = 'Giai đoạn sinh trưởng mạnh';
  } else if (greenness < 0.7) {
    growthStage = 'Giai đoạn già cỗi';
  }
  
  // Tạo đề xuất dựa trên tình trạng
  const recommendations = generateRecommendations(condition, healthScore, diseaseDetected);
  
  return {
    condition,
    healthScore: Math.max(0, Math.min(100, healthScore)),
    diseaseDetected,
    diseaseName,
    diseaseConfidence,
    growthStage,
    recommendations,
    detectedAt: new Date().toISOString(),
    imageStats: {
      greenness: parseFloat(greenness.toFixed(2)),
      contrast: parseFloat(contrast.toFixed(2))
    }
  };
};

// Phân tích dự phòng khi không thể sử dụng mô hình AI
const fallbackAnalysis = (imagePath) => {
  // Phân tích đơn giản dựa trên tên file và kích thước
  const fileInfo = path.parse(imagePath);
  const fileStats = fs.statSync(imagePath);
  const fileSize = fileStats.size / (1024 * 1024); // Convert to MB
  
  // Phân loại cây dựa trên tên file (mô phỏng)
  let plantType = 'Không xác định';
  if (fileInfo.name.toLowerCase().includes('tomato') || fileInfo.name.toLowerCase().includes('ca-chua')) {
    plantType = 'Cà chua';
  } else if (fileInfo.name.toLowerCase().includes('rice') || fileInfo.name.toLowerCase().includes('lua')) {
    plantType = 'Lúa';
  } else if (fileInfo.name.toLowerCase().includes('pepper') || fileInfo.name.toLowerCase().includes('ot')) {
    plantType = 'Ớt';
  } else {
    plantType = 'Cây trồng khác';
  }
  
  // Xác định tình trạng cây dựa trên kích thước file (mô phỏng)
  let condition = 'Khỏe mạnh';
  let healthScore = 85;
  let diseaseDetected = false;
  
  if (fileSize < 0.5) {
    condition = 'Thiếu nước';
    healthScore = 60;
  } else if (fileSize > 5) {
    condition = 'Thừa nước';
    healthScore = 70;
  } else if (fileSize > 2 && fileSize < 3) {
    condition = 'Bị sâu bệnh';
    healthScore = 40;
    diseaseDetected = true;
  } else if (fileSize > 3 && fileSize < 4) {
    condition = 'Thiếu dinh dưỡng';
    healthScore = 65;
  }
  
  // Tạo đề xuất dựa trên tình trạng
  const recommendations = generateRecommendations(condition, healthScore, diseaseDetected);
  
  console.log(`Phân tích dự phòng: ${condition} (${healthScore}%)`);
  
  return {
    condition: condition,
    healthScore: healthScore,
    diseaseDetected,
    diseaseName: diseaseDetected ? 'Không xác định' : null,
    diseaseConfidence: diseaseDetected ? 0.6 : 0,
    confidence: 0.7,
    recommendations: recommendations,
    detectedAt: new Date().toISOString(),
    imageId: path.basename(imagePath),
    analysisMethod: 'fallback',
    plantType: plantType,
    growthStage: 'Không xác định'
  };
};

// Hàm phụ trợ cho phân tích ảnh
function generateRecommendations(condition, healthScore, diseaseDetected) {
  let recommendations = [];
  
  // Đề xuất dựa trên tình trạng sức khỏe
  if (healthScore < 50) {
    recommendations.push({
      type: 'urgent',
      message: 'Cây đang trong tình trạng sức khỏe kém, cần chăm sóc khẩn cấp',
      action: 'Kiểm tra toàn diện các yếu tố: nước, ánh sáng, dinh dưỡng và bệnh'
    });
  }
  
  // Đề xuất cụ thể dựa trên tình trạng
  switch (condition) {
    case 'Khỏe mạnh':
      recommendations.push(
        {
          type: 'maintenance',
          message: 'Tiếp tục chế độ chăm sóc hiện tại',
          action: 'Duy trì lịch tưới nước và bón phân hiện tại'
        },
        {
          type: 'monitoring',
          message: 'Kiểm tra định kỳ mỗi tuần',
          action: 'Chụp ảnh theo dõi mỗi tuần để đảm bảo cây phát triển tốt'
        }
      );
      break;
      
    case 'Thiếu nước':
      recommendations.push(
        {
          type: 'watering',
          message: 'Tăng tần suất tưới nước',
          action: 'Tưới nước ngay lập tức và tăng tần suất tưới trong 7 ngày tới'
        },
        {
          type: 'watering',
          message: 'Tưới vào buổi sáng sớm hoặc chiều muộn',
          action: 'Điều chỉnh thời gian tưới để giảm bay hơi nước'
        },
        {
          type: 'monitoring',
          message: 'Kiểm tra độ ẩm đất thường xuyên',
          action: 'Sử dụng cảm biến độ ẩm đất để theo dõi hàng ngày'
        }
      );
      break;
      
    case 'Thừa nước':
      recommendations.push(
        {
          type: 'watering',
          message: 'Giảm tần suất tưới nước',
          action: 'Ngừng tưới trong 3-5 ngày và đánh giá lại'
        },
        {
          type: 'soil',
          message: 'Đảm bảo đất có khả năng thoát nước tốt',
          action: 'Kiểm tra và cải thiện hệ thống thoát nước, thêm cát hoặc đá perlite nếu cần'
        },
        {
          type: 'monitoring',
          message: 'Kiểm tra dấu hiệu thối rễ',
          action: 'Quan sát các dấu hiệu như lá vàng từ dưới lên, mùi hôi từ đất'
        }
      );
      break;
      
    case 'Bị sâu bệnh':
    case 'Bị bệnh đốm lá':
    case 'Bị bệnh phấn trắng':
      recommendations.push(
        {
          type: 'treatment',
          message: 'Xử lý bệnh ngay lập tức',
          action: diseaseDetected ? 
            'Sử dụng thuốc trừ sâu/thuốc diệt nấm phù hợp với loại bệnh đã phát hiện' : 
            'Sử dụng thuốc trừ sâu tự nhiên hoặc thuốc diệt nấm rộng phổ'
        },
        {
          type: 'isolation',
          message: 'Cách ly cây bị nhiễm bệnh',
          action: 'Di chuyển cây ra xa các cây khỏe mạnh để ngăn lây lan'
        },
        {
          type: 'monitoring',
          message: 'Kiểm tra các cây xung quanh',
          action: 'Kiểm tra kỹ các cây gần đó để phát hiện dấu hiệu lây nhiễm sớm'
        },
        {
          type: 'prevention',
          message: 'Cải thiện thông gió',
          action: 'Tăng cường lưu thông không khí xung quanh cây để giảm độ ẩm bề mặt lá'
        }
      );
      break;
      
    case 'Thiếu dinh dưỡng':
      recommendations.push(
        {
          type: 'fertilizer',
          message: 'Bổ sung phân bón hữu cơ',
          action: 'Sử dụng phân bón cân bằng NPK và thêm phân hữu cơ'
        },
        {
          type: 'soil',
          message: 'Kiểm tra độ pH của đất',
          action: 'Đo độ pH và điều chỉnh về khoảng 6.0-7.0 tùy loại cây'
        },
        {
          type: 'fertilizer',
          message: 'Thay đổi chế độ bón phân',
          action: 'Bón phân với liều lượng nhỏ nhưng thường xuyên hơn'
        }
      );
      break;
      
    case 'Thừa phân đạm':
      recommendations.push(
        {
          type: 'watering',
          message: 'Tăng lượng nước tưới để rửa trôi phân thừa',
          action: 'Tưới nhiều nước trong vài ngày để giảm nồng độ phân trong đất'
        },
        {
          type: 'fertilizer',
          message: 'Ngừng bón phân đạm',
          action: 'Tạm dừng bón phân trong ít nhất 2-3 tuần'
        },
        {
          type: 'monitoring',
          message: 'Theo dõi sự phát triển của lá mới',
          action: 'Quan sát màu sắc và kích thước của lá mới để đánh giá sự phục hồi'
        }
      );
      break;
      
    default:
      recommendations.push(
        {
          type: 'consultation',
          message: 'Tham khảo ý kiến chuyên gia nông nghiệp',
          action: 'Liên hệ với chuyên gia để được tư vấn cụ thể'
        },
        {
          type: 'monitoring',
          message: 'Theo dõi sự phát triển của cây',
          action: 'Ghi chép và chụp ảnh hàng ngày để theo dõi sự thay đổi'
        }
      );
  }
  
  // Thêm đề xuất chung về theo dõi
  if (healthScore < 70) {
    recommendations.push({
      type: 'follow_up',
      message: 'Chụp ảnh theo dõi sau 3-5 ngày',
      action: 'Sử dụng tính năng phân tích hình ảnh để đánh giá hiệu quả của các biện pháp đã áp dụng'
    });
  }
  
  return recommendations;
}

// Phân tích chi tiết bệnh dựa trên hình ảnh
const analyzeDisease = async (imagePath, focusArea = 'all') => {
  try {
    // Trong môi trường thực tế, sẽ sử dụng mô hình AI chuyên biệt cho phát hiện bệnh
    console.log(`Phân tích bệnh với trọng tâm: ${focusArea}`);
    
    // Mô phỏng phân tích bệnh
    const imageStats = await analyzeImageColors(imagePath);
    const { redMean, greenMean, blueMean, contrast } = imageStats;
    
    // Các bệnh thường gặp ở cây trồng
    const commonDiseases = [
      { name: 'Bệnh đốm lá', symptoms: 'Đốm nâu trên lá', severity: 'medium', treatment: 'Phun thuốc diệt nấm' },
      { name: 'Bệnh phấn trắng', symptoms: 'Lớp phủ trắng trên lá', severity: 'medium', treatment: 'Phun dung dịch baking soda' },
      { name: 'Bệnh thối rễ', symptoms: 'Lá vàng từ dưới lên', severity: 'high', treatment: 'Cải thiện thoát nước, sử dụng thuốc đặc trị' },
      { name: 'Bệnh virus khảm', symptoms: 'Hoa văn khảm trên lá', severity: 'high', treatment: 'Loại bỏ cây bị nhiễm, kiểm soát côn trùng' },
      { name: 'Bệnh héo xanh', symptoms: 'Cây héo dù đất ẩm', severity: 'high', treatment: 'Loại bỏ cây bị nhiễm, luân canh' }
    ];
    
    // Mô phỏng phát hiện bệnh dựa trên thống kê màu sắc
    let detectedDiseases = [];
    
    if (redMean > 150 && greenMean < 100) {
      // Có thể là bệnh đốm lá
      detectedDiseases.push({
        ...commonDiseases[0],
        confidence: 0.7 + Math.random() * 0.2,
        affectedArea: Math.round(30 + Math.random() * 40)
      });
    }
    
    if (contrast < 15 && blueMean > 120) {
      // Có thể là bệnh phấn trắng
      detectedDiseases.push({
        ...commonDiseases[1],
        confidence: 0.65 + Math.random() * 0.25,
        affectedArea: Math.round(20 + Math.random() * 30)
      });
    }
    
    if (blueMean > 150 && greenMean < 120 && redMean < 100) {
      // Có thể là bệnh thối rễ
      detectedDiseases.push({
        ...commonDiseases[2],
        confidence: 0.6 + Math.random() * 0.2,
        affectedArea: Math.round(10 + Math.random() * 40)
      });
    }
    
    // Sắp xếp theo độ tin cậy
    detectedDiseases.sort((a, b) => b.confidence - a.confidence);
    
    return {
      diseaseDetected: detectedDiseases.length > 0,
      diseases: detectedDiseases,
      healthAssessment: detectedDiseases.length > 0 
        ? { score: Math.max(30, 100 - detectedDiseases[0].affectedArea), status: 'Cần điều trị' }
        : { score: 85 + Math.random() * 15, status: 'Khỏe mạnh' }
    };
  } catch (error) {
    console.error('Lỗi khi phân tích bệnh:', error);
    return {
      diseaseDetected: false,
      diseases: [],
      healthAssessment: { score: 70, status: 'Không thể đánh giá chính xác' },
      error: error.message
    };
  }
};

// Controller xử lý nhận diện hình ảnh
const imageRecognitionController = {
  // Middleware xử lý upload ảnh
  uploadImage: upload.single('image'),
  
  // API nhận diện bệnh cây trồng
  recognizePlantDisease: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: true, message: 'Không có file ảnh được tải lên' });
      }
      
      const imagePath = req.file.path;
      const userId = req.body.userId || 'anonymous';
      const plantId = req.body.plantId || 'unknown';
      const focusArea = req.body.focusArea || 'disease'; // disease, health, growth
      
      console.log(`Nhận yêu cầu phân tích ảnh từ user ${userId} cho cây ${plantId}, trọng tâm: ${focusArea}`);
      
      // Phân tích hình ảnh
      let analysisResult;
      
      if (focusArea === 'disease') {
        // Phân tích chi tiết về bệnh
        const diseaseAnalysis = await analyzeDisease(imagePath, focusArea);
        
        // Kết hợp với phân tích tổng quát
        const generalAnalysis = await analyzeImageWithAI(imagePath);
        
        analysisResult = {
          ...generalAnalysis,
          diseaseAnalysis: diseaseAnalysis,
          analysisMethod: 'ai_disease_focused'
        };
      } else {
        // Phân tích tổng quát
        analysisResult = await analyzeImageWithAI(imagePath);
      }
      
      // Lưu kết quả phân tích
      await saveAnalysisResult(userId, plantId, imagePath, analysisResult);
      
      // Trả về kết quả
      return res.status(200).json({
        success: true,
        imagePath: `/uploads/${path.basename(imagePath)}`,
        analysis: analysisResult,
        recommendations: analysisResult.recommendations
      });
      
    } catch (error) {
      console.error('Lỗi khi nhận diện bệnh cây trồng:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi nhận diện bệnh cây trồng',
        details: error.message
      });
    }
  },

  // Lấy lịch sử phân tích ảnh
  getAnalysisHistory: async (req, res) => {
    try {
      const { userId, plantId } = req.params;
      
      if (!userId) {
        return res.status(400).json({ error: true, message: 'Thiếu thông tin người dùng' });
      }
      
      // Mô phỏng lấy lịch sử phân tích
      const mockHistory = [
        {
          id: 1,
          user_id: userId,
          plant_id: plantId || 'plant-123',
          image_path: '/uploads/sample1.jpg',
          analysis_result: {
            condition: 'Khỏe mạnh',
            healthScore: 90,
            diseaseDetected: false,
            detectedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          user_id: userId,
          plant_id: plantId || 'plant-456',
          image_path: '/uploads/sample2.jpg',
          analysis_result: {
            condition: 'Thiếu nước',
            healthScore: 65,
            diseaseDetected: false,
            detectedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          user_id: userId,
          plant_id: plantId || 'plant-789',
          image_path: '/uploads/sample3.jpg',
          analysis_result: {
            condition: 'Bị bệnh đốm lá',
            healthScore: 45,
            diseaseDetected: true,
            diseaseName: 'Bệnh đốm lá',
            diseaseConfidence: 0.85,
            detectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          },
          created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      // Lọc theo plantId nếu có
      const filteredHistory = plantId 
        ? mockHistory.filter(item => item.plant_id === plantId)
        : mockHistory;
      
      return res.status(200).json({
        success: true,
        history: filteredHistory
      });
    } catch (error) {
      console.error('Lỗi lấy lịch sử phân tích:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi lấy lịch sử phân tích ảnh',
        details: error.message
      });
    }
  },
  
  // So sánh hai ảnh để đánh giá sự thay đổi
  compareImages: async (req, res) => {
    try {
      const { imageId1, imageId2 } = req.body;
      
      if (!imageId1 || !imageId2) {
        return res.status(400).json({ error: true, message: 'Thiếu thông tin ảnh cần so sánh' });
      }
      
      // Mô phỏng so sánh hai ảnh
      const mockComparison = {
        healthScoreChange: Math.round((Math.random() * 20) - 10), // Thay đổi từ -10 đến +10
        conditionChange: Math.random() > 0.5 ? 'improved' : 'deteriorated',
        significantChanges: [
          {
            aspect: 'Màu sắc lá',
            before: 'Vàng nhạt',
            after: 'Xanh đậm',
            improvement: true
          },
          {
            aspect: 'Kích thước lá',
            before: 'Nhỏ',
            after: 'Lớn hơn',
            improvement: true
          },
          {
            aspect: 'Dấu hiệu bệnh',
            before: 'Có đốm nâu',
            after: 'Giảm đốm nâu',
            improvement: true
          }
        ],
        recommendations: [
          'Tiếp tục chế độ chăm sóc hiện tại',
          'Theo dõi thêm 1 tuần nữa để đánh giá hiệu quả lâu dài'
        ]
      };
      
      // Điều chỉnh kết quả nếu conditionChange là deteriorated
      if (mockComparison.conditionChange === 'deteriorated') {
        mockComparison.healthScoreChange = -Math.abs(mockComparison.healthScoreChange);
        mockComparison.significantChanges = [
          {
            aspect: 'Màu sắc lá',
            before: 'Xanh đậm',
            after: 'Vàng nhạt',
            improvement: false
          },
          {
            aspect: 'Kích thước lá',
            before: 'Bình thường',
            after: 'Nhỏ hơn',
            improvement: false
          },
          {
            aspect: 'Dấu hiệu bệnh',
            before: 'Không có',
            after: 'Xuất hiện đốm nâu',
            improvement: false
          }
        ];
        mockComparison.recommendations = [
          'Kiểm tra lại chế độ tưới nước',
          'Xem xét bổ sung dinh dưỡng',
          'Theo dõi sát sao trong 3-5 ngày tới'
        ];
      }
      
      return res.status(200).json({
        success: true,
        comparison: mockComparison
      });
    } catch (error) {
      console.error('Lỗi khi so sánh ảnh:', error);
      return res.status(500).json({
        error: true,
        message: 'Đã xảy ra lỗi khi so sánh ảnh',
        details: error.message
      });
    }
  },
  
  // Phân tích ảnh (để các controller khác có thể sử dụng)
  analyzeImage: async (imagePath, focusArea = 'all') => {
    try {
      if (!imagePath) {
        throw new Error('Thiếu đường dẫn hình ảnh');
      }
      
      // Kiểm tra file tồn tại
      if (!fs.existsSync(imagePath)) {
        throw new Error('File hình ảnh không tồn tại');
      }
      
      // Phân tích hình ảnh
      const analysisResult = await analyzeImageWithAI(imagePath);
      
      // Nếu tập trung vào phân tích bệnh
      if (focusArea === 'disease') {
        const diseaseAnalysis = await analyzeDisease(imagePath);
        return {
          ...analysisResult,
          diseaseAnalysis
        };
      }
      
      return analysisResult;
    } catch (error) {
      console.error('Lỗi khi phân tích ảnh:', error);
      // Sử dụng phân tích dự phòng
      return fallbackAnalysis(imagePath);
    }
  }
};

module.exports = imageRecognitionController;