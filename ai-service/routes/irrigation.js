const express = require('express');
const router = express.Router();
const irrigationPredictionController = require('../controllers/irrigationPredictionController');

// Route dự báo nhu cầu tưới cây thông minh
router.post('/predict', (req, res) => {
  if (irrigationPredictionController.predictIrrigationNeeds) {
    return irrigationPredictionController.predictIrrigationNeeds(req, res);
  }
  res.status(501).json({ error: 'Chức năng đang được phát triển' });
});

// Route dự báo nhu cầu tưới cây với dữ liệu chi tiết
router.post('/predict/detailed', (req, res) => {
  const { plantId, userId, includeFactors = true, includeConfidence = true } = req.body;
  
  if (!plantId) {
    return res.status(400).json({ error: true, message: 'Thiếu thông tin cây trồng' });
  }
  
  // Thêm các tham số vào request
  req.body.includeFactors = includeFactors;
  req.body.includeConfidence = includeConfidence;
  
  return irrigationPredictionController.predictIrrigationNeeds(req, res);
});

// Route phân tích và cảnh báo
router.post('/analyze', (req, res) => {
  if (irrigationPredictionController.analyzeAndAlert) {
    return irrigationPredictionController.analyzeAndAlert(req, res);
  }
  res.status(501).json({ error: 'Chức năng đang được phát triển' });
});

// Route lấy lịch sử dự báo
router.get('/history/:plantId', (req, res) => {
  if (irrigationPredictionController.getPredictionHistory) {
    return irrigationPredictionController.getPredictionHistory(req, res);
  }
  res.status(501).json({ error: 'Chức năng đang được phát triển' });
});

// Route lấy lịch sử dự báo với khoảng thời gian
router.get('/history/:plantId/:startDate/:endDate', (req, res) => {
  const { plantId, startDate, endDate } = req.params;
  
  if (!plantId || !startDate || !endDate) {
    return res.status(400).json({ error: true, message: 'Thiếu thông tin cần thiết' });
  }
  
  // Thêm các tham số vào request
  req.query.startDate = startDate;
  req.query.endDate = endDate;
  
  return irrigationPredictionController.getPredictionHistory(req, res);
});

module.exports = router;