import { useState, useEffect, useCallback } from 'react';
import aiApi from '../api/aiApi';
import useMqtt from './useMqtt';

/**
 * Custom hook for disease detection functionality
 * Manages state, API calls, and real-time updates via MQTT
 */
const useDiseaseDetection = (plantId, userId) => {
  // State management
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [supportedDiseases, setSupportedDiseases] = useState({});
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState({
    history: false,
    diseases: false,
    statistics: false,
    analysis: false
  });
  const [error, setError] = useState(null);

  // MQTT integration
  const { isConnected, subscribe, unsubscribe } = useMqtt();

  // Load initial data
  useEffect(() => {
    loadSupportedDiseases();
    if (plantId) {
      loadAnalysisHistory();
      loadStatistics();
    }
  }, [plantId]);

  // Subscribe to MQTT topics for real-time updates
  useEffect(() => {
    if (isConnected && plantId) {
      const topics = [
        `ai/disease/analysis/${plantId}`,
        `ai/disease/alert/${plantId}`
      ];

      topics.forEach(topic => {
        subscribe(topic, handleMqttMessage);
      });

      return () => {
        topics.forEach(topic => {
          unsubscribe(topic);
        });
      };
    }
  }, [isConnected, plantId]);

  // Handle MQTT real-time messages
  const handleMqttMessage = useCallback((topic, message) => {
    try {
      const data = JSON.parse(message);
      
      if (topic.includes('/analysis/')) {
        // Refresh history when new analysis is received
        loadAnalysisHistory();
      } else if (topic.includes('/alert/')) {
        // Handle disease alerts
        console.log('Disease alert received:', data);
        // You could trigger notifications here
      }
    } catch (error) {
      console.error('Error parsing MQTT message:', error);
    }
  }, []);

  // Load supported diseases
  const loadSupportedDiseases = useCallback(async () => {
    setLoading(prev => ({ ...prev, diseases: true }));
    setError(null);
    
    try {
      const response = await aiApi.getSupportedDiseases();
      if (response.data.success) {
        setSupportedDiseases(response.data.data.supportedDiseases);
      }
    } catch (error) {
      console.error('Error loading supported diseases:', error);
      setError('Không thể tải danh sách bệnh được hỗ trợ');
    } finally {
      setLoading(prev => ({ ...prev, diseases: false }));
    }
  }, []);

  // Load analysis history
  const loadAnalysisHistory = useCallback(async (options = {}) => {
    if (!plantId) return;
    
    setLoading(prev => ({ ...prev, history: true }));
    setError(null);
    
    try {
      const { limit = 20, offset = 0, includeImages = true } = options;
      const response = await aiApi.getDiseaseHistory(plantId, { 
        limit, 
        offset, 
        includeImages 
      });
      
      if (response.data.success) {
        const analyses = response.data.data.analyses || [];
        setAnalysisHistory(offset === 0 ? analyses : prev => [...prev, ...analyses]);
        return analyses;
      }
    } catch (error) {
      console.error('Error loading analysis history:', error);
      setError('Không thể tải lịch sử phân tích');
    } finally {
      setLoading(prev => ({ ...prev, history: false }));
    }
  }, [plantId]);

  // Load statistics
  const loadStatistics = useCallback(async (timeRange = '30d') => {
    setLoading(prev => ({ ...prev, statistics: true }));
    
    try {
      const response = await aiApi.getDiseaseStatistics(timeRange);
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Don't set error for statistics as it's not critical
    } finally {
      setLoading(prev => ({ ...prev, statistics: false }));
    }
  }, []);

  // Analyze disease
  const analyzeDisease = useCallback(async (imageFile, options = {}) => {
    setLoading(prev => ({ ...prev, analysis: true }));
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      if (plantId) formData.append('plantId', plantId);
      if (userId) formData.append('userId', userId);
      
      // Add any additional options
      Object.keys(options).forEach(key => {
        if (options[key] !== undefined) {
          formData.append(key, options[key]);
        }
      });
      
      const response = await aiApi.analyzeDisease(formData);
      
      if (response.data.success) {
        const analysisResult = response.data.data;
        
        // Refresh history to include new analysis
        if (plantId) {
          loadAnalysisHistory();
        }
        
        return analysisResult;
      } else {
        throw new Error(response.data.error || 'Phân tích thất bại');
      }
    } catch (error) {
      console.error('Error analyzing disease:', error);
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Không thể phân tích hình ảnh. Vui lòng thử lại sau.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(prev => ({ ...prev, analysis: false }));
    }
  }, [plantId, userId]);

  // Validate image
  const validateImage = useCallback(async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const response = await aiApi.validateImage(formData);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Xác thực ảnh thất bại');
      }
    } catch (error) {
      console.error('Error validating image:', error);
      throw new Error(error.response?.data?.error || 'Không thể xác thực ảnh');
    }
  }, []);

  // Submit feedback
  const submitFeedback = useCallback(async (analysisId, feedbackData) => {
    try {
      const response = await aiApi.submitDiseaseFeedback(analysisId, {
        ...feedbackData,
        userId
      });
      
      if (response.data.success) {
        // Optionally refresh statistics after feedback
        if (plantId) {
          loadStatistics();
        }
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Gửi feedback thất bại');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw new Error(error.response?.data?.error || 'Không thể gửi feedback');
    }
  }, [userId, plantId]);

  // Get treatment recommendations
  const getTreatments = useCallback(async (diseaseType) => {
    try {
      const response = await aiApi.getTreatments(diseaseType);
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Không tìm thấy phương pháp điều trị');
      }
    } catch (error) {
      console.error('Error getting treatments:', error);
      throw new Error(error.response?.data?.error || 'Không thể lấy thông tin điều trị');
    }
  }, []);

  // Get stored image
  const getStoredImage = useCallback(async (filename, thumbnail = false) => {
    try {
      const response = await aiApi.getStoredImage(filename, thumbnail);
      return response.data;
    } catch (error) {
      console.error('Error getting stored image:', error);
      throw new Error('Không thể tải ảnh');
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      loadSupportedDiseases(),
      plantId ? loadAnalysisHistory() : Promise.resolve(),
      plantId ? loadStatistics() : Promise.resolve()
    ]);
  }, [loadSupportedDiseases, loadAnalysisHistory, loadStatistics, plantId]);

  return {
    // State
    analysisHistory,
    supportedDiseases,
    statistics,
    loading,
    error,
    isConnected,

    // Actions
    analyzeDisease,
    validateImage,
    submitFeedback,
    getTreatments,
    getStoredImage,
    loadAnalysisHistory,
    loadSupportedDiseases,
    loadStatistics,
    clearError,
    refreshData,

    // Computed values
    hasHistory: analysisHistory.length > 0,
    isReady: !loading.diseases && Object.keys(supportedDiseases).length > 0
  };
};

export default useDiseaseDetection;