const express = require('express');
const router = express.Router();
const historicalAnalysisController = require('../controllers/historicalAnalysisController');

// Route phân tích dữ liệu lịch sử và đề xuất chăm sóc
router.post('/analyze', historicalAnalysisController.analyzeAndRecommend);

// Route lấy lịch sử phân tích
router.get('/history/:plantId', historicalAnalysisController.getAnalysisHistory);

module.exports = router;