/**
 * Database Operations and Data Consistency End-to-End Tests
 * Tests data integrity across all AI features and services
 */

const request = require('supertest');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

describe('Database Operations and Data Consistency E2E Tests', () => {
  let dbPool;
  const TEST_CONFIG = {
    aiService: 'http://localhost:3001',
    mainServer: 'http://localhost:3010',
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'plant_monitoring_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password'
    },
    testTimeout: 20000
  };

  beforeAll(async () => {
    // Initialize database connection
    dbPool = new Pool(TEST_CONFIG.database);
    
    try {
      await dbPool.query('SELECT 1');
      console.log('Database connection established');
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }

    // Ensure test data is clean
    await cleanupTestData();
  }, TEST_CONFIG.testTimeout);

  afterAll(async () => {
    await cleanupTestData();
    if (dbPool) {
      await dbPool.end();
    }
  });

  async function cleanupTestData() {
    const cleanupQueries = [
      'DELETE FROM ai_feedback WHERE user_id >= 9000',
      'DELETE FROM ai_analyses WHERE user_id >= 9000',
      'DELETE FROM plant_disease_images WHERE user_id >= 9000',
      'DELETE FROM chat_histories WHERE user_id >= 9000',
      'DELETE FROM sensor_data WHERE plant_id >= 9000',
      'DELETE FROM plants WHERE id >= 9000',
      'DELETE FROM users WHERE id >= 9000'
    ];

    for (const query of cleanupQueries) {
      try {
        await dbPool.query(query);
      } catch (error) {
        // Ignore errors for non-existent tables/data
      }
    }
  }

  async function createTestUser(userId = 9001) {
    const query = `
      INSERT INTO users (id, email, username, password_hash, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `;
    
    const result = await dbPool.query(query, [
      userId,
      `test${userId}@example.com`,
      `testuser${userId}`,
      'hashed_password'
    ]);
    
    return userId;
  }

  async function createTestPlant(plantId = 9001, userId = 9001) {
    const query = `
      INSERT INTO plants (id, user_id, name, plant_type, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `;
    
    await dbPool.query(query, [
      plantId,
      userId,
      `Test Plant ${plantId}`,
      'tomato'
    ]);
    
    return plantId;
  }

  describe('Cross-Service Data Integrity', () => {
    test('should maintain data consistency across chatbot, disease detection, and irrigation services', async () => {
      const userId = 9001;
      const plantId = 9001;
      const sessionId = 'consistency-test-session';

      // Setup test data
      await createTestUser(userId);
      await createTestPlant(plantId, userId);

      // Step 1: Create chatbot conversation
      const chatResponse = await request(TEST_CONFIG.aiService)
        .post('/api/ai/chatbot/message')
        .send({
          message: 'My plant needs help with watering',
          userId,
          plantId,
          sessionId
        })
        .expect(200);

      expect(chatResponse.body.success).toBe(true);

      // Step 2: Create disease analysis
      const testImagePath = path.join(__dirname, 'test-assets', 'test-plant.jpg');
      if (!fs.existsSync(path.dirname(testImagePath))) {
        fs.mkdirSync(path.dirname(testImagePath), { recursive: true });
      }
      
      // Create minimal test image
      const testImageBuffer = Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9
      ]);
      fs.writeFileSync(testImagePath, testImageBuffer);

      const diseaseResponse = await request(TEST_CONFIG.aiService)
        .post('/api/ai/disease/analyze')
        .attach('image', testImagePath)
        .field('plantId', plantId.toString())
        .field('userId', userId.toString());

      // Step 3: Create irrigation prediction
      const irrigationResponse = await request(TEST_CONFIG.aiService)
        .post(`/api/ai/irrigation/predict/${plantId}`)
        .send({
          userId,
          sensorData: {
            soilMoisture: 25,
            temperature: 28,
            humidity: 65,
            lightLevel: 1000
          }
        })
        .expect(200);

      expect(irrigationResponse.body.success).toBe(true);

      // Step 4: Verify data consistency in database
      
      // Check chat history
      const chatQuery = 'SELECT * FROM chat_histories WHERE user_id = $1 AND session_id = $2';
      const chatResult = await dbPool.query(chatQuery, [userId, sessionId]);
      expect(chatResult.rows.length).toBeGreaterThan(0);
      expect(chatResult.rows[0].plant_id).toBe(plantId);

      // Check AI analyses
      const analysisQuery = 'SELECT * FROM ai_analyses WHERE user_id = $1 AND plant_id = $2';
      const analysisResult = await dbPool.query(analysisQuery, [userId, plantId]);
      
      if (diseaseResponse.status === 200) {
        const diseaseAnalyses = analysisResult.rows.filter(row => row.analysis_type === 'disease_detection');
        expect(diseaseAnalyses.length).toBeGreaterThan(0);
      }

      const irrigationAnalyses = analysisResult.rows.filter(row => row.analysis_type === 'irrigation_prediction');
      expect(irrigationAnalyses.length).toBeGreaterThan(0);

      // Verify foreign key relationships
      for (const analysis of analysisResult.rows) {
        expect(analysis.user_id).toBe(userId);
        expect(analysis.plant_id).toBe(plantId);
        expect(analysis.created_at).toBeDefined();
        expect(analysis.result_data).toBeDefined();
      }
    });

    test('should handle transaction rollback on service failures', async () => {
      const userId = 9002;
      const plantId = 9002;

      await createTestUser(userId);
      await createTestPlant(plantId, userId);

      // Attempt operation that should fail (invalid data)
      const response = await request(TEST_CONFIG.aiService)
        .post('/api/ai/chatbot/message')
        .send({
          message: '', // Empty message should fail validation
          userId,
          plantId,
          sessionId: 'rollback-test-session'
        });

      // Verify no partial data was saved
      const chatQuery = 'SELECT * FROM chat_histories WHERE user_id = $1 AND session_id = $2';
      const chatResult = await dbPool.query(chatQuery, [userId, 'rollback-test-session']);
      expect(chatResult.rows.length).toBe(0);

      const analysisQuery = 'SELECT * FROM ai_analyses WHERE user_id = $1 AND plant_id = $2';
      const analysisResult = await dbPool.query(analysisQuery, [userId, plantId]);
      expect(analysisResult.rows.length).toBe(0);
    });
  });

  describe('Concurrent Operations Handling', () => {
    test('should handle concurrent database operations without deadlocks', async () => {
      const userId = 9003;
      const plantId = 9003;
      const numConcurrentOps = 10;

      await createTestUser(userId);
      await createTestPlant(plantId, userId);

      // Create concurrent chatbot requests
      const promises = [];
      for (let i = 0; i < numConcurrentOps; i++) {
        promises.push(
          request(TEST_CONFIG.aiService)
            .post('/api/ai/chatbot/message')
            .send({
              message: `Concurrent message ${i}`,
              userId,
              plantId,
              sessionId: `concurrent-session-${i}`
            })
        );
      }

      // Execute all requests concurrently
      const results = await Promise.all(promises);

      // Verify all operations completed successfully
      let successCount = 0;
      results.forEach(result => {
        if (result.status === 200 && result.body.success) {
          successCount++;
        }
      });

      expect(successCount).toBe(numConcurrentOps);

      // Verify database consistency
      const chatQuery = 'SELECT * FROM chat_histories WHERE user_id = $1 ORDER BY created_at';
      const chatResult = await dbPool.query(chatQuery, [userId]);
      expect(chatResult.rows.length).toBe(numConcurrentOps);

      // Verify no duplicate or corrupted data
      const sessionIds = chatResult.rows.map(row => row.session_id);
      const uniqueSessionIds = [...new Set(sessionIds)];
      expect(uniqueSessionIds.length).toBe(numConcurrentOps);
    });

    test('should maintain referential integrity under concurrent load', async () => {
      const baseUserId = 9100;
      const basePlantId = 9100;
      const numUsers = 5;

      // Create multiple users and plants
      for (let i = 0; i < numUsers; i++) {
        await createTestUser(baseUserId + i);
        await createTestPlant(basePlantId + i, baseUserId + i);
      }

      // Create concurrent operations across different users
      const promises = [];
      for (let i = 0; i < numUsers; i++) {
        const userId = baseUserId + i;
        const plantId = basePlantId + i;

        // Chatbot message
        promises.push(
          request(TEST_CONFIG.aiService)
            .post('/api/ai/chatbot/message')
            .send({
              message: `Message from user ${userId}`,
              userId,
              plantId,
              sessionId: `multi-user-session-${userId}`
            })
        );

        // Irrigation prediction
        promises.push(
          request(TEST_CONFIG.aiService)
            .post(`/api/ai/irrigation/predict/${plantId}`)
            .send({
              userId,
              sensorData: {
                soilMoisture: 20 + i,
                temperature: 25 + i,
                humidity: 60 + i,
                lightLevel: 800 + (i * 100)
              }
            })
        );
      }

      const results = await Promise.all(promises);

      // Verify all operations succeeded
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.body.success).toBe(true);
      });

      // Verify referential integrity
      for (let i = 0; i < numUsers; i++) {
        const userId = baseUserId + i;
        const plantId = basePlantId + i;

        // Check chat histories
        const chatQuery = 'SELECT * FROM chat_histories WHERE user_id = $1';
        const chatResult = await dbPool.query(chatQuery, [userId]);
        expect(chatResult.rows.length).toBeGreaterThan(0);
        chatResult.rows.forEach(row => {
          expect(row.user_id).toBe(userId);
          expect(row.plant_id).toBe(plantId);
        });

        // Check AI analyses
        const analysisQuery = 'SELECT * FROM ai_analyses WHERE user_id = $1';
        const analysisResult = await dbPool.query(analysisQuery, [userId]);
        expect(analysisResult.rows.length).toBeGreaterThan(0);
        analysisResult.rows.forEach(row => {
          expect(row.user_id).toBe(userId);
          expect(row.plant_id).toBe(plantId);
        });
      }
    });
  });

  describe('Data Validation and Constraints', () => {
    test('should enforce database constraints and data validation', async () => {
      const userId = 9004;
      const plantId = 9004;

      await createTestUser(userId);
      await createTestPlant(plantId, userId);

      // Test foreign key constraints
      try {
        const invalidQuery = `
          INSERT INTO ai_analyses (plant_id, user_id, analysis_type, input_data, result_data)
          VALUES ($1, $2, $3, $4, $5)
        `;
        
        await dbPool.query(invalidQuery, [
          99999, // Non-existent plant_id
          userId,
          'test_analysis',
          '{}',
          '{}'
        ]);
        
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        // Should throw foreign key constraint error
        expect(error.code).toBe('23503'); // Foreign key violation
      }

      // Test NOT NULL constraints
      try {
        const nullQuery = `
          INSERT INTO ai_analyses (plant_id, user_id, analysis_type, input_data, result_data)
          VALUES ($1, $2, $3, $4, $5)
        `;
        
        await dbPool.query(nullQuery, [
          plantId,
          userId,
          null, // NULL analysis_type should fail
          '{}',
          '{}'
        ]);
        
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('23502'); // NOT NULL violation
      }
    });

    test('should validate JSON data structure in JSONB columns', async () => {
      const userId = 9005;
      const plantId = 9005;

      await createTestUser(userId);
      await createTestPlant(plantId, userId);

      // Test valid JSON structure
      const validQuery = `
        INSERT INTO ai_analyses (plant_id, user_id, analysis_type, input_data, result_data, confidence_score)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      
      const validResult = await dbPool.query(validQuery, [
        plantId,
        userId,
        'test_analysis',
        JSON.stringify({ message: 'test input' }),
        JSON.stringify({ response: 'test output', confidence: 0.95 }),
        0.95
      ]);

      expect(validResult.rows.length).toBe(1);
      expect(validResult.rows[0].id).toBeDefined();

      // Verify JSON data can be queried
      const jsonQuery = `
        SELECT result_data->>'response' as response,
               (result_data->>'confidence')::float as confidence
        FROM ai_analyses 
        WHERE id = $1
      `;
      
      const jsonResult = await dbPool.query(jsonQuery, [validResult.rows[0].id]);
      expect(jsonResult.rows[0].response).toBe('test output');
      expect(jsonResult.rows[0].confidence).toBe(0.95);
    });
  });

  describe('Data Retention and Cleanup', () => {
    test('should handle data retention policies', async () => {
      const userId = 9006;
      const plantId = 9006;

      await createTestUser(userId);
      await createTestPlant(plantId, userId);

      // Create old data (simulate by manually setting timestamps)
      const oldDataQuery = `
        INSERT INTO ai_analyses (plant_id, user_id, analysis_type, input_data, result_data, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 365); // 1 year ago

      await dbPool.query(oldDataQuery, [
        plantId,
        userId,
        'old_analysis',
        '{}',
        '{}',
        oldDate
      ]);

      // Create recent data
      await dbPool.query(oldDataQuery, [
        plantId,
        userId,
        'recent_analysis',
        '{}',
        '{}',
        new Date()
      ]);

      // Test cleanup query (simulate retention policy)
      const cleanupQuery = `
        DELETE FROM ai_analyses 
        WHERE created_at < NOW() - INTERVAL '6 months'
        AND user_id = $1
        RETURNING id
      `;
      
      const cleanupResult = await dbPool.query(cleanupQuery, [userId]);
      expect(cleanupResult.rows.length).toBe(1);

      // Verify recent data is still there
      const remainingQuery = 'SELECT * FROM ai_analyses WHERE user_id = $1';
      const remainingResult = await dbPool.query(remainingQuery, [userId]);
      expect(remainingResult.rows.length).toBe(1);
      expect(remainingResult.rows[0].analysis_type).toBe('recent_analysis');
    });

    test('should handle cascade deletes properly', async () => {
      const userId = 9007;
      const plantId = 9007;

      await createTestUser(userId);
      await createTestPlant(plantId, userId);

      // Create related data
      const analysisQuery = `
        INSERT INTO ai_analyses (plant_id, user_id, analysis_type, input_data, result_data)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
      
      const analysisResult = await dbPool.query(analysisQuery, [
        plantId,
        userId,
        'test_analysis',
        '{}',
        '{}'
      ]);

      const analysisId = analysisResult.rows[0].id;

      // Create feedback for the analysis
      const feedbackQuery = `
        INSERT INTO ai_feedback (analysis_id, user_id, feedback_type, user_comment)
        VALUES ($1, $2, $3, $4)
      `;
      
      await dbPool.query(feedbackQuery, [
        analysisId,
        userId,
        'correct',
        'Test feedback'
      ]);

      // Delete the plant (should cascade to analyses and feedback)
      const deletePlantQuery = 'DELETE FROM plants WHERE id = $1';
      await dbPool.query(deletePlantQuery, [plantId]);

      // Verify cascade delete worked
      const analysisCheckQuery = 'SELECT * FROM ai_analyses WHERE plant_id = $1';
      const analysisCheckResult = await dbPool.query(analysisCheckQuery, [plantId]);
      expect(analysisCheckResult.rows.length).toBe(0);

      const feedbackCheckQuery = 'SELECT * FROM ai_feedback WHERE analysis_id = $1';
      const feedbackCheckResult = await dbPool.query(feedbackCheckQuery, [analysisId]);
      expect(feedbackCheckResult.rows.length).toBe(0);
    });
  });

  describe('Performance and Indexing', () => {
    test('should perform efficiently with proper indexing', async () => {
      const userId = 9008;
      const basePlantId = 9200;
      const numRecords = 100;

      await createTestUser(userId);

      // Create multiple plants and analyses
      for (let i = 0; i < numRecords; i++) {
        const plantId = basePlantId + i;
        await createTestPlant(plantId, userId);

        const analysisQuery = `
          INSERT INTO ai_analyses (plant_id, user_id, analysis_type, input_data, result_data)
          VALUES ($1, $2, $3, $4, $5)
        `;
        
        await dbPool.query(analysisQuery, [
          plantId,
          userId,
          'performance_test',
          '{}',
          '{}'
        ]);
      }

      // Test query performance with indexes
      const startTime = Date.now();
      
      const performanceQuery = `
        SELECT COUNT(*) as total,
               analysis_type,
               AVG(confidence_score) as avg_confidence
        FROM ai_analyses 
        WHERE user_id = $1 
        GROUP BY analysis_type
      `;
      
      const result = await dbPool.query(performanceQuery, [userId]);
      
      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(result.rows.length).toBeGreaterThan(0);
      expect(queryTime).toBeLessThan(1000); // Should complete within 1 second

      console.log(`Performance query completed in ${queryTime}ms for ${numRecords} records`);
    });

    test('should handle large JSON data efficiently', async () => {
      const userId = 9009;
      const plantId = 9009;

      await createTestUser(userId);
      await createTestPlant(plantId, userId);

      // Create large JSON data
      const largeInputData = {
        sensorReadings: Array.from({ length: 1000 }, (_, i) => ({
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
          soilMoisture: Math.random() * 100,
          temperature: 20 + Math.random() * 15,
          humidity: 40 + Math.random() * 40,
          lightLevel: Math.random() * 2000
        })),
        metadata: {
          plantType: 'tomato',
          location: 'greenhouse',
          sensors: ['moisture', 'temperature', 'humidity', 'light']
        }
      };

      const largeResultData = {
        predictions: Array.from({ length: 100 }, (_, i) => ({
          hour: i,
          shouldWater: Math.random() > 0.5,
          confidence: Math.random(),
          waterAmount: Math.random() * 500
        })),
        analysis: {
          trends: 'increasing_moisture_need',
          recommendations: ['water_in_morning', 'check_drainage', 'monitor_temperature']
        }
      };

      const startTime = Date.now();

      const largeDataQuery = `
        INSERT INTO ai_analyses (plant_id, user_id, analysis_type, input_data, result_data)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `;
      
      const result = await dbPool.query(largeDataQuery, [
        plantId,
        userId,
        'large_data_test',
        JSON.stringify(largeInputData),
        JSON.stringify(largeResultData)
      ]);

      const insertTime = Date.now() - startTime;

      expect(result.rows.length).toBe(1);
      expect(insertTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Test querying large JSON data
      const queryStartTime = Date.now();
      
      const jsonQueryResult = await dbPool.query(`
        SELECT 
          jsonb_array_length(input_data->'sensorReadings') as sensor_count,
          jsonb_array_length(result_data->'predictions') as prediction_count,
          result_data->'analysis'->>'trends' as trends
        FROM ai_analyses 
        WHERE id = $1
      `, [result.rows[0].id]);

      const queryTime = Date.now() - queryStartTime;

      expect(queryTime).toBeLessThan(1000);
      expect(queryResult.rows[0].sensor_count).toBe(1000);
      expect(queryResult.rows[0].prediction_count).toBe(100);
      expect(queryResult.rows[0].trends).toBe('increasing_moisture_need');

      console.log(`Large JSON insert: ${insertTime}ms, query: ${queryTime}ms`);
    });
  });
});