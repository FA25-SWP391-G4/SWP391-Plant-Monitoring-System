import { useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

/**
 * Custom hook to subscribe to real-time sensor data updates
 * @param {string} deviceId - The device ID to listen for
 * @param {Function} onSensorUpdate - Callback when new sensor data arrives
 * @returns {Object} - Connection status and methods
 */
export function useRealtimeSensorData(deviceId, onSensorUpdate) {
  const socketRef = useRef(null);
  const isConnectedRef = useRef(false);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    try {
      // Connect to backend socket.io server
      socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
        transports: ['websocket', 'polling'],
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      socketRef.current.on('connect', () => {
        console.log('🔌 Connected to real-time sensor updates');
        isConnectedRef.current = true;
        
        // Subscribe to sensor updates for this specific device
        if (deviceId) {
          socketRef.current.emit('subscribe-device', deviceId);
          console.log(`🌱 Subscribed to device updates: ${deviceId}`);
        }
      });

      socketRef.current.on('disconnect', () => {
        console.log('🔌 Disconnected from real-time sensor updates');
        isConnectedRef.current = false;
      });

      socketRef.current.on('sensor-update', (data) => {
        // Filter updates for this specific device
        if (data.deviceId === deviceId && onSensorUpdate) {
          console.log(`📊 Received real-time update for device ${deviceId}:`, data);
          onSensorUpdate(data);
        }
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        isConnectedRef.current = false;
        
        // Retry connection after delay
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!isConnectedRef.current) {
            connect();
          }
        }, 3000);
      });

    } catch (error) {
      console.error('❌ Failed to initialize socket connection:', error);
    }
  }, [deviceId, onSensorUpdate]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    isConnectedRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Effect to handle connection/disconnection
  useEffect(() => {
    if (deviceId && onSensorUpdate) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [deviceId, onSensorUpdate, connect, disconnect]);

  // Effect to handle device ID changes
  useEffect(() => {
    if (socketRef.current?.connected && deviceId) {
      socketRef.current.emit('subscribe-device', deviceId);
      console.log(`🔄 Switched subscription to device: ${deviceId}`);
    }
  }, [deviceId]);

  return {
    isConnected: isConnectedRef.current,
    connect,
    disconnect
  };
}

export default useRealtimeSensorData;