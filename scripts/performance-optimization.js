#!/usr/bin/env node

/**
 * Performance Optimization Script for AI Features Integration
 * Analyzes and optimizes system performance across all components
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class PerformanceOptimizer {
  constructor() {
    this.results = {
      optimizations: 0,
      warnings: 0,
      errors: 0,
      recommendations: []
    };
    this.startTime = Date.now();
  }

  async optimize() {
    console.log('⚡ Starting performance optimization...');
    console.log('=' .repeat(50));
    
    try {
      await this.analyzeSystemResources();
      await this.optimizeDatabase();
      await this.optimizeRedisCache();
      await this.optimizeAIModels();
      await this.optimizeImageProcessing();
      await this.optimizeNetworkConfiguration();
      await this.optimizeLogging();
      await this.analyzeMemoryUsage();
      await this.optimizeDockerConfiguration();
      
      this.generateOptimizationReport();
      
    } catch (error) {
      console.error('❌ Performance optimization failed:', error.message);
      process.exit(1);
    }
  }

  async analyzeSystemResources() {
    console.log('\n📊 Analyzing system resources...');
    
    try {
      // Check available memory
      const memInfo = execSync('free -m', { encoding: 'utf8' });
      const memLines = memInfo.split('\n');
      const memData = memLines[1].split(/\s+/);
      const totalMem = parseInt(memData[1]);
      const availableMem = parseInt(memData[6]);
      
      console.log(`💾 Memory: ${availableMem}MB available of ${totalMem}MB total`);
      
      if (availableMem < 1000) {
        this.addWarning('Low available memory detected', 'Consider increasing system memory or optimizing memory usage');
      } else {
        this.addOptimization('Sufficient memory available for AI operations');
      }
      
      // Check CPU usage
      const cpuInfo = execSync('top -bn1 | grep "Cpu(s)"', { encoding: 'utf8' });
      const cpuMatch = cpuInfo.match(/(\d+\.\d+)%us/);
      if (cpuMatch) {
        const cpuUsage = parseFloat(cpuMatch[1]);
        console.log(`🖥️  CPU Usage: ${cpuUsage}%`);
        
        if (cpuUsage > 80) {
          this.addWarning('High CPU usage detected', 'Monitor CPU usage and consider scaling');
        }
      }
      
      // Check disk space
      const diskInfo = execSync('df -h /', { encoding: 'utf8' });
      const diskLines = diskInfo.split('\n');
      const diskData = diskLines[1].split(/\s+/);
      const diskUsage = diskData[4];
      
      console.log(`💿 Disk Usage: ${diskUsage}`);
      
      if (parseInt(diskUsage) > 80) {
        this.addWarning('High disk usage detected', 'Clean up old files and logs');
      }
      
    } catch (error) {
      console.log('ℹ️  Could not analyze system resources (non-Linux system)');
    }
  }

  async optimizeDatabase() {
    console.log('\n🗄️  Optimizing database performance...');
    
    // Check for database optimization opportunities
    const dbOptimizations = [
      {
        file: 'ai-service/database/ai-schema-migration.sql',
        check: 'indexes',
        optimization: 'Database indexes for AI tables'
      },
      {
        file: 'postgredb.sql',
        check: 'indexes',
        optimization: 'Main database indexes'
      }
    ];
    
    for (const opt of dbOptimizations) {
      try {
        const content = await fs.readFile(opt.file, 'utf8');
        
        if (content.includes('CREATE INDEX')) {
          this.addOptimization(`${opt.optimization} - indexes found`);
        } else {
          this.addRecommendation(`Add database indexes for ${opt.file}`, 
            'CREATE INDEX idx_table_column ON table(column);');
        }
        
        // Check for query optimization
        if (content.includes('EXPLAIN') || content.includes('ANALYZE')) {
          this.addOptimization('Query analysis tools detected');
        } else {
          this.addRecommendation('Add query performance analysis', 
            'Use EXPLAIN ANALYZE for query optimization');
        }
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.addError(`Could not optimize ${opt.file}`, error.message);
        }
      }
    }
    
    // Generate database optimization script
    await this.generateDatabaseOptimizationScript();
  }

  async optimizeRedisCache() {
    console.log('\n🚀 Optimizing Redis cache configuration...');
    
    const cacheOptimizations = [
      {
        service: 'ai-service/services/redisCacheService.js',
        feature: 'Redis caching implementation'
      },
      {
        service: 'ai-service/services/irrigationCacheService.js',
        feature: 'Irrigation prediction caching'
      }
    ];
    
    for (const opt of cacheOptimizations) {
      try {
        const content = await fs.readFile(opt.service, 'utf8');
        
        // Check for TTL configuration
        if (content.includes('ttl') || content.includes('expire')) {
          this.addOptimization(`${opt.feature} - TTL configured`);
        } else {
          this.addRecommendation(`Configure TTL for ${opt.feature}`, 
            'Set appropriate cache expiration times');
        }
        
        // Check for cache invalidation
        if (content.includes('invalidate') || content.includes('delete')) {
          this.addOptimization(`${opt.feature} - cache invalidation implemented`);
        } else {
          this.addRecommendation(`Implement cache invalidation for ${opt.feature}`, 
            'Add cache invalidation on data updates');
        }
        
        // Check for compression
        if (content.includes('compress') || content.includes('gzip')) {
          this.addOptimization(`${opt.feature} - compression enabled`);
        } else {
          this.addRecommendation(`Enable compression for ${opt.feature}`, 
            'Compress large cached objects');
        }
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.addError(`Could not optimize ${opt.service}`, error.message);
        }
      }
    }
    
    // Generate Redis optimization configuration
    await this.generateRedisOptimizationConfig();
  }

  async optimizeAIModels() {
    console.log('\n🤖 Optimizing AI model performance...');
    
    const modelServices = [
      'ai-service/services/diseaseDetectionService.js',
      'ai-service/services/irrigationPredictionService.js',
      'ai-service/services/modelOptimizationService.js'
    ];
    
    for (const service of modelServices) {
      try {
        const content = await fs.readFile(service, 'utf8');
        
        // Check for model lazy loading
        if (content.includes('lazy') || content.includes('loadModel')) {
          this.addOptimization(`${service} - lazy loading implemented`);
        } else {
          this.addRecommendation(`Implement lazy loading for ${service}`, 
            'Load models only when needed');
        }
        
        // Check for model quantization
        if (content.includes('quantiz') || content.includes('optimize')) {
          this.addOptimization(`${service} - model optimization detected`);
        } else {
          this.addRecommendation(`Implement model quantization for ${service}`, 
            'Use TensorFlow.js quantization for smaller models');
        }
        
        // Check for batch processing
        if (content.includes('batch') || content.includes('parallel')) {
          this.addOptimization(`${service} - batch processing implemented`);
        } else {
          this.addRecommendation(`Implement batch processing for ${service}`, 
            'Process multiple requests together');
        }
        
        // Check for WebWorker usage
        if (content.includes('Worker') || content.includes('worker')) {
          this.addOptimization(`${service} - WebWorker implementation detected`);
        } else {
          this.addRecommendation(`Use WebWorkers for ${service}`, 
            'Offload heavy computations to WebWorkers');
        }
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.addError(`Could not optimize ${service}`, error.message);
        }
      }
    }
    
    // Generate model optimization script
    await this.generateModelOptimizationScript();
  }

  async optimizeImageProcessing() {
    console.log('\n🖼️  Optimizing image processing performance...');
    
    const imageServices = [
      'ai-service/services/imageStorageService.js',
      'ai-service/services/imageValidationService.js'
    ];
    
    for (const service of imageServices) {
      try {
        const content = await fs.readFile(service, 'utf8');
        
        // Check for image compression
        if (content.includes('compress') || content.includes('sharp') || content.includes('jimp')) {
          this.addOptimization(`${service} - image compression implemented`);
        } else {
          this.addRecommendation(`Implement image compression for ${service}`, 
            'Use Sharp or similar library for image optimization');
        }
        
        // Check for image resizing
        if (content.includes('resize') || content.includes('thumbnail')) {
          this.addOptimization(`${service} - image resizing implemented`);
        } else {
          this.addRecommendation(`Implement image resizing for ${service}`, 
            'Generate thumbnails and multiple sizes');
        }
        
        // Check for format optimization
        if (content.includes('webp') || content.includes('format')) {
          this.addOptimization(`${service} - format optimization detected`);
        } else {
          this.addRecommendation(`Optimize image formats for ${service}`, 
            'Use WebP format for better compression');
        }
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.addError(`Could not optimize ${service}`, error.message);
        }
      }
    }
  }

  async optimizeNetworkConfiguration() {
    console.log('\n🌐 Optimizing network configuration...');
    
    // Check Docker Compose configuration
    try {
      const dockerCompose = await fs.readFile('docker-compose.ai.yml', 'utf8');
      
      // Check for resource limits
      if (dockerCompose.includes('deploy:') && dockerCompose.includes('resources:')) {
        this.addOptimization('Docker resource limits configured');
      } else {
        this.addRecommendation('Configure Docker resource limits', 
          'Set memory and CPU limits for containers');
      }
      
      // Check for health checks
      if (dockerCompose.includes('healthcheck:')) {
        this.addOptimization('Docker health checks configured');
      } else {
        this.addRecommendation('Add Docker health checks', 
          'Configure health checks for all services');
      }
      
      // Check for restart policies
      if (dockerCompose.includes('restart:')) {
        this.addOptimization('Docker restart policies configured');
      } else {
        this.addRecommendation('Configure Docker restart policies', 
          'Set restart: unless-stopped for production');
      }
      
    } catch (error) {
      this.addError('Could not optimize Docker configuration', error.message);
    }
    
    // Check Nginx configuration
    try {
      const nginxConfig = await fs.readFile('nginx/nginx.conf', 'utf8');
      
      // Check for gzip compression
      if (nginxConfig.includes('gzip')) {
        this.addOptimization('Nginx gzip compression configured');
      } else {
        this.addRecommendation('Enable Nginx gzip compression', 
          'Add gzip on; to nginx configuration');
      }
      
      // Check for caching
      if (nginxConfig.includes('expires') || nginxConfig.includes('cache')) {
        this.addOptimization('Nginx caching configured');
      } else {
        this.addRecommendation('Configure Nginx caching', 
          'Add expires headers for static assets');
      }
      
    } catch (error) {
      if (error.code !== 'ENOENT') {
        this.addError('Could not optimize Nginx configuration', error.message);
      }
    }
  }

  async optimizeLogging() {
    console.log('\n📝 Optimizing logging performance...');
    
    const logServices = [
      'ai-service/utils/errorHandler.js',
      'utils/logger.js'
    ];
    
    for (const service of logServices) {
      try {
        const content = await fs.readFile(service, 'utf8');
        
        // Check for log levels
        if (content.includes('level') && content.includes('winston')) {
          this.addOptimization(`${service} - log levels configured`);
        } else {
          this.addRecommendation(`Configure log levels for ${service}`, 
            'Use appropriate log levels (error, warn, info, debug)');
        }
        
        // Check for log rotation
        if (content.includes('rotation') || content.includes('DailyRotateFile')) {
          this.addOptimization(`${service} - log rotation configured`);
        } else {
          this.addRecommendation(`Configure log rotation for ${service}`, 
            'Use winston-daily-rotate-file for log rotation');
        }
        
        // Check for structured logging
        if (content.includes('json') || content.includes('structured')) {
          this.addOptimization(`${service} - structured logging implemented`);
        } else {
          this.addRecommendation(`Implement structured logging for ${service}`, 
            'Use JSON format for better log analysis');
        }
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.addError(`Could not optimize ${service}`, error.message);
        }
      }
    }
  }

  async analyzeMemoryUsage() {
    console.log('\n💾 Analyzing memory usage patterns...');
    
    // Check for memory leaks in services
    const services = [
      'ai-service/app.js',
      'app.js'
    ];
    
    for (const service of services) {
      try {
        const content = await fs.readFile(service, 'utf8');
        
        // Check for memory monitoring
        if (content.includes('memoryUsage') || content.includes('heapUsed')) {
          this.addOptimization(`${service} - memory monitoring implemented`);
        } else {
          this.addRecommendation(`Add memory monitoring to ${service}`, 
            'Monitor process.memoryUsage() regularly');
        }
        
        // Check for garbage collection optimization
        if (content.includes('gc') || content.includes('--max-old-space-size')) {
          this.addOptimization(`${service} - GC optimization detected`);
        } else {
          this.addRecommendation(`Optimize garbage collection for ${service}`, 
            'Set appropriate Node.js memory flags');
        }
        
        // Check for event listener cleanup
        if (content.includes('removeListener') || content.includes('off')) {
          this.addOptimization(`${service} - event listener cleanup implemented`);
        } else {
          this.addRecommendation(`Implement event listener cleanup for ${service}`, 
            'Remove event listeners to prevent memory leaks');
        }
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.addError(`Could not analyze ${service}`, error.message);
        }
      }
    }
  }

  async optimizeDockerConfiguration() {
    console.log('\n🐳 Optimizing Docker configuration...');
    
    const dockerFiles = [
      'Dockerfile',
      'ai-service/Dockerfile',
      'client/Dockerfile'
    ];
    
    for (const dockerfile of dockerFiles) {
      try {
        const content = await fs.readFile(dockerfile, 'utf8');
        
        // Check for multi-stage builds
        if (content.includes('FROM') && content.split('FROM').length > 2) {
          this.addOptimization(`${dockerfile} - multi-stage build implemented`);
        } else {
          this.addRecommendation(`Implement multi-stage build for ${dockerfile}`, 
            'Use multi-stage builds to reduce image size');
        }
        
        // Check for .dockerignore
        const dockerignorePath = path.join(path.dirname(dockerfile), '.dockerignore');
        try {
          await fs.access(dockerignorePath);
          this.addOptimization(`${dockerfile} - .dockerignore found`);
        } catch {
          this.addRecommendation(`Create .dockerignore for ${dockerfile}`, 
            'Exclude unnecessary files from Docker context');
        }
        
        // Check for layer optimization
        if (content.includes('RUN') && content.split('RUN').length > 5) {
          this.addRecommendation(`Optimize layers in ${dockerfile}`, 
            'Combine RUN commands to reduce layers');
        } else {
          this.addOptimization(`${dockerfile} - layer optimization good`);
        }
        
      } catch (error) {
        if (error.code !== 'ENOENT') {
          this.addError(`Could not optimize ${dockerfile}`, error.message);
        }
      }
    }
  }

  async generateDatabaseOptimizationScript() {
    const script = `-- Database Performance Optimization Script
-- Generated by Performance Optimizer

-- AI Tables Indexes
CREATE INDEX IF NOT EXISTS idx_ai_analyses_plant_id ON ai_analyses(plant_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_at ON ai_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_type ON ai_analyses(analysis_type);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_analysis_id ON ai_feedback(analysis_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_created_at ON ai_feedback(created_at);

CREATE INDEX IF NOT EXISTS idx_plant_disease_images_plant_id ON plant_disease_images(plant_id);
CREATE INDEX IF NOT EXISTS idx_plant_disease_images_upload_timestamp ON plant_disease_images(upload_timestamp);

CREATE INDEX IF NOT EXISTS idx_chat_histories_user_id ON chat_histories(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_histories_session_id ON chat_histories(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_histories_created_at ON chat_histories(created_at);

-- Performance Settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Reload configuration
SELECT pg_reload_conf();

-- Analyze tables for better query planning
ANALYZE ai_analyses;
ANALYZE ai_feedback;
ANALYZE plant_disease_images;
ANALYZE chat_histories;
`;

    await fs.mkdir('scripts/optimizations', { recursive: true });
    await fs.writeFile('scripts/optimizations/database-optimization.sql', script);
    this.addOptimization('Database optimization script generated');
  }

  async generateRedisOptimizationConfig() {
    const config = `# Redis Performance Optimization Configuration
# Generated by Performance Optimizer

# Memory optimization
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence optimization
save 900 1
save 300 10
save 60 10000

# Network optimization
tcp-keepalive 300
timeout 0

# Performance tuning
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log

# Security
bind 127.0.0.1
protected-mode yes
`;

    await fs.mkdir('scripts/optimizations', { recursive: true });
    await fs.writeFile('scripts/optimizations/redis-optimization.conf', config);
    this.addOptimization('Redis optimization configuration generated');
  }

  async generateModelOptimizationScript() {
    const script = `#!/usr/bin/env node

/**
 * AI Model Optimization Script
 * Generated by Performance Optimizer
 */

const tf = require('@tensorflow/tfjs-node');

class ModelOptimizer {
  async optimizeModel(modelPath, outputPath) {
    console.log('Loading model for optimization...');
    const model = await tf.loadLayersModel(modelPath);
    
    // Quantize model for better performance
    console.log('Quantizing model...');
    const quantizedModel = await tf.quantization.quantize(model);
    
    // Save optimized model
    console.log('Saving optimized model...');
    await quantizedModel.save(outputPath);
    
    console.log('Model optimization completed');
    
    // Cleanup
    model.dispose();
    quantizedModel.dispose();
  }
  
  async warmUpModels() {
    console.log('Warming up AI models...');
    
    // Warm up disease detection model
    try {
      const diseaseModel = await tf.loadLayersModel('file://./models/disease-detection/model.json');
      const dummyInput = tf.zeros([1, 224, 224, 3]);
      await diseaseModel.predict(dummyInput);
      dummyInput.dispose();
      console.log('Disease detection model warmed up');
    } catch (error) {
      console.log('Could not warm up disease detection model:', error.message);
    }
    
    // Warm up irrigation prediction model
    try {
      const irrigationModel = await tf.loadLayersModel('file://./models/irrigation-prediction/model.json');
      const dummyInput = tf.zeros([1, 8]);
      await irrigationModel.predict(dummyInput);
      dummyInput.dispose();
      console.log('Irrigation prediction model warmed up');
    } catch (error) {
      console.log('Could not warm up irrigation prediction model:', error.message);
    }
  }
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new ModelOptimizer();
  optimizer.warmUpModels().catch(console.error);
}

module.exports = ModelOptimizer;
`;

    await fs.mkdir('scripts/optimizations', { recursive: true });
    await fs.writeFile('scripts/optimizations/model-optimization.js', script);
    this.addOptimization('Model optimization script generated');
  }

  addOptimization(description) {
    console.log(`✅ ${description}`);
    this.results.optimizations++;
  }

  addWarning(description, recommendation) {
    console.log(`⚠️  WARNING: ${description}`);
    console.log(`   Recommendation: ${recommendation}`);
    this.results.warnings++;
    this.results.recommendations.push({ type: 'warning', description, recommendation });
  }

  addRecommendation(description, implementation) {
    console.log(`💡 RECOMMENDATION: ${description}`);
    console.log(`   Implementation: ${implementation}`);
    this.results.recommendations.push({ type: 'recommendation', description, implementation });
  }

  addError(description, error) {
    console.log(`❌ ERROR: ${description}`);
    console.log(`   Error: ${error}`);
    this.results.errors++;
  }

  generateOptimizationReport() {
    const duration = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(50));
    console.log('⚡ PERFORMANCE OPTIMIZATION REPORT');
    console.log('='.repeat(50));
    
    console.log(`\n📊 Summary:`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Optimizations Applied: ${this.results.optimizations}`);
    console.log(`  Warnings: ${this.results.warnings}`);
    console.log(`  Errors: ${this.results.errors}`);
    console.log(`  Recommendations: ${this.results.recommendations.length}`);
    
    if (this.results.recommendations.length > 0) {
      console.log(`\n💡 RECOMMENDATIONS:`);
      this.results.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec.description}`);
        if (rec.implementation) {
          console.log(`     Implementation: ${rec.implementation}`);
        }
        if (rec.recommendation) {
          console.log(`     Recommendation: ${rec.recommendation}`);
        }
      });
    }
    
    console.log(`\n📁 Generated Optimization Files:`);
    console.log(`  - scripts/optimizations/database-optimization.sql`);
    console.log(`  - scripts/optimizations/redis-optimization.conf`);
    console.log(`  - scripts/optimizations/model-optimization.js`);
    
    // Save detailed report
    this.saveOptimizationReport();
    
    console.log('\n✅ Performance optimization completed successfully!');
  }

  async saveOptimizationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      summary: {
        optimizations: this.results.optimizations,
        warnings: this.results.warnings,
        errors: this.results.errors,
        recommendations: this.results.recommendations.length
      },
      recommendations: this.results.recommendations,
      generatedFiles: [
        'scripts/optimizations/database-optimization.sql',
        'scripts/optimizations/redis-optimization.conf',
        'scripts/optimizations/model-optimization.js'
      ]
    };
    
    const reportPath = path.join(__dirname, '..', 'reports', 'performance-optimization-report.json');
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new PerformanceOptimizer();
  optimizer.optimize().catch(console.error);
}

module.exports = PerformanceOptimizer;