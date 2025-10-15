/**
 * AI Database Helpers
 * Sử dụng database configuration chung từ config/db.js
 */

const db = require('../../config/db');

// AI-specific database helpers

// Get AI analysis by ID
const getAIAnalysis = async (analysisId) => {
  const result = await db.pool.query(
    'SELECT * FROM ai_analyses WHERE id = $1',
    [analysisId]
  );
  return result.rows[0];
};

// Create AI analysis record
const createAIAnalysis = async (plantId, userId, analysisType, inputData, resultData, confidenceScore) => {
  const result = await db.pool.query(`
    INSERT INTO ai_analyses (plant_id, user_id, analysis_type, input_data, result_data, confidence_score)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [plantId, userId, analysisType, JSON.stringify(inputData), JSON.stringify(resultData), confidenceScore]);
  
  return result.rows[0];
};

// Get AI feedback for analysis
const getAIFeedback = async (analysisId) => {
  const result = await db.pool.query(
    'SELECT * FROM ai_feedback WHERE analysis_id = $1 ORDER BY created_at DESC',
    [analysisId]
  );
  return result.rows;
};

// Create AI feedback record
const createAIFeedback = async (analysisId, userId, feedbackType, userComment, actualResult) => {
  const result = await db.pool.query(`
    INSERT INTO ai_feedback (analysis_id, user_id, feedback_type, user_comment, actual_result)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, [analysisId, userId, feedbackType, userComment, actualResult ? JSON.stringify(actualResult) : null]);
  
  return result.rows[0];
};

// Store disease image
const storeDiseaseImage = async (plantId, userId, imagePath, imageSize, imageType, analysisId = null) => {
  const result = await db.pool.query(`
    INSERT INTO plant_disease_images (plant_id, user_id, image_path, image_size, image_type, analysis_id)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [plantId, userId, imagePath, imageSize, imageType, analysisId]);
  
  return result.rows[0];
};

// Update disease image processing status
const updateImageProcessingStatus = async (imageId, status, isProcessed = false) => {
  const result = await db.pool.query(`
    UPDATE plant_disease_images 
    SET processing_status = $1, is_processed = $2
    WHERE id = $3
    RETURNING *
  `, [status, isProcessed, imageId]);
  
  return result.rows[0];
};

// Get active AI models
const getActiveAIModels = async (modelType = null) => {
  let queryText = 'SELECT * FROM ai_models WHERE is_active = true';
  let params = [];
  
  if (modelType) {
    queryText += ' AND model_type = $1';
    params.push(modelType);
  }
  
  queryText += ' ORDER BY created_at DESC';
  
  const result = await db.pool.query(queryText, params);
  return result.rows;
};

// Enhanced chat history methods
const createChatHistory = async (userId, userMessage, aiResponse, sessionId, plantId, plantContext, aiConfidence, topicCategory, language = 'vi') => {
  const result = await db.pool.query(`
    INSERT INTO chat_histories (user_id, user_message, ai_response, session_id, plant_id, plant_context, ai_confidence, topic_category, language)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `, [userId, userMessage, aiResponse, sessionId, plantId, plantContext ? JSON.stringify(plantContext) : null, aiConfidence, topicCategory, language]);
  
  return result.rows[0];
};

// Get chat history by session
const getChatHistoryBySession = async (sessionId, limit = 50) => {
  const result = await db.pool.query(`
    SELECT * FROM chat_histories 
    WHERE session_id = $1 
    ORDER BY created_at ASC 
    LIMIT $2
  `, [sessionId, limit]);
  
  return result.rows;
};

// Get recent sensor data for AI analysis
const getRecentSensorData = async (plantId, hours = 24) => {
  const result = await db.pool.query(`
    SELECT * FROM sensor_data 
    WHERE plant_id = $1 
    AND timestamp > CURRENT_TIMESTAMP - INTERVAL '${hours} hours'
    ORDER BY timestamp DESC
  `, [plantId]);
  
  return result.rows;
};

// Get plant information
const getPlantInfo = async (plantId) => {
  const result = await db.pool.query(
    'SELECT * FROM plants WHERE id = $1',
    [plantId]
  );
  return result.rows[0];
};

// Get AI analysis statistics
const getAIAnalysisStats = async (userId = null, days = 30) => {
  let queryText = `
    SELECT 
      analysis_type,
      COUNT(*) as total_analyses,
      AVG(confidence_score) as avg_confidence,
      MAX(created_at) as last_analysis
    FROM ai_analyses 
    WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '${days} days'
  `;
  
  let params = [];
  if (userId) {
    queryText += ' AND user_id = $1';
    params.push(userId);
  }
  
  queryText += ' GROUP BY analysis_type ORDER BY total_analyses DESC';
  
  const result = await db.pool.query(queryText, params);
  return result.rows;
};

// Get chat session summary
const getChatSessionSummary = async (userId, days = 7) => {
  const result = await db.pool.query(`
    SELECT 
      session_id,
      plant_id,
      COUNT(*) as message_count,
      MIN(created_at) as session_start,
      MAX(created_at) as session_end,
      AVG(ai_confidence) as avg_confidence,
      STRING_AGG(DISTINCT topic_category, ', ') as topics_discussed
    FROM chat_histories 
    WHERE user_id = $1 
    AND created_at > CURRENT_TIMESTAMP - INTERVAL '${days} days'
    AND session_id IS NOT NULL
    GROUP BY session_id, plant_id
    ORDER BY session_start DESC
  `, [userId]);
  
  return result.rows;
};

// Cleanup old AI data
const cleanupOldAIData = async (daysToKeep = 90) => {
  try {
    // Delete old chat histories (keep only recent ones)
    const chatResult = await db.pool.query(`
      DELETE FROM chat_histories 
      WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${daysToKeep} days'
    `);
    
    // Delete old unprocessed images
    const imageResult = await db.pool.query(`
      DELETE FROM plant_disease_images 
      WHERE upload_timestamp < CURRENT_TIMESTAMP - INTERVAL '${daysToKeep} days'
      AND is_processed = FALSE
    `);
    
    // Delete old AI analyses (keep those with feedback)
    const analysisResult = await db.pool.query(`
      DELETE FROM ai_analyses 
      WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '${daysToKeep} days'
      AND id NOT IN (SELECT DISTINCT analysis_id FROM ai_feedback WHERE analysis_id IS NOT NULL)
    `);
    
    return {
      deletedChats: chatResult.rowCount,
      deletedImages: imageResult.rowCount,
      deletedAnalyses: analysisResult.rowCount
    };
  } catch (error) {
    console.error('❌ Error cleaning up old AI data:', error);
    return { error: error.message };
  }
};

// Database health check for AI features
const aiHealthCheck = async () => {
  try {
    // Check if AI tables exist and are accessible
    const tableChecks = await Promise.all([
      db.pool.query('SELECT COUNT(*) FROM ai_analyses'),
      db.pool.query('SELECT COUNT(*) FROM ai_feedback'),
      db.pool.query('SELECT COUNT(*) FROM plant_disease_images'),
      db.pool.query('SELECT COUNT(*) FROM ai_models'),
      db.pool.query('SELECT COUNT(*) FROM chat_histories')
    ]);
    
    return {
      status: 'healthy',
      tables: {
        ai_analyses: parseInt(tableChecks[0].rows[0].count),
        ai_feedback: parseInt(tableChecks[1].rows[0].count),
        plant_disease_images: parseInt(tableChecks[2].rows[0].count),
        ai_models: parseInt(tableChecks[3].rows[0].count),
        chat_histories: parseInt(tableChecks[4].rows[0].count)
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = {
  // Core AI operations
  getAIAnalysis,
  createAIAnalysis,
  getAIFeedback,
  createAIFeedback,
  
  // Disease detection
  storeDiseaseImage,
  updateImageProcessingStatus,
  
  // AI models
  getActiveAIModels,
  
  // Chat operations
  createChatHistory,
  getChatHistoryBySession,
  
  // Plant and sensor data
  getRecentSensorData,
  getPlantInfo,
  
  // Statistics and monitoring
  getAIAnalysisStats,
  getChatSessionSummary,
  aiHealthCheck,
  cleanupOldAIData
};