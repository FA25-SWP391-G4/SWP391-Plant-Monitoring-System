#!/usr/bin/env node

/**
 * Complete End-to-End Test Suite Runner
 * Orchestrates all E2E tests with proper setup, execution, and reporting
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('./e2e-test-config');

class CompleteE2ETestSuite {
  constructor() {
    this.processes = [];
    this.testResults = {
      suites: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0
      },
      startTime: null,
      endTime: null
    };
    
    this.testSuites = [
      {
        name: 'AI Features Integration',
        file: 'ai-features-e2e.test.js',
        description: 'Complete AI workflows from frontend to backend',
        timeout: config.timeouts.long,
        critical: true
      },
      {
        name: 'MQTT Real-time Communication',
        file: 'mqtt-realtime-e2e.test.js',
        description: 'MQTT integration and real-time messaging',
        timeout: config.timeouts.default,
        critical: true
      },
      {
        name: 'Database Consistency',
        file: 'database-consistency-e2e.test.js',
        description: 'Database operations and data integrity',
        timeout: config.timeouts.long,
        critical: true
      },
      {
        name: 'File Upload Pipeline',
        file: 'file-upload-pipeline-e2e.test.js',
        description: 'Image upload, validation, and processing',
        timeout: config.timeouts.long,
        critical: false
      }
    ];
  }

  async runCompleteTestSuite() {
    console.log('🚀 Starting Complete AI Features End-to-End Test Suite\n');
    
    try {
      this.testResults.startTime = new Date();
      
      // Phase 1: Environment Setup
      await this.setupTestEnvironment();
      
      // Phase 2: Service Orchestration
      await this.startAllServices();
      
      // Phase 3: Pre-test Validation
      await this.validateTestEnvironment();
      
      // Phase 4: Execute Test Suites
      await this.executeAllTestSuites();
      
      // Phase 5: Generate Comprehensive Report
      await this.generateComprehensiveReport();
      
    } catch (error) {
      console.error('❌ Test suite execution failed:', error.message);
      await this.handleTestFailure(error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }

  async setupTestEnvironment() {
    console.log('🔧 Setting up test environment...');
    
    // Create necessary directories
    const directories = [
      'tests/logs',
      'tests/reports',
      'tests/test-assets',
      'tests/temp'
    ];
    
    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
    
    // Setup test database
    await this.setupTestDatabase();
    
    // Create test assets
    await this.createTestAssets();
    
    console.log('✅ Test environment setup completed\n');
  }

  async setupTestDatabase() {
    console.log('🗄️  Setting up test database...');
    
    try {
      // Run database setup script
      await this.executeCommand('node', ['ai-service/database/setup-ai-database.js'], {
        env: { ...process.env, NODE_ENV: 'test' }
      });
      
      console.log('✅ Test database setup completed');
    } catch (error) {
      console.warn('⚠️  Database setup failed, continuing with existing database');
    }
  }

  async createTestAssets() {
    const assetsDir = path.join(__dirname, 'test-assets');
    
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    
    // Create test images using config helper
    const testImages = [
      { name: 'valid-plant.jpg', format: 'jpeg' },
      { name: 'valid-plant.png', format: 'png' },
      { name: 'corrupted-image.jpg', format: 'jpeg' },
      { name: 'large-image.jpg', format: 'jpeg' }
    ];
    
    for (const image of testImages) {
      const imagePath = path.join(assetsDir, image.name);
      let imageBuffer = config.helpers.createTestImageBuffer(image.format);
      
      // Make large image actually large
      if (image.name.includes('large')) {
        imageBuffer = Buffer.concat(Array(1000).fill(imageBuffer));
      }
      
      // Corrupt the corrupted image
      if (image.name.includes('corrupted')) {
        imageBuffer = imageBuffer.slice(0, imageBuffer.length / 2);
      }
      
      fs.writeFileSync(imagePath, imageBuffer);
    }
    
    console.log('✅ Test assets created');
  }

  async startAllServices() {
    console.log('🔄 Starting all required services...');
    
    const services = [
      {
        name: 'MQTT Broker',
        command: 'mosquitto',
        args: ['-c', 'mqtt/mosquitto.conf'],
        port: 1883,
        healthCheck: () => this.checkTcpPort('localhost', 1883)
      },
      {
        name: 'AI Service',
        command: 'node',
        args: ['app.js'],
        cwd: 'ai-service',
        port: 3001,
        env: { ...process.env, NODE_ENV: 'test', PORT: '3001' },
        healthCheck: () => this.checkHttpService('http://localhost:3001/health')
      },
      {
        name: 'Main Server',
        command: 'node',
        args: ['app.js'],
        port: 3010,
        env: { ...process.env, NODE_ENV: 'test', PORT: '3010' },
        healthCheck: () => this.checkHttpService('http://localhost:3010/health')
      }
    ];
    
    // Start services in parallel
    const startPromises = services.map(service => this.startService(service));
    await Promise.all(startPromises);
    
    // Wait for all services to be healthy
    console.log('⏳ Waiting for services to be ready...');
    const healthPromises = services.map(service => this.waitForServiceHealth(service));
    await Promise.all(healthPromises);
    
    console.log('✅ All services are ready\n');
  }

  async startService(service) {
    console.log(`🔄 Starting ${service.name}...`);
    
    const process = spawn(service.command, service.args, {
      cwd: service.cwd,
      stdio: 'pipe',
      env: service.env || process.env
    });
    
    // Log service output
    process.stdout.on('data', (data) => {
      const logFile = path.join('tests/logs', `${service.name.toLowerCase().replace(' ', '-')}.log`);
      fs.appendFileSync(logFile, data);
    });
    
    process.stderr.on('data', (data) => {
      const logFile = path.join('tests/logs', `${service.name.toLowerCase().replace(' ', '-')}-error.log`);
      fs.appendFileSync(logFile, data);
    });
    
    this.processes.push({ name: service.name, process, service });
    
    return process;
  }

  async waitForServiceHealth(service) {
    const maxWaitTime = config.timeouts.serviceStartup;
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const isHealthy = await service.healthCheck();
        if (isHealthy) {
          console.log(`✅ ${service.name} is healthy`);
          return;
        }
      } catch (error) {
        // Service not ready yet
      }
      
      await this.sleep(2000);
    }
    
    throw new Error(`${service.name} failed to become healthy within ${maxWaitTime}ms`);
  }

  async checkHttpService(url) {
    try {
      const response = await fetch(url);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async checkTcpPort(host, port) {
    return new Promise((resolve) => {
      const net = require('net');
      const socket = new net.Socket();
      
      socket.setTimeout(1000);
      
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      
      socket.on('error', () => {
        resolve(false);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      
      socket.connect(port, host);
    });
  }

  async validateTestEnvironment() {
    console.log('🔍 Validating test environment...');
    
    const validations = [
      {
        name: 'Database Connection',
        check: () => this.validateDatabaseConnection()
      },
      {
        name: 'MQTT Broker',
        check: () => this.validateMqttBroker()
      },
      {
        name: 'AI Service Health',
        check: () => this.validateAiServiceHealth()
      },
      {
        name: 'Test Assets',
        check: () => this.validateTestAssets()
      }
    ];
    
    for (const validation of validations) {
      try {
        await validation.check();
        console.log(`✅ ${validation.name} validation passed`);
      } catch (error) {
        console.error(`❌ ${validation.name} validation failed:`, error.message);
        throw error;
      }
    }
    
    console.log('✅ Environment validation completed\n');
  }

  async validateDatabaseConnection() {
    const { Pool } = require('pg');
    const pool = new Pool(config.database);
    
    try {
      await pool.query('SELECT 1');
      await pool.end();
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  async validateMqttBroker() {
    const mqtt = require('mqtt');
    
    return new Promise((resolve, reject) => {
      const client = mqtt.connect(config.services.mqttBroker);
      
      client.on('connect', () => {
        client.end();
        resolve();
      });
      
      client.on('error', (error) => {
        reject(new Error(`MQTT broker connection failed: ${error.message}`));
      });
      
      setTimeout(() => {
        client.end();
        reject(new Error('MQTT broker connection timeout'));
      }, 5000);
    });
  }

  async validateAiServiceHealth() {
    const response = await fetch(`${config.services.aiService}/health`);
    if (!response.ok) {
      throw new Error(`AI Service health check failed: ${response.status}`);
    }
  }

  async validateTestAssets() {
    const assetsDir = path.join(__dirname, 'test-assets');
    const requiredAssets = ['valid-plant.jpg', 'valid-plant.png'];
    
    for (const asset of requiredAssets) {
      const assetPath = path.join(assetsDir, asset);
      if (!fs.existsSync(assetPath)) {
        throw new Error(`Required test asset not found: ${asset}`);
      }
    }
  }

  async executeAllTestSuites() {
    console.log('🧪 Executing all test suites...\n');
    
    for (const suite of this.testSuites) {
      console.log(`📋 Running ${suite.name} test suite...`);
      console.log(`   Description: ${suite.description}`);
      console.log(`   File: ${suite.file}`);
      console.log(`   Timeout: ${suite.timeout}ms`);
      console.log(`   Critical: ${suite.critical ? 'Yes' : 'No'}\n`);
      
      try {
        const result = await this.executeTestSuite(suite);
        this.testResults.suites[suite.name] = result;
        
        if (result.success) {
          console.log(`✅ ${suite.name} test suite passed\n`);
        } else {
          console.log(`❌ ${suite.name} test suite failed\n`);
          
          if (suite.critical) {
            throw new Error(`Critical test suite failed: ${suite.name}`);
          }
        }
      } catch (error) {
        console.error(`💥 ${suite.name} test suite crashed:`, error.message);
        
        this.testResults.suites[suite.name] = {
          success: false,
          error: error.message,
          duration: 0,
          tests: { total: 0, passed: 0, failed: 1 }
        };
        
        if (suite.critical) {
          throw error;
        }
      }
    }
    
    console.log('🎯 All test suites completed\n');
  }

  async executeTestSuite(suite) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const testProcess = spawn('npm', ['test', '--', `tests/${suite.file}`, '--verbose'], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' },
        timeout: suite.timeout
      });
      
      let output = '';
      let errorOutput = '';
      
      testProcess.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        console.log(text);
      });
      
      testProcess.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        console.error(text);
      });
      
      testProcess.on('close', (code) => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const result = {
          success: code === 0,
          duration,
          output,
          errorOutput,
          tests: this.parseTestOutput(output)
        };
        
        // Update summary
        this.testResults.summary.total += result.tests.total;
        this.testResults.summary.passed += result.tests.passed;
        this.testResults.summary.failed += result.tests.failed;
        this.testResults.summary.duration += duration;
        
        resolve(result);
      });
      
      testProcess.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
          duration: Date.now() - startTime,
          tests: { total: 0, passed: 0, failed: 1 }
        });
      });
    });
  }

  parseTestOutput(output) {
    const tests = { total: 0, passed: 0, failed: 0, skipped: 0 };
    
    // Parse Jest output
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.includes('Tests:')) {
        const match = line.match(/(\d+) passed.*?(\d+) total/);
        if (match) {
          tests.passed = parseInt(match[1]);
          tests.total = parseInt(match[2]);
          tests.failed = tests.total - tests.passed;
        }
      }
    }
    
    return tests;
  }

  async generateComprehensiveReport() {
    console.log('📊 Generating comprehensive test report...');
    
    this.testResults.endTime = new Date();
    const totalDuration = this.testResults.endTime - this.testResults.startTime;
    
    // Generate JSON report
    const jsonReport = {
      ...this.testResults,
      totalDuration,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        timestamp: new Date().toISOString()
      },
      configuration: {
        services: config.services,
        timeouts: config.timeouts,
        performance: config.performance
      }
    };
    
    const jsonReportPath = 'tests/reports/complete-e2e-report.json';
    fs.writeFileSync(jsonReportPath, JSON.stringify(jsonReport, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHtmlReport(jsonReport);
    const htmlReportPath = 'tests/reports/complete-e2e-report.html';
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    // Generate markdown summary
    const markdownReport = this.generateMarkdownReport(jsonReport);
    const markdownReportPath = 'tests/reports/complete-e2e-summary.md';
    fs.writeFileSync(markdownReportPath, markdownReport);
    
    console.log(`✅ Reports generated:`);
    console.log(`   JSON: ${jsonReportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
    console.log(`   Markdown: ${markdownReportPath}`);
    
    // Print summary
    this.printTestSummary(jsonReport);
  }

  generateHtmlReport(report) {
    const suiteRows = Object.entries(report.suites).map(([name, suite]) => `
      <tr class="${suite.success ? 'success' : 'failure'}">
        <td>${name}</td>
        <td>${suite.tests.total}</td>
        <td>${suite.tests.passed}</td>
        <td>${suite.tests.failed}</td>
        <td>${(suite.duration / 1000).toFixed(2)}s</td>
        <td>${suite.success ? '✅ Pass' : '❌ Fail'}</td>
      </tr>
    `).join('');
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>AI Features E2E Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e9ecef; padding: 15px; border-radius: 5px; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background: #f8f9fa; }
        .success { background: #d4edda; }
        .failure { background: #f8d7da; }
    </style>
</head>
<body>
    <div class="header">
        <h1>AI Features End-to-End Test Report</h1>
        <p>Generated: ${report.environment.timestamp}</p>
        <p>Duration: ${(report.totalDuration / 1000 / 60).toFixed(2)} minutes</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>${report.summary.total}</h3>
            <p>Total Tests</p>
        </div>
        <div class="metric">
            <h3>${report.summary.passed}</h3>
            <p>Passed</p>
        </div>
        <div class="metric">
            <h3>${report.summary.failed}</h3>
            <p>Failed</p>
        </div>
        <div class="metric">
            <h3>${((report.summary.passed / report.summary.total) * 100).toFixed(1)}%</h3>
            <p>Success Rate</p>
        </div>
    </div>
    
    <h2>Test Suites</h2>
    <table>
        <thead>
            <tr>
                <th>Suite Name</th>
                <th>Total Tests</th>
                <th>Passed</th>
                <th>Failed</th>
                <th>Duration</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${suiteRows}
        </tbody>
    </table>
</body>
</html>`;
  }

  generateMarkdownReport(report) {
    const suiteRows = Object.entries(report.suites).map(([name, suite]) => 
      `| ${name} | ${suite.tests.total} | ${suite.tests.passed} | ${suite.tests.failed} | ${(suite.duration / 1000).toFixed(2)}s | ${suite.success ? '✅' : '❌'} |`
    ).join('\n');
    
    return `# AI Features End-to-End Test Report

## Summary
- **Total Tests**: ${report.summary.total}
- **Passed**: ${report.summary.passed}
- **Failed**: ${report.summary.failed}
- **Success Rate**: ${((report.summary.passed / report.summary.total) * 100).toFixed(1)}%
- **Total Duration**: ${(report.totalDuration / 1000 / 60).toFixed(2)} minutes
- **Generated**: ${report.environment.timestamp}

## Test Suites

| Suite Name | Total | Passed | Failed | Duration | Status |
|------------|-------|--------|--------|----------|--------|
${suiteRows}

## Environment
- **Node Version**: ${report.environment.nodeVersion}
- **Platform**: ${report.environment.platform}
- **Services**: ${Object.entries(report.configuration.services).map(([k, v]) => `${k}: ${v}`).join(', ')}

## Test Coverage Areas
1. **Complete AI Workflows** - End-to-end testing of chatbot, disease detection, and irrigation prediction
2. **MQTT Real-time Communication** - Message ordering, connection handling, topic management
3. **Database Operations** - Data consistency, concurrent operations, referential integrity
4. **File Upload Pipeline** - Image validation, processing, storage, and security

Generated by AI Features E2E Test Suite
`;
  }

  printTestSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('📈 COMPLETE TEST SUITE SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${report.summary.total}`);
    console.log(`Passed: ${report.summary.passed}`);
    console.log(`Failed: ${report.summary.failed}`);
    console.log(`Success Rate: ${((report.summary.passed / report.summary.total) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${(report.totalDuration / 1000 / 60).toFixed(2)} minutes`);
    console.log('='.repeat(60));
    
    if (report.summary.failed === 0) {
      console.log('🎉 ALL TESTS PASSED! The AI features are working correctly.');
    } else {
      console.log(`⚠️  ${report.summary.failed} tests failed. Please review the detailed report.`);
    }
    
    console.log('='.repeat(60) + '\n');
  }

  async handleTestFailure(error) {
    console.error('\n💥 Test Suite Execution Failed');
    console.error('Error:', error.message);
    
    // Generate failure report
    const failureReport = {
      error: error.message,
      timestamp: new Date().toISOString(),
      partialResults: this.testResults
    };
    
    fs.writeFileSync('tests/reports/failure-report.json', JSON.stringify(failureReport, null, 2));
    console.log('📄 Failure report saved to tests/reports/failure-report.json');
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test environment...');
    
    // Stop all processes
    for (const { name, process } of this.processes) {
      console.log(`Stopping ${name}...`);
      process.kill('SIGTERM');
      
      await this.sleep(2000);
      
      if (!process.killed) {
        process.kill('SIGKILL');
      }
    }
    
    // Clean up temporary files if configured
    if (config.utilities.cleanup.enabled) {
      const tempDir = 'tests/temp';
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    }
    
    console.log('✅ Cleanup completed');
  }

  async executeCommand(command, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const process = spawn(command, args, { stdio: 'pipe', ...options });
      
      let output = '';
      let error = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed: ${command}\n${error}`));
        }
      });
      
      process.on('error', reject);
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the complete test suite if this script is executed directly
if (require.main === module) {
  const testSuite = new CompleteE2ETestSuite();
  testSuite.runCompleteTestSuite().catch(error => {
    console.error('Test suite execution failed:', error);
    process.exit(1);
  });
}

module.exports = CompleteE2ETestSuite;