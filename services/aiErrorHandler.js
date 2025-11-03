/**
 * AI Error Handler Service
 * Comprehensive error handling for AI operations with fallback responses
 */

const SystemLog = require('../models/SystemLog');

class AIErrorHandler {
    constructor() {
        this.retryConfig = {
            maxRetries: 3,
            baseDelay: 1000, // 1 second
            maxDelay: 10000, // 10 seconds
            backoffMultiplier: 2
        };
        
        this.fallbackResponses = {
            chatbot: {
                response: "I'm temporarily unavailable. Please try again in a few moments, or contact support if the issue persists.",
                confidence: 0.1,
                source: 'fallback',
                isPlantRelated: false
            },
            wateringPrediction: {
                shouldWater: false,
                confidence: 0.3,
                recommendedAmount: 0,
                reasoning: "AI prediction temporarily unavailable. Please check soil moisture manually.",
                modelUsed: 'fallback-manual-check'
            },
            diseaseRecognition: {
                diseaseDetected: 'Analysis_Unavailable',
                confidence: 0.1,
                severity: 'unknown',
                isHealthy: null,
                treatmentSuggestions: [
                    'AI analysis temporarily unavailable',
                    'Please consult with a plant care expert',
                    'Monitor plant closely for any changes',
                    'Ensure proper watering, lighting, and air circulation'
                ],
                preventionTips: [
                    'Maintain consistent care routine',
                    'Regular health monitoring',
                    'Proper environmental conditions'
                ],
                urgency: 'medium'
            }
        };
    }

    /**
     * Execute function with retry mechanism and exponential backoff
     */
    async executeWithRetry(operation, operationType = 'unknown', context = {}) {
        let lastError;
        let delay = this.retryConfig.baseDelay;

        for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
            try {
                const result = await operation();
                
                // Log successful retry if not first attempt
                if (attempt > 1) {
                    await this.logEvent('INFO', `${operationType} succeeded on attempt ${attempt}`, context);
                }
                
                return result;
            } catch (error) {
                lastError = error;
                
                await this.logEvent('WARN', 
                    `${operationType} failed on attempt ${attempt}/${this.retryConfig.maxRetries}: ${error.message}`, 
                    { ...context, attempt, error: error.message }
                );

                // Don't retry on certain error types
                if (this.isNonRetryableError(error)) {
                    break;
                }

                // Don't wait after the last attempt
                if (attempt < this.retryConfig.maxRetries) {
                    await this.sleep(delay);
                    delay = Math.min(delay * this.retryConfig.backoffMultiplier, this.retryConfig.maxDelay);
                }
            }
        }

        // All retries failed, handle gracefully
        return this.handleFailedOperation(operationType, lastError, context);
    }

    /**
     * Handle OpenRouter API calls with retry and fallback
     */
    async handleOpenRouterCall(apiCall, context = {}) {
        return this.executeWithRetry(async () => {
            try {
                const response = await apiCall();
                
                // Validate response structure
                if (!response || !response.data) {
                    throw new Error('Invalid API response structure');
                }

                return response.data;
            } catch (error) {
                // Handle specific OpenRouter errors
                if (error.response) {
                    const status = error.response.status;
                    const message = error.response.data?.error?.message || error.message;
                    
                    if (status === 429) {
                        throw new Error(`Rate limit exceeded: ${message}`);
                    } else if (status === 401) {
                        throw new Error(`Authentication failed: ${message}`);
                    } else if (status >= 500) {
                        throw new Error(`OpenRouter server error: ${message}`);
                    }
                }
                
                throw error;
            }
        }, 'OpenRouter API call', context);
    }

    /**
     * Handle TensorFlow.js model operations with error recovery
     */
    async handleModelOperation(modelOperation, modelType, context = {}) {
        return this.executeWithRetry(async () => {
            try {
                const result = await modelOperation();
                
                // Validate model output
                if (!result || typeof result !== 'object') {
                    throw new Error('Invalid model output');
                }

                return result;
            } catch (error) {
                // Handle specific TensorFlow errors
                if (error.message.includes('memory')) {
                    throw new Error('Model memory error - may need to restart');
                } else if (error.message.includes('tensor')) {
                    throw new Error('Tensor operation failed - invalid input data');
                } else if (error.message.includes('model')) {
                    throw new Error('Model loading or execution failed');
                }
                
                throw error;
            }
        }, `${modelType} model operation`, context);
    }

    /**
     * Handle image processing operations
     */
    async handleImageProcessing(imageOperation, context = {}) {
        return this.executeWithRetry(async () => {
            try {
                const result = await imageOperation();
                return result;
            } catch (error) {
                // Handle specific image processing errors
                if (error.message.includes('ENOENT')) {
                    throw new Error('Image file not found or inaccessible');
                } else if (error.message.includes('format')) {
                    throw new Error('Unsupported image format');
                } else if (error.message.includes('size')) {
                    throw new Error('Image size too large or invalid');
                }
                
                throw error;
            }
        }, 'Image processing', context);
    }

    /**
     * Handle database operations with retry
     */
    async handleDatabaseOperation(dbOperation, context = {}) {
        return this.executeWithRetry(async () => {
            try {
                const result = await dbOperation();
                return result;
            } catch (error) {
                // Handle specific database errors
                if (error.code === 'ECONNREFUSED') {
                    throw new Error('Database connection refused');
                } else if (error.code === 'ETIMEDOUT') {
                    throw new Error('Database operation timed out');
                } else if (error.message.includes('duplicate')) {
                    throw new Error('Duplicate entry in database');
                }
                
                throw error;
            }
        }, 'Database operation', context);
    }

    /**
     * Get fallback response for failed operations
     */
    getFallbackResponse(operationType, error, context = {}) {
        const fallback = this.fallbackResponses[operationType];
        
        if (!fallback) {
            return {
                success: false,
                error: 'Service temporarily unavailable',
                fallback: true,
                message: 'Please try again later or contact support'
            };
        }

        return {
            success: true,
            data: {
                ...fallback,
                fallback: true,
                error: error?.message || 'Unknown error',
                timestamp: new Date().toISOString(),
                context: context
            }
        };
    }

    /**
     * Handle failed operation with appropriate fallback
     */
    async handleFailedOperation(operationType, error, context = {}) {
        await this.logEvent('ERROR', 
            `All retries failed for ${operationType}: ${error?.message || 'Unknown error'}`, 
            { ...context, finalError: error?.message }
        );

        // Return appropriate fallback response
        return this.getFallbackResponse(operationType, error, context);
    }

    /**
     * Check if error should not be retried
     */
    isNonRetryableError(error) {
        const nonRetryablePatterns = [
            'authentication',
            'authorization',
            'invalid input',
            'validation',
            'not found',
            'bad request',
            'malformed'
        ];

        const errorMessage = error.message.toLowerCase();
        return nonRetryablePatterns.some(pattern => errorMessage.includes(pattern));
    }

    /**
     * Sleep utility for retry delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Log events with error handling
     */
    async logEvent(level, message, context = {}) {
        try {
            await SystemLog.create({
                log_level: level,
                source: 'AIErrorHandler',
                message: message,
                details: JSON.stringify(context)
            });
        } catch (logError) {
            // Fallback to console if database logging fails
            console.error(`Failed to log ${level}: ${message}`, logError);
        }
    }

    /**
     * Create error response with consistent format
     */
    createErrorResponse(message, error = null, statusCode = 500) {
        return {
            success: false,
            message: message,
            error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error?.message,
            timestamp: new Date().toISOString(),
            statusCode: statusCode
        };
    }

    /**
     * Validate and sanitize input data
     */
    validateInput(data, schema) {
        const errors = [];
        
        for (const [field, rules] of Object.entries(schema)) {
            const value = data[field];
            
            if (rules.required && (value === undefined || value === null)) {
                errors.push(`${field} is required`);
                continue;
            }
            
            if (value !== undefined && value !== null) {
                if (rules.type && typeof value !== rules.type) {
                    errors.push(`${field} must be of type ${rules.type}`);
                }
                
                if (rules.min !== undefined && value < rules.min) {
                    errors.push(`${field} must be at least ${rules.min}`);
                }
                
                if (rules.max !== undefined && value > rules.max) {
                    errors.push(`${field} must be at most ${rules.max}`);
                }
                
                if (rules.pattern && !rules.pattern.test(value)) {
                    errors.push(`${field} format is invalid`);
                }
            }
        }
        
        return errors;
    }

    /**
     * Health check for error handler
     */
    async healthCheck() {
        try {
            // Test logging capability
            await this.logEvent('INFO', 'Error handler health check', { timestamp: Date.now() });
            
            return {
                healthy: true,
                status: 'operational',
                features: [
                    'Retry mechanism with exponential backoff',
                    'Fallback responses for all AI operations',
                    'Comprehensive error logging',
                    'Input validation and sanitization',
                    'Graceful degradation'
                ],
                config: {
                    maxRetries: this.retryConfig.maxRetries,
                    baseDelay: this.retryConfig.baseDelay,
                    maxDelay: this.retryConfig.maxDelay
                }
            };
        } catch (error) {
            return {
                healthy: false,
                status: 'degraded',
                error: error.message
            };
        }
    }
}

module.exports = new AIErrorHandler();