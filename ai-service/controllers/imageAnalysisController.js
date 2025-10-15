const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const tf = require('@tensorflow/tfjs-node');
require('dotenv').config();

// Cấu hình lưu trữ hình ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Cấu hình upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
    }
  }
});

// Đường dẫn đến mô hình
const MODEL_PATH = path.join(__dirname, '../models/plant_disease_model/model.json');

// Danh sách bệnh cây trồng
const PLANT_DISEASES = [
  'Khỏe mạnh',
  'Bệnh đốm lá',
  'Bệnh thối rễ',
  'Bệnh phấn trắng',
  'Bệnh gỉ sắt',
  'Bệnh héo xanh',
  'Bệnh vàng lá',
  'Bệnh thối nhũn'
];

// Hàm tiền xử lý hình ảnh
async function preprocessImage(imagePath) {
  try {
    // Đọc và resize hình ảnh
    const image = await sharp(imagePath)
      .resize(224, 224)
      .toBuffer();

    // Chuyển đổi thành tensor
    const tensor = tf.node.decodeImage(image, 3);
    
    // Chuẩn hóa giá trị pixel
    const normalized = tensor.div(255.0);
    
    // Mở rộng kích thước batch
    const batched = normalized.expandDims(0);
    
    return batched;
  } catch (error) {
    console.error('Lỗi khi tiền xử lý hình ảnh:', error);
    throw error;
  }
}

// Hàm phân tích hình ảnh với mô hình AI
async function analyzeImageWithModel(imagePath) {
  try {
    // Kiểm tra xem mô hình có tồn tại không
    if (!fs.existsSync(MODEL_PATH)) {
      console.warn('Không tìm thấy mô hình AI, sử dụng phân tích cơ bản');
      return analyzeImageBasic(imagePath);
    }

    // Tải mô hình
    const model = await tf.loadLayersModel(`file://${MODEL_PATH}`);
    
    // Tiền xử lý hình ảnh
    const processedImage = await preprocessImage(imagePath);
    
    // Dự đoán
    const predictions = await model.predict(processedImage);
    const results = await predictions.data();
    
    // Lấy kết quả dự đoán
    const maxIndex = results.indexOf(Math.max(...results));
    const confidence = results[maxIndex];
    
    // Giải phóng bộ nhớ
    tf.dispose([processedImage, predictions]);
    
    return {
      disease: PLANT_DISEASES[maxIndex],
      confidence: confidence,
      isHealthy: maxIndex === 0,
      needsAttention: confidence > 0.7 && maxIndex !== 0
    };
  } catch (error) {
    console.error('Lỗi khi phân tích hình ảnh với mô hình:', error);
    return analyzeImageBasic(imagePath);
  }
}

// Hàm phân tích cơ bản dựa trên màu sắc
async function analyzeImageBasic(imagePath) {
  try {
    // Đọc hình ảnh
    const imageBuffer = await sharp(imagePath).raw().toBuffer({ resolveWithObject: true });
    const { data, info } = imageBuffer;
    
    // Tính toán các chỉ số màu sắc
    let totalPixels = info.width * info.height;
    let totalRed = 0;
    let totalGreen = 0;
    let totalBlue = 0;
    
    for (let i = 0; i < data.length; i += 3) {
      totalRed += data[i];
      totalGreen += data[i + 1];
      totalBlue += data[i + 2];
    }
    
    const avgRed = totalRed / totalPixels;
    const avgGreen = totalGreen / totalPixels;
    const avgBlue = totalBlue / totalPixels;
    
    // Tính chỉ số sức khỏe dựa trên màu xanh lá
    const greenness = avgGreen / (avgRed + avgBlue + 1);
    const healthScore = Math.min(Math.max(greenness * 100, 0), 100);
    
    // Xác định tình trạng cây
    let disease = 'Khỏe mạnh';
    let confidence = 0.8;
    let isHealthy = true;
    
    if (healthScore < 40) {
      disease = 'Bệnh vàng lá';
      confidence = 0.7;
      isHealthy = false;
    } else if (avgRed > avgGreen && avgRed > avgBlue) {
      disease = 'Bệnh gỉ sắt';
      confidence = 0.6;
      isHealthy = false;
    } else if (avgBlue > avgGreen && avgBlue > avgRed) {
      disease = 'Bệnh thối nhũn';
      confidence = 0.5;
      isHealthy = false;
    }
    
    return {
      disease,
      confidence,
      isHealthy,
      healthScore,
      needsAttention: !isHealthy && confidence > 0.6,
      colorStats: {
        avgRed,
        avgGreen,
        avgBlue,
        greenness
      }
    };
  } catch (error) {
    console.error('Lỗi khi phân tích hình ảnh cơ bản:', error);
    return {
      disease: 'Không xác định',
      confidence: 0.3,
      isHealthy: false,
      healthScore: 50,
      needsAttention: true,
      error: error.message
    };
  }
}

// Hàm tạo khuyến nghị chăm sóc
function generateCareRecommendations(analysisResult) {
  const { disease, confidence, isHealthy, healthScore } = analysisResult;
  
  const recommendations = {
    watering: '',
    fertilizing: '',
    pestControl: '',
    general: ''
  };
  
  if (isHealthy) {
    recommendations.general = 'Cây của bạn đang khỏe mạnh. Tiếp tục chăm sóc theo lịch trình hiện tại.';
    recommendations.watering = 'Duy trì lịch tưới nước hiện tại.';
    recommendations.fertilizing = 'Bón phân định kỳ 2-4 tuần một lần với liều lượng khuyến cáo.';
    return recommendations;
  }
  
  // Khuyến nghị dựa trên loại bệnh
  switch (disease) {
    case 'Bệnh đốm lá':
      recommendations.general = 'Cây của bạn có dấu hiệu bệnh đốm lá. Cần xử lý ngay để tránh lây lan.';
      recommendations.watering = 'Tránh tưới nước trực tiếp lên lá. Tưới gốc và giảm tần suất tưới.';
      recommendations.pestControl = 'Sử dụng thuốc trừ nấm đặc trị cho bệnh đốm lá. Loại bỏ lá bị bệnh.';
      break;
    case 'Bệnh thối rễ':
      recommendations.general = 'Cây có dấu hiệu bệnh thối rễ. Cần xử lý khẩn cấp.';
      recommendations.watering = 'Giảm tưới nước ngay lập tức. Kiểm tra hệ thống thoát nước của chậu.';
      recommendations.general += ' Có thể cần thay đất và cắt tỉa rễ bị thối.';
      break;
    case 'Bệnh phấn trắng':
      recommendations.general = 'Cây bị bệnh phấn trắng. Cần xử lý để tránh lây lan.';
      recommendations.pestControl = 'Phun dung dịch xà phòng loãng hoặc thuốc trừ nấm đặc trị. Tăng lưu thông không khí.';
      break;
    case 'Bệnh gỉ sắt':
      recommendations.general = 'Cây bị bệnh gỉ sắt. Cần loại bỏ các bộ phận bị nhiễm bệnh.';
      recommendations.pestControl = 'Sử dụng thuốc trừ nấm đặc trị cho bệnh gỉ sắt. Tăng khoảng cách giữa các cây.';
      break;
    case 'Bệnh héo xanh':
      recommendations.general = 'Cây bị bệnh héo xanh. Đây là bệnh nghiêm trọng cần xử lý ngay.';
      recommendations.watering = 'Kiểm tra độ ẩm đất và điều chỉnh tưới nước phù hợp.';
      recommendations.pestControl = 'Có thể cần loại bỏ cây bị bệnh nặng để tránh lây lan.';
      break;
    case 'Bệnh vàng lá':
      recommendations.general = 'Cây bị vàng lá. Có thể do thiếu dinh dưỡng hoặc tưới nước quá nhiều.';
      recommendations.fertilizing = 'Bổ sung phân bón giàu nitơ và sắt.';
      recommendations.watering = 'Điều chỉnh lịch tưới nước, tránh tưới quá nhiều.';
      break;
    case 'Bệnh thối nhũn':
      recommendations.general = 'Cây bị thối nhũn. Cần xử lý ngay để cứu cây.';
      recommendations.watering = 'Ngừng tưới nước ngay lập tức. Kiểm tra hệ thống thoát nước.';
      recommendations.general += ' Loại bỏ các bộ phận bị thối và xử lý bằng thuốc trừ nấm.';
      break;
    default:
      recommendations.general = 'Cây có dấu hiệu không khỏe mạnh. Theo dõi thêm và chụp ảnh rõ hơn để phân tích.';
      recommendations.watering = 'Kiểm tra lại lịch tưới nước và điều chỉnh phù hợp.';
      recommendations.fertilizing = 'Bổ sung phân bón cân bằng để tăng cường sức khỏe cho cây.';
  }
  
  return recommendations;
}

// Controller xử lý phân tích hình ảnh
const imageAnalysisController = {
  // Middleware xử lý upload
  uploadImage: upload.single('image'),
  
  // API phân tích hình ảnh
  async analyzeImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Vui lòng tải lên hình ảnh cần phân tích'
        });
      }
      
      const imagePath = req.file.path;
      const { plantId, focusArea = 'health' } = req.body;
      
      // Phân tích hình ảnh
      const analysisResult = await analyzeImageWithModel(imagePath);
      
      // Tạo khuyến nghị chăm sóc
      const careRecommendations = generateCareRecommendations(analysisResult);
      
      // Lưu kết quả phân tích vào cơ sở dữ liệu (giả định)
      const analysisId = Date.now().toString();
      
      // Trả về kết quả
      return res.status(200).json({
        success: true,
        data: {
          analysisId,
          plantId,
          imageUrl: `/uploads/${path.basename(imagePath)}`,
          analysisResult,
          careRecommendations,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Lỗi khi phân tích hình ảnh:', error);
      return res.status(500).json({
        success: false,
        error: 'Lỗi khi phân tích hình ảnh: ' + error.message
      });
    }
  },
  
  // API lấy lịch sử phân tích
  async getAnalysisHistory(req, res) {
    try {
      const { plantId } = req.params;
      
      // Giả định dữ liệu lịch sử (trong thực tế sẽ lấy từ cơ sở dữ liệu)
      const historyData = [
        {
          analysisId: '1234567890',
          plantId: plantId,
          imageUrl: '/uploads/sample-1.jpg',
          analysisResult: {
            disease: 'Khỏe mạnh',
            confidence: 0.92,
            isHealthy: true,
            healthScore: 85
          },
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        {
          analysisId: '0987654321',
          plantId: plantId,
          imageUrl: '/uploads/sample-2.jpg',
          analysisResult: {
            disease: 'Bệnh đốm lá',
            confidence: 0.78,
            isHealthy: false,
            healthScore: 60
          },
          timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        }
      ];
      
      return res.status(200).json({
        success: true,
        data: historyData
      });
    } catch (error) {
      console.error('Lỗi khi lấy lịch sử phân tích:', error);
      return res.status(500).json({
        success: false,
        error: 'Lỗi khi lấy lịch sử phân tích: ' + error.message
      });
    }
  },
  
  // API so sánh hai hình ảnh
  async compareImages(req, res) {
    try {
      const { imageId1, imageId2 } = req.body;
      
      // Giả định dữ liệu so sánh (trong thực tế sẽ lấy từ cơ sở dữ liệu và phân tích)
      const comparisonResult = {
        healthScoreChange: 15,
        improved: true,
        keyChanges: [
          'Màu sắc lá cải thiện',
          'Giảm dấu hiệu bệnh đốm lá',
          'Tăng trưởng mới'
        ],
        recommendations: {
          general: 'Cây đang phát triển tốt. Tiếp tục chăm sóc theo phương pháp hiện tại.'
        }
      };
      
      return res.status(200).json({
        success: true,
        data: comparisonResult
      });
    } catch (error) {
      console.error('Lỗi khi so sánh hình ảnh:', error);
      return res.status(500).json({
        success: false,
        error: 'Lỗi khi so sánh hình ảnh: ' + error.message
      });
    }
  }
};

module.exports = imageAnalysisController;