const express = require('express');
const cors = require('cors');
const path = require('path');

// Khởi tạo ứng dụng Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Irrigation Prediction UI route
app.get('/irrigation-prediction', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'irrigation-prediction.html'));
});

// Chatbot UI route
app.get('/chatbot', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chatbot.html'));
});

// Mock API cho dự đoán tưới cây
app.post('/api/irrigation/predict/detailed', (req, res) => {
  const { plantId, plantType, growthStage, sensorData } = req.body;
  
  // Tạo dữ liệu giả lập
  const needsWatering = sensorData.soilMoisture < 40;
  const waterAmount = calculateWaterAmount(plantType, growthStage, sensorData);
  const nextWateringTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const confidence = Math.floor(70 + Math.random() * 20);
  
  // Tạo các yếu tố ảnh hưởng
  const contributingFactors = [
    {
      name: 'Độ ẩm đất',
      impact: 45,
      value: sensorData.soilMoisture,
      unit: '%'
    },
    {
      name: 'Nhiệt độ',
      impact: 25,
      value: sensorData.temperature,
      unit: '°C'
    },
    {
      name: 'Độ ẩm không khí',
      impact: 15,
      value: sensorData.humidity,
      unit: '%'
    },
    {
      name: 'Ánh sáng',
      impact: 15,
      value: sensorData.lightLevel,
      unit: 'lux'
    }
  ];
  
  // Trả về kết quả
  res.json({
    plantId,
    needsWatering,
    waterAmount,
    nextWateringTime,
    confidence,
    contributingFactors
  });
});

// Hàm tính toán lượng nước cần thiết
function calculateWaterAmount(plantType, growthStage, sensorData) {
  // Lượng nước cơ bản dựa trên loại cây
  let baseAmount = 0;
  switch (plantType) {
    case 'tomato': baseAmount = 200; break;
    case 'cucumber': baseAmount = 180; break;
    case 'lettuce': baseAmount = 150; break;
    case 'pepper': baseAmount = 170; break;
    case 'basil': baseAmount = 120; break;
    default: baseAmount = 150;
  }
  
  // Điều chỉnh theo giai đoạn phát triển
  let stageMultiplier = 1;
  switch (growthStage) {
    case 'seedling': stageMultiplier = 0.5; break;
    case 'vegetative': stageMultiplier = 0.8; break;
    case 'flowering': stageMultiplier = 1.2; break;
    case 'fruiting': stageMultiplier = 1.5; break;
    case 'mature': stageMultiplier = 1.0; break;
    default: stageMultiplier = 1.0;
  }
  
  // Điều chỉnh theo độ ẩm đất
  const moistureAdjustment = (40 - sensorData.soilMoisture) / 100;
  const moistureMultiplier = 1 + (moistureAdjustment > 0 ? moistureAdjustment : 0);
  
  // Điều chỉnh theo nhiệt độ
  const tempAdjustment = (sensorData.temperature - 25) / 100;
  const tempMultiplier = 1 + (tempAdjustment > 0 ? tempAdjustment : 0);
  
  // Tính toán lượng nước cuối cùng
  return Math.round(baseAmount * stageMultiplier * moistureMultiplier * tempMultiplier);
}

// API giả lập cho chatbot
app.post('/api/chatbot/message', (req, res) => {
  const { message, userId } = req.body;
  
  // Tạo phản hồi giả lập dựa trên tin nhắn
  let response = '';
  if (message.toLowerCase().includes('xin chào') || message.toLowerCase().includes('chào')) {
    response = 'Xin chào! Tôi là trợ lý vườn thông minh. Tôi có thể giúp gì cho bạn?';
  } else if (message.toLowerCase().includes('tưới') || message.toLowerCase().includes('nước')) {
    response = 'Dựa trên dữ liệu cảm biến, cây của bạn có thể cần tưới trong 2 ngày tới. Độ ẩm đất hiện tại là 45%.';
  } else if (message.toLowerCase().includes('thời tiết')) {
    response = 'Dự báo thời tiết hôm nay: Nhiệt độ 28°C, độ ẩm 65%, có khả năng mưa nhẹ vào buổi chiều.';
  } else if (message.toLowerCase().includes('bệnh') || message.toLowerCase().includes('sâu')) {
    response = 'Tôi không phát hiện dấu hiệu bệnh hoặc sâu bệnh trên cây của bạn. Hãy tiếp tục theo dõi và chụp ảnh nếu bạn thấy điều gì bất thường.';
  } else {
    response = 'Tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể hỏi về tưới cây, thời tiết, hoặc tình trạng sâu bệnh.';
  }
  
  // Trả về phản hồi
  res.json({
    response,
    timestamp: new Date().toISOString()
  });
});

// API giả lập dữ liệu cảm biến cho giao diện
app.get('/api/chatbot/simulate-data', (req, res) => {
  // Tạo dữ liệu giả lập
  const data = {
    soilMoisture: Math.floor(35 + Math.random() * 30),
    temperature: Math.floor(22 + Math.random() * 10),
    humidity: Math.floor(50 + Math.random() * 30),
    lightLevel: Math.floor(3000 + Math.random() * 5000),
    waterLevel: Math.floor(60 + Math.random() * 30),
    batteryStatus: Math.floor(70 + Math.random() * 30),
    lastUpdated: new Date().toISOString()
  };
  
  res.json(data);
});

// API giả lập dữ liệu cảm biến cho giao diện (định dạng cũ)
app.get('/api/sensor-data', (req, res) => {
  const plantId = req.query.plantId || 1;
  
  // Tạo dữ liệu giả lập
  const data = {
    plantInfo: {
      name: 'Cây cà chua',
      plant_type: 'Cà chua',
      description: 'Cây cà chua khỏe mạnh',
      optimal_moisture: 60,
      optimal_temperature: 25,
      optimal_light: 5000
    },
    sensorData: {
      moisture: Math.floor(35 + Math.random() * 30),
      temperature: Math.floor(22 + Math.random() * 10),
      humidity: Math.floor(50 + Math.random() * 30),
      light: Math.floor(3000 + Math.random() * 5000)
    },
    lastWatering: [
      { date: new Date(Date.now() - 2*24*60*60*1000).toISOString(), amount: '200ml' },
      { date: new Date(Date.now() - 5*24*60*60*1000).toISOString(), amount: '180ml' }
    ]
  };
  
  res.json(data);
});

// Trang chủ API
app.get('/', (req, res) => {
  res.json({
    message: 'Chào mừng đến với AI Service API (Phiên bản đơn giản)',
    endpoints: {
      irrigation: '/api/irrigation/predict/detailed',
      chatbot: '/api/chatbot/message',
      sensorData: '/api/chatbot/simulate-data'
    },
    ui: {
      irrigationPrediction: '/irrigation-prediction',
      chatbot: '/chatbot'
    }
  });
});

// Khởi động server
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
  console.log(`Truy cập giao diện dự đoán tưới cây tại http://localhost:${PORT}/irrigation-prediction`);
});