import { useState, useEffect, useCallback } from 'react';
import useMqtt from './useMqtt';

/**
 * Custom hook for managing sensor data and plant context
 */
const useSensorData = (plantId) => {
  const [sensorData, setSensorData] = useState(null);
  const [plantInfo, setPlantInfo] = useState(null);
  const [wateringHistory, setWateringHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const { subscribe, unsubscribe, isConnected } = useMqtt({
    autoConnect: true
  });

  // Handle sensor data updates via MQTT
  const handleSensorDataUpdate = useCallback((messageData) => {
    try {
      const { message } = messageData;
      
      if (message.plantId === plantId || message.deviceId === plantId) {
        console.log('🌡️ Sensor data updated for plant:', plantId, message);
        
        setSensorData(prevData => ({
          ...prevData,
          ...message,
          timestamp: message.timestamp || new Date().toISOString()
        }));
        
        setLastUpdate(new Date().toISOString());
        setError(null);
      }
    } catch (error) {
      console.error('❌ Error processing sensor data update:', error);
      setError(error.message);
    }
  }, [plantId]);

  // Handle watering history updates
  const handleWateringUpdate = useCallback((messageData) => {
    try {
      const { message } = messageData;
      
      if (message.plantId === plantId) {
        console.log('💧 Watering history updated for plant:', plantId, message);
        
        setWateringHistory(prev => {
          const newHistory = [message, ...prev];
          // Keep only last 10 watering records
          return newHistory.slice(0, 10);
        });
        
        setLastUpdate(new Date().toISOString());
      }
    } catch (error) {
      console.error('❌ Error processing watering update:', error);
      setError(error.message);
    }
  }, [plantId]);

  // Subscribe to MQTT topics when plant ID changes
  useEffect(() => {
    if (!plantId || !isConnected) return;

    const sensorTopic = `plant-system/${plantId}/sensor-data`;
    const wateringTopic = `plant-system/${plantId}/watering`;
    const statusTopic = `plant-system/${plantId}/status`;

    console.log('📡 Subscribing to sensor data topics for plant:', plantId);

    // Subscribe to sensor data updates
    subscribe(sensorTopic, handleSensorDataUpdate)
      .catch(error => {
        console.error('❌ Failed to subscribe to sensor data:', error);
        setError(error.message);
      });

    // Subscribe to watering updates
    subscribe(wateringTopic, handleWateringUpdate)
      .catch(error => {
        console.error('❌ Failed to subscribe to watering updates:', error);
      });

    // Subscribe to plant status updates
    subscribe(statusTopic, (messageData) => {
      try {
        const { message } = messageData;
        if (message.plantId === plantId) {
          setPlantInfo(prev => ({
            ...prev,
            status: message.status,
            lastSeen: message.timestamp
          }));
        }
      } catch (error) {
        console.error('❌ Error processing status update:', error);
      }
    }).catch(error => {
      console.error('❌ Failed to subscribe to status updates:', error);
    });

    // Cleanup subscriptions when plant ID changes or component unmounts
    return () => {
      unsubscribe(sensorTopic);
      unsubscribe(wateringTopic);
      unsubscribe(statusTopic);
    };
  }, [plantId, isConnected, subscribe, unsubscribe, handleSensorDataUpdate, handleWateringUpdate]);

  // Load initial plant data
  const loadPlantData = useCallback(async () => {
    if (!plantId) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('📊 Loading initial plant data for:', plantId);
      
      // In a real implementation, you would fetch from your API
      // For now, we'll simulate plant info
      const mockPlantInfo = {
        id: plantId,
        name: `Cây số ${plantId}`,
        type: 'Cây cảnh',
        location: 'Phòng khách',
        plantedDate: '2024-01-15',
        status: 'healthy',
        lastWatered: '2024-10-15T10:30:00Z',
        wateringSchedule: 'Mỗi 2 ngày',
        notes: 'Cây phát triển tốt'
      };

      setPlantInfo(mockPlantInfo);

      // Mock initial sensor data
      const mockSensorData = {
        plantId: plantId,
        soilMoisture: 65,
        temperature: 24.5,
        humidity: 70,
        lightLevel: 450,
        timestamp: new Date().toISOString()
      };

      setSensorData(mockSensorData);

      // Mock watering history
      const mockWateringHistory = [
        {
          id: 1,
          plantId: plantId,
          amount: 250,
          timestamp: '2024-10-15T10:30:00Z',
          method: 'manual',
          notes: 'Tưới nước thường xuyên'
        },
        {
          id: 2,
          plantId: plantId,
          amount: 200,
          timestamp: '2024-10-13T08:15:00Z',
          method: 'automatic',
          notes: 'Tưới tự động theo lịch'
        }
      ];

      setWateringHistory(mockWateringHistory);
      setLastUpdate(new Date().toISOString());

      console.log('✅ Plant data loaded successfully');
    } catch (error) {
      console.error('❌ Error loading plant data:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [plantId]);

  // Load plant data when plant ID changes
  useEffect(() => {
    loadPlantData();
  }, [loadPlantData]);

  // Get formatted sensor data for display
  const getFormattedSensorData = useCallback(() => {
    if (!sensorData) return null;

    return {
      soilMoisture: {
        value: sensorData.soilMoisture,
        unit: '%',
        status: sensorData.soilMoisture > 60 ? 'good' : sensorData.soilMoisture > 30 ? 'warning' : 'critical',
        label: 'Độ ẩm đất'
      },
      temperature: {
        value: sensorData.temperature,
        unit: '°C',
        status: sensorData.temperature >= 20 && sensorData.temperature <= 30 ? 'good' : 'warning',
        label: 'Nhiệt độ'
      },
      humidity: {
        value: sensorData.humidity,
        unit: '%',
        status: sensorData.humidity >= 60 && sensorData.humidity <= 80 ? 'good' : 'warning',
        label: 'Độ ẩm không khí'
      },
      lightLevel: {
        value: sensorData.lightLevel,
        unit: 'lux',
        status: sensorData.lightLevel > 300 ? 'good' : sensorData.lightLevel > 100 ? 'warning' : 'critical',
        label: 'Cường độ ánh sáng'
      }
    };
  }, [sensorData]);

  // Get plant health summary
  const getPlantHealthSummary = useCallback(() => {
    const formattedData = getFormattedSensorData();
    if (!formattedData) return null;

    const criticalCount = Object.values(formattedData).filter(item => item.status === 'critical').length;
    const warningCount = Object.values(formattedData).filter(item => item.status === 'warning').length;

    let overallStatus = 'good';
    let message = 'Cây đang phát triển tốt';

    if (criticalCount > 0) {
      overallStatus = 'critical';
      message = 'Cây cần được chăm sóc ngay lập tức';
    } else if (warningCount > 1) {
      overallStatus = 'warning';
      message = 'Cây cần được chú ý thêm';
    }

    return {
      status: overallStatus,
      message,
      criticalCount,
      warningCount,
      lastUpdate: lastUpdate
    };
  }, [getFormattedSensorData, lastUpdate]);

  return {
    // Data state
    sensorData,
    plantInfo,
    wateringHistory,
    isLoading,
    error,
    lastUpdate,

    // Data methods
    loadPlantData,
    getFormattedSensorData,
    getPlantHealthSummary,

    // Status
    hasData: !!sensorData,
    isConnected
  };
};

export default useSensorData;