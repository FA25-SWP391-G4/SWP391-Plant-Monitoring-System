import { useState, useEffect, useRef, useCallback } from 'react';
import mqtt from 'mqtt';

/**
 * Enhanced MQTT hook for AI features integration
 * Provides robust connection management, automatic reconnection, and AI-specific helpers
 */
const useMqtt = (options = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [messages, setMessages] = useState({});
  const [error, setError] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastConnectedAt, setLastConnectedAt] = useState(null);
  
  const clientRef = useRef(null);
  const subscriptionsRef = useRef(new Set());
  const messageHandlersRef = useRef(new Map());
  const reconnectTimeoutRef = useRef(null);
  const connectionQualityRef = useRef('unknown');
  
  const {
    brokerUrl = process.env.NEXT_PUBLIC_MQTT_URL || 'ws://localhost:9001',
    clientId = `client_${Math.random().toString(16).slice(3)}`,
    username = process.env.NEXT_PUBLIC_MQTT_USERNAME,
    password = process.env.NEXT_PUBLIC_MQTT_PASSWORD,
    reconnectPeriod = 5000,
    connectTimeout = 4000,
    autoConnect = true
  } = options;

  // Connect to MQTT broker
  const connect = useCallback(() => {
    if (clientRef.current?.connected) {
      console.log('MQTT client already connected');
      return;
    }

    try {
      console.log(`🔌 Connecting to MQTT broker: ${brokerUrl}`);
      setConnectionStatus('connecting');
      setError(null);

      const client = mqtt.connect(brokerUrl, {
        clientId,
        username,
        password,
        clean: true,
        connectTimeout,
        reconnectPeriod,
        will: {
          topic: `client/status/${clientId}`,
          payload: JSON.stringify({
            status: 'offline',
            timestamp: new Date().toISOString()
          }),
          qos: 1,
          retain: true
        }
      });

      // Connection successful
      client.on('connect', () => {
        console.log('✅ MQTT client connected successfully');
        setIsConnected(true);
        setConnectionStatus('connected');
        setError(null);
        setConnectionAttempts(0);
        setLastConnectedAt(new Date().toISOString());
        connectionQualityRef.current = 'good';

        // Clear any pending reconnection timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }

        // Publish online status with enhanced metadata
        client.publish(`client/status/${clientId}`, JSON.stringify({
          status: 'online',
          timestamp: new Date().toISOString(),
          clientInfo: {
            userAgent: navigator.userAgent,
            url: window.location.href,
            features: ['ai-chatbot', 'disease-detection', 'irrigation-prediction']
          }
        }), { qos: 1, retain: true });

        // Re-subscribe to previous subscriptions with error handling
        subscriptionsRef.current.forEach(topic => {
          client.subscribe(topic, { qos: 1 }, (error) => {
            if (error) {
              console.error(`❌ Failed to re-subscribe to ${topic}:`, error);
            } else {
              console.log(`✅ Re-subscribed to: ${topic}`);
            }
          });
        });
      });

      // Handle incoming messages
      client.on('message', (topic, payload) => {
        try {
          const message = JSON.parse(payload.toString());
          const messageData = {
            topic,
            message,
            timestamp: new Date().toISOString()
          };

          // Update messages state
          setMessages(prev => ({
            ...prev,
            [topic]: messageData
          }));

          // Call specific message handlers
          const handler = messageHandlersRef.current.get(topic);
          if (handler) {
            handler(messageData);
          }

          console.log(`📨 MQTT message received on ${topic}:`, message);
        } catch (error) {
          console.error('❌ Error parsing MQTT message:', error);
          console.error('Topic:', topic);
          console.error('Payload:', payload.toString());
        }
      });

      // Handle connection errors
      client.on('error', (err) => {
        console.error('❌ MQTT connection error:', err);
        setError(err.message);
        setConnectionStatus('error');
        setIsConnected(false);
        setConnectionAttempts(prev => prev + 1);
        connectionQualityRef.current = 'poor';
      });

      // Handle disconnection
      client.on('close', () => {
        console.log('🔌 MQTT connection closed');
        setIsConnected(false);
        setConnectionStatus('disconnected');
        connectionQualityRef.current = 'poor';
      });

      // Handle reconnection attempts
      client.on('reconnect', () => {
        console.log('🔄 MQTT reconnecting...');
        setConnectionStatus('reconnecting');
        setConnectionAttempts(prev => prev + 1);
        connectionQualityRef.current = 'fair';
      });

      // Handle offline status
      client.on('offline', () => {
        console.log('📴 MQTT client offline');
        setIsConnected(false);
        setConnectionStatus('offline');
        connectionQualityRef.current = 'poor';
      });

      // Handle packet receive (for connection quality monitoring)
      client.on('packetreceive', () => {
        if (connectionQualityRef.current === 'good') {
          connectionQualityRef.current = 'excellent';
        }
      });

      clientRef.current = client;

    } catch (error) {
      console.error('❌ MQTT connection failed:', error);
      setError(error.message);
      setConnectionStatus('error');
    }
  }, [brokerUrl, clientId, username, password, connectTimeout, reconnectPeriod]);

  // Disconnect from MQTT broker
  const disconnect = useCallback(() => {
    if (clientRef.current) {
      console.log('🔌 Disconnecting MQTT client...');
      
      // Publish offline status
      clientRef.current.publish(`client/status/${clientId}`, JSON.stringify({
        status: 'offline',
        timestamp: new Date().toISOString()
      }), { qos: 1, retain: true });

      clientRef.current.end();
      clientRef.current = null;
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  }, [clientId]);

  // Subscribe to a topic
  const subscribe = useCallback((topic, handler = null) => {
    if (!clientRef.current?.connected) {
      console.warn('MQTT client not connected, cannot subscribe to:', topic);
      return false;
    }

    return new Promise((resolve, reject) => {
      clientRef.current.subscribe(topic, { qos: 1 }, (error) => {
        if (error) {
          console.error(`❌ Failed to subscribe to ${topic}:`, error);
          reject(error);
        } else {
          console.log(`📡 Subscribed to: ${topic}`);
          subscriptionsRef.current.add(topic);
          
          if (handler) {
            messageHandlersRef.current.set(topic, handler);
          }
          
          resolve(true);
        }
      });
    });
  }, []);

  // Unsubscribe from a topic
  const unsubscribe = useCallback((topic) => {
    if (!clientRef.current?.connected) {
      console.warn('MQTT client not connected, cannot unsubscribe from:', topic);
      return false;
    }

    return new Promise((resolve, reject) => {
      clientRef.current.unsubscribe(topic, (error) => {
        if (error) {
          console.error(`❌ Failed to unsubscribe from ${topic}:`, error);
          reject(error);
        } else {
          console.log(`📡 Unsubscribed from: ${topic}`);
          subscriptionsRef.current.delete(topic);
          messageHandlersRef.current.delete(topic);
          resolve(true);
        }
      });
    });
  }, []);

  // Publish a message
  const publish = useCallback((topic, payload, options = {}) => {
    if (!clientRef.current?.connected) {
      console.warn('MQTT client not connected, cannot publish to:', topic);
      return Promise.reject(new Error('MQTT client not connected'));
    }

    const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const publishOptions = {
      qos: 1,
      retain: false,
      ...options
    };

    return new Promise((resolve, reject) => {
      clientRef.current.publish(topic, message, publishOptions, (error) => {
        if (error) {
          console.error(`❌ Failed to publish to ${topic}:`, error);
          reject(error);
        } else {
          console.log(`📤 Published to ${topic}`);
          resolve(true);
        }
      });
    });
  }, []);

  // Get message for specific topic
  const getMessage = useCallback((topic) => {
    return messages[topic];
  }, [messages]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages({});
  }, []);

  // AI-specific helper methods
  const aiHelpers = {
    // Chatbot helpers
    chatbot: {
      subscribeToResponses: useCallback((userId, handler) => {
        return subscribe(`ai/chatbot/response/${userId}`, handler);
      }, [subscribe]),
      
      subscribeToTyping: useCallback((userId, handler) => {
        return subscribe(`ai/chatbot/typing/${userId}`, handler);
      }, [subscribe]),
      
      sendMessage: useCallback((userId, message, context = {}) => {
        return publish(`ai/chatbot/request/${userId}`, {
          message,
          context,
          timestamp: new Date().toISOString(),
          clientId
        });
      }, [publish, clientId])
    },

    // Disease detection helpers
    disease: {
      subscribeToAnalysis: useCallback((plantId, handler) => {
        return subscribe(`ai/disease/analysis/${plantId}`, handler);
      }, [subscribe]),
      
      subscribeToAlerts: useCallback((plantId, handler) => {
        return subscribe(`ai/disease/alert/${plantId}`, handler);
      }, [subscribe]),
      
      requestAnalysis: useCallback((plantId, imageData, metadata = {}) => {
        return publish(`ai/disease/request/${plantId}`, {
          imageData,
          metadata,
          timestamp: new Date().toISOString(),
          clientId
        });
      }, [publish, clientId])
    },

    // Irrigation prediction helpers
    irrigation: {
      subscribeToPredictions: useCallback((plantId, handler) => {
        return subscribe(`ai/irrigation/prediction/${plantId}`, handler);
      }, [subscribe]),
      
      subscribeToRecommendations: useCallback((plantId, handler) => {
        return subscribe(`ai/irrigation/recommendation/${plantId}`, handler);
      }, [subscribe]),
      
      subscribeToAlerts: useCallback((plantId, handler) => {
        return subscribe(`ai/irrigation/alert/${plantId}`, handler);
      }, [subscribe]),
      
      requestPrediction: useCallback((plantId, sensorData, options = {}) => {
        return publish(`ai/irrigation/request/${plantId}`, {
          sensorData,
          options,
          timestamp: new Date().toISOString(),
          clientId
        });
      }, [publish, clientId])
    },

    // System helpers
    system: {
      subscribeToStatus: useCallback((handler) => {
        return subscribe('ai/system/status', handler);
      }, [subscribe]),
      
      subscribeToModelUpdates: useCallback((handler) => {
        return subscribe('ai/system/model-update', handler);
      }, [subscribe]),
      
      publishHeartbeat: useCallback(() => {
        return publish('client/heartbeat', {
          clientId,
          timestamp: new Date().toISOString(),
          status: 'alive',
          features: ['ai-integration']
        });
      }, [publish, clientId])
    }
  };

  // Connection quality assessment
  const getConnectionQuality = useCallback(() => {
    if (!isConnected) return 'disconnected';
    if (connectionAttempts === 0) return 'excellent';
    if (connectionAttempts <= 2) return 'good';
    if (connectionAttempts <= 5) return 'fair';
    return 'poor';
  }, [isConnected, connectionAttempts]);

  // Enhanced reconnection logic with exponential backoff
  useEffect(() => {
    if (connectionStatus === 'error' && autoConnect) {
      const backoffDelay = Math.min(30000, 1000 * Math.pow(2, connectionAttempts));
      console.log(`🔄 Scheduling reconnection in ${backoffDelay}ms (attempt ${connectionAttempts + 1})`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Attempting automatic reconnection...');
        connect();
      }, backoffDelay);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connectionStatus, connectionAttempts, autoConnect, connect]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    // Connection state
    isConnected,
    connectionStatus,
    connectionQuality: getConnectionQuality(),
    error,
    connectionAttempts,
    lastConnectedAt,
    
    // Connection methods
    connect,
    disconnect,
    
    // Subscription methods
    subscribe,
    unsubscribe,
    
    // Publishing methods
    publish,
    
    // Message methods
    messages,
    getMessage,
    clearMessages,
    
    // AI-specific helpers
    ai: aiHelpers,
    
    // Client reference (for advanced usage)
    client: clientRef.current
  };
};

export default useMqtt;