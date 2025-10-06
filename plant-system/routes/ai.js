const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { requireAuth, requirePremium } = require('../middlewares/authMiddleware');

// AI Chatbot routes
router.post('/chat', aiController.sendChatMessage);
router.get('/chat/history', aiController.getChatHistory);
router.delete('/chat/history', aiController.deleteChatHistory);

// Plant AI analysis routes
router.get('/predict-watering/:plantId', aiController.predictWatering);
router.get('/analyze-health/:plantId', aiController.analyzeHealth);
router.get('/optimize-watering-schedules', aiController.optimizeWateringSchedules);

module.exports = router;