'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Droplets, ArrowLeft, AlertCircle, CheckCircle, Loader, Thermometer, Gauge, Humidity } from 'lucide-react';
import { useAuth } from '../../../providers/AuthProvider';
import aiApi from '../../../api/aiApi';

const SmartWateringPage = () => {
  const [plantId, setPlantId] = useState('');
  const [sensorData, setSensorData] = useState({
    moisture: '',
    temperature: '',
    humidity: '',
    lightLevel: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [plants, setPlants] = useState([]);
  const { user } = useAuth();
  const router = useRouter();

  const hasAIAccess = () => {
    if (!user) return false;
    return user.isPremium || user.role === 'admin' || user.role === 'Admin' || user.role === 'Premium';
  };

  useEffect(() => {
    // Load user's plants for selection
    const loadPlants = async () => {
      try {
        // Mock plants data - replace with actual API call
        setPlants([
          { id: 1, name: 'Rose Garden', type: 'Rose' },
          { id: 2, name: 'Tomato Plant', type: 'Tomato' },
          { id: 3, name: 'Basil Herb', type: 'Basil' }
        ]);
      } catch (error) {
        console.error('Error loading plants:', error);
      }
    };

    if (hasAIAccess()) {
      loadPlants();
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setSensorData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const validateInputs = () => {
    if (!plantId) {
      setError('Please select a plant');
      return false;
    }

    const { moisture, temperature, humidity } = sensorData;
    
    if (!moisture || !temperature || !humidity) {
      setError('Please fill in all required sensor data');
      return false;
    }

    const moistureNum = parseFloat(moisture);
    const tempNum = parseFloat(temperature);
    const humidityNum = parseFloat(humidity);

    if (moistureNum < 0 || moistureNum > 100) {
      setError('Moisture level must be between 0-100%');
      return false;
    }

    if (tempNum < -40 || tempNum > 60) {
      setError('Temperature must be between -40°C and 60°C');
      return false;
    }

    if (humidityNum < 0 || humidityNum > 100) {
      setError('Humidity must be between 0-100%');
      return false;
    }

    return true;
  };

  const handlePredict = async () => {
    if (!validateInputs()) return;

    if (!hasAIAccess()) {
      setError('Premium subscription or admin access required for AI features');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const requestData = {
        plant_id: plantId,
        current_moisture: parseFloat(sensorData.moisture),
        temperature: parseFloat(sensorData.temperature),
        humidity: parseFloat(sensorData.humidity),
        light_level: sensorData.lightLevel ? parseFloat(sensorData.lightLevel) : undefined
      };

      const response = await aiApi.getIrrigationRecommendations(requestData);
      
      if (response.success) {
        setPrediction(response.data);
      } else {
        setError(response.error || 'Prediction failed. Please try again.');
      }
    } catch (error) {
      console.error('Prediction error:', error);
      setError('An error occurred during analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'text-red-600 bg-red-100';
      case 'medium':
      case 'moderate':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getSensorStatusColor = (value, type) => {
    const numValue = parseFloat(value);
    if (type === 'moisture') {
      if (numValue < 30) return 'text-red-600';
      if (numValue < 60) return 'text-yellow-600';
      return 'text-green-600';
    }
    if (type === 'temperature') {
      if (numValue < 15 || numValue > 30) return 'text-red-600';
      if (numValue < 18 || numValue > 28) return 'text-yellow-600';
      return 'text-green-600';
    }
    if (type === 'humidity') {
      if (numValue < 40 || numValue > 80) return 'text-red-600';
      if (numValue < 50 || numValue > 70) return 'text-yellow-600';
      return 'text-green-600';
    }
    return 'text-gray-600';
  };

  const clearForm = () => {
    setPlantId('');
    setSensorData({
      moisture: '',
      temperature: '',
      humidity: '',
      lightLevel: ''
    });
    setPrediction(null);
    setError(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access smart watering predictions</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (!hasAIAccess()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Premium Feature</h2>
          <p className="text-gray-600 mb-4">Upgrade to Premium or contact admin for smart watering predictions</p>
          <button
            onClick={() => router.push('/premium')}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Smart Watering</h1>
            <p className="text-gray-600">Get AI-powered irrigation recommendations based on your plant's current conditions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Droplets size={24} className="text-blue-600" />
              Plant & Sensor Data
            </h2>

            {/* Plant Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Plant *
              </label>
              <select
                value={plantId}
                onChange={(e) => setPlantId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a plant...</option>
                {plants.map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    {plant.name} ({plant.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Sensor Data Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Moisture Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Gauge size={16} />
                    Soil Moisture (%) *
                  </div>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={sensorData.moisture}
                  onChange={(e) => handleInputChange('moisture', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                    sensorData.moisture ? getSensorStatusColor(sensorData.moisture, 'moisture') : 'border-gray-300'
                  }`}
                  placeholder="e.g., 45"
                />
                {sensorData.moisture && (
                  <p className={`text-xs mt-1 ${getSensorStatusColor(sensorData.moisture, 'moisture')}`}>
                    {parseFloat(sensorData.moisture) < 30 ? 'Too dry' :
                     parseFloat(sensorData.moisture) < 60 ? 'Moderate' : 'Well hydrated'}
                  </p>
                )}
              </div>

              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Thermometer size={16} />
                    Temperature (°C) *
                  </div>
                </label>
                <input
                  type="number"
                  min="-40"
                  max="60"
                  value={sensorData.temperature}
                  onChange={(e) => handleInputChange('temperature', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                    sensorData.temperature ? getSensorStatusColor(sensorData.temperature, 'temperature') : 'border-gray-300'
                  }`}
                  placeholder="e.g., 25"
                />
                {sensorData.temperature && (
                  <p className={`text-xs mt-1 ${getSensorStatusColor(sensorData.temperature, 'temperature')}`}>
                    {parseFloat(sensorData.temperature) < 15 || parseFloat(sensorData.temperature) > 30 ? 'Extreme' :
                     parseFloat(sensorData.temperature) < 18 || parseFloat(sensorData.temperature) > 28 ? 'Suboptimal' : 'Optimal'}
                  </p>
                )}
              </div>

              {/* Humidity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <Humidity size={16} />
                    Humidity (%) *
                  </div>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={sensorData.humidity}
                  onChange={(e) => handleInputChange('humidity', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                    sensorData.humidity ? getSensorStatusColor(sensorData.humidity, 'humidity') : 'border-gray-300'
                  }`}
                  placeholder="e.g., 65"
                />
                {sensorData.humidity && (
                  <p className={`text-xs mt-1 ${getSensorStatusColor(sensorData.humidity, 'humidity')}`}>
                    {parseFloat(sensorData.humidity) < 40 || parseFloat(sensorData.humidity) > 80 ? 'Suboptimal' :
                     parseFloat(sensorData.humidity) < 50 || parseFloat(sensorData.humidity) > 70 ? 'Acceptable' : 'Optimal'}
                  </p>
                )}
              </div>

              {/* Light Level (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Light Level (lux)
                </label>
                <input
                  type="number"
                  min="0"
                  value={sensorData.lightLevel}
                  onChange={(e) => handleInputChange('lightLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 15000 (optional)"
                />
              </div>
            </div>

            {error && (
              <div className="mb-6 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2">
                <AlertCircle size={20} className="text-red-600" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handlePredict}
                disabled={isAnalyzing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Droplets size={20} />
                    Get Watering Recommendation
                  </>
                )}
              </button>
              <button
                onClick={clearForm}
                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Watering Recommendations</h2>

            {!prediction && !isAnalyzing && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Droplets size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-600">Enter sensor data and get your watering recommendation</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center py-12">
                <Loader size={48} className="mx-auto text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600">Analyzing environmental conditions...</p>
                <p className="text-sm text-gray-500 mt-2">Calculating optimal watering schedule</p>
              </div>
            )}

            {prediction && (
              <div className="space-y-6">
                {/* Urgency Level */}
                {prediction.urgency && (
                  <div className={`p-4 rounded-lg ${getUrgencyColor(prediction.urgency)}`}>
                    <h3 className="font-semibold mb-2">Watering Urgency</h3>
                    <p className="text-lg font-medium">{prediction.urgency}</p>
                  </div>
                )}

                {/* Water Amount */}
                {prediction.water_amount && (
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <Droplets size={20} />
                      Recommended Amount
                    </h3>
                    <p className="text-blue-700 text-xl font-medium">{prediction.water_amount}</p>
                  </div>
                )}

                {/* Timing */}
                {prediction.timing && (
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <h3 className="font-semibold text-green-900 mb-2">Best Timing</h3>
                    <p className="text-green-700">{prediction.timing}</p>
                  </div>
                )}

                {/* Recommendations */}
                {prediction.recommendations && prediction.recommendations.length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <CheckCircle size={20} />
                      Care Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {prediction.recommendations.map((rec, index) => (
                        <li key={index} className="text-gray-700 flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* General Response */}
                {prediction.response && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Analysis Summary</h3>
                    <p className="text-gray-700">{prediction.response}</p>
                  </div>
                )}

                {/* Next Check */}
                {prediction.next_check && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-semibold text-yellow-900 mb-2">Next Check</h3>
                    <p className="text-yellow-700">{prediction.next_check}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartWateringPage;