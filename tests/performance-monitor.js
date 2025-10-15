/**
 * Performance Monitor for AI System
 * Monitors response times and system performance metrics
 * Requirements: 4.1, 4.2, 4.3
 */

const axios = require('axios');
const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');

const PERFORMANCE_CONFIG = {
  baseUrl: 'http://localhost:3001',
  monitoringDuration: 300000, // 5 minutes
  samplingInterval: 5000, // 5 seconds
  thresholds: {
    chatbot: {
      warning: 2000, // 2 seconds
      critical: 3000 // 3 seconds
    },
    irrigation: {
      warning: 2000,
      critical: 3000
    },
    disease: {
      warning: 8000, // 8 seconds (image processing takes longer)
      critical: 10000 // 10 seconds
    },
    health: {
      warning: 1000,
      critical: 2000
    }
  }
};

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      startTime: Date.now(),
      samples: [],
      alerts: [],
      summary: {
        totalSamples: 0,
        averageResponseTimes: {},
        thresholdViolations: {},
        systemHealth: 'unknown'
      }
    };
    this.isMonitoring = false;
  }

  async startMonitoring() {
    console.log('🔍 Starting Performance Monitoring...');
    console.log(`📊 Duration: ${PERFORMANCE_CONFIG.monitoringDuration / 1000} seconds`);
    console.log(`⏱️ Sampling Interval: ${PERFORMANCE_CONFIG.samplingInterval / 1000} seconds\n`);

    this.isMonitoring = true;
    const endTime = Date.now() + PERFORMANCE_CONFIG.monitoringDuration;

    while (Date.now() < endTime && this.isMonitoring) {
      const sampleStartTime = Date.now();
      
      try {
        const sample = await this.collectPerformanceSample();
        this.metrics.samples.push(sample);
        this.metrics.summary.totalSamples++;
        
        // Check for threshold violations
        this.checkThresholds(sample);
        
        // Log current status
        this.logCurrentStatus(sample);
        
      } catch (error) {
        console.error(`❌ Error collecting performance sample: ${error.message}`);
        this.metrics.alerts.push({
          type: 'monitoring_error',
          message: error.message,
          timestamp: Date.now()
        });
      }

      // Wait for next sampling interval
      const sampleDuration = Date.now() - sampleStartTime;
      const waitTime = Math.max(0, PERFORMANCE_CONFIG.samplingInterval - sampleDuration);
      await this.sleep(waitTime);
    }

    await this.generatePerformanceReport();
  }

  async collectPerformanceSample() {
    const sample = {
      timestamp: Date.now(),
      endpoints: {},
      systemMetrics: this.getSystemMetrics()
    };

    // Test each endpoint
    const endpoints = ['chatbot', 'irrigation', 'health'];
    
    for (const endpoint of endpoints) {
      try {
        const startTime = performance.now();
        await this.testEndpoint(endpoint);
        const responseTime = performance.now() - startTime;
        
        sample.endpoints[endpoint] = {
          responseTime,
          status: 'success',
          timestamp: Date.now()
        };
        
      } catch (error) {
        sample.endpoints[endpoint] = {
          responseTime: null,
          status: 'error',
          error: error.message,
          timestamp: Date.now()
        };
      }
    }

    return sample;
  }

  async testEndpoint(endpointType) {
    const baseUrl = PERFORMANCE_CONFIG.baseUrl;
    
    switch (endpointType) {
      case 'chatbot':
        return await this.testChatbotEndpoint(baseUrl);
      case 'irrigation':
        return await this.testIrrigationEndpoint(baseUrl);
      case 'health':
        return await this.testHealthEndpoint(baseUrl);
      default:
        throw new Error(`Unknown endpoint: ${endpointType}`);
    }
  }

  async testChatbotEndpoint(baseUrl) {
    const response = await axios.post(`${baseUrl}/api/ai/chatbot/message`, {
      message: 'Performance test message',
      userId: 99999,
      plantId: 1,
      sessionId: `perf-monitor-${Date.now()}`
    }, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.data.success) {
      throw new Error('Chatbot endpoint failed');
    }

    return response.data;
  }

  async testIrrigationEndpoint(baseUrl) {
    const response = await axios.post(`${baseUrl}/api/ai/irrigation/predict/1`, {
      sensorData: {
        soilMoisture: 50,
        temperature: 25,
        humidity: 60,
        lightLevel: 1500
      },
      userId: 99999
    }, {
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.data.success) {
      throw new Error('Irrigation endpoint failed');
    }

    return response.data;
  }

  async testHealthEndpoint(baseUrl) {
    const response = await axios.get(`${baseUrl}/api/health`, {
      timeout: 10000
    });

    if (response.status !== 200) {
      throw new Error('Health endpoint failed');
    }

    return response.data;
  }

  getSystemMetrics() {
    const memoryUsage = process.memoryUsage();
    
    return {
      memory: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        rss: memoryUsage.rss,
        external: memoryUsage.external
      },
      uptime: process.uptime(),
      cpuUsage: process.cpuUsage()
    };
  }

  checkThresholds(sample) {
    Object.keys(sample.endpoints).forEach(endpoint => {
      const endpointData = sample.endpoints[endpoint];
      
      if (endpointData.status === 'success' && endpointData.responseTime) {
        const thresholds = PERFORMANCE_CONFIG.thresholds[endpoint];
        
        if (!thresholds) return;

        if (endpointData.responseTime > thresholds.critical) {
          this.metrics.alerts.push({
            type: 'critical_response_time',
            endpoint,
            responseTime: endpointData.responseTime,
            threshold: thresholds.critical,
            timestamp: sample.timestamp
          });
        } else if (endpointData.responseTime > thresholds.warning) {
          this.metrics.alerts.push({
            type: 'warning_response_time',
            endpoint,
            responseTime: endpointData.responseTime,
            threshold: thresholds.warning,
            timestamp: sample.timestamp
          });
        }
      }
    });
  }

  logCurrentStatus(sample) {
    const statusLine = Object.keys(sample.endpoints).map(endpoint => {
      const data = sample.endpoints[endpoint];
      if (data.status === 'success') {
        const responseTime = data.responseTime.toFixed(0);
        const threshold = PERFORMANCE_CONFIG.thresholds[endpoint];
        
        let status = '✅';
        if (threshold && data.responseTime > threshold.critical) {
          status = '🔴';
        } else if (threshold && data.responseTime > threshold.warning) {
          status = '🟡';
        }
        
        return `${endpoint}: ${status} ${responseTime}ms`;
      } else {
        return `${endpoint}: ❌ ERROR`;
      }
    }).join(' | ');

    const memoryMB = (sample.systemMetrics.memory.heapUsed / 1024 / 1024).toFixed(1);
    console.log(`[${new Date().toLocaleTimeString()}] ${statusLine} | Memory: ${memoryMB}MB`);
  }

  async generatePerformanceReport() {
    console.log('\n📊 Generating Performance Report...');

    // Calculate summary statistics
    this.calculateSummaryStatistics();

    const report = {
      configuration: PERFORMANCE_CONFIG,
      metrics: this.metrics,
      analysis: this.analyzePerformance()
    };

    // Save detailed report
    await fs.writeFile(
      path.join(__dirname, 'performance-monitor-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Generate human-readable summary
    const summary = this.generatePerformanceSummary(report);
    await fs.writeFile(
      path.join(__dirname, 'performance-monitor-summary.md'),
      summary
    );

    // Console output
    console.log('\n📋 Performance Monitoring Results:');
    console.log(`   Duration: ${((Date.now() - this.metrics.startTime) / 1000).toFixed(0)} seconds`);
    console.log(`   Total Samples: ${this.metrics.summary.totalSamples}`);
    console.log(`   System Health: ${this.metrics.summary.systemHealth}`);
    
    Object.keys(this.metrics.summary.averageResponseTimes).forEach(endpoint => {
      const avgTime = this.metrics.summary.averageResponseTimes[endpoint];
      const violations = this.metrics.summary.thresholdViolations[endpoint] || 0;
      console.log(`   ${endpoint}: ${avgTime.toFixed(0)}ms avg (${violations} violations)`);
    });

    console.log(`\n📄 Reports saved:`);
    console.log(`   - performance-monitor-report.json`);
    console.log(`   - performance-monitor-summary.md`);

    return report;
  }

  calculateSummaryStatistics() {
    const endpointStats = {};
    
    // Initialize endpoint stats
    this.metrics.samples.forEach(sample => {
      Object.keys(sample.endpoints).forEach(endpoint => {
        if (!endpointStats[endpoint]) {
          endpointStats[endpoint] = {
            responseTimes: [],
            successCount: 0,
            errorCount: 0,
            violations: 0
          };
        }
        
        const endpointData = sample.endpoints[endpoint];
        if (endpointData.status === 'success' && endpointData.responseTime) {
          endpointStats[endpoint].responseTimes.push(endpointData.responseTime);
          endpointStats[endpoint].successCount++;
          
          // Count threshold violations
          const threshold = PERFORMANCE_CONFIG.thresholds[endpoint];
          if (threshold && endpointData.responseTime > threshold.warning) {
            endpointStats[endpoint].violations++;
          }
        } else {
          endpointStats[endpoint].errorCount++;
        }
      });
    });

    // Calculate averages
    Object.keys(endpointStats).forEach(endpoint => {
      const stats = endpointStats[endpoint];
      if (stats.responseTimes.length > 0) {
        this.metrics.summary.averageResponseTimes[endpoint] = 
          stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length;
      }
      this.metrics.summary.thresholdViolations[endpoint] = stats.violations;
    });

    // Determine overall system health
    const totalViolations = Object.values(this.metrics.summary.thresholdViolations)
      .reduce((a, b) => a + b, 0);
    const violationRate = totalViolations / this.metrics.summary.totalSamples;

    if (violationRate < 0.05) {
      this.metrics.summary.systemHealth = 'excellent';
    } else if (violationRate < 0.15) {
      this.metrics.summary.systemHealth = 'good';
    } else if (violationRate < 0.30) {
      this.metrics.summary.systemHealth = 'fair';
    } else {
      this.metrics.summary.systemHealth = 'poor';
    }
  }

  analyzePerformance() {
    const analysis = {
      overallHealth: this.metrics.summary.systemHealth,
      recommendations: [],
      criticalIssues: [],
      trends: {}
    };

    // Analyze critical alerts
    const criticalAlerts = this.metrics.alerts.filter(alert => alert.type === 'critical_response_time');
    if (criticalAlerts.length > 0) {
      analysis.criticalIssues.push({
        issue: 'Critical response time violations detected',
        count: criticalAlerts.length,
        endpoints: [...new Set(criticalAlerts.map(alert => alert.endpoint))]
      });
    }

    // Generate recommendations
    Object.keys(this.metrics.summary.averageResponseTimes).forEach(endpoint => {
      const avgTime = this.metrics.summary.averageResponseTimes[endpoint];
      const threshold = PERFORMANCE_CONFIG.thresholds[endpoint];
      
      if (threshold && avgTime > threshold.warning) {
        analysis.recommendations.push({
          endpoint,
          issue: `Average response time (${avgTime.toFixed(0)}ms) exceeds warning threshold (${threshold.warning}ms)`,
          suggestion: this.getOptimizationSuggestion(endpoint)
        });
      }
    });

    // Analyze memory trends
    const memoryUsages = this.metrics.samples.map(sample => sample.systemMetrics.memory.heapUsed);
    if (memoryUsages.length > 1) {
      const firstHalf = memoryUsages.slice(0, Math.floor(memoryUsages.length / 2));
      const secondHalf = memoryUsages.slice(Math.floor(memoryUsages.length / 2));
      
      const firstHalfAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      const memoryTrend = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
      
      analysis.trends.memoryUsage = {
        trend: memoryTrend > 10 ? 'increasing' : memoryTrend < -10 ? 'decreasing' : 'stable',
        percentage: memoryTrend.toFixed(1)
      };
      
      if (memoryTrend > 20) {
        analysis.criticalIssues.push({
          issue: 'Memory usage increasing significantly',
          trend: `${memoryTrend.toFixed(1)}% increase during monitoring period`
        });
      }
    }

    return analysis;
  }

  getOptimizationSuggestion(endpoint) {
    const suggestions = {
      chatbot: 'Consider implementing response caching, optimizing AI model inference, or adding request queuing',
      irrigation: 'Optimize ML model performance, implement prediction caching, or use lighter algorithms',
      disease: 'Optimize image processing pipeline, implement async processing, or reduce model complexity',
      health: 'Optimize database queries and reduce system checks'
    };

    return suggestions[endpoint] || 'Review endpoint implementation for optimization opportunities';
  }

  generatePerformanceSummary(report) {
    const analysis = report.analysis;
    
    return `# Performance Monitoring Report

## Monitoring Configuration
- **Duration**: ${PERFORMANCE_CONFIG.monitoringDuration / 1000} seconds
- **Sampling Interval**: ${PERFORMANCE_CONFIG.samplingInterval / 1000} seconds
- **Total Samples**: ${this.metrics.summary.totalSamples}

## Overall System Health: ${analysis.overallHealth.toUpperCase()}

## Response Time Performance
${Object.keys(this.metrics.summary.averageResponseTimes).map(endpoint => {
  const avgTime = this.metrics.summary.averageResponseTimes[endpoint];
  const violations = this.metrics.summary.thresholdViolations[endpoint];
  const threshold = PERFORMANCE_CONFIG.thresholds[endpoint];
  
  let status = '✅ GOOD';
  if (threshold && avgTime > threshold.critical) {
    status = '🔴 CRITICAL';
  } else if (threshold && avgTime > threshold.warning) {
    status = '🟡 WARNING';
  }
  
  return `### ${endpoint.toUpperCase()}
- **Status**: ${status}
- **Average Response Time**: ${avgTime.toFixed(2)}ms
- **Warning Threshold**: ${threshold?.warning || 'N/A'}ms
- **Critical Threshold**: ${threshold?.critical || 'N/A'}ms
- **Threshold Violations**: ${violations}`;
}).join('\n\n')}

## System Metrics Trends
${analysis.trends.memoryUsage ? 
  `### Memory Usage
- **Trend**: ${analysis.trends.memoryUsage.trend}
- **Change**: ${analysis.trends.memoryUsage.percentage}%` : 
  'Memory trend analysis not available'
}

## Critical Issues
${analysis.criticalIssues.length > 0 ? 
  analysis.criticalIssues.map(issue => `- **${issue.issue}**${issue.count ? ` (${issue.count} occurrences)` : ''}${issue.trend ? `: ${issue.trend}` : ''}`).join('\n') :
  'No critical issues detected ✅'
}

## Recommendations
${analysis.recommendations.length > 0 ?
  analysis.recommendations.map(rec => `### ${rec.endpoint.toUpperCase()}
- **Issue**: ${rec.issue}
- **Suggestion**: ${rec.suggestion}`).join('\n\n') :
  'System performance is within acceptable parameters ✅'
}

## Alert Summary
- **Total Alerts**: ${this.metrics.alerts.length}
- **Critical Response Time Alerts**: ${this.metrics.alerts.filter(a => a.type === 'critical_response_time').length}
- **Warning Response Time Alerts**: ${this.metrics.alerts.filter(a => a.type === 'warning_response_time').length}
- **Monitoring Errors**: ${this.metrics.alerts.filter(a => a.type === 'monitoring_error').length}

---
*Generated by Performance Monitor*
`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stopMonitoring() {
    this.isMonitoring = false;
  }
}

// Main execution
async function runPerformanceMonitoring() {
  const monitor = new PerformanceMonitor();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping performance monitoring...');
    monitor.stopMonitoring();
  });
  
  try {
    await monitor.startMonitoring();
    console.log('\n✅ Performance monitoring completed successfully!');
  } catch (error) {
    console.error('\n❌ Performance monitoring failed:', error);
    process.exit(1);
  }
}

// Export for use in other test files
module.exports = { PerformanceMonitor, PERFORMANCE_CONFIG };

// Run if called directly
if (require.main === module) {
  runPerformanceMonitoring();
}