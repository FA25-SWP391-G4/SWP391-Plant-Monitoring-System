#!/usr/bin/env node

/**
 * AI Features End-to-End Test Runner
 * Orchestrates the complete testing environment and runs comprehensive E2E tests
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class E2ETestRunner {
  constructor() {
    this.processes = [];
    this.testResults = {
      passed: 0,
      failed: 0,
      total: 0,
      startTime: null,
      endTime: null,
      details: []
    };
  }

  async runTests() {
    console.log('🚀 Starting AI Features End-to-End Tests...\n');
    
    try {
      // Step 1: Environment validation
      await this.validateEnvironment();
      
      // Step 2: Start required services
      await this.startServices();
      
      // Step 3: Wait for services to be ready
      await this.waitForServices();
      
      // Step 4: Run the actual tests
      await this.executeTests();
      
      // Step 5: Generate test report
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ E2E Test execution failed:', error.message);
      process.exit(1);
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  async validateEnvironment() {
    console.log('🔍 Validating test environment...');
    
    const requiredFiles = [
      'ai-service/app.js',
      'app.js',
      'client/package.json',
      'tests/ai-features-e2e.test.js'
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required file not found: ${file}`);
      }
    }

    // Check if required ports are available
    const requiredPorts = [3000, 3001, 3010, 1883, 5432];
    for (const port of requiredPorts) {
      const isPortFree = await this.checkPortAvailable(port);
      if (!isPortFree) {
        console.warn(`⚠️  Port ${port} is already in use. Tests may fail if services conflict.`);
      }
    }

    console.log('✅ Environment validation completed\n');
  }

  async checkPortAvailable(port) {
    return new Promise((resolve) => {
      const net = require('net');
      const server = net.createServer();
      
      server.listen(port, () => {
        server.once('close', () => resolve(true));
        server.close();
      });
      
      server.on('error', () => resolve(false));
    });
  }

  async startServices() {
    console.log('🔧 Starting required services...');

    // Start PostgreSQL (if not running)
    try {
      await this.executeCommand('pg_isready', [], { timeout: 5000 });
      console.log('✅ PostgreSQL is already running');
    } catch (error) {
      console.log('🔄 Starting PostgreSQL...');
      // Note: This assumes PostgreSQL is installed and configured
      // In a real environment, you might use Docker or other orchestration
    }

    // Start MQTT Broker (Mosquitto)
    console.log('🔄 Starting MQTT Broker...');
    const mqttProcess = spawn('mosquitto', ['-c', 'mqtt/mosquitto.conf'], {
      stdio: 'pipe',
      detached: false
    });
    
    mqttProcess.stdout.on('data', (data) => {
      console.log(`MQTT: ${data.toString().trim()}`);
    });
    
    mqttProcess.stderr.on('data', (data) => {
      console.log(`MQTT Error: ${data.toString().trim()}`);
    });

    this.processes.push({ name: 'MQTT', process: mqttProcess });

    // Start AI Service
    console.log('🔄 Starting AI Service...');
    const aiServiceProcess = spawn('node', ['app.js'], {
      cwd: 'ai-service',
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test', PORT: '3001' }
    });

    aiServiceProcess.stdout.on('data', (data) => {
      console.log(`AI Service: ${data.toString().trim()}`);
    });

    aiServiceProcess.stderr.on('data', (data) => {
      console.log(`AI Service Error: ${data.toString().trim()}`);
    });

    this.processes.push({ name: 'AI Service', process: aiServiceProcess });

    // Start Main Server
    console.log('🔄 Starting Main Server...');
    const mainServerProcess = spawn('node', ['app.js'], {
      stdio: 'pipe',
      env: { ...process.env, NODE_ENV: 'test', PORT: '3010' }
    });

    mainServerProcess.stdout.on('data', (data) => {
      console.log(`Main Server: ${data.toString().trim()}`);
    });

    mainServerProcess.stderr.on('data', (data) => {
      console.log(`Main Server Error: ${data.toString().trim()}`);
    });

    this.processes.push({ name: 'Main Server', process: mainServerProcess });

    console.log('✅ All services started\n');
  }

  async waitForServices() {
    console.log('⏳ Waiting for services to be ready...');

    const services = [
      { name: 'AI Service', url: 'http://localhost:3001/health', timeout: 30000 },
      { name: 'Main Server', url: 'http://localhost:3010/health', timeout: 30000 },
      { name: 'MQTT Broker', host: 'localhost', port: 1883, timeout: 10000 }
    ];

    for (const service of services) {
      if (service.url) {
        await this.waitForHttpService(service);
      } else if (service.host && service.port) {
        await this.waitForTcpService(service);
      }
    }

    // Additional wait to ensure all services are fully initialized
    console.log('⏳ Allowing additional time for service initialization...');
    await this.sleep(5000);

    console.log('✅ All services are ready\n');
  }

  async waitForHttpService(service) {
    const startTime = Date.now();
    const maxWaitTime = service.timeout || 30000;

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await fetch(service.url);
        if (response.ok) {
          console.log(`✅ ${service.name} is ready`);
          return;
        }
      } catch (error) {
        // Service not ready yet, continue waiting
      }

      await this.sleep(1000);
    }

    throw new Error(`${service.name} failed to start within ${maxWaitTime}ms`);
  }

  async waitForTcpService(service) {
    const net = require('net');
    const startTime = Date.now();
    const maxWaitTime = service.timeout || 10000;

    return new Promise((resolve, reject) => {
      const checkConnection = () => {
        if (Date.now() - startTime > maxWaitTime) {
          reject(new Error(`${service.name} failed to start within ${maxWaitTime}ms`));
          return;
        }

        const socket = new net.Socket();
        
        socket.setTimeout(1000);
        
        socket.on('connect', () => {
          console.log(`✅ ${service.name} is ready`);
          socket.destroy();
          resolve();
        });

        socket.on('error', () => {
          socket.destroy();
          setTimeout(checkConnection, 1000);
        });

        socket.on('timeout', () => {
          socket.destroy();
          setTimeout(checkConnection, 1000);
        });

        socket.connect(service.port, service.host);
      };

      checkConnection();
    });
  }

  async executeTests() {
    console.log('🧪 Executing End-to-End Tests...\n');
    
    this.testResults.startTime = new Date();

    return new Promise((resolve, reject) => {
      const testProcess = spawn('npm', ['test', '--', 'tests/ai-features-e2e.test.js', '--verbose'], {
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let testOutput = '';
      let testError = '';

      testProcess.stdout.on('data', (data) => {
        const output = data.toString();
        testOutput += output;
        console.log(output);
      });

      testProcess.stderr.on('data', (data) => {
        const error = data.toString();
        testError += error;
        console.error(error);
      });

      testProcess.on('close', (code) => {
        this.testResults.endTime = new Date();
        
        if (code === 0) {
          console.log('\n✅ All tests passed!');
          this.parseTestResults(testOutput);
          resolve();
        } else {
          console.log('\n❌ Some tests failed!');
          this.parseTestResults(testOutput);
          this.testResults.details.push({
            type: 'error',
            message: testError
          });
          resolve(); // Don't reject, we want to generate report anyway
        }
      });

      testProcess.on('error', (error) => {
        console.error('Failed to start test process:', error);
        reject(error);
      });
    });
  }

  parseTestResults(output) {
    // Parse Jest output to extract test statistics
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.includes('Tests:')) {
        const match = line.match(/(\d+) passed.*?(\d+) total/);
        if (match) {
          this.testResults.passed = parseInt(match[1]);
          this.testResults.total = parseInt(match[2]);
          this.testResults.failed = this.testResults.total - this.testResults.passed;
        }
      }
    }

    // Extract individual test results
    const testSuites = output.match(/PASS|FAIL.*?\.test\.js/g) || [];
    testSuites.forEach(suite => {
      this.testResults.details.push({
        type: suite.startsWith('PASS') ? 'pass' : 'fail',
        message: suite
      });
    });
  }

  async generateReport() {
    console.log('\n📊 Generating Test Report...');

    const duration = this.testResults.endTime - this.testResults.startTime;
    const durationSeconds = Math.round(duration / 1000);

    const report = {
      summary: {
        total: this.testResults.total,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        duration: `${durationSeconds}s`,
        timestamp: new Date().toISOString()
      },
      details: this.testResults.details,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    // Write JSON report
    const reportPath = 'tests/ai-e2e-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Write human-readable report
    const humanReportPath = 'tests/ai-e2e-test-report.md';
    const humanReport = this.generateHumanReport(report);
    fs.writeFileSync(humanReportPath, humanReport);

    console.log(`✅ Test report generated: ${reportPath}`);
    console.log(`✅ Human-readable report: ${humanReportPath}`);

    // Print summary
    console.log('\n📈 Test Summary:');
    console.log(`   Total Tests: ${report.summary.total}`);
    console.log(`   Passed: ${report.summary.passed}`);
    console.log(`   Failed: ${report.summary.failed}`);
    console.log(`   Duration: ${report.summary.duration}`);
    
    if (report.summary.failed > 0) {
      console.log('\n❌ Test execution completed with failures');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed successfully!');
    }
  }

  generateHumanReport(report) {
    return `# AI Features End-to-End Test Report

## Summary
- **Total Tests**: ${report.summary.total}
- **Passed**: ${report.summary.passed}
- **Failed**: ${report.summary.failed}
- **Duration**: ${report.summary.duration}
- **Timestamp**: ${report.summary.timestamp}

## Environment
- **Node Version**: ${report.environment.nodeVersion}
- **Platform**: ${report.environment.platform}
- **Architecture**: ${report.environment.arch}

## Test Results
${report.details.map(detail => `- ${detail.type.toUpperCase()}: ${detail.message}`).join('\n')}

## Test Coverage Areas
1. **Chatbot AI Complete Workflow**
   - Message processing and AI responses
   - Content filtering and scope restriction
   - Sensor data integration
   - MQTT real-time communication

2. **Disease Detection Complete Workflow**
   - Image upload and validation
   - Plant content detection
   - Disease analysis and treatment recommendations
   - MQTT real-time updates

3. **Irrigation Prediction Complete Workflow**
   - Sensor data analysis
   - ML prediction generation
   - Intelligent scheduling
   - Emergency alerts

4. **Database Operations and Data Consistency**
   - Cross-service data integrity
   - Concurrent operation handling
   - Transaction consistency

5. **MQTT Real-time Communication**
   - Connection handling
   - Message ordering
   - Topic management
   - Error recovery

6. **Error Handling and Recovery**
   - Service failure fallbacks
   - Input validation
   - Database error handling

7. **Performance and Load Testing**
   - Concurrent user handling
   - Response time validation
   - Load testing scenarios

Generated on: ${new Date().toISOString()}
`;
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test environment...');

    // Stop all spawned processes
    for (const { name, process } of this.processes) {
      console.log(`Stopping ${name}...`);
      process.kill('SIGTERM');
      
      // Wait a bit for graceful shutdown
      await this.sleep(2000);
      
      // Force kill if still running
      if (!process.killed) {
        process.kill('SIGKILL');
      }
    }

    // Clean up test files
    const testAssets = 'tests/test-assets';
    if (fs.existsSync(testAssets)) {
      fs.rmSync(testAssets, { recursive: true, force: true });
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

      const timeout = options.timeout || 10000;
      const timer = setTimeout(() => {
        process.kill('SIGKILL');
        reject(new Error(`Command timeout: ${command}`));
      }, timeout);

      process.on('close', (code) => {
        clearTimeout(timer);
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Command failed: ${command}\n${error}`));
        }
      });

      process.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  const runner = new E2ETestRunner();
  runner.runTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = E2ETestRunner;