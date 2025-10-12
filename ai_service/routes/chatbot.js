const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');

// Route xử lý tin nhắn
router.post('/', chatbotController.handleMessage);

// Route lấy lịch sử trò chuyện
router.get('/history/:userId', chatbotController.getChatHistory);

module.exports = router;