import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import aiApi from '../api/aiApi';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Button } from './ui/Button';

const AIWateringPrediction = ({ plant = null, className = '' }) => {
  const { t } = useTranslation();
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [manualOverride, setManualOverride] = useState(null);
  const [sensorData, setSensorData] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Generate prediction timeline for the next 7 days
  const generatePredictionTimeline = useCallback(async () => {
    if (!plant) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare sensor data for prediction
      const currentSensorData = {
        moisture: plant.current_moisture || 0,
        temperature: plant.current_temperature || 20,
        humidity: plant.current_humidity || 50,
        light: plant.current_light || 500,
        plant_type: plant.species || plant.name,
        last_watered: plant.last_watered,
        location: plant.location
      };
      
      setSensorData(currentSensorData);
      
      // Call AI prediction API
      const response = await aiApi.predictWatering({
        plant_id: plant.id,
        sensor_data: currentSensorData,
        prediction_days: 7
      });
      
      // Process prediction response
      const predictionData = response.data.data || response.data;
      
      // If single prediction, convert to timeline format
      let timelinePredictions = [];
      
      if (predictionData.predictions && Array.isArray(predictionData.predictions)) {
        timelinePredictions = predictionData.predictions;
      } else {
        // Generate 7-day timeline based on single prediction
        const basePrediction = predictionData;
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          
          // Simple logic to distribute watering recommendations
          const daysSinceLastWater = plant.last_watered 
            ? Math.floor((date - new Date(plant.last_watered)) / (1000 * 60 * 60 * 24))
            : 3;
          
          const shouldWater = i === 0 
            ? basePrediction.should_water || (currentSensorData.moisture < 30)
            : (daysSinceLastWater + i) % 3 === 0; // Water every 3 days as fallback
          
          timelinePredictions.push({
            date: date.toISOString().split('T')[0],
            should_water: shouldWater,
            confidence: basePrediction.confidence || 0.75 - (i * 0.05),
            recommended_amount: basePrediction.recommended_amount || 250,
            reasoning: shouldWater 
              ? `${i === 0 ? 'Current' : 'Predicted'} moisture level requires watering`
              : 'Soil moisture adequate',
            moisture_prediction: Math.max(10, currentSensorData.moisture - (i * 5) + (shouldWater ? 40 : 0)),
            temperature_forecast: currentSensorData.temperature + (Math.random() * 4 - 2)
          });
        }
      }
      
      setPredictions(timelinePredictions);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error getting watering predictions:', error);
      setError(t('wateringPrediction.error', 'Unable to generate watering predictions. Please try again.'));
      
      // Fallback predictions based on basic logic
      const fallbackPredictions = generateFallbackPredictions();
      setPredictions(fallbackPredictions);
    } finally {
      setIsLoading(false);
    }
  }, [plant, t]);

  // Generate fallback predictions when API fails
  const generateFallbackPredictions = useCallback(() => {
    if (!plant) return [];
    
    const predictions = [];
    const today = new Date();
    const currentMoisture = plant.current_moisture || 50;
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Simple rule-based prediction
      const predictedMoisture = Math.max(10, currentMoisture - (i * 8));
      const shouldWater = predictedMoisture < 30;
      
      predictions.push({
        date: date.toISOString().split('T')[0],
        should_water: shouldWater,
        confidence: 0.6, // Lower confidence for fallback
        recommended_amount: 200,
        reasoning: shouldWater ? 'Basic rule: moisture below 30%' : 'Basic rule: moisture adequate',
        moisture_prediction: predictedMoisture,
        temperature_forecast: (plant.current_temperature || 20) + (Math.random() * 4 - 2),
        isFallback: true
      });
    }
    
    return predictions;
  }, [plant]);

  // Load predictions on component mount and plant change
  useEffect(() => {
    if (plant) {
      generatePredictionTimeline();
    }
  }, [plant, generatePredictionTimeline]);

  // Set up auto-refresh every 30 minutes
  useEffect(() => {
    if (plant) {
      const interval = setInterval(() => {
        generatePredictionTimeline();
      }, 30 * 60 * 1000); // 30 minutes
      
      setRefreshInterval(interval);
      
      return () => {
        if (interval) {
          clearInterval(interval);
        }
      };
    }
  }, [plant, generatePredictionTimeline]);

  // Manual override functions
  const handleManualOverride = (date, shouldWater) => {
    setManualOverride({ date, shouldWater, timestamp: new Date() });
    
    // Update predictions with override
    setPredictions(prev => prev.map(pred => 
      pred.date === date 
        ? { ...pred, should_water: shouldWater, isManualOverride: true, confidence: 1.0 }
        : pred
    ));
  };

  const clearManualOverride = (date) => {
    setManualOverride(null);
    
    // Restore original prediction
    setPredictions(prev => prev.map(pred => 
      pred.date === date 
        ? { ...pred, isManualOverride: false }
        : pred
    ));
    
    // Refresh predictions
    generatePredictionTimeline();
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return t('wateringPrediction.today', 'Today');
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return t('wateringPrediction.tomorrow', 'Tomorrow');
    } else {
      return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Get watering recommendation color
  const getWateringColor = (shouldWater, isOverride = false) => {
    if (isOverride) return 'border-purple-300 bg-purple-50';
    return shouldWater ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-gray-50';
  };

  if (!plant) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">
            {t('wateringPrediction.noPlant', 'Select a plant to view watering predictions')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
              </svg>
              <span>{t('wateringPrediction.title', 'AI Watering Predictions')}</span>
            </CardTitle>
            <CardDescription>
              {t('wateringPrediction.subtitle', 'Smart watering recommendations for {{plantName}}', { plantName: plant.name })}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generatePredictionTimeline}
            disabled={isLoading}
          >
            {isLoading ? (
              <svg className="w-4 h-4 animate-spin mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {t('wateringPrediction.refresh', 'Refresh')}
          </Button>
        </div>
        
        {error && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}
        
        {lastUpdated && (
          <div className="text-xs text-gray-500">
            {t('wateringPrediction.lastUpdated', 'Last updated: {{time}}', { 
              time: lastUpdated.toLocaleTimeString() 
            })}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {/* Current Sensor Data Visualization */}
        {sensorData && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm text-gray-700 mb-3">
              {t('wateringPrediction.currentConditions', 'Current Conditions')}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{sensorData.moisture}%</div>
                <div className="text-xs text-gray-500">{t('wateringPrediction.moisture', 'Moisture')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{sensorData.temperature}°C</div>
                <div className="text-xs text-gray-500">{t('wateringPrediction.temperature', 'Temperature')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{sensorData.humidity}%</div>
                <div className="text-xs text-gray-500">{t('wateringPrediction.humidity', 'Humidity')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{sensorData.light}</div>
                <div className="text-xs text-gray-500">{t('wateringPrediction.light', 'Light')}</div>
              </div>
            </div>
          </div>
        )}
        
        {/* Prediction Timeline */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">
            {t('wateringPrediction.timeline', '7-Day Watering Timeline')}
          </h4>
          
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-20 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {predictions.map((prediction, index) => (
                <div 
                  key={prediction.date}
                  className={`border rounded-lg p-4 transition-all ${getWateringColor(prediction.should_water, prediction.isManualOverride)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="font-medium text-sm">
                          {formatDate(prediction.date)}
                        </div>
                        
                        {/* Watering Recommendation */}
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          prediction.should_water 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {prediction.should_water 
                            ? t('wateringPrediction.water', 'Water') 
                            : t('wateringPrediction.skip', 'Skip')
                          }
                        </div>
                        
                        {/* Confidence Indicator */}
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(prediction.confidence)}`}>
                          {Math.round(prediction.confidence * 100)}% {t('wateringPrediction.confidence', 'confidence')}
                        </div>
                        
                        {/* Manual Override Indicator */}
                        {prediction.isManualOverride && (
                          <div className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {t('wateringPrediction.manual', 'Manual')}
                          </div>
                        )}
                        
                        {/* Fallback Indicator */}
                        {prediction.isFallback && (
                          <div className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {t('wateringPrediction.basic', 'Basic')}
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-600">
                        {prediction.reasoning}
                      </div>
                      
                      {prediction.should_water && (
                        <div className="mt-1 text-xs text-blue-600">
                          {t('wateringPrediction.amount', 'Recommended: {{amount}}ml', { 
                            amount: prediction.recommended_amount 
                          })}
                        </div>
                      )}
                      
                      {/* Predicted Conditions */}
                      <div className="mt-2 flex space-x-4 text-xs text-gray-500">
                        <span>
                          {t('wateringPrediction.predictedMoisture', 'Moisture: {{moisture}}%', { 
                            moisture: Math.round(prediction.moisture_prediction || 0) 
                          })}
                        </span>
                        <span>
                          {t('wateringPrediction.predictedTemp', 'Temp: {{temp}}°C', { 
                            temp: Math.round(prediction.temperature_forecast || 20) 
                          })}
                        </span>
                      </div>
                    </div>
                    
                    {/* Manual Override Controls */}
                    <div className="flex space-x-2">
                      {!prediction.isManualOverride ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleManualOverride(prediction.date, !prediction.should_water)}
                            className="text-xs"
                          >
                            {prediction.should_water 
                              ? t('wateringPrediction.skipOverride', 'Skip') 
                              : t('wateringPrediction.waterOverride', 'Water')
                            }
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearManualOverride(prediction.date)}
                          className="text-xs text-purple-600"
                        >
                          {t('wateringPrediction.clearOverride', 'Clear')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <h5 className="font-medium text-xs text-gray-700 mb-2">
            {t('wateringPrediction.legend', 'Legend')}
          </h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
              <span>{t('wateringPrediction.legendWater', 'Watering recommended')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded"></div>
              <span>{t('wateringPrediction.legendSkip', 'Skip watering')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded"></div>
              <span>{t('wateringPrediction.legendManual', 'Manual override')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-100 rounded"></div>
              <span>{t('wateringPrediction.legendHighConf', 'High confidence (80%+)')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIWateringPrediction;