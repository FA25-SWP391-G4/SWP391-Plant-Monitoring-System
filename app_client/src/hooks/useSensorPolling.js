import { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as plantApi from '../api/plantApi';

/**
 * useSensorPolling - Hook for polling sensor data at configurable intervals
 * 
 * Features:
 * - Polls sensor data at specified interval (default: 5s)
 * - Respects AppState (pauses when backgrounded, resumes when foreground)
 * - Tracks data staleness (marks stale if >10s old)
 * - Manual start/stop controls
 * 
 * @param {string} plantId - ID of the plant to poll
 * @param {number} intervalMs - Polling interval in milliseconds (default: 5000)
 * @returns {Object} { data, loading, error, isStale, startPolling, stopPolling }
 */
export const useSensorPolling = (plantId, intervalMs = 5000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isStale, setIsStale] = useState(false);
  
  const appStateRef = useRef(null);
  const intervalRef = useRef(null);
  const lastFetchTimeRef = useRef(null);
  const isActiveRef = useRef(false);

  const checkStaleness = () => {
    if (lastFetchTimeRef.current) {
      const timeDiff = Date.now() - lastFetchTimeRef.current;
      setIsStale(timeDiff > 10000);
    }
  };

  const fetchSensorData = async () => {
    if (!plantId || !isActiveRef.current) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await plantApi.getSensorHistory(plantId, 1);
      
      if (response && response.data && response.data.length > 0) {
        const latest = response.data[0];
        setData(latest);
        lastFetchTimeRef.current = Date.now();
        checkStaleness();
      } else {
        setData(null);
      }

      setLoading(false);
    } catch (err) {
      console.error('[useSensorPolling] Fetch error:', err.message);
      setError(err.message || 'Failed to fetch sensor data');
      setLoading(false);
    }
  };

  const startPolling = () => {
    if (intervalRef.current) {
      return;
    }

    console.log('[useSensorPolling] Starting polling for plant:', plantId);
    isActiveRef.current = true;
    fetchSensorData();

    intervalRef.current = setInterval(() => {
      if (isActiveRef.current) {
        fetchSensorData();
        checkStaleness();
      }
    }, intervalMs);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      console.log('[useSensorPolling] Stopping polling');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isActiveRef.current = false;
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState) => {
    if (appStateRef.current && appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('[useSensorPolling] App came to foreground, resuming polling');
      if (isActiveRef.current && !intervalRef.current) {
        startPolling();
      }
    } else if (nextAppState.match(/inactive|background/)) {
      console.log('[useSensorPolling] App went to background, pausing polling');
      stopPolling();
    }

    appStateRef.current = nextAppState;
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [plantId]);

  return {
    data,
    loading,
    error,
    isStale,
    startPolling,
    stopPolling,
  };
};