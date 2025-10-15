const express = require('express');
const router = express.Router();
const diseaseDetectionController = require('../controllers/diseaseDetectionController');

/**
 * Disease Detection Routes
 * All routes are prefixed with /api/ai/disease
 */

// POST /api/ai/disease/analyze - Phân tích ảnh bệnh cây
router.post('/analyze', 
  diseaseDetectionController.getUploadMiddleware(),
  async (req, res) => {
    await diseaseDetectionController.analyzeDisease(req, res);
  }
);

// GET /api/ai/disease/history/:plantId - Lấy lịch sử phân tích
router.get('/history/:plantId', async (req, res) => {
  await diseaseDetectionController.getDiseaseHistory(req, res);
});

// GET /api/ai/disease/treatments/:diseaseType - Lấy phương pháp điều trị
router.get('/treatments/:diseaseType', async (req, res) => {
  await diseaseDetectionController.getTreatments(req, res);
});

// POST /api/ai/disease/validate-image - Kiểm tra ảnh có phải cây không
router.post('/validate-image',
  diseaseDetectionController.getUploadMiddleware(),
  async (req, res) => {
    await diseaseDetectionController.validateImage(req, res);
  }
);

// POST /api/ai/disease/feedback/:analysisId - Feedback từ user
router.post('/feedback/:analysisId', async (req, res) => {
  await diseaseDetectionController.submitFeedback(req, res);
});

// GET /api/ai/disease/supported - Lấy danh sách bệnh được hỗ trợ
router.get('/supported', async (req, res) => {
  await diseaseDetectionController.getSupportedDiseases(req, res);
});

// GET /api/ai/disease/image/:filename - Lấy ảnh đã lưu trữ
router.get('/image/:filename', async (req, res) => {
  await diseaseDetectionController.getStoredImage(req, res);
});

// GET /api/ai/disease/statistics - Lấy thống kê phân tích
router.get('/statistics', async (req, res) => {
  await diseaseDetectionController.getAnalysisStatistics(req, res);
});

module.exports = router;