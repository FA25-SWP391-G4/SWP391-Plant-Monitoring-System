/**
 * Memory Usage Monitor for AI System
 * Monitors memory consumption and detects memory leaks
 * Requirements: 4.1, 4.2, 4.3
 */

const axios = require('axios');
const { performance } = require('perf_hooks');
const fs = require('fs').promises;
const path = require('path');

const MEMORY_CONFIG = {
  baseUrl: 'http://localhost:3001',
  monitoringDuration: 600000, // 10 minutes
  samplingInterval: 2000, // 2 seconds
  stressTestDuration: 120000, // 2 minutes of stress testing
  thresholds: {
    heapUsed: 512 * 1024 * 1024, // 512MB
    rss: 1024 * 1024 * 1024, // 1GB
    memoryLeakRate: 0.1 // 10% increase per minute
  },
  gcOptions: {
    forceGC: true,
    gcInterval: 30000 // Force GC every 30 seconds
  }
};

class MemoryUsageMonitor {
  constructor() {
    this.metrics = {
      startTime: Date.now(),
      samples: [],
      gcEvents: [],
      memoryLeaks: [],
      stressTestResults: null,
      summary: {
        peakMemory: { heapUsed: 0, rss: 0, timestamp: 0 },
        averageMemory: { heapUsed: 0, rss: 0 },
        memoryGrowthRate: 0,
        gcEfficiency: 0,
        leakDetected: false
      }
    };
    this.isMonitoring = false;
    this.baselineMemory = null;
  }

  async startMonitoring() {
    console.log('🧠 Starting Memory Usage Monitoring...');
    console.log(`📊 Duration: ${MEMORY_CONFIG.monitoringDuration / 1000} seconds`);
    console.log(`⏱️ Sampling Interval: ${MEMORY_CONFIG.samplingInterval / 1000} seconds`);
    console.log(`🔥 Stress Test Duration: ${MEMORY_CONFIG.stressTestDuration / 1000} seconds\n`);

    // Enable garbage collection if available
    if (global.gc) {
      console.log('✅ Garbage collection available for testing');
    } else {
      console.log('⚠️ Garbage collection not available (run with --expose-gc for better testing)');
    }

    this.isMonitoring = true;
    
    // Collect baseline memory
    this.baselineMemory = this.collectMemorySample();
    console.log(`📊 Baseline Memory: Heap ${(this.baselineMemory.heapUsed / 1024 / 1024).toFixed(1)}MB, RSS ${(this.baselineMemory.rss / 1024 / 1024).toFixed(1)}MB\n`);

    // Start monitoring phases
    await this.runNormalMonitoring();
    await this.runStressTest();
    await this.runPostStressMonitoring();
    
    await this.generateMemoryReport();
  }

  async runNormalMonitoring() {
    console.log('📈 Phase 1: Normal Operation Monitoring...');
    
    const normalDuration = (MEMORY_CONFIG.monitoringDuration - MEMORY_CONFIG.stressTestDuration) / 2;
    const endTime = Date.now() + normalDuration;

    while (Date.now() < endTime && this.isMonitoring) {
      const sample = this.collectMemorySample();
      this.metrics.samples.push({
        ...sample,
        phase: 'normal',
        timestamp: Date.now()
      });

      this.checkMemoryThresholds(sample);
      this.logMemoryStatus(sample, 'Normal');

      // Periodic garbage collection if available
      if (global.gc && Date.now() % MEMORY_CONFIG.gcOptions.gcInterval < MEMORY_CONFIG.samplingInterval) {
        this.forceGarbageCollection();
      }

      await this.sleep(MEMORY_CONFIG.samplingInterval);
    }
  }

  async runStressTest() {
    console.log('\n🔥 Phase 2: Memory Stress Testing...');
    
    const stressEndTime = Date.now() + MEMORY_CONFIG.stressTestDuration;
    const stressResults = {
      startMemory: this.collectMemorySample(),
      peakMemory: { heapUsed: 0, rss: 0 },
      endMemory: null,
      operationsCompleted: 0,
      errors: []
    };

    // Start intensive operations
    const stressPromises = [
      this.runConcurrentChatbotRequests(),
      this.runConcurrentIrrigationRequests(),
      this.runMemoryIntensiveOperations()
    ];

    // Monitor memory during stress test
    const monitoringPromise = (async () => {
      while (Date.now() < stressEndTime && this.isMonitoring) {
        const sample = this.collectMemorySample();
        this.metrics.samples.push({
          ...sample,
          phase: 'stress',
          timestamp: Date.now()
        });

        // Track peak memory during stress test
        if (sample.heapUsed > stressResults.peakMemory.heapUsed) {
          stressResults.peakMemory = sample;
        }

        this.checkMemoryThresholds(sample);
        this.logMemoryStatus(sample, 'Stress');

        await this.sleep(MEMORY_CONFIG.samplingInterval);
      }
    })();

    // Wait for stress test completion
    await Promise.all([...stressPromises, monitoringPromise]);
    
    stressResults.endMemory = this.collectMemorySample();
    this.metrics.stressTestResults = stressResults;

    console.log(`✅ Stress test completed. Peak memory: ${(stressResults.peakMemory.heapUsed / 1024 / 1024).toFixed(1)}MB`);
  }

  async runPostStressMonitoring() {
    console.log('\n📉 Phase 3: Post-Stress Recovery Monitoring...');
    
    // Force garbage collection to see memory recovery
    if (global.gc) {
      this.forceGarbageCollection();
      await this.sleep(2000); // Wait for GC to complete
    }

    const recoveryDuration = (MEMORY_CONFIG.monitoringDuration - MEMORY_CONFIG.stressTestDuration) / 2;
    const endTime = Date.now() + recoveryDuration;

    while (Date.now() < endTime && this.isMonitoring) {
      const sample = this.collectMemorySample();
      this.metrics.samples.push({
        ...sample,
        phase: 'recovery',
        timestamp: Date.now()
      });

      this.checkMemoryThresholds(sample);
      this.logMemoryStatus(sample, 'Recovery');

      await this.sleep(MEMORY_CONFIG.samplingInterval);
    }
  }

  async runConcurrentChatbotRequests() {
    const promises = [];
    const endTime = Date.now() + MEMORY_CONFIG.stressTestDuration;

    while (Date.now() < endTime) {
      // Create 10 concurrent chatbot requests
      for (let i = 0; i < 10; i++) {
        promises.push(this.makeChatbotRequest(i));
      }

      // Wait for batch completion
      try {
        await Promise.allSettled(promises.splice(0, 10));
      } catch (error) {
        // Continue stress testing even if some requests fail
      }

      await this.sleep(1000); // 1 second between batches
    }
  }

  async runConcurrentIrrigationRequests() {
    const promises = [];
    const endTime = Date.now() + MEMORY_CONFIG.stressTestDuration;

    while (Date.now() < endTime) {
      // Create 5 concurrent irrigation requests
      for (let i = 0; i < 5; i++) {
        promises.push(this.makeIrrigationRequest(i));
      }

      try {
        await Promise.allSettled(promises.splice(0, 5));
      } catch (error) {
        // Continue stress testing
      }

      await this.sleep(2000); // 2 seconds between batches
    }
  }

  async runMemoryIntensiveOperations() {
    const endTime = Date.now() + MEMORY_CONFIG.stressTestDuration;
    const largeArrays = [];

    while (Date.now() < endTime) {
      // Create large arrays to simulate memory-intensive AI operations
      const largeArray = new Array(100000).fill(0).map(() => ({
        id: Math.random(),
        data: new Array(100).fill(Math.random()),
        timestamp: Date.now()
      }));

      largeArrays.push(largeArray);

      // Process the array (simulate AI computation)
      largeArray.forEach(item => {
        item.processed = item.data.reduce((sum, val) => sum + val, 0);
      });

      // Keep only recent arrays to prevent unlimited growth
      if (largeArrays.length > 10) {
        largeArrays.shift();
      }

      await this.sleep(500);
    }

    // Clear arrays at the end
    largeArrays.length = 0;
  }

  async makeChatbotRequest(requestId) {
    try {
      const response = await axios.post(`${MEMORY_CONFIG.baseUrl}/api/ai/chatbot/message`, {
        message: `Memory stress test message ${requestId}`,
        userId: 88888 + requestId,
        plantId: 1,
        sessionId: `memory-stress-${requestId}-${Date.now()}`
      }, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });

      return response.data;
    } catch (error) {
      // Expected during stress testing
      return null;
    }
  }

  async makeIrrigationRequest(requestId) {
    try {
      const response = await axios.post(`${MEMORY_CONFIG.baseUrl}/api/ai/irrigation/predict/1`, {
        sensorData: {
          soilMoisture: Math.random() * 100,
          temperature: 15 + Math.random() * 20,
          humidity: 30 + Math.random() * 50,
          lightLevel: 500 + Math.random() * 3000
        },
        userId: 88888 + requestId
      }, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });

      return response.data;
    } catch (error) {
      // Expected during stress testing
      return null;
    }
  }

  collectMemorySample() {
    const memoryUsage = process.memoryUsage();
    
    return {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      rss: memoryUsage.rss,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers || 0,
      timestamp: Date.now()
    };
  }

  checkMemoryThresholds(sample) {
    // Check heap usage threshold
    if (sample.heapUsed > MEMORY_CONFIG.thresholds.heapUsed) {
      this.metrics.memoryLeaks.push({
        type: 'heap_threshold_exceeded',
        value: sample.heapUsed,
        threshold: MEMORY_CONFIG.thresholds.heapUsed,
        timestamp: sample.timestamp
      });
    }

    // Check RSS threshold
    if (sample.rss > MEMORY_CONFIG.thresholds.rss) {
      this.metrics.memoryLeaks.push({
        type: 'rss_threshold_exceeded',
        value: sample.rss,
        threshold: MEMORY_CONFIG.thresholds.rss,
        timestamp: sample.timestamp
      });
    }

    // Update peak memory
    if (sample.heapUsed > this.metrics.summary.peakMemory.heapUsed) {
      this.metrics.summary.peakMemory = {
        heapUsed: sample.heapUsed,
        rss: sample.rss,
        timestamp: sample.timestamp
      };
    }
  }

  forceGarbageCollection() {
    if (global.gc) {
      const beforeGC = this.collectMemorySample();
      global.gc();
      const afterGC = this.collectMemorySample();
      
      this.metrics.gcEvents.push({
        beforeGC,
        afterGC,
        memoryFreed: beforeGC.heapUsed - afterGC.heapUsed,
        timestamp: Date.now()
      });

      console.log(`🗑️ GC: Freed ${((beforeGC.heapUsed - afterGC.heapUsed) / 1024 / 1024).toFixed(1)}MB`);
    }
  }

  logMemoryStatus(sample, phase) {
    const heapMB = (sample.heapUsed / 1024 / 1024).toFixed(1);
    const rssMB = (sample.rss / 1024 / 1024).toFixed(1);
    const heapPercent = ((sample.heapUsed / sample.heapTotal) * 100).toFixed(1);
    
    let status = '✅';
    if (sample.heapUsed > MEMORY_CONFIG.thresholds.heapUsed) {
      status = '🔴';
    } else if (sample.heapUsed > MEMORY_CONFIG.thresholds.heapUsed * 0.8) {
      status = '🟡';
    }

    console.log(`[${new Date().toLocaleTimeString()}] ${phase}: ${status} Heap ${heapMB}MB (${heapPercent}%) | RSS ${rssMB}MB`);
  }

  async generateMemoryReport() {
    console.log('\n📊 Generating Memory Usage Report...');

    // Calculate summary statistics
    this.calculateMemorySummary();

    const report = {
      configuration: MEMORY_CONFIG,
      metrics: this.metrics,
      analysis: this.analyzeMemoryUsage()
    };

    // Save detailed report
    await fs.writeFile(
      path.join(__dirname, 'memory-usage-report.json'),
      JSON.stringify(report, null, 2)
    );

    // Generate human-readable summary
    const summary = this.generateMemorySummary(report);
    await fs.writeFile(
      path.join(__dirname, 'memory-usage-summary.md'),
      summary
    );

    // Console output
    console.log('\n📋 Memory Usage Results:');
    console.log(`   Duration: ${((Date.now() - this.metrics.startTime) / 1000).toFixed(0)} seconds`);
    console.log(`   Peak Heap: ${(this.metrics.summary.peakMemory.heapUsed / 1024 / 1024).toFixed(1)}MB`);
    console.log(`   Peak RSS: ${(this.metrics.summary.peakMemory.rss / 1024 / 1024).toFixed(1)}MB`);
    console.log(`   Memory Growth Rate: ${this.metrics.summary.memoryGrowthRate.toFixed(2)}%/min`);
    console.log(`   Memory Leaks: ${this.metrics.memoryLeaks.length} threshold violations`);
    console.log(`   GC Events: ${this.metrics.gcEvents.length}`);
    console.log(`   Leak Detected: ${this.metrics.summary.leakDetected ? '❌ YES' : '✅ NO'}`);

    console.log(`\n📄 Reports saved:`);
    console.log(`   - memory-usage-report.json`);
    console.log(`   - memory-usage-summary.md`);

    return report;
  }

  calculateMemorySummary() {
    if (this.metrics.samples.length === 0) return;

    // Calculate average memory usage
    const totalHeap = this.metrics.samples.reduce((sum, sample) => sum + sample.heapUsed, 0);
    const totalRSS = this.metrics.samples.reduce((sum, sample) => sum + sample.rss, 0);
    
    this.metrics.summary.averageMemory = {
      heapUsed: totalHeap / this.metrics.samples.length,
      rss: totalRSS / this.metrics.samples.length
    };

    // Calculate memory growth rate
    if (this.metrics.samples.length > 1) {
      const firstSample = this.metrics.samples[0];
      const lastSample = this.metrics.samples[this.metrics.samples.length - 1];
      const timeDiffMinutes = (lastSample.timestamp - firstSample.timestamp) / (1000 * 60);
      
      const memoryGrowth = ((lastSample.heapUsed - firstSample.heapUsed) / firstSample.heapUsed) * 100;
      this.metrics.summary.memoryGrowthRate = memoryGrowth / timeDiffMinutes;
    }

    // Calculate GC efficiency
    if (this.metrics.gcEvents.length > 0) {
      const totalMemoryFreed = this.metrics.gcEvents.reduce((sum, event) => sum + event.memoryFreed, 0);
      const averageMemoryFreed = totalMemoryFreed / this.metrics.gcEvents.length;
      this.metrics.summary.gcEfficiency = (averageMemoryFreed / this.metrics.summary.averageMemory.heapUsed) * 100;
    }

    // Detect memory leaks
    this.metrics.summary.leakDetected = 
      this.metrics.summary.memoryGrowthRate > MEMORY_CONFIG.thresholds.memoryLeakRate ||
      this.metrics.memoryLeaks.length > 0;
  }

  analyzeMemoryUsage() {
    const analysis = {
      overallHealth: 'unknown',
      memoryLeakRisk: 'low',
      recommendations: [],
      criticalIssues: [],
      phaseAnalysis: {}
    };

    // Analyze by phase
    const phases = ['normal', 'stress', 'recovery'];
    phases.forEach(phase => {
      const phaseSamples = this.metrics.samples.filter(sample => sample.phase === phase);
      if (phaseSamples.length > 0) {
        const avgHeap = phaseSamples.reduce((sum, s) => sum + s.heapUsed, 0) / phaseSamples.length;
        const maxHeap = Math.max(...phaseSamples.map(s => s.heapUsed));
        
        analysis.phaseAnalysis[phase] = {
          averageHeap: avgHeap,
          peakHeap: maxHeap,
          sampleCount: phaseSamples.length
        };
      }
    });

    // Determine overall health
    if (this.metrics.summary.leakDetected) {
      analysis.overallHealth = 'poor';
      analysis.memoryLeakRisk = 'high';
    } else if (this.metrics.summary.peakMemory.heapUsed > MEMORY_CONFIG.thresholds.heapUsed * 0.8) {
      analysis.overallHealth = 'fair';
      analysis.memoryLeakRisk = 'medium';
    } else {
      analysis.overallHealth = 'good';
      analysis.memoryLeakRisk = 'low';
    }

    // Generate recommendations
    if (this.metrics.summary.memoryGrowthRate > 0.05) {
      analysis.recommendations.push({
        issue: 'Memory growth rate is concerning',
        suggestion: 'Review object lifecycle management and implement proper cleanup'
      });
    }

    if (this.metrics.gcEvents.length > 0 && this.metrics.summary.gcEfficiency < 10) {
      analysis.recommendations.push({
        issue: 'Low garbage collection efficiency',
        suggestion: 'Review memory allocation patterns and reduce object creation'
      });
    }

    if (this.metrics.summary.peakMemory.heapUsed > MEMORY_CONFIG.thresholds.heapUsed * 0.9) {
      analysis.recommendations.push({
        issue: 'Peak memory usage is very high',
        suggestion: 'Consider implementing memory pooling or reducing concurrent operations'
      });
    }

    // Identify critical issues
    if (this.metrics.memoryLeaks.length > 0) {
      analysis.criticalIssues.push({
        issue: 'Memory threshold violations detected',
        count: this.metrics.memoryLeaks.length,
        types: [...new Set(this.metrics.memoryLeaks.map(leak => leak.type))]
      });
    }

    return analysis;
  }

  generateMemorySummary(report) {
    const analysis = report.analysis;
    
    return `# Memory Usage Monitoring Report

## Monitoring Configuration
- **Duration**: ${MEMORY_CONFIG.monitoringDuration / 1000} seconds
- **Sampling Interval**: ${MEMORY_CONFIG.samplingInterval / 1000} seconds
- **Stress Test Duration**: ${MEMORY_CONFIG.stressTestDuration / 1000} seconds
- **Total Samples**: ${this.metrics.samples.length}

## Overall Memory Health: ${analysis.overallHealth.toUpperCase()}
**Memory Leak Risk**: ${analysis.memoryLeakRisk.toUpperCase()}

## Memory Usage Summary
- **Baseline Heap**: ${(this.baselineMemory?.heapUsed / 1024 / 1024).toFixed(1)}MB
- **Peak Heap Usage**: ${(this.metrics.summary.peakMemory.heapUsed / 1024 / 1024).toFixed(1)}MB
- **Peak RSS Usage**: ${(this.metrics.summary.peakMemory.rss / 1024 / 1024).toFixed(1)}MB
- **Average Heap Usage**: ${(this.metrics.summary.averageMemory.heapUsed / 1024 / 1024).toFixed(1)}MB
- **Memory Growth Rate**: ${this.metrics.summary.memoryGrowthRate.toFixed(2)}%/minute

## Phase Analysis
${Object.keys(analysis.phaseAnalysis).map(phase => {
  const phaseData = analysis.phaseAnalysis[phase];
  return `### ${phase.toUpperCase()} Phase
- **Average Heap**: ${(phaseData.averageHeap / 1024 / 1024).toFixed(1)}MB
- **Peak Heap**: ${(phaseData.peakHeap / 1024 / 1024).toFixed(1)}MB
- **Samples**: ${phaseData.sampleCount}`;
}).join('\n\n')}

## Garbage Collection Analysis
- **GC Events**: ${this.metrics.gcEvents.length}
- **GC Efficiency**: ${this.metrics.summary.gcEfficiency.toFixed(1)}%
${this.metrics.gcEvents.length > 0 ? 
  `- **Average Memory Freed**: ${(this.metrics.gcEvents.reduce((sum, event) => sum + event.memoryFreed, 0) / this.metrics.gcEvents.length / 1024 / 1024).toFixed(1)}MB` :
  '- **Note**: No garbage collection events recorded'
}

## Stress Test Results
${this.metrics.stressTestResults ? 
  `- **Start Memory**: ${(this.metrics.stressTestResults.startMemory.heapUsed / 1024 / 1024).toFixed(1)}MB
- **Peak Memory**: ${(this.metrics.stressTestResults.peakMemory.heapUsed / 1024 / 1024).toFixed(1)}MB
- **End Memory**: ${(this.metrics.stressTestResults.endMemory.heapUsed / 1024 / 1024).toFixed(1)}MB
- **Memory Increase**: ${((this.metrics.stressTestResults.peakMemory.heapUsed - this.metrics.stressTestResults.startMemory.heapUsed) / 1024 / 1024).toFixed(1)}MB` :
  'Stress test results not available'
}

## Critical Issues
${analysis.criticalIssues.length > 0 ? 
  analysis.criticalIssues.map(issue => `- **${issue.issue}**${issue.count ? ` (${issue.count} occurrences)` : ''}`).join('\n') :
  'No critical memory issues detected ✅'
}

## Memory Threshold Violations
- **Total Violations**: ${this.metrics.memoryLeaks.length}
${this.metrics.memoryLeaks.length > 0 ?
  `- **Heap Threshold Violations**: ${this.metrics.memoryLeaks.filter(leak => leak.type === 'heap_threshold_exceeded').length}
- **RSS Threshold Violations**: ${this.metrics.memoryLeaks.filter(leak => leak.type === 'rss_threshold_exceeded').length}` :
  '- **Status**: All memory usage within acceptable thresholds ✅'
}

## Recommendations
${analysis.recommendations.length > 0 ?
  analysis.recommendations.map(rec => `### ${rec.issue}
**Suggestion**: ${rec.suggestion}`).join('\n\n') :
  'Memory usage is within acceptable parameters. No specific recommendations needed ✅'
}

## Memory Optimization Tips
${analysis.memoryLeakRisk === 'high' ? 
  `🚨 **High Risk Detected**:
- Implement proper object cleanup in AI processing pipelines
- Review TensorFlow.js model disposal
- Add memory monitoring to production deployment
- Consider implementing memory limits for AI operations` :
  analysis.memoryLeakRisk === 'medium' ?
  `⚠️ **Medium Risk**:
- Monitor memory usage in production
- Implement periodic garbage collection
- Review large object allocations in AI processing` :
  `✅ **Low Risk**:
- Current memory usage patterns are acceptable
- Continue monitoring in production environment`
}

---
*Generated by Memory Usage Monitor*
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
async function runMemoryMonitoring() {
  const monitor = new MemoryUsageMonitor();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping memory monitoring...');
    monitor.stopMonitoring();
  });
  
  try {
    await monitor.startMonitoring();
    console.log('\n✅ Memory monitoring completed successfully!');
  } catch (error) {
    console.error('\n❌ Memory monitoring failed:', error);
    process.exit(1);
  }
}

// Export for use in other test files
module.exports = { MemoryUsageMonitor, MEMORY_CONFIG };

// Run if called directly
if (require.main === module) {
  runMemoryMonitoring();
}