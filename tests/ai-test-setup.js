/**
 * AI Test Setup Utilities
 * Helper functions for setting up AI integration tests
 */

const bcrypt = require('bcrypt');

// Mock database operations for testing
const mockDatabase = {
    users: [],
    plants: [],
    predictions: [],
    analyses: []
};

/**
 * Setup test database (mock implementation)
 */
async function setupTestDatabase() {
    // Clear mock data
    mockDatabase.users = [];
    mockDatabase.plants = [];
    mockDatabase.predictions = [];
    mockDatabase.analyses = [];
    
    console.log('🗄️  Test database setup completed');
}

/**
 * Cleanup test database
 */
async function cleanupTestDatabase() {
    // Clear mock data
    mockDatabase.users = [];
    mockDatabase.plants = [];
    mockDatabase.predictions = [];
    mockDatabase.analyses = [];
    
    console.log('🧹 Test database cleanup completed');
}

/**
 * Create test user
 */
async function createTestUser() {
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    
    const testUser = {
        user_id: 1,
        email: 'test@example.com',
        password: hashedPassword,
        first_name: 'Test',
        last_name: 'User',
        created_at: new Date(),
        is_admin: false
    };
    
    mockDatabase.users.push(testUser);
    return testUser;
}

/**
 * Create test plant
 */
async function createTestPlant(userId) {
    const testPlant = {
        plant_id: 1,
        user_id: userId,
        custom_name: 'Test Plant',
        plant_type: 'Tomato',
        location: 'Test Garden',
        created_at: new Date(),
        is_active: true
    };
    
    mockDatabase.plants.push(testPlant);
    return testPlant;
}

/**
 * Create test admin user
 */
async function createTestAdmin() {
    const hashedPassword = await bcrypt.hash('adminpassword123', 10);
    
    const testAdmin = {
        user_id: 2,
        email: 'admin@example.com',
        password: hashedPassword,
        first_name: 'Admin',
        last_name: 'User',
        created_at: new Date(),
        is_admin: true
    };
    
    mockDatabase.users.push(testAdmin);
    return testAdmin;
}

/**
 * Mock sensor data generator
 */
function generateMockSensorData(options = {}) {
    return {
        moisture: options.moisture || (30 + Math.random() * 40), // 30-70%
        temperature: options.temperature || (18 + Math.random() * 12), // 18-30°C
        humidity: options.humidity || (40 + Math.random() * 40), // 40-80%
        light: options.light || (200 + Math.random() * 600), // 200-800 lux
        timestamp: new Date()
    };
}

/**
 * Mock historical sensor data
 */
function generateMockHistoricalData(days = 7) {
    const data = [];
    const now = new Date();
    
    for (let i = days; i >= 0; i--) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        
        // Generate multiple readings per day
        for (let j = 0; j < 4; j++) {
            const readingTime = new Date(date.getTime() + (j * 6 * 60 * 60 * 1000));
            
            data.push({
                ...generateMockSensorData(),
                timestamp: readingTime,
                plant_id: 1
            });
        }
    }
    
    return data;
}

/**
 * Wait for a specified amount of time
 */
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate test image buffer
 */
async function generateTestImageBuffer() {
    try {
        const sharp = require('sharp');
        
        return await sharp({
            create: {
                width: 224,
                height: 224,
                channels: 3,
                background: { r: 60, g: 140, b: 60 }
            }
        })
        .jpeg({ quality: 80 })
        .toBuffer();
    } catch (error) {
        console.warn('Sharp not available, using mock buffer');
        return Buffer.from('mock-image-data');
    }
}

/**
 * Validate test environment
 */
function validateTestEnvironment() {
    const requiredEnvVars = [
        'NODE_ENV'
    ];
    
    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missing.length > 0) {
        console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
    }
    
    // Set test environment if not set
    if (!process.env.NODE_ENV) {
        process.env.NODE_ENV = 'test';
    }
    
    return {
        isValid: missing.length === 0,
        missing: missing
    };
}

/**
 * Mock AI service responses
 */
const mockAIResponses = {
    wateringPrediction: {
        shouldWater: true,
        confidence: 0.85,
        recommendedAmount: 200,
        reasoning: 'Mock prediction: Low moisture detected',
        modelUsed: 'mock-model',
        processingTime: 150
    },
    
    diseaseRecognition: {
        diseaseDetected: 'Healthy',
        confidence: 0.92,
        severity: 'none',
        isHealthy: true,
        treatmentSuggestions: ['Continue current care routine'],
        preventionTips: ['Maintain good plant hygiene'],
        urgency: 'low'
    },
    
    chatbotResponse: {
        response: 'This is a mock chatbot response for testing purposes.',
        confidence: 0.8,
        isPlantRelated: true,
        source: 'mock-chatbot'
    }
};

/**
 * Performance test utilities
 */
const performanceUtils = {
    /**
     * Measure execution time of a function
     */
    async measureTime(fn) {
        const start = Date.now();
        const result = await fn();
        const duration = Date.now() - start;
        
        return {
            result,
            duration
        };
    },
    
    /**
     * Run function multiple times and get average time
     */
    async benchmark(fn, iterations = 10) {
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const { duration } = await this.measureTime(fn);
            times.push(duration);
        }
        
        return {
            average: times.reduce((a, b) => a + b, 0) / times.length,
            min: Math.min(...times),
            max: Math.max(...times),
            times
        };
    }
};

module.exports = {
    setupTestDatabase,
    cleanupTestDatabase,
    createTestUser,
    createTestPlant,
    createTestAdmin,
    generateMockSensorData,
    generateMockHistoricalData,
    generateTestImageBuffer,
    validateTestEnvironment,
    mockAIResponses,
    performanceUtils,
    wait,
    mockDatabase
};