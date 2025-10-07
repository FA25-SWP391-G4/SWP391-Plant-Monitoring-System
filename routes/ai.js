/**
 * AI Features Routes
 * Routes for AI-powered features including watering prediction, plant analysis, 
 * watering schedule optimization, historical analysis, image recognition, and chatbot
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate } = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

// AI Service URL from environment or default to localhost in development
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * @route POST /api/ai/watering-prediction
 * @desc Predict watering needs using AI
 * @access Private
 */
router.post('/watering-prediction', authenticate, async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/watering-prediction`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI service for watering prediction:', error);
    res.status(500).json({ 
      error: 'Failed to get watering prediction', 
      details: error.response?.data || error.message 
    });
  }
});

/**
 * @route POST /api/ai/plant-analysis
 * @desc Analyze plant condition using AI
 * @access Private
 */
router.post('/plant-analysis', authenticate, async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/plant-analysis`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI service for plant analysis:', error);
    res.status(500).json({ 
      error: 'Failed to analyze plant condition', 
      details: error.response?.data || error.message 
    });
  }
});

/**
 * @route POST /api/ai/watering-schedule
 * @desc Optimize watering schedule using AI
 * @access Private
 */
router.post('/watering-schedule', authenticate, async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/watering-schedule`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI service for watering schedule:', error);
    res.status(500).json({ 
      error: 'Failed to optimize watering schedule', 
      details: error.response?.data || error.message 
    });
  }
});

/**
 * @route POST /api/ai/historical-analysis
 * @desc Analyze historical plant data using AI
 * @access Private
 */
router.post('/historical-analysis', authenticate, async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/historical-analysis`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI service for historical analysis:', error);
    res.status(500).json({ 
      error: 'Failed to analyze historical data', 
      details: error.response?.data || error.message 
    });
  }
});

/**
 * @route POST /api/ai/image-recognition
 * @desc Analyze plant image using AI
 * @access Private
 */
router.post('/image-recognition', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Read the file as base64
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');

    // Send to AI service
    const response = await axios.post(`${AI_SERVICE_URL}/image-recognition`, {
      image: base64Image,
      plant_type: req.body.plant_type || 'unknown'
    });

    // Delete the temporary file
    fs.unlinkSync(req.file.path);

    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI service for image recognition:', error);
    
    // Clean up temp file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }
    
    res.status(500).json({ 
      error: 'Failed to analyze plant image', 
      details: error.response?.data || error.message 
    });
  }
});

/**
 * @route POST /api/ai/chatbot
 * @desc Interact with AI chatbot
 * @access Private
 */
router.post('/chatbot', authenticate, async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/chatbot`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('Error calling AI service for chatbot:', error);
    res.status(500).json({ 
      error: 'Failed to get chatbot response', 
      details: error.response?.data || error.message 
    });
  }
});

module.exports = router;