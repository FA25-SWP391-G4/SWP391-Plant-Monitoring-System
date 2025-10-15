const express = require('express');
const router = express.Router();
const selfLearningController = require('../controllers/legacySelfLearningController');

// Route huấn luyện mô hình dự đoán nhu cầu tưới
router.post('/train', selfLearningController.trainIrrigationModel);

// Route cập nhật mô hình với dữ liệu mới
router.post('/update', selfLearningController.updateModel);

// Route nhận phản hồi và cải thiện từ người dùng
router.post('/feedback', selfLearningController.checkTrainingStatus);

// Route lấy thông tin mô hình
router.get('/model/:plantId', selfLearningController.checkTrainingStatus);

module.exports = router;