const express = require('express');
const router = express.Router();
const irrigationScheduleController = require('../controllers/irrigationScheduleController');

// Route tối ưu lịch tưới tự động
router.post('/optimize', (req, res) => {
  if (irrigationScheduleController.optimizeSchedule) {
    return irrigationScheduleController.optimizeSchedule(req, res);
  }
  res.status(501).json({ error: 'Chức năng đang được phát triển' });
});

// Route tự động hóa quá trình tưới cây
router.post('/automate', (req, res) => {
  if (irrigationScheduleController.automateIrrigation) {
    return irrigationScheduleController.automateIrrigation(req, res);
  }
  res.status(501).json({ error: 'Chức năng đang được phát triển' });
});

// Route lấy lịch tưới hiện tại
router.get('/schedule/:plantId', (req, res) => {
  if (irrigationScheduleController.getSchedule) {
    return irrigationScheduleController.getSchedule(req, res);
  }
  res.status(501).json({ error: 'Chức năng đang được phát triển' });
});

module.exports = router;