#!/usr/bin/env node

/**
 * Quick Development Startup Script
 * Starts all services for local development
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class DevStarter {
  constructor() {
    this.processes = [];
    this.isWindows = process.platform === 'win32';
  }

  async start() {
    console.log('🚀 Starting AI Features Integration - Development Mode');
    console.log('=' .repeat(60));
    
    try {
      await this.checkPrerequisites();
      await this.startInfrastructure();
      await this.setupDatabase();
      await this.installDependencies();
      await this.startServices();
      
      this.showAccessInfo();
      this.setupGracefulShutdown();
      
    } catch (error) {
      console.error('❌ Failed to start development environment:', error.message);
      await this.cleanup();
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    console.log('\n🔍 Checking prerequisites...');
    
    // Check Node.js
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      console.log(`✅ Node.js: ${nodeVersion}`);
    } catch (error) {
      throw new Error('Node.js is not installed');
    }
    
    // Check npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`✅ npm: ${npmVersion}`);
    } catch (error) {
      throw new Error('npm is not installed');
    }
    
    // Check Docker (optional)
    try {
      const dockerVersion = execSync('docker --version', { encoding: 'utf8' }).trim();
      console.log(`✅ Docker: ${dockerVersion}`);
    } catch (error) {
      console.log('⚠️  Docker not found - will use manual setup');
    }
    
    // Check environment files
    const envFiles = ['.env', 'ai-service/.env'];
    for (const envFile of envFiles) {
      if (!fs.existsSync(envFile)) {
        console.log(`⚠️  ${envFile} not found - creating template`);
        await this.createEnvTemplate(envFile);
      } else {
        console.log(`✅ ${envFile} exists`);
      }
    }
  }

  async createEnvTemplate(envFile) {
    const templates = {
      '.env': `# Main Server Environment Variables
DATABASE_URL=postgresql://postgres:password@localhost:5432/plant_monitoring
REDIS_URL=redis://localhost:6379
MQTT_BROKER_URL=mqtt://localhost:1883
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
NODE_ENV=development
PORT=3010
`,
      'ai-service/.env': `# AI Service Environment Variables
DATABASE_URL=postgresql://postgres:password@localhost:5432/plant_monitoring
REDIS_URL=redis://localhost:6379
MQTT_BROKER_URL=mqtt://localhost:1883
OPENROUTER_API_KEY=your-openrouter-api-key-here
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
NODE_ENV=development
PORT=3001
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
MODEL_CACHE_SIZE=1000
MAX_CONCURRENT_REQUESTS=50
`
    };
    
    fs.writeFileSync(envFile, templates[envFile]);
    console.log(`📝 Created ${envFile} template - please update with your values`);
  }

  async startInfrastructure() {
    console.log('\n🐳 Starting infrastructure services...');
    
    try {
      // Try Docker first
      execSync('docker-compose -f docker-compose.dev.yml up -d', { stdio: 'inherit' });
      console.log('✅ Infrastructure started with Docker');
      
      // Wait for services to be ready
      console.log('⏳ Waiting for services to be ready...');
      await this.sleep(10000);
      
    } catch (error) {
      console.log('⚠️  Docker not available - please start PostgreSQL, Redis, and MQTT manually');
      console.log('   PostgreSQL: localhost:5432 (database: plant_monitoring)');
      console.log('   Redis: localhost:6379');
      console.log('   MQTT: localhost:1883');
    }
  }

  async setupDatabase() {
    console.log('\n🗄️  Setting up database...');
    
    try {
      // Wait a bit more for PostgreSQL to be ready
      await this.sleep(5000);
      
      execSync('node ai-service/database/setup-ai-database.js', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Database setup completed');
      
    } catch (error) {
      console.log('⚠️  Database setup failed - please run manually:');
      console.log('   cd ai-service && node database/setup-ai-database.js');
    }
  }

  async installDependencies() {
    console.log('\n📦 Installing dependencies...');
    
    const packages = [
      { name: 'Main Server', path: '.' },
      { name: 'AI Service', path: 'ai-service' },
      { name: 'Frontend', path: 'client' }
    ];
    
    for (const pkg of packages) {
      if (fs.existsSync(path.join(pkg.path, 'package.json'))) {
        try {
          console.log(`📦 Installing ${pkg.name} dependencies...`);
          execSync('npm install', { 
            stdio: 'inherit',
            cwd: pkg.path
          });
          console.log(`✅ ${pkg.name} dependencies installed`);
        } catch (error) {
          console.log(`⚠️  Failed to install ${pkg.name} dependencies`);
        }
      }
    }
  }

  async startServices() {
    console.log('\n🚀 Starting application services...');
    
    // Start AI Service
    console.log('🤖 Starting AI Service...');
    const aiService = spawn('node', ['app.js'], {
      cwd: 'ai-service',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'development' }
    });
    
    aiService.stdout.on('data', (data) => {
      console.log(`[AI Service] ${data.toString().trim()}`);
    });
    
    aiService.stderr.on('data', (data) => {
      console.error(`[AI Service Error] ${data.toString().trim()}`);
    });
    
    this.processes.push({ name: 'AI Service', process: aiService });
    
    // Wait for AI Service to start
    await this.sleep(3000);
    
    // Start Main Server
    if (fs.existsSync('app.js')) {
      console.log('🖥️  Starting Main Server...');
      const mainServer = spawn('node', ['app.js'], {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'development' }
      });
      
      mainServer.stdout.on('data', (data) => {
        console.log(`[Main Server] ${data.toString().trim()}`);
      });
      
      mainServer.stderr.on('data', (data) => {
        console.error(`[Main Server Error] ${data.toString().trim()}`);
      });
      
      this.processes.push({ name: 'Main Server', process: mainServer });
      
      // Wait for Main Server to start
      await this.sleep(3000);
    }
    
    // Start Frontend
    if (fs.existsSync('client/package.json')) {
      console.log('🌐 Starting Frontend...');
      const frontend = spawn('npm', ['run', 'dev'], {
        cwd: 'client',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'development' }
      });
      
      frontend.stdout.on('data', (data) => {
        console.log(`[Frontend] ${data.toString().trim()}`);
      });
      
      frontend.stderr.on('data', (data) => {
        console.error(`[Frontend Error] ${data.toString().trim()}`);
      });
      
      this.processes.push({ name: 'Frontend', process: frontend });
    }
    
    console.log('✅ All services started');
  }

  showAccessInfo() {
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Development Environment Ready!');
    console.log('='.repeat(60));
    
    console.log('\n🌐 Access URLs:');
    console.log('  Frontend:        http://localhost:3000');
    console.log('  Main Server:     http://localhost:3010');
    console.log('  AI Service:      http://localhost:3001');
    console.log('  API Docs:        http://localhost:3001/api/docs');
    
    console.log('\n🔧 Management Tools:');
    console.log('  Database Admin:  http://localhost:8080 (Adminer)');
    console.log('  Redis Admin:     http://localhost:8081 (Redis Commander)');
    
    console.log('\n🏥 Health Checks:');
    console.log('  AI Service:      http://localhost:3001/api/ai/health');
    console.log('  Main Server:     http://localhost:3010/health');
    
    console.log('\n🧪 AI Features:');
    console.log('  AI Chat:         http://localhost:3000/ai-chat');
    console.log('  Disease Detection: http://localhost:3000/disease-detection');
    console.log('  Irrigation:      http://localhost:3000/irrigation-prediction');
    
    console.log('\n📊 Quick Tests:');
    console.log('  curl http://localhost:3001/api/ai/health');
    console.log('  curl http://localhost:3010/health');
    
    console.log('\n⚡ Quick Commands:');
    console.log('  Test Chatbot:    node ai-service/test-chatbot-simple.js');
    console.log('  Run Tests:       npm test');
    console.log('  Quality Check:   node scripts/run-quality-assurance.js');
    
    console.log('\n🛑 To Stop: Press Ctrl+C');
    console.log('='.repeat(60));
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      await this.cleanup();
      process.exit(0);
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up...');
    
    // Kill all spawned processes
    for (const proc of this.processes) {
      try {
        console.log(`🛑 Stopping ${proc.name}...`);
        proc.process.kill();
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
    
    // Stop Docker services
    try {
      execSync('docker-compose -f docker-compose.dev.yml down', { stdio: 'ignore' });
      console.log('🐳 Docker services stopped');
    } catch (error) {
      // Ignore if Docker is not available
    }
    
    console.log('✅ Cleanup completed');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run if called directly
if (require.main === module) {
  const starter = new DevStarter();
  starter.start().catch(console.error);
}

module.exports = DevStarter;