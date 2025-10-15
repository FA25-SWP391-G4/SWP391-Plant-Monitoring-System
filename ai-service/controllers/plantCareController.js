const axios = require('axios');
const tf = require('@tensorflow/tfjs-node');
require('dotenv').config();

// Cấu hình API OpenAI
const openaiConfig = {
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1',
  model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
};

// Danh sách các loại cây phổ biến và thông tin chăm sóc
const PLANT_CARE_DATABASE = {
  'cây xương rồng': {
    watering: 'Tưới ít nước, chỉ khi đất khô hoàn toàn (2-3 tuần/lần)',
    light: 'Ánh sáng trực tiếp hoặc gián tiếp',
    soil: 'Đất thoát nước tốt, pha cát',
    fertilizing: 'Bón phân loãng 2-3 tháng/lần trong mùa sinh trưởng',
    humidity: 'Thấp, không cần phun sương',
    temperature: '18-32°C, tránh nhiệt độ dưới 10°C'
  },
  'cây trầu bà': {
    watering: 'Giữ đất ẩm, tưới khi lớp đất trên khô (5-7 ngày/lần)',
    light: 'Ánh sáng gián tiếp, tránh ánh nắng trực tiếp',
    soil: 'Đất giàu mùn, thoát nước tốt',
    fertilizing: 'Bón phân cân bằng mỗi tháng trong mùa sinh trưởng',
    humidity: 'Trung bình đến cao, thích hợp phun sương',
    temperature: '18-30°C, tránh nhiệt độ dưới 15°C'
  },
  'cây lưỡi hổ': {
    watering: 'Tưới khi đất khô (10-14 ngày/lần)',
    light: 'Ánh sáng trực tiếp hoặc gián tiếp',
    soil: 'Đất thoát nước tốt',
    fertilizing: 'Bón phân loãng 3 tháng/lần',
    humidity: 'Thấp, không cần phun sương',
    temperature: '15-30°C'
  },
  'cây kim tiền': {
    watering: 'Tưới khi đất khô (7-10 ngày/lần)',
    light: 'Ánh sáng gián tiếp, tránh ánh nắng trực tiếp',
    soil: 'Đất giàu mùn, thoát nước tốt',
    fertilizing: 'Bón phân loãng 2 tháng/lần',
    humidity: 'Trung bình, có thể phun sương',
    temperature: '18-27°C'
  },
  'cây lan': {
    watering: 'Tưới khi giá thể hơi khô (5-7 ngày/lần)',
    light: 'Ánh sáng gián tiếp, một số loài cần ánh sáng lọc',
    soil: 'Giá thể đặc biệt cho lan, thoát nước tốt',
    fertilizing: 'Bón phân đặc biệt cho lan 2 tuần/lần trong mùa sinh trưởng',
    humidity: 'Cao, cần phun sương thường xuyên',
    temperature: '18-29°C, tùy loài'
  }
};

// Hàm tạo khuyến nghị chăm sóc dựa trên dữ liệu cảm biến
function generateCareRecommendationsFromSensorData(plantType, sensorData) {
  const recommendations = {
    watering: '',
    light: '',
    temperature: '',
    humidity: '',
    fertilizing: '',
    general: ''
  };
  
  // Lấy thông tin chăm sóc cơ bản từ cơ sở dữ liệu
  const plantInfo = PLANT_CARE_DATABASE[plantType.toLowerCase()] || {};
  
  // Phân tích dữ liệu độ ẩm đất
  if (sensorData.soilMoisture !== undefined) {
    if (sensorData.soilMoisture < 20) {
      recommendations.watering = `Cây cần được tưới nước ngay lập tức. ${plantInfo.watering || ''}`;
    } else if (sensorData.soilMoisture < 40) {
      recommendations.watering = `Cây sẽ cần tưới nước trong 1-2 ngày tới. ${plantInfo.watering || ''}`;
    } else if (sensorData.soilMoisture > 80) {
      recommendations.watering = 'Đất quá ẩm, ngừng tưới nước và kiểm tra hệ thống thoát nước.';
    } else {
      recommendations.watering = `Độ ẩm đất đang ở mức tốt. ${plantInfo.watering || ''}`;
    }
  }
  
  // Phân tích dữ liệu ánh sáng
  if (sensorData.light !== undefined) {
    if (sensorData.light < 500) {
      recommendations.light = `Cây đang thiếu ánh sáng. Hãy di chuyển đến vị trí có nhiều ánh sáng hơn. ${plantInfo.light || ''}`;
    } else if (sensorData.light > 10000 && !plantType.includes('xương rồng')) {
      recommendations.light = 'Ánh sáng quá mạnh, có thể gây cháy lá. Hãy di chuyển cây vào vị trí có ánh sáng gián tiếp.';
    } else {
      recommendations.light = `Mức ánh sáng đang phù hợp. ${plantInfo.light || ''}`;
    }
  }
  
  // Phân tích dữ liệu nhiệt độ
  if (sensorData.temperature !== undefined) {
    if (sensorData.temperature < 15) {
      recommendations.temperature = 'Nhiệt độ quá thấp cho hầu hết các loại cây. Hãy di chuyển cây vào trong nhà hoặc nơi ấm hơn.';
    } else if (sensorData.temperature > 35) {
      recommendations.temperature = 'Nhiệt độ quá cao. Hãy di chuyển cây vào nơi mát mẻ hơn và tăng độ ẩm.';
    } else {
      recommendations.temperature = `Nhiệt độ đang ở mức phù hợp. ${plantInfo.temperature || ''}`;
    }
  }
  
  // Phân tích dữ liệu độ ẩm không khí
  if (sensorData.humidity !== undefined) {
    if (sensorData.humidity < 30 && !plantType.includes('xương rồng') && !plantType.includes('lưỡi hổ')) {
      recommendations.humidity = 'Độ ẩm không khí quá thấp. Hãy phun sương hoặc sử dụng máy tạo độ ẩm.';
    } else if (sensorData.humidity > 80 && (plantType.includes('xương rồng') || plantType.includes('lưỡi hổ'))) {
      recommendations.humidity = 'Độ ẩm không khí quá cao cho loại cây này. Cải thiện thông gió.';
    } else {
      recommendations.humidity = `Độ ẩm không khí đang ở mức phù hợp. ${plantInfo.humidity || ''}`;
    }
  }
  
  // Khuyến nghị bón phân
  recommendations.fertilizing = plantInfo.fertilizing || 'Bón phân cân bằng định kỳ theo loại cây.';
  
  // Khuyến nghị chung
  recommendations.general = 'Dựa trên dữ liệu cảm biến, cây của bạn ';
  if (sensorData.soilMoisture < 30 || sensorData.light < 400 || sensorData.temperature < 15 || sensorData.temperature > 35) {
    recommendations.general += 'cần được chú ý ngay lập tức. Hãy điều chỉnh các điều kiện chăm sóc theo khuyến nghị.';
  } else {
    recommendations.general += 'đang phát triển trong điều kiện tương đối tốt. Tiếp tục theo dõi và chăm sóc đều đặn.';
  }
  
  return recommendations;
}

// Hàm tạo lịch chăm sóc cây
function generateCarePlan(plantType, plantAge, location) {
  const carePlan = {
    daily: [],
    weekly: [],
    monthly: [],
    seasonal: []
  };
  
  // Lấy thông tin chăm sóc cơ bản từ cơ sở dữ liệu
  const plantInfo = PLANT_CARE_DATABASE[plantType.toLowerCase()] || {};
  
  // Nhiệm vụ hàng ngày
  carePlan.daily.push('Kiểm tra tình trạng cây');
  
  if (plantType.includes('lan') || plantType.includes('trầu bà')) {
    carePlan.daily.push('Phun sương vào buổi sáng (nếu độ ẩm thấp)');
  }
  
  // Nhiệm vụ hàng tuần
  if (plantInfo.watering && plantInfo.watering.includes('tuần')) {
    carePlan.weekly.push('Tưới nước theo lịch');
  } else {
    carePlan.daily.push('Kiểm tra độ ẩm đất và tưới nước nếu cần');
  }
  
  carePlan.weekly.push('Lau lá để loại bỏ bụi (trừ cây xương rồng)');
  carePlan.weekly.push('Kiểm tra dấu hiệu sâu bệnh');
  
  // Nhiệm vụ hàng tháng
  carePlan.monthly.push('Bón phân theo khuyến nghị');
  carePlan.monthly.push('Xoay cây để phát triển đều');
  carePlan.monthly.push('Cắt tỉa lá úa hoặc bị hư hại');
  
  // Nhiệm vụ theo mùa
  carePlan.seasonal.push('Điều chỉnh lịch tưới nước theo mùa');
  carePlan.seasonal.push('Thay đổi vị trí cây theo mùa nếu cần');
  carePlan.seasonal.push('Cắt tỉa và tạo hình (nếu cần)');
  
  if (plantAge > 12) { // Nếu cây trên 1 năm tuổi
    carePlan.seasonal.push('Đánh giá nhu cầu thay chậu');
  }
  
  return carePlan;
}

// Hàm tạo khuyến nghị chăm sóc sử dụng AI
async function generateAICareRecommendations(plantType, plantCondition, sensorData) {
  try {
    // Kiểm tra API key
    if (!process.env.OPENAI_API_KEY && !process.env.MISTRAL_API_KEY && !process.env.ANTHROPIC_API_KEY) {
      console.warn('Không tìm thấy API key cho AI, sử dụng khuyến nghị cơ bản');
      return generateCareRecommendationsFromSensorData(plantType, sensorData);
    }
    
    // Chuẩn bị dữ liệu cho AI
    const prompt = `
    Hãy đưa ra khuyến nghị chi tiết về cách chăm sóc cây ${plantType} dựa trên thông tin sau:
    
    Tình trạng cây: ${plantCondition}
    
    Dữ liệu cảm biến:
    - Độ ẩm đất: ${sensorData.soilMoisture || 'Không có dữ liệu'}%
    - Ánh sáng: ${sensorData.light || 'Không có dữ liệu'} lux
    - Nhiệt độ: ${sensorData.temperature || 'Không có dữ liệu'}°C
    - Độ ẩm không khí: ${sensorData.humidity || 'Không có dữ liệu'}%
    
    Hãy đưa ra khuyến nghị cụ thể về:
    1. Tưới nước (tần suất, lượng nước)
    2. Ánh sáng (vị trí đặt cây, thời gian chiếu sáng)
    3. Nhiệt độ và độ ẩm (điều kiện môi trường lý tưởng)
    4. Bón phân (loại phân, tần suất)
    5. Các vấn đề cần chú ý và cách khắc phục
    
    Trả lời ngắn gọn, cụ thể và thực tế.
    `;
    
    // Lựa chọn API để sử dụng
    let aiResponse;
    
    if (process.env.OPENAI_API_KEY) {
      // Sử dụng OpenAI API
      const response = await axios.post(
        `${openaiConfig.baseURL}/chat/completions`,
        {
          model: openaiConfig.model,
          messages: [
            { role: 'system', content: 'Bạn là một chuyên gia về cây trồng và làm vườn.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      aiResponse = response.data.choices[0].message.content;
    } else if (process.env.MISTRAL_API_KEY) {
      // Sử dụng Mistral API
      const response = await axios.post(
        'https://api.mistral.ai/v1/chat/completions',
        {
          model: process.env.MISTRAL_MODEL || 'mistral-small',
          messages: [
            { role: 'system', content: 'Bạn là một chuyên gia về cây trồng và làm vườn.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      aiResponse = response.data.choices[0].message.content;
    } else {
      // Sử dụng Anthropic API
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: process.env.ANTHROPIC_MODEL || 'claude-instant-1',
          messages: [
            { role: 'user', content: `Bạn là một chuyên gia về cây trồng và làm vườn.\n\n${prompt}` }
          ],
          temperature: 0.7,
          max_tokens: 500
        },
        {
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          }
        }
      );
      
      aiResponse = response.data.content[0].text;
    }
    
    // Phân tích phản hồi từ AI
    const recommendations = {
      watering: '',
      light: '',
      temperature: '',
      humidity: '',
      fertilizing: '',
      general: ''
    };
    
    // Phân tích văn bản AI để trích xuất khuyến nghị
    const lines = aiResponse.split('\n');
    let currentCategory = 'general';
    
    for (const line of lines) {
      if (line.toLowerCase().includes('tưới nước')) {
        currentCategory = 'watering';
        recommendations.watering = line.split(':').slice(1).join(':').trim();
      } else if (line.toLowerCase().includes('ánh sáng')) {
        currentCategory = 'light';
        recommendations.light = line.split(':').slice(1).join(':').trim();
      } else if (line.toLowerCase().includes('nhiệt độ')) {
        currentCategory = 'temperature';
        recommendations.temperature = line.split(':').slice(1).join(':').trim();
      } else if (line.toLowerCase().includes('độ ẩm')) {
        currentCategory = 'humidity';
        recommendations.humidity = line.split(':').slice(1).join(':').trim();
      } else if (line.toLowerCase().includes('bón phân')) {
        currentCategory = 'fertilizing';
        recommendations.fertilizing = line.split(':').slice(1).join(':').trim();
      } else if (line.trim() !== '') {
        if (recommendations[currentCategory]) {
          recommendations[currentCategory] += ' ' + line.trim();
        }
      }
    }
    
    // Đảm bảo có khuyến nghị chung
    if (!recommendations.general || recommendations.general.trim() === '') {
      recommendations.general = 'Dựa trên dữ liệu cảm biến và tình trạng cây, hãy điều chỉnh chế độ chăm sóc theo các khuyến nghị cụ thể.';
    }
    
    return recommendations;
  } catch (error) {
    console.error('Lỗi khi tạo khuyến nghị AI:', error);
    // Fallback về khuyến nghị cơ bản
    return generateCareRecommendationsFromSensorData(plantType, sensorData);
  }
}

// Controller xử lý gợi ý chăm sóc cây
const plantCareController = {
  // API tạo khuyến nghị chăm sóc
  async getCareRecommendations(req, res) {
    try {
      const { plantId, plantType, plantAge, plantCondition, location } = req.body;
      
      // Lấy dữ liệu cảm biến (giả định)
      // Trong thực tế, dữ liệu này sẽ được lấy từ cơ sở dữ liệu hoặc hệ thống IoT
      const sensorData = {
        soilMoisture: req.body.soilMoisture || 45,
        light: req.body.light || 2500,
        temperature: req.body.temperature || 25,
        humidity: req.body.humidity || 60
      };
      
      // Tạo khuyến nghị chăm sóc
      let careRecommendations;
      
      if (req.body.useAI === true) {
        careRecommendations = await generateAICareRecommendations(plantType, plantCondition, sensorData);
      } else {
        careRecommendations = generateCareRecommendationsFromSensorData(plantType, sensorData);
      }
      
      // Tạo lịch chăm sóc
      const carePlan = generateCarePlan(plantType, plantAge, location);
      
      // Trả về kết quả
      return res.status(200).json({
        success: true,
        data: {
          plantId,
          plantType,
          careRecommendations,
          carePlan,
          sensorData,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Lỗi khi tạo khuyến nghị chăm sóc:', error);
      return res.status(500).json({
        success: false,
        error: 'Lỗi khi tạo khuyến nghị chăm sóc: ' + error.message
      });
    }
  },
  
  // API tạo báo cáo chăm sóc
  async generateCareReport(req, res) {
    try {
      const { plantId, startDate, endDate } = req.body;
      
      // Giả định dữ liệu lịch sử (trong thực tế sẽ lấy từ cơ sở dữ liệu)
      const historicalData = {
        plantInfo: {
          id: plantId,
          name: 'Cây Trầu Bà',
          type: 'cây trầu bà',
          age: 6, // tháng
          location: 'Trong nhà'
        },
        sensorReadings: [
          {
            date: '2023-05-01',
            soilMoisture: 42,
            light: 2300,
            temperature: 24,
            humidity: 58
          },
          {
            date: '2023-05-15',
            soilMoisture: 38,
            light: 2500,
            temperature: 26,
            humidity: 55
          },
          {
            date: '2023-06-01',
            soilMoisture: 45,
            light: 2400,
            temperature: 25,
            humidity: 60
          }
        ],
        careActions: [
          {
            date: '2023-05-02',
            action: 'Tưới nước',
            notes: 'Tưới 200ml'
          },
          {
            date: '2023-05-10',
            action: 'Bón phân',
            notes: 'Phân NPK loãng'
          },
          {
            date: '2023-05-18',
            action: 'Tưới nước',
            notes: 'Tưới 250ml'
          },
          {
            date: '2023-05-25',
            action: 'Phun sương',
            notes: 'Phun sương lá'
          }
        ]
      };
      
      // Phân tích dữ liệu
      const analysis = {
        growthTrend: 'Tích cực',
        healthStatus: 'Tốt',
        careQuality: 'Đầy đủ',
        keyObservations: [
          'Độ ẩm đất duy trì ở mức tốt',
          'Nhiệt độ và ánh sáng phù hợp',
          'Tần suất tưới nước phù hợp'
        ],
        recommendations: [
          'Tiếp tục chế độ chăm sóc hiện tại',
          'Có thể tăng nhẹ lượng phân bón trong tháng tới',
          'Theo dõi độ ẩm không khí vào mùa khô'
        ]
      };
      
      // Trả về báo cáo
      return res.status(200).json({
        success: true,
        data: {
          plantId,
          reportPeriod: {
            startDate,
            endDate
          },
          historicalData,
          analysis,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Lỗi khi tạo báo cáo chăm sóc:', error);
      return res.status(500).json({
        success: false,
        error: 'Lỗi khi tạo báo cáo chăm sóc: ' + error.message
      });
    }
  },
  
  // API gợi ý xử lý vấn đề
  async getTroubleshootingAdvice(req, res) {
    try {
      const { plantType, symptoms, duration } = req.body;
      
      // Giả định dữ liệu gợi ý (trong thực tế sẽ sử dụng AI hoặc cơ sở dữ liệu)
      const commonProblems = {
        'lá vàng': {
          causes: [
            'Thiếu nước',
            'Thiếu dinh dưỡng (đặc biệt là nitơ)',
            'Ánh sáng quá mạnh',
            'Bệnh nấm'
          ],
          solutions: [
            'Kiểm tra lịch tưới nước và điều chỉnh',
            'Bón phân cân bằng NPK',
            'Di chuyển cây vào vị trí có ánh sáng gián tiếp',
            'Kiểm tra rễ và đất, thay đất nếu cần'
          ]
        },
        'lá úa': {
          causes: [
            'Tưới nước quá nhiều',
            'Thoát nước kém',
            'Nhiệt độ quá thấp',
            'Bệnh thối rễ'
          ],
          solutions: [
            'Giảm tần suất tưới nước',
            'Kiểm tra hệ thống thoát nước của chậu',
            'Di chuyển cây vào vị trí ấm hơn',
            'Kiểm tra và cắt tỉa rễ bị thối, thay đất'
          ]
        },
        'lá có đốm': {
          causes: [
            'Bệnh nấm',
            'Côn trùng',
            'Tưới nước lên lá',
            'Thiếu dinh dưỡng vi lượng'
          ],
          solutions: [
            'Sử dụng thuốc trừ nấm',
            'Kiểm tra và xử lý côn trùng',
            'Tưới nước ở gốc, tránh làm ướt lá',
            'Bổ sung phân bón có vi lượng'
          ]
        },
        'không phát triển': {
          causes: [
            'Thiếu ánh sáng',
            'Chậu quá nhỏ',
            'Thiếu dinh dưỡng',
            'Nhiệt độ không phù hợp'
          ],
          solutions: [
            'Di chuyển cây đến vị trí có nhiều ánh sáng hơn',
            'Thay chậu lớn hơn',
            'Bón phân định kỳ',
            'Điều chỉnh nhiệt độ môi trường'
          ]
        }
      };
      
      // Tìm gợi ý phù hợp
      let advice = {
        possibleCauses: [],
        recommendedSolutions: [],
        preventionTips: [
          'Theo dõi cây thường xuyên để phát hiện vấn đề sớm',
          'Duy trì lịch chăm sóc đều đặn',
          'Nghiên cứu kỹ nhu cầu của loại cây trước khi trồng'
        ]
      };
      
      // Phân tích triệu chứng
      for (const symptom of symptoms) {
        const lowerSymptom = symptom.toLowerCase();
        for (const [problem, info] of Object.entries(commonProblems)) {
          if (lowerSymptom.includes(problem)) {
            advice.possibleCauses = [...advice.possibleCauses, ...info.causes];
            advice.recommendedSolutions = [...advice.recommendedSolutions, ...info.solutions];
          }
        }
      }
      
      // Loại bỏ các mục trùng lặp
      advice.possibleCauses = [...new Set(advice.possibleCauses)];
      advice.recommendedSolutions = [...new Set(advice.recommendedSolutions)];
      
      // Trả về gợi ý
      return res.status(200).json({
        success: true,
        data: {
          plantType,
          symptoms,
          duration,
          advice,
          timestamp: new Date()
        }
      });
    } catch (error) {
      console.error('Lỗi khi tạo gợi ý xử lý vấn đề:', error);
      return res.status(500).json({
        success: false,
        error: 'Lỗi khi tạo gợi ý xử lý vấn đề: ' + error.message
      });
    }
  }
};

module.exports = plantCareController;