import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import useMqtt from '../hooks/useMqtt';

const MqttContext = createContext();

/**
 * MQTT Context Provider for AI Features
 * Provides centralized MQTT management for all AI components
 */
export const MqttProvider = ({ children }) => {
  const [subscriptions, setSubscriptions] = useState(new Map());
  const [connectionHistory, setConnectionHistory] = useState([]);
  const [messageStats, setMessageStats] = useState({
    totalReceived: 0,
    totalSent: 0,
    lastActivity: null
  });

  // Initialize MQTT hook with enhanced options
  const mqtt = useMqtt({
    brokerUrl: process.env.NEXT_PUBLIC_MQTT_URL || 'ws://localhost:9001',
    clientId: `ai_client_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`,
    username: process.env.NEXT_PUBLIC_MQTT_USERNAME,
    password: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
    reconnectPeriod: 3000,
    connectTimeout: 5000,
    autoConnect: true
  });

  const reconnectTimeoutRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);

  // Track connection history
  useEffect(() => {
    const newEntry = {
      status: mqtt.connectionStatus,
      timestamp: new Date().toISOString(),
      error: mqtt.error
    };

    setConnectionHistory(prev => [newEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
  }, [mqtt.connectionStatus, mqtt.error]);

  // Enhanced subscription management
  const subscribeToTopic = useCallback(async (topic, handler, options = {}) => {
    try {
      const success = await mqtt.subscribe(topic, handler);
      if (success) {
        setSubscriptions(prev => new Map(prev.set(topic, {
          handler,
          subscribedAt: new Date().toISOString(),
          messageCount: 0,
          lastMessage: null,
          ...options
        })));
        console.log(`✅ Successfully subscribed to: ${topic}`);
        return true;
      }
    } catch (error) {
      console.error(`❌ Failed to subscribe to ${topic}:`, error);
      return false;
    }
  }, [mqtt.subscribe]);

  const unsubscribeFromTopic = useCallback(async (topic) => {
    try {
      const success = await mqtt.unsubscribe(topic);
      if (success) {
        setSubscriptions(prev => {
          const newMap = new Map(prev);
          newMap.delete(topic);
          return newMap;
        });
        console.log(`✅ Successfully unsubscribed from: ${topic}`);
        return true;
      }
    } catch (error) {
      console.error(`❌ Failed to unsubscribe from ${topic}:`, error);
      return false;
    }
  }, [mqtt.unsubscribe]);

  // Enhanced publish with statistics tracking
  const publishMessage = useCallback(async (topic, payload, options = {}) => {
    try {
      const success = await mqtt.publish(topic, payload, options);
      if (success) {
        setMessageStats(prev => ({
          ...prev,
          totalSent: prev.totalSent + 1,
          lastActivity: new Date().toISOString()
        }));
      }
      return success;
    } catch (error) {
      console.error(`❌ Failed to publish to ${topic}:`, error);
      return false;
    }
  }, [mqtt.publish]);

  // Track received messages
  useEffect(() => {
    if (Object.keys(mqtt.messages).length > 0) {
      setMessageStats(prev => ({
        ...prev,
        totalReceived: prev.totalReceived + 1,
        lastActivity: new Date().toISOString()
      }));

      // Update subscription message counts
      Object.keys(mqtt.messages).forEach(topic => {
        setSubscriptions(prev => {
          if (prev.has(topic)) {
            const subscription = prev.get(topic);
            const updated = new Map(prev);
            updated.set(topic, {
              ...subscription,
              messageCount: subscription.messageCount + 1,
              lastMessage: mqtt.messages[topic]
            });
            return updated;
          }
          return prev;
        });
      });
    }
  }, [mqtt.messages]);

  // Auto-reconnection logic with exponential backoff
  useEffect(() => {
    if (mqtt.connectionStatus === 'error' || mqtt.connectionStatus === 'offline') {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      const reconnectDelay = Math.min(30000, 1000 * Math.pow(2, connectionHistory.length));
      console.log(`🔄 Scheduling reconnection in ${reconnectDelay}ms`);

      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('🔄 Attempting to reconnect...');
        mqtt.connect();
      }, reconnectDelay);
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [mqtt.connectionStatus, mqtt.connect, connectionHistory.length]);

  // Heartbeat mechanism
  useEffect(() => {
    if (mqtt.isConnected) {
      heartbeatIntervalRef.current = setInterval(() => {
        publishMessage('client/heartbeat', {
          clientId: mqtt.client?.options?.clientId,
          timestamp: new Date().toISOString(),
          uptime: Date.now() - (connectionHistory.find(h => h.status === 'connected')?.timestamp || Date.now())
        });
      }, 30000); // Send heartbeat every 30 seconds
    } else {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    }

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [mqtt.isConnected, publishMessage, connectionHistory]);

  // AI-specific topic helpers
  const aiTopics = {
    // Chatbot topics
    chatbot: {
      subscribe: (userId, handler) => subscribeToTopic(`ai/chatbot/response/${userId}`, handler),
      subscribeTyping: (userId, handler) => subscribeToTopic(`ai/chatbot/typing/${userId}`, handler),
      publish: (userId, message) => publishMessage(`ai/chatbot/request/${userId}`, message)
    },

    // Disease detection topics
    disease: {
      subscribe: (plantId, handler) => subscribeToTopic(`ai/disease/analysis/${plantId}`, handler),
      subscribeAlerts: (plantId, handler) => subscribeToTopic(`ai/disease/alert/${plantId}`, handler),
      publish: (plantId, analysisRequest) => publishMessage(`ai/disease/request/${plantId}`, analysisRequest)
    },

    // Irrigation prediction topics
    irrigation: {
      subscribe: (plantId, handler) => subscribeToTopic(`ai/irrigation/prediction/${plantId}`, handler),
      subscribeRecommendations: (plantId, handler) => subscribeToTopic(`ai/irrigation/recommendation/${plantId}`, handler),
      subscribeAlerts: (plantId, handler) => subscribeToTopic(`ai/irrigation/alert/${plantId}`, handler),
      publish: (plantId, predictionRequest) => publishMessage(`ai/irrigation/request/${plantId}`, predictionRequest)
    },

    // System topics
    system: {
      subscribeStatus: (handler) => subscribeToTopic('ai/system/status', handler),
      subscribeModelUpdates: (handler) => subscribeToTopic('ai/system/model-update', handler)
    }
  };

  // Connection quality indicator
  const getConnectionQuality = useCallback(() => {
    if (!mqtt.isConnected) return 'poor';
    
    const recentErrors = connectionHistory.slice(0, 5).filter(h => h.status === 'error').length;
    const recentReconnects = connectionHistory.slice(0, 10).filter(h => h.status === 'reconnecting').length;
    
    if (recentErrors === 0 && recentReconnects <= 1) return 'excellent';
    if (recentErrors <= 1 && recentReconnects <= 3) return 'good';
    if (recentErrors <= 2 && recentReconnects <= 5) return 'fair';
    return 'poor';
  }, [mqtt.isConnected, connectionHistory]);

  const contextValue = {
    // Connection state
    isConnected: mqtt.isConnected,
    connectionStatus: mqtt.connectionStatus,
    connectionQuality: getConnectionQuality(),
    error: mqtt.error,
    connectionHistory,
    
    // Basic MQTT operations
    connect: mqtt.connect,
    disconnect: mqtt.disconnect,
    
    // Enhanced subscription management
    subscribe: subscribeToTopic,
    unsubscribe: unsubscribeFromTopic,
    subscriptions,
    
    // Enhanced publishing
    publish: publishMessage,
    
    // Messages
    messages: mqtt.messages,
    getMessage: mqtt.getMessage,
    clearMessages: mqtt.clearMessages,
    
    // AI-specific helpers
    aiTopics,
    
    // Statistics
    messageStats,
    
    // Client reference
    client: mqtt.client
  };

  return (
    <MqttContext.Provider value={contextValue}>
      {children}
    </MqttContext.Provider>
  );
};

export const useMqttContext = () => {
  const context = useContext(MqttContext);
  if (!context) {
    throw new Error('useMqttContext must be used within a MqttProvider');
  }
  return context;
};

export default MqttContext;