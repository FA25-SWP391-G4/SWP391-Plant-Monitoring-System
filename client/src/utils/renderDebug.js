/**
 * Render debugging utilities for performance monitoring
 * Tracks component render times, re-renders, and expensive operations
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// Global performance tracker
const PERFORMANCE_TRACKER = {
  renders: new Map(),
  timings: new Map(),
  rerenderCounts: new Map(),
  slowComponents: new Set(),
  enableLogging: true
};

// Colors for different types of logs
const LOG_COLORS = {
  render: '#2563eb', // blue
  mount: '#059669', // green
  update: '#d97706', // amber
  unmount: '#dc2626', // red
  slow: '#7c2d12', // red-800
  timing: '#7c3aed' // purple
};

// Log with colors and performance data
const perfLog = (type, componentName, message, data = {}) => {
  if (!PERFORMANCE_TRACKER.enableLogging) return;
  
  const color = LOG_COLORS[type] || '#000000';
  const timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
  
  console.log(
    `%c[${timestamp}] 🚀 ${type.toUpperCase()} - ${componentName}: ${message}`,
    `color: ${color}; font-weight: bold;`,
    data
  );
};

// Performance measurement hook
export const useRenderDebug = (componentName, props = {}) => {
  const renderCount = useRef(0);
  const mountTime = useRef(null);
  const lastRenderTime = useRef(null);
  const propsRef = useRef(props);
  
  // Track render count and timing
  renderCount.current += 1;
  const currentTime = performance.now();
  
  // Check for prop changes
  const propChanges = useRef([]);
  useEffect(() => {
    const changes = [];
    Object.keys(props).forEach(key => {
      if (propsRef.current[key] !== props[key]) {
        changes.push({
          prop: key,
          oldValue: propsRef.current[key],
          newValue: props[key]
        });
      }
    });
    
    if (changes.length > 0) {
      perfLog('update', componentName, `Props changed`, changes);
      propChanges.current = changes;
    }
    
    propsRef.current = props;
  });
  
  // Mount tracking
  useEffect(() => {
    mountTime.current = currentTime;
    PERFORMANCE_TRACKER.rerenderCounts.set(componentName, 0);
    
    perfLog('mount', componentName, `Component mounted`, {
      initialProps: props,
      mountTime: currentTime
    });
    
    return () => {
      const unmountTime = performance.now();
      const totalLifetime = unmountTime - mountTime.current;
      
      perfLog('unmount', componentName, `Component unmounted`, {
        lifetime: `${totalLifetime.toFixed(2)}ms`,
        totalRenders: renderCount.current
      });
    };
  }, []);
  
  // Render tracking
  useEffect(() => {
    const renderTime = currentTime;
    const timeSinceLastRender = lastRenderTime.current 
      ? renderTime - lastRenderTime.current 
      : 0;
    
    // Track re-renders
    if (renderCount.current > 1) {
      const currentCount = PERFORMANCE_TRACKER.rerenderCounts.get(componentName) || 0;
      PERFORMANCE_TRACKER.rerenderCounts.set(componentName, currentCount + 1);
    }
    
    // Log render info
    perfLog('render', componentName, `Render #${renderCount.current}`, {
      renderTime: `${renderTime.toFixed(2)}ms`,
      timeSinceLastRender: timeSinceLastRender > 0 ? `${timeSinceLastRender.toFixed(2)}ms` : 'N/A',
      propChanges: propChanges.current,
      totalRerenders: PERFORMANCE_TRACKER.rerenderCounts.get(componentName) || 0
    });
    
    // Flag slow renders (>16ms for 60fps)
    if (timeSinceLastRender > 16 && timeSinceLastRender < 1000) {
      PERFORMANCE_TRACKER.slowComponents.add(componentName);
      perfLog('slow', componentName, `Slow render detected!`, {
        renderTime: `${timeSinceLastRender.toFixed(2)}ms`,
        threshold: '16ms (60fps)'
      });
    }
    
    lastRenderTime.current = renderTime;
  });
  
  return {
    renderCount: renderCount.current,
    componentName,
    logTiming: (operationName, startTime) => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      perfLog('timing', componentName, `${operationName} completed`, {
        duration: `${duration.toFixed(2)}ms`,
        startTime: `${startTime.toFixed(2)}ms`,
        endTime: `${endTime.toFixed(2)}ms`
      });
      
      return duration;
    }
  };
};

// Hook for timing expensive operations
export const useOperationTiming = (componentName) => {
  const timingRef = useRef(new Map());
  
  const startTiming = useCallback((operationName) => {
    const startTime = performance.now();
    timingRef.current.set(operationName, startTime);
    
    perfLog('timing', componentName, `${operationName} started`, {
      startTime: `${startTime.toFixed(2)}ms`
    });
    
    return startTime;
  }, [componentName]);
  
  const endTiming = useCallback((operationName) => {
    const startTime = timingRef.current.get(operationName);
    if (!startTime) {
      console.warn(`No start time found for operation: ${operationName}`);
      return null;
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    perfLog('timing', componentName, `${operationName} completed`, {
      duration: `${duration.toFixed(2)}ms`,
      startTime: `${startTime.toFixed(2)}ms`,
      endTime: `${endTime.toFixed(2)}ms`
    });
    
    timingRef.current.delete(operationName);
    return duration;
  }, [componentName]);
  
  return { startTiming, endTiming };
};

// Hook for tracking data fetching performance
export const useDataFetchDebug = (componentName) => {
  const [fetchState, setFetchState] = useState({
    loading: false,
    error: null,
    data: null,
    fetchTime: null
  });
  
  const fetchWithDebug = useCallback(async (fetchFunction, operationName = 'data fetch') => {
    const startTime = performance.now();
    
    setFetchState(prev => ({ ...prev, loading: true, error: null }));
    
    perfLog('timing', componentName, `${operationName} started`, {
      startTime: `${startTime.toFixed(2)}ms`
    });
    
    try {
      const result = await fetchFunction();
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setFetchState({
        loading: false,
        error: null,
        data: result,
        fetchTime: duration
      });
      
      perfLog('timing', componentName, `${operationName} completed successfully`, {
        duration: `${duration.toFixed(2)}ms`,
        dataSize: typeof result === 'object' ? JSON.stringify(result).length : 'N/A'
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      setFetchState({
        loading: false,
        error,
        data: null,
        fetchTime: duration
      });
      
      perfLog('timing', componentName, `${operationName} failed`, {
        duration: `${duration.toFixed(2)}ms`,
        error: error.message
      });
      
      throw error;
    }
  }, [componentName]);
  
  return { fetchState, fetchWithDebug };
};

// Performance summary utility
export const getPerformanceSummary = () => {
  const summary = {
    totalComponents: PERFORMANCE_TRACKER.rerenderCounts.size,
    slowComponents: Array.from(PERFORMANCE_TRACKER.slowComponents),
    rerenderStats: Object.fromEntries(PERFORMANCE_TRACKER.rerenderCounts),
    timestamp: new Date().toISOString()
  };
  
  console.group('🚀 Performance Summary');
  console.log('Total components tracked:', summary.totalComponents);
  console.log('Slow components:', summary.slowComponents);
  console.log('Re-render stats:', summary.rerenderStats);
  console.groupEnd();
  
  return summary;
};

// Toggle debugging on/off
export const toggleRenderDebug = (enabled = null) => {
  PERFORMANCE_TRACKER.enableLogging = enabled !== null ? enabled : !PERFORMANCE_TRACKER.enableLogging;
  console.log(`🚀 Render debugging ${PERFORMANCE_TRACKER.enableLogging ? 'enabled' : 'disabled'}`);
  return PERFORMANCE_TRACKER.enableLogging;
};

// Clear performance data
export const clearPerformanceData = () => {
  PERFORMANCE_TRACKER.renders.clear();
  PERFORMANCE_TRACKER.timings.clear();
  PERFORMANCE_TRACKER.rerenderCounts.clear();
  PERFORMANCE_TRACKER.slowComponents.clear();
  console.log('🚀 Performance data cleared');
};

// Make debugging utilities available globally for debugging
if (typeof window !== 'undefined') {
  window.perfDebug = {
    getSummary: getPerformanceSummary,
    toggle: toggleRenderDebug,
    clear: clearPerformanceData,
    tracker: PERFORMANCE_TRACKER
  };
}