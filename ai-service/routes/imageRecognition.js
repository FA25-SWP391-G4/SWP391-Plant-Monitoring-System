const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const imageRecognitionController = require('../controllers/imageRecognitionController');

// Cấu hình multer để lưu trữ file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads/'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Giới hạn 10MB
  },
  fileFilter: function (req, file, cb) {
    // Chỉ chấp nhận file hình ảnh
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
    }
    cb(null, true);
  }
});

// Route phân tích hình ảnh
router.post('/analyze', upload.single('image'), imageRecognitionController.analyzeImage);

// Route lấy lịch sử phân tích
router.get('/history/:userId', imageRecognitionController.getAnalysisHistory);

module.exports = router;