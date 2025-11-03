/**
 * Optimized Image Processor
 * High-performance image processing with Sharp.js optimization
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const aiErrorHandler = require('./aiErrorHandler');
const aiCacheService = require('./aiCacheService');

class OptimizedImageProcessor {
    constructor() {
        this.config = {
            // Processing settings
            maxConcurrentProcessing: 3,
            defaultQuality: 85,
            maxImageSize: 10 * 1024 * 1024, // 10MB
            
            // Output formats
            formats: {
                thumbnail: { width: 150, height: 150, quality: 70 },
                preview: { width: 400, height: 400, quality: 80 },
                analysis: { width: 224, height: 224, quality: 90 },
                original: { quality: 95 }
            },
            
            // Cache settings
            cacheProcessedImages: true,
            cacheTTL: 3600, // 1 hour
            
            // Optimization settings
            progressive: true,
            mozjpeg: true,
            optimizeScans: true
        };

        this.processingQueue = [];
        this.currentProcessing = 0;
        this.processedCache = new Map();
        
        // Configure Sharp for optimal performance
        this.configureSharp();
    }

    /**
     * Configure Sharp for optimal performance
     */
    configureSharp() {
        // Set Sharp cache limits for better performance
        sharp.cache({ memory: 50, files: 20, items: 100 });
        
        // Set concurrency based on CPU cores
        const cpuCount = require('os').cpus().length;
        sharp.concurrency(Math.min(cpuCount, 4));
        
        console.log(`📸 Sharp configured with ${cpuCount} CPU cores, max concurrency: ${Math.min(cpuCount, 4)}`);
    }

    /**
     * Process image with multiple optimized outputs
     */
    async processImage(inputPath, options = {}) {
        const startTime = Date.now();
        
        try {
            // Validate input
            await this.validateImage(inputPath);
            
            // Generate cache key
            const cacheKey = await this.generateCacheKey(inputPath, options);
            
            // Check cache first
            if (this.config.cacheProcessedImages) {
                const cached = this.processedCache.get(cacheKey);
                if (cached && await this.isCacheValid(cached)) {
                    return {
                        ...cached.result,
                        cached: true,
                        processingTime: Date.now() - startTime
                    };
                }
            }

            // Queue processing if at capacity
            if (this.currentProcessing >= this.config.maxConcurrentProcessing) {
                return await this.queueProcessing(inputPath, options);
            }

            // Process the image
            const result = await this.performImageProcessing(inputPath, options);
            
            // Cache the result
            if (this.config.cacheProcessedImages) {
                this.processedCache.set(cacheKey, {
                    result,
                    timestamp: Date.now()
                });
            }

            return {
                ...result,
                processingTime: Date.now() - startTime
            };

        } catch (error) {
            await aiErrorHandler.logEvent('ERROR', 'Image processing failed', {
                inputPath,
                error: error.message,
                processingTime: Date.now() - startTime
            });
            throw error;
        }
    }

    /**
     * Perform the actual image processing
     */
    async performImageProcessing(inputPath, options = {}) {
        this.currentProcessing++;
        
        try {
            const outputDir = options.outputDir || path.dirname(inputPath);
            const baseName = path.parse(inputPath).name;
            const results = {};

            // Get image metadata
            const metadata = await sharp(inputPath).metadata();
            results.metadata = {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: metadata.size,
                hasAlpha: metadata.hasAlpha,
                orientation: metadata.orientation
            };

            // Process different formats concurrently
            const processingPromises = [];

            // Generate thumbnail
            if (options.generateThumbnail !== false) {
                processingPromises.push(
                    this.generateOptimizedImage(inputPath, {
                        ...this.config.formats.thumbnail,
                        outputPath: path.join(outputDir, `${baseName}_thumb.jpg`),
                        format: 'jpeg'
                    }).then(result => {
                        results.thumbnail = result;
                    })
                );
            }

            // Generate preview
            if (options.generatePreview !== false) {
                processingPromises.push(
                    this.generateOptimizedImage(inputPath, {
                        ...this.config.formats.preview,
                        outputPath: path.join(outputDir, `${baseName}_preview.jpg`),
                        format: 'jpeg'
                    }).then(result => {
                        results.preview = result;
                    })
                );
            }

            // Generate analysis-ready image (224x224 for ML models)
            if (options.generateAnalysis !== false) {
                processingPromises.push(
                    this.generateOptimizedImage(inputPath, {
                        ...this.config.formats.analysis,
                        outputPath: path.join(outputDir, `${baseName}_analysis.jpg`),
                        format: 'jpeg',
                        fit: 'cover',
                        background: { r: 255, g: 255, b: 255 }
                    }).then(result => {
                        results.analysis = result;
                    })
                );
            }

            // Optimize original if requested
            if (options.optimizeOriginal) {
                processingPromises.push(
                    this.generateOptimizedImage(inputPath, {
                        ...this.config.formats.original,
                        outputPath: path.join(outputDir, `${baseName}_optimized.jpg`),
                        format: 'jpeg'
                    }).then(result => {
                        results.optimized = result;
                    })
                );
            }

            // Wait for all processing to complete
            await Promise.all(processingPromises);

            // Extract image features for quality assessment
            results.features = await this.extractImageFeatures(inputPath);

            return results;

        } finally {
            this.currentProcessing--;
            this.processQueue();
        }
    }

    /**
     * Generate optimized image with Sharp
     */
    async generateOptimizedImage(inputPath, options) {
        const startTime = Date.now();
        
        try {
            let pipeline = sharp(inputPath);

            // Apply transformations
            if (options.width || options.height) {
                pipeline = pipeline.resize(options.width, options.height, {
                    fit: options.fit || 'inside',
                    withoutEnlargement: true,
                    background: options.background || { r: 255, g: 255, b: 255 }
                });
            }

            // Auto-rotate based on EXIF
            pipeline = pipeline.rotate();

            // Apply format-specific optimizations
            switch (options.format) {
                case 'jpeg':
                    pipeline = pipeline.jpeg({
                        quality: options.quality || this.config.defaultQuality,
                        progressive: this.config.progressive,
                        mozjpeg: this.config.mozjpeg,
                        optimizeScans: this.config.optimizeScans
                    });
                    break;
                    
                case 'png':
                    pipeline = pipeline.png({
                        quality: options.quality || this.config.defaultQuality,
                        progressive: this.config.progressive,
                        compressionLevel: 9
                    });
                    break;
                    
                case 'webp':
                    pipeline = pipeline.webp({
                        quality: options.quality || this.config.defaultQuality,
                        effort: 6
                    });
                    break;
            }

            // Process and save
            const info = await pipeline.toFile(options.outputPath);

            return {
                path: options.outputPath,
                size: info.size,
                width: info.width,
                height: info.height,
                format: info.format,
                processingTime: Date.now() - startTime
            };

        } catch (error) {
            throw new Error(`Failed to generate optimized image: ${error.message}`);
        }
    }

    /**
     * Extract image features for quality assessment
     */
    async extractImageFeatures(imagePath) {
        try {
            const image = sharp(imagePath);
            const metadata = await image.metadata();
            
            // Get image statistics
            const stats = await image.stats();
            
            // Calculate quality metrics
            const aspectRatio = metadata.width / metadata.height;
            const megapixels = (metadata.width * metadata.height) / 1000000;
            
            // Estimate blur using standard deviation of luminance
            const blurScore = this.calculateBlurScore(stats);
            
            // Calculate brightness and contrast
            const brightness = this.calculateBrightness(stats);
            const contrast = this.calculateContrast(stats);
            
            // Overall quality score (0-1)
            const qualityScore = this.calculateQualityScore({
                blur: blurScore,
                brightness,
                contrast,
                resolution: Math.min(megapixels / 2, 1), // Normalize to 2MP
                aspectRatio: Math.abs(aspectRatio - 1) < 0.5 ? 1 : 0.7 // Prefer square-ish images
            });

            return {
                quality: {
                    score: qualityScore,
                    blur: blurScore,
                    brightness,
                    contrast,
                    recommendations: this.getQualityRecommendations(qualityScore, {
                        blur: blurScore,
                        brightness,
                        contrast
                    })
                },
                technical: {
                    width: metadata.width,
                    height: metadata.height,
                    aspectRatio,
                    megapixels,
                    format: metadata.format,
                    hasAlpha: metadata.hasAlpha,
                    colorSpace: metadata.space
                }
            };

        } catch (error) {
            console.warn('Failed to extract image features:', error.message);
            return {
                quality: { score: 0.5, recommendations: ['Unable to analyze image quality'] },
                technical: {}
            };
        }
    }

    /**
     * Calculate blur score from image statistics
     */
    calculateBlurScore(stats) {
        // Use standard deviation as a proxy for sharpness
        // Higher std dev generally means more detail/less blur
        const avgStdDev = stats.channels.reduce((sum, ch) => sum + ch.stdev, 0) / stats.channels.length;
        return Math.min(avgStdDev / 50, 1); // Normalize to 0-1
    }

    /**
     * Calculate brightness score
     */
    calculateBrightness(stats) {
        const avgMean = stats.channels.reduce((sum, ch) => sum + ch.mean, 0) / stats.channels.length;
        const normalizedBrightness = avgMean / 255;
        
        // Optimal brightness is around 0.4-0.7
        if (normalizedBrightness >= 0.4 && normalizedBrightness <= 0.7) {
            return 1;
        } else if (normalizedBrightness >= 0.2 && normalizedBrightness <= 0.9) {
            return 0.7;
        } else {
            return 0.3;
        }
    }

    /**
     * Calculate contrast score
     */
    calculateContrast(stats) {
        const avgStdDev = stats.channels.reduce((sum, ch) => sum + ch.stdev, 0) / stats.channels.length;
        // Good contrast typically has std dev > 30
        return Math.min(avgStdDev / 60, 1);
    }

    /**
     * Calculate overall quality score
     */
    calculateQualityScore(metrics) {
        const weights = {
            blur: 0.3,
            brightness: 0.25,
            contrast: 0.25,
            resolution: 0.15,
            aspectRatio: 0.05
        };

        return Object.entries(weights).reduce((score, [metric, weight]) => {
            return score + (metrics[metric] * weight);
        }, 0);
    }

    /**
     * Get quality improvement recommendations
     */
    getQualityRecommendations(qualityScore, metrics) {
        const recommendations = [];

        if (qualityScore < 0.3) {
            recommendations.push('Image quality is poor - consider retaking the photo');
        }

        if (metrics.blur < 0.3) {
            recommendations.push('Image appears blurry - ensure camera is focused and stable');
        }

        if (metrics.brightness < 0.5) {
            recommendations.push('Improve lighting conditions for better analysis');
        }

        if (metrics.contrast < 0.4) {
            recommendations.push('Increase contrast - avoid flat, uniform lighting');
        }

        if (recommendations.length === 0) {
            recommendations.push('Image quality is good for analysis');
        }

        return recommendations;
    }

    /**
     * Queue image processing when at capacity
     */
    async queueProcessing(inputPath, options) {
        return new Promise((resolve, reject) => {
            this.processingQueue.push({
                inputPath,
                options,
                resolve,
                reject,
                queuedAt: Date.now()
            });
        });
    }

    /**
     * Process queued images
     */
    async processQueue() {
        if (this.processingQueue.length === 0 || this.currentProcessing >= this.config.maxConcurrentProcessing) {
            return;
        }

        const queuedItem = this.processingQueue.shift();
        
        try {
            const result = await this.performImageProcessing(queuedItem.inputPath, queuedItem.options);
            queuedItem.resolve(result);
        } catch (error) {
            queuedItem.reject(error);
        }
    }

    /**
     * Validate image file
     */
    async validateImage(imagePath) {
        try {
            const stats = await fs.stat(imagePath);
            
            if (stats.size > this.config.maxImageSize) {
                throw new Error(`Image too large: ${stats.size} bytes (max: ${this.config.maxImageSize})`);
            }

            // Try to read metadata to ensure it's a valid image
            await sharp(imagePath).metadata();
            
        } catch (error) {
            throw new Error(`Invalid image file: ${error.message}`);
        }
    }

    /**
     * Generate cache key for processed images
     */
    async generateCacheKey(inputPath, options) {
        try {
            const stats = await fs.stat(inputPath);
            const optionsString = JSON.stringify(options);
            const keyData = `${inputPath}:${stats.mtime.getTime()}:${stats.size}:${optionsString}`;
            return crypto.createHash('md5').update(keyData).digest('hex');
        } catch (error) {
            return `fallback:${Date.now()}:${Math.random()}`;
        }
    }

    /**
     * Check if cached result is still valid
     */
    async isCacheValid(cached) {
        const age = Date.now() - cached.timestamp;
        return age < (this.config.cacheTTL * 1000);
    }

    /**
     * Clean up temporary files
     */
    async cleanupTempFiles(filePaths) {
        const cleanupPromises = filePaths.map(async (filePath) => {
            try {
                await fs.unlink(filePath);
            } catch (error) {
                console.warn(`Failed to cleanup temp file ${filePath}:`, error.message);
            }
        });

        await Promise.all(cleanupPromises);
    }

    /**
     * Get processor statistics
     */
    getStats() {
        return {
            currentProcessing: this.currentProcessing,
            queueLength: this.processingQueue.length,
            cacheSize: this.processedCache.size,
            config: this.config,
            sharpStats: {
                cache: sharp.cache(),
                concurrency: sharp.concurrency()
            }
        };
    }

    /**
     * Optimize processor performance
     */
    async optimizePerformance() {
        try {
            // Clear old cache entries
            const now = Date.now();
            const expiredKeys = [];
            
            for (const [key, cached] of this.processedCache.entries()) {
                if (now - cached.timestamp > (this.config.cacheTTL * 1000)) {
                    expiredKeys.push(key);
                }
            }
            
            expiredKeys.forEach(key => this.processedCache.delete(key));

            // Clear Sharp cache
            sharp.cache(false);
            sharp.cache({ memory: 50, files: 20, items: 100 });

            await aiErrorHandler.logEvent('INFO', 'Image processor optimization completed', {
                clearedCacheEntries: expiredKeys.length,
                currentCacheSize: this.processedCache.size
            });

            return {
                success: true,
                message: 'Image processor optimized',
                clearedEntries: expiredKeys.length,
                stats: this.getStats()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Health check for image processor
     */
    async healthCheck() {
        try {
            const stats = this.getStats();
            
            return {
                healthy: true,
                status: 'operational',
                stats: stats,
                features: [
                    'Concurrent image processing',
                    'Multiple format optimization',
                    'Quality assessment and recommendations',
                    'Intelligent caching',
                    'Sharp.js performance tuning'
                ]
            };
        } catch (error) {
            return {
                healthy: false,
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Dispose of processor and cleanup
     */
    dispose() {
        try {
            // Clear all caches
            this.processedCache.clear();
            this.processingQueue.length = 0;
            
            // Clear Sharp cache
            sharp.cache(false);
            
            console.log('✅ Optimized Image Processor disposed');
        } catch (error) {
            console.error('Error disposing image processor:', error);
        }
    }
}

module.exports = new OptimizedImageProcessor();