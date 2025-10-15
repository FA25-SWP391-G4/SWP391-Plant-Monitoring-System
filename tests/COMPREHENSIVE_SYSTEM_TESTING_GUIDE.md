# Comprehensive System Testing Guide

## Overview

This guide covers the comprehensive system testing suite for the AI Features Integration project. The testing suite validates system performance, memory usage, load handling, and user acceptance criteria as specified in requirements 4.1, 4.2, and 4.3.

## Test Components

### 1. Load Testing (100 Concurrent Users)
- **File**: `load-test-runner.js`
- **Purpose**: Tests system behavior under 100 concurrent users
- **Duration**: 2-3 minutes
- **Metrics**: Requests/second, response times, success rates

### 2. Performance Testing
- **File**: `performance-monitor.js`
- **Purpose**: Monitors response times and system performance
- **Duration**: 5 minutes
- **Metrics**: Average response times, threshold violations, system health

### 3. Memory Usage Monitoring
- **File**: `memory-usage-monitor.js`
- **Purpose**: Monitors memory consumption and detects leaks
- **Duration**: 10 minutes
- **Metrics**: Peak memory usage, memory growth rate, garbage collection efficiency

### 4. User Acceptance Testing
- **File**: `user-acceptance-test.js`
- **Purpose**: Tests real-world scenarios with actual data
- **Duration**: 5 minutes
- **Metrics**: Functionality correctness, user experience quality

### 5. Comprehensive System Test
- **File**: `comprehensive-system-test.js`
- **Purpose**: Orchestrates all testing components
- **Duration**: 1-2 minutes
- **Metrics**: Overall system health score

## Prerequisites

### System Requirements
- **Memory**: Minimum 2GB RAM available
- **CPU**: Minimum 2 CPU cores
- **Node.js**: Version 14+ with `--expose-gc` flag for memory testing
- **Services**: AI Service running on port 3001

### Required Services
Before running tests, ensure these services are running:

```bash
# Start AI Service
cd ai-service
npm start

# Optional: Start Main Server
npm start
```

### Dependencies
Install required testing dependencies:

```bash
npm install axios form-data
```

## Running Tests

### Individual Test Components

#### 1. Load Testing
```bash
# Basic load test
node tests/load-test-runner.js

# With custom configuration
CONCURRENT_USERS=50 TEST_DURATION=1 node tests/load-test-runner.js
```

#### 2. Performance Monitoring
```bash
# Standard performance monitoring
node tests/performance-monitor.js

# With custom duration (in milliseconds)
MONITORING_DURATION=300000 node tests/performance-monitor.js
```

#### 3. Memory Usage Monitoring
```bash
# Standard memory monitoring
node --expose-gc tests/memory-usage-monitor.js

# With custom configuration
MONITORING_DURATION=600000 node --expose-gc tests/memory-usage-monitor.js
```

#### 4. User Acceptance Testing
```bash
# Run UAT scenarios
node tests/user-acceptance-test.js
```

#### 5. Comprehensive System Test
```bash
# Run all tests in sequence
node tests/comprehensive-system-test.js
```

### Master Test Runner

Run all tests in an orchestrated sequence:

```bash
# Run complete system testing suite
node --expose-gc tests/run-comprehensive-system-tests.js
```

## Test Configuration

### Load Test Configuration
```javascript
const LOAD_TEST_CONFIG = {
  baseUrl: 'http://localhost:3001',
  concurrentUsers: 100,
  testDurationMinutes: 2,
  rampUpTimeSeconds: 30
};
```

### Performance Thresholds
```javascript
const PERFORMANCE_THRESHOLDS = {
  chatbot: {
    warning: 2000,    // 2 seconds
    critical: 3000    // 3 seconds
  },
  irrigation: {
    warning: 2000,
    critical: 3000
  },
  disease: {
    warning: 8000,    // 8 seconds (image processing)
    critical: 10000   // 10 seconds
  }
};
```

### Memory Thresholds
```javascript
const MEMORY_THRESHOLDS = {
  heapUsed: 512 * 1024 * 1024,    // 512MB
  rss: 1024 * 1024 * 1024,        // 1GB
  memoryLeakRate: 0.1              // 10% increase per minute
};
```

## Test Reports

### Generated Reports

Each test component generates detailed reports:

1. **JSON Reports** (machine-readable)
   - `load-test-report.json`
   - `performance-monitor-report.json`
   - `memory-usage-report.json`
   - `user-acceptance-test-report.json`
   - `comprehensive-system-test-report.json`

2. **Markdown Summaries** (human-readable)
   - `load-test-summary.md`
   - `performance-monitor-summary.md`
   - `memory-usage-summary.md`
   - `user-acceptance-test-summary.md`
   - `comprehensive-system-test-summary.md`

3. **Consolidated Reports**
   - `consolidated-system-test-report.json`
   - `executive-summary.md`

### Report Locations
All reports are saved in the `tests/` directory.

## Interpreting Results

### Success Criteria

#### Load Testing
- ✅ **Success Rate**: ≥95%
- ✅ **Average Response Time**: ≤5 seconds
- ✅ **Requests per Second**: ≥10 RPS

#### Performance Testing
- ✅ **Chatbot Response**: ≤3 seconds
- ✅ **Irrigation Prediction**: ≤3 seconds
- ✅ **Disease Detection**: ≤10 seconds
- ✅ **Threshold Violations**: 0

#### Memory Testing
- ✅ **Peak Heap Usage**: ≤512MB
- ✅ **Memory Growth Rate**: ≤10%/minute
- ✅ **Memory Leaks**: 0 detected

#### User Acceptance Testing
- ✅ **Overall Score**: ≥70%
- ✅ **Response Relevance**: ≥80%
- ✅ **System Integration**: ≥90%

### Status Indicators

#### Overall System Health
- 🟢 **EXCELLENT** (85-100%): Production ready
- 🟡 **GOOD** (70-84%): Ready with monitoring
- 🟠 **FAIR** (50-69%): Needs improvement
- 🔴 **POOR** (0-49%): Not ready for production

#### Production Readiness Levels
- ✅ **PRODUCTION_READY**: All critical tests passed
- ⚠️ **NEEDS_MONITORING**: Minor issues, deploy with monitoring
- 🚨 **NOT_READY**: Critical issues must be resolved

## Troubleshooting

### Common Issues

#### 1. Service Not Available
```
Error: connect ECONNREFUSED 127.0.0.1:3001
```
**Solution**: Ensure AI service is running on port 3001

#### 2. Memory Issues
```
Error: JavaScript heap out of memory
```
**Solution**: 
- Increase Node.js memory limit: `node --max-old-space-size=4096`
- Run with garbage collection: `node --expose-gc`

#### 3. Timeout Errors
```
Error: timeout of 10000ms exceeded
```
**Solution**: 
- Check system resources
- Reduce concurrent users or test duration
- Optimize AI service performance

#### 4. Permission Errors
```
Error: EACCES: permission denied
```
**Solution**: 
- Check file permissions
- Run with appropriate user privileges
- Ensure write access to tests directory

### Performance Optimization

#### For Load Testing
- Reduce `concurrentUsers` if system struggles
- Increase `rampUpTimeSeconds` for gradual load increase
- Monitor system resources during testing

#### For Memory Testing
- Run with `--expose-gc` flag for accurate GC testing
- Close other applications to free memory
- Monitor system memory usage

#### For Performance Testing
- Ensure stable network connection
- Close unnecessary applications
- Run during low system usage periods

## Continuous Integration

### GitHub Actions Example
```yaml
name: Comprehensive System Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  system-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm install
      
    - name: Start AI Service
      run: |
        cd ai-service
        npm install
        npm start &
        sleep 30
        
    - name: Run System Tests
      run: node --expose-gc tests/run-comprehensive-system-tests.js
      
    - name: Upload Test Reports
      uses: actions/upload-artifact@v2
      with:
        name: test-reports
        path: tests/*.json
```

### Jenkins Pipeline Example
```groovy
pipeline {
    agent any
    
    stages {
        stage('Setup') {
            steps {
                sh 'npm install'
                sh 'cd ai-service && npm install'
            }
        }
        
        stage('Start Services') {
            steps {
                sh 'cd ai-service && npm start &'
                sh 'sleep 30'
            }
        }
        
        stage('System Tests') {
            steps {
                sh 'node --expose-gc tests/run-comprehensive-system-tests.js'
            }
        }
        
        stage('Archive Reports') {
            steps {
                archiveArtifacts artifacts: 'tests/*.json', fingerprint: true
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'tests',
                    reportFiles: 'executive-summary.md',
                    reportName: 'System Test Report'
                ])
            }
        }
    }
}
```

## Best Practices

### Before Running Tests
1. Ensure all services are running and healthy
2. Close unnecessary applications to free resources
3. Check system resource availability
4. Backup important data (tests create temporary files)

### During Testing
1. Monitor system resources (CPU, memory, disk)
2. Don't interrupt tests unless critical
3. Watch for error messages in console output
4. Note any unusual system behavior

### After Testing
1. Review all generated reports
2. Address critical issues immediately
3. Plan improvements for warnings
4. Archive reports for historical comparison
5. Update system documentation with findings

### Regular Testing Schedule
- **Daily**: Quick health checks
- **Weekly**: Performance and memory monitoring
- **Before releases**: Full comprehensive testing
- **After major changes**: Complete system validation

## Support and Maintenance

### Log Files
Test execution logs are written to console and can be redirected:
```bash
node tests/run-comprehensive-system-tests.js > system-test.log 2>&1
```

### Debugging
Enable debug mode for detailed output:
```bash
DEBUG=true node tests/run-comprehensive-system-tests.js
```

### Updating Thresholds
Modify configuration objects in test files to adjust thresholds based on:
- System capabilities
- Performance requirements
- User expectations
- Production environment characteristics

---

For additional support or questions about the comprehensive system testing suite, please refer to the project documentation or contact the development team.