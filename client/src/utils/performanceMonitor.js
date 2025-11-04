/**
 * Performance monitoring script for dashboard analysis
 * Run this in the browser console to monitor performance metrics
 */

// Add to window for easy access
window.performanceMonitor = {
  enabled: true,
  metrics: [],
  thresholds: {
    render: 16, // 16ms for 60fps
    dataFetch: 1000, // 1 second for data fetching
    navigation: 500 // 500ms for navigation
  },
  
  // Start monitoring
  start() {
    console.log('🚀 Performance monitoring started for dashboard');
    console.log('Thresholds:', this.thresholds);
    
    // Monitor navigation timing
    this.monitorNavigation();
    
    // Monitor long tasks
    this.monitorLongTasks();
    
    // Monitor memory usage
    this.monitorMemory();
    
    // Set up periodic reporting
    this.reportingInterval = setInterval(() => {
      this.generateReport();
    }, 10000); // Report every 10 seconds
  },
  
  // Stop monitoring
  stop() {
    console.log('🚀 Performance monitoring stopped');
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
    }
  },
  
  // Monitor navigation timing
  monitorNavigation() {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const navigationTime = timing.loadEventEnd - timing.navigationStart;
      const domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
      const firstPaint = timing.responseEnd - timing.fetchStart;
      
      console.log('📊 Navigation Timing:');
      console.log(`  Total Navigation: ${navigationTime}ms`);
      console.log(`  DOM Content Loaded: ${domContentLoaded}ms`);
      console.log(`  First Paint: ${firstPaint}ms`);
      
      this.metrics.push({
        type: 'navigation',
        timestamp: Date.now(),
        data: {
          navigationTime,
          domContentLoaded,
          firstPaint
        }
      });
    }
  },
  
  // Monitor long tasks (requires observer support)
  monitorLongTasks() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) { // Tasks longer than 50ms
              console.warn(`⚠️ Long Task Detected: ${entry.duration.toFixed(2)}ms`);
              console.log('  Name:', entry.name);
              console.log('  Start:', entry.startTime.toFixed(2));
              
              this.metrics.push({
                type: 'longTask',
                timestamp: Date.now(),
                data: {
                  duration: entry.duration,
                  name: entry.name,
                  startTime: entry.startTime
                }
              });
            }
          }
        });
        
        observer.observe({ entryTypes: ['longtask'] });
        console.log('📈 Long task monitoring enabled');
      } catch (e) {
        console.log('❌ Long task monitoring not supported');
      }
    }
  },
  
  // Monitor memory usage
  monitorMemory() {
    if (window.performance && window.performance.memory) {
      const logMemory = () => {
        const memory = window.performance.memory;
        const used = Math.round(memory.usedJSHeapSize / 1048576 * 100) / 100;
        const total = Math.round(memory.totalJSHeapSize / 1048576 * 100) / 100;
        const limit = Math.round(memory.jsHeapSizeLimit / 1048576 * 100) / 100;
        
        console.log(`💾 Memory Usage: ${used}MB / ${total}MB (Limit: ${limit}MB)`);
        
        this.metrics.push({
          type: 'memory',
          timestamp: Date.now(),
          data: { used, total, limit }
        });
      };
      
      // Log memory every 5 seconds
      setInterval(logMemory, 5000);
      logMemory(); // Initial reading
    }
  },
  
  // Generate performance report
  generateReport() {
    console.group('📊 Performance Report');
    
    // Count metrics by type
    const metricCounts = this.metrics.reduce((acc, metric) => {
      acc[metric.type] = (acc[metric.type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('Metrics collected:', metricCounts);
    
    // Find problematic patterns
    const longTasks = this.metrics.filter(m => m.type === 'longTask');
    if (longTasks.length > 0) {
      console.warn(`⚠️ ${longTasks.length} long tasks detected`);
      const avgDuration = longTasks.reduce((sum, task) => sum + task.data.duration, 0) / longTasks.length;
      console.log(`Average long task duration: ${avgDuration.toFixed(2)}ms`);
    }
    
    // Check memory trends
    const memoryMetrics = this.metrics.filter(m => m.type === 'memory').slice(-5);
    if (memoryMetrics.length > 1) {
      const firstMem = memoryMetrics[0].data.used;
      const lastMem = memoryMetrics[memoryMetrics.length - 1].data.used;
      const memoryTrend = lastMem - firstMem;
      
      if (memoryTrend > 5) { // 5MB increase
        console.warn(`⚠️ Memory increasing: +${memoryTrend.toFixed(2)}MB`);
      } else if (memoryTrend < -5) {
        console.log(`✅ Memory decreasing: ${memoryTrend.toFixed(2)}MB`);
      }
    }
    
    console.groupEnd();
  },
  
  // Get summary of current performance state
  getSummary() {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(m => now - m.timestamp < 60000); // Last minute
    
    return {
      totalMetrics: this.metrics.length,
      recentMetrics: recentMetrics.length,
      longTasks: this.metrics.filter(m => m.type === 'longTask').length,
      memoryData: this.metrics.filter(m => m.type === 'memory').slice(-1)[0]?.data,
      thresholds: this.thresholds
    };
  },
  
  // Clear all metrics
  clear() {
    this.metrics = [];
    console.log('🧹 Performance metrics cleared');
  }
};

// Dashboard-specific performance checks
window.dashboardPerf = {
  // Check for slow components
  checkSlowComponents() {
    console.log('🔍 Checking for slow components...');
    
    if (window.perfDebug && window.perfDebug.tracker) {
      const slowComponents = Array.from(window.perfDebug.tracker.slowComponents);
      const rerenderStats = window.perfDebug.tracker.rerenderCounts;
      
      console.log('Slow components:', slowComponents);
      console.log('Components with excessive re-renders:');
      
      Object.entries(rerenderStats).forEach(([component, count]) => {
        if (count > 5) {
          console.warn(`⚠️ ${component}: ${count} re-renders`);
        }
      });
    }
  },
  
  // Monitor dashboard-specific timing
  monitorDashboardLoad() {
    const startTime = performance.now();
    
    // Wait for dashboard to be likely loaded
    setTimeout(() => {
      const loadTime = performance.now() - startTime;
      console.log(`📊 Dashboard load time: ${loadTime.toFixed(2)}ms`);
      
      // Check if dashboard elements are present
      const hasWelcome = document.querySelector('[class*="welcome"]') !== null;
      const hasWidgets = document.querySelectorAll('[class*="widget"]').length > 0;
      const hasNavigation = document.querySelector('nav') !== null;
      
      console.log('Dashboard elements check:', {
        hasWelcome,
        hasWidgets,
        hasNavigation,
        loadTime: `${loadTime.toFixed(2)}ms`
      });
    }, 1000);
  }
};

// Auto-start monitoring when script loads
console.log('🚀 Dashboard performance monitoring tools loaded');
console.log('Available commands:');
console.log('  - window.performanceMonitor.start() - Start monitoring');
console.log('  - window.performanceMonitor.stop() - Stop monitoring');
console.log('  - window.performanceMonitor.getSummary() - Get current status');
console.log('  - window.dashboardPerf.checkSlowComponents() - Check component performance');
console.log('  - window.dashboardPerf.monitorDashboardLoad() - Monitor dashboard load');
console.log('  - window.perfDebug.getSummary() - Get render debug summary');

// Auto-start basic monitoring
window.performanceMonitor.start();
window.dashboardPerf.monitorDashboardLoad();