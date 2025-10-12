const express = require('express');
const router = express.Router();
const irrigationPredictionController = require('../controllers/irrigationPredictionController');

// Route dự báo nhu cầu tưới cây
router.post('/predict', (req, res) => {
  if (irrigationPredictionController.predictIrrigationNeeds) {
    return irrigationPredictionController.predictIrrigationNeeds(req, res);
  }
  res.status(501).json({ error: 'Chức năng đang được phát triển' });
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

module.exports = router;