const fetch = require('node-fetch');

// Simplified controller for testing
exports.sendChatMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user ? req.user.id : '12345';
        
        console.log(`Received message: ${message} from user: ${userId}`);
        
        // Simple response for testing
        const response = `Đây là phản hồi thử nghiệm cho tin nhắn: "${message}"`;
        
        res.json({ 
            response: response, 
            chat_id: Date.now(),
            source: 'test'
        });
    } catch (error) {
        console.error('Error in sendChatMessage:', error);
        res.status(500).json({ error: 'Lỗi khi xử lý tin nhắn' });
    }
};

// Get chat history
exports.getChatHistory = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : '12345';
        
        // Mock chat history for testing
        const history = [
            { id: 1, user_message: 'Xin chào', ai_response: 'Chào bạn! Tôi có thể giúp gì cho bạn?', timestamp: new Date() },
            { id: 2, user_message: 'Làm thế nào để chăm sóc cây xương rồng?', ai_response: 'Cây xương rồng cần ít nước, nhiều ánh sáng và đất thoát nước tốt.', timestamp: new Date() }
        ];
        
        res.json({ history });
    } catch (error) {
        console.error('Error in getChatHistory:', error);
        res.status(500).json({ error: 'Lỗi khi lấy lịch sử chat' });
    }
};

// Delete chat history
exports.deleteChatHistory = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : '12345';
        
        res.json({ message: 'Đã xóa lịch sử chat thành công' });
    } catch (error) {
        console.error('Error in deleteChatHistory:', error);
        res.status(500).json({ error: 'Lỗi khi xóa lịch sử chat' });
    }
};

// Predict watering needs
exports.predictWatering = async (req, res) => {
    try {
        const plantId = req.params.plantId;
        
        // Mock prediction data for testing
        const prediction = {
            plantId,
            plantName: plantId == 1 ? 'Cây xương rồng' : plantId == 2 ? 'Cây hoa hồng' : 'Cây húng quế',
            shouldWater: plantId != 1,
            confidence: 0.85,
            recommendedAmount: plantId == 1 ? 50 : plantId == 2 ? 200 : 150,
            nextWateringTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * (plantId == 1 ? 7 : 2)),
            currentSoilMoisture: plantId == 1 ? 45 : 30,
            source: 'test'
        };
        
        res.json({ prediction });
    } catch (error) {
        console.error('Error in predictWatering:', error);
        res.status(500).json({ error: 'Lỗi khi dự đoán nhu cầu tưới nước' });
    }
};

// Analyze plant health
exports.analyzeHealth = async (req, res) => {
    try {
        const plantId = req.params.plantId;
        
        // Mock health analysis data for testing
        const health = {
            plantId,
            plantName: plantId == 1 ? 'Cây xương rồng' : plantId == 2 ? 'Cây hoa hồng' : 'Cây húng quế',
            healthScore: plantId == 1 ? 85 : plantId == 2 ? 65 : 75,
            status: plantId == 1 ? 'Tốt' : plantId == 2 ? 'Cần chú ý' : 'Bình thường',
            issues: plantId == 1 ? [] : plantId == 2 ? ['Thiếu nước', 'Có dấu hiệu sâu bệnh'] : ['Thiếu ánh sáng'],
            recommendations: plantId == 1 ? 
                ['Tiếp tục chế độ chăm sóc hiện tại'] : 
                plantId == 2 ? 
                ['Tăng lượng nước', 'Kiểm tra và xử lý sâu bệnh', 'Bổ sung phân bón'] : 
                ['Di chuyển cây đến nơi có nhiều ánh sáng hơn', 'Tưới nước đều đặn'],
            source: 'test'
        };
        
        res.json({ health });
    } catch (error) {
        console.error('Error in analyzeHealth:', error);
        res.status(500).json({ error: 'Lỗi khi phân tích sức khỏe cây trồng' });
    }
};

// Optimize watering schedules
exports.optimizeWateringSchedules = async (req, res) => {
    try {
        const userId = req.user ? req.user.id : '12345';
        
        // Mock optimized schedule for testing
        const schedule = [
            {
                plantId: 1,
                plantName: 'Cây xương rồng',
                wateringTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
                recommendedAmount: 50
            },
            {
                plantId: 2,
                plantName: 'Cây hoa hồng',
                wateringTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
                recommendedAmount: 200
            },
            {
                plantId: 3,
                plantName: 'Cây húng quế',
                wateringTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
                recommendedAmount: 150
            }
        ];
        
        res.json({ schedule, source: 'test' });
    } catch (error) {
        console.error('Error in optimizeWateringSchedules:', error);
        res.status(500).json({ error: 'Lỗi khi tối ưu hóa lịch tưới nước' });
    }
};