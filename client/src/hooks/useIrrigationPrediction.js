import { useState, useEffect, useCallback, useRef } from 'react';
import aiApi from '../api/aiApi';
import useMqtt from './useMqtt';
import { useToast } from './useToast';

/**
 * Custom hook for irrigation prediction functionality
 * Handles predictions, scheduling, real-time updates, and MQTT integration
 */
const useIrrigationPrediction = (plantId, options = {}) => {
  const [prediction, setPrediction] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [plantTypes, setPlantTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [performance, setPerformance] = useState(null);

  const { toast } = useToast();
  const predictionHistoryRef = useRef([]);
  const alertTimeoutRef = useRef(null);

  const {
    autoPredict = true,
    updateInterval = 300000, // 5 minutes
    enableAlerts = true,
    confidenceThreshold = 0.7
  } = options;

  // MQTT integration for real-time updates
  const mqtt = useMqtt({
    autoConnect: true
  });

  // Subscribe to MQTT topics for real-time irrigation updates
  useEffect(() => {
    if (!mqtt.isConnected || !plantId) return;

    const topics = [
      `ai/irrigation/prediction/${plantId}`,
      `ai/irrigation/recommendation/${plantId}`,
      `ai/irrigation/alert/${plantId}`
    ];

    const subscribeToTopics = async () => {
      try {
        for (const topic of topics) {
          await mqtt.subscribe(topic, (messageData) => {
            handleMqttMessage(topic, messageData);
          });
        }
        console.log('✅ Subscribed to irrigation MQTT topics');
      } catch (error) {
        console.error('❌ Failed to subscribe to MQTT topics:', error);
      }
    };

    subscribeToTopics();

    return () => {
      topics.forEach(topic => {
        mqtt.unsubscribe(topic).catch(console.error);
      });
    };
  }, [mqtt.isConnected, plantId]);

  // Handle MQTT messages
  const handleMqttMessage = useCallback((topic, messageData) => {
    const { message } = messageData;

    if (topic.includes('/prediction/')) {
      setPrediction(prevPrediction => ({
        ...prevPrediction,
        ...message,
        receivedAt: new Date().toISOString()
      }));
      setLastUpdate(new Date().toISOString());

      // Add to prediction history
      predictionHistoryRef.current = [
        ...predictionHistoryRef.current.slice(-19), // Keep last 20 predictions
        {
          ...message,
          timestamp: new Date().toISOString()
        }
      ];
    }

    if (topic.includes('/recommendation/')) {
      setRecommendations(prev => [message, ...prev.slice(0, 9)]); // Keep last 10 recommendations
    }

    if (topic.includes('/alert/')) {
      const newAlert = {
        id: Date.now(),
        ...message,
        timestamp: new Date().toISOString()
      };

      setAlerts(prev => [newAlert, ...prev.slice(0, 4)]); // Keep last 5 alerts

      // Show toast notification for urgent alerts
      if (enableAlerts && message.type === 'urgent_watering') {
        toast({
          title: "🚨 Urgent Watering Alert",
          description: message.message,
          variant: "destructive"
        });
      }

      // Auto-dismiss alerts after 30 seconds
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
      alertTimeoutRef.current = setTimeout(() => {
        setAlerts(prev => prev.filter(alert => alert.id !== newAlert.id));
      }, 30000);
    }
  }, [enableAlerts, toast]);

  // Predict irrigation needs
  const predictIrrigation = useCallback(async (sensorData) => {
    if (!plantId) {
      setError('Plant ID is required for prediction');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await aiApi.predictIrrigation(plantId, sensorData);
      
      if (response.data.success) {
        const predictionData = {
          ...response.data.prediction,
          requestedAt: new Date().toISOString(),
          sensorData
        };

        setPrediction(predictionData);
        setLastUpdate(new Date().toISOString());

        // Add to prediction history
        predictionHistoryRef.current = [
          ...predictionHistoryRef.current.slice(-19),
          predictionData
        ];

        return predictionData;
      } else {
        throw new Error(response.data.message || 'Prediction failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to predict irrigation needs';
      setError(errorMessage);
      console.error('❌ Irrigation prediction error:', error);
      
      toast({
        title: "Prediction Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [plantId, toast]);

  // Create irrigation schedule
  const createSchedule = useCallback(async (scheduleData) => {
    if (!plantId) {
      setError('Plant ID is required for scheduling');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await aiApi.createIrrigationSchedule(plantId, scheduleData);
      
      if (response.data.success) {
        const scheduleResult = {
          ...response.data.schedule,
          createdAt: new Date().toISOString()
        };

        setSchedule(scheduleResult);
        
        toast({
          title: "✅ Schedule Created",
          description: "Intelligent irrigation schedule has been created successfully",
          variant: "default"
        });

        return scheduleResult;
      } else {
        throw new Error(response.data.message || 'Schedule creation failed');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create irrigation schedule';
      setError(errorMessage);
      console.error('❌ Schedule creation error:', error);
      
      toast({
        title: "Schedule Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [plantId, toast]);

  // Get recommendations
  const getRecommendations = useCallback(async (params = {}) => {
    if (!plantId) return;

    try {
      const response = await aiApi.getIrrigationRecommendations(plantId, params);
      
      if (response.data.success) {
        setRecommendations(response.data.recommendations || []);
        return response.data.recommendations;
      }
    } catch (error) {
      console.error('❌ Failed to get recommendations:', error);
    }
  }, [plantId]);

  // Submit feedback
  const submitFeedback = useCallback(async (feedback) => {
    try {
      const response = await aiApi.submitIrrigationFeedback(feedback);
      
      if (response.data.success) {
        toast({
          title: "✅ Feedback Submitted",
          description: "Thank you for your feedback! It helps improve our predictions.",
          variant: "default"
        });
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to submit feedback:', error);
      toast({
        title: "Feedback Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      });
    }
    return false;
  }, [toast]);

  // Load plant types
  const loadPlantTypes = useCallback(async () => {
    try {
      const response = await aiApi.getPlantTypes();
      if (response.data.success) {
        setPlantTypes(response.data.plantTypes || []);
      }
    } catch (error) {
      console.error('❌ Failed to load plant types:', error);
    }
  }, []);

  // Load performance metrics
  const loadPerformance = useCallback(async () => {
    try {
      const response = await aiApi.getIrrigationPerformance();
      if (response.data.success) {
        setPerformance(response.data.performance);
      }
    } catch (error) {
      console.error('❌ Failed to load performance metrics:', error);
    }
  }, []);

  // Clear alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Get prediction history
  const getPredictionHistory = useCallback(() => {
    return predictionHistoryRef.current;
  }, []);

  // Initialize data on mount
  useEffect(() => {
    if (plantId) {
      loadPlantTypes();
      getRecommendations();
      loadPerformance();
    }
  }, [plantId, loadPlantTypes, getRecommendations, loadPerformance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    prediction,
    schedule,
    recommendations,
    plantTypes,
    loading,
    error,
    lastUpdate,
    alerts,
    performance,

    // Actions
    predictIrrigation,
    createSchedule,
    getRecommendations,
    submitFeedback,
    loadPlantTypes,
    loadPerformance,
    clearAlerts,
    clearError,
    getPredictionHistory,

    // MQTT connection status
    mqttConnected: mqtt.isConnected,
    mqttStatus: mqtt.connectionStatus
  };
};

export default useIrrigationPrediction;