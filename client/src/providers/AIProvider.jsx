'use client'

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';

const AIContext = createContext();

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}

export function AIProvider({ children }) {
  const { user } = useAuth();
  const [insights, setInsights] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  // Cache duration: 5 minutes
  const CACHE_DURATION = 5 * 60 * 1000;

  const fetchAIData = async (force = false) => {
    if (!user) return;
    
    // Check if we need to fetch (cache not expired)
    if (!force && lastFetch && Date.now() - lastFetch < CACHE_DURATION) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Mock data - in real app, these would be API calls
      const mockInsights = [
        {
          id: 1,
          type: 'watering',
          message: 'Your Snake Plant will need watering in 2 days',
          confidence: 0.87,
          icon: '💧',
          priority: 'medium'
        },
        {
          id: 2,
          type: 'health',
          message: 'Monstera shows signs of overwatering',
          confidence: 0.92,
          icon: '🌿',
          priority: 'high'
        }
      ];

      const mockPredictions = [
        {
          id: 1,
          plant_name: 'Snake Plant',
          prediction_type: 'watering',
          next_action: '2024-10-19T10:00:00Z',
          confidence: 0.89,
          details: {
            current_moisture: 72,
            predicted_moisture: 35,
            recommended_amount: 250
          }
        }
      ];

      const mockHistory = [
        {
          id: 1,
          type: 'prediction',
          action: 'Watering prediction generated',
          plant_name: 'Snake Plant',
          timestamp: '2024-10-17T10:30:00Z',
          result: 'success',
          confidence: 0.89
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      setInsights(mockInsights);
      setPredictions(mockPredictions);
      setHistory(mockHistory);
      setLastFetch(Date.now());
    } catch (err) {
      console.error('Error fetching AI data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when user changes or on mount
  useEffect(() => {
    fetchAIData();
  }, [user]);

  // Refresh data function
  const refreshAIData = () => {
    fetchAIData(true);
  };

  const value = {
    insights,
    predictions,
    history,
    loading,
    error,
    refreshAIData,
    lastFetch
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
}