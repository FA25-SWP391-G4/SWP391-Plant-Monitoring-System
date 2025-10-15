import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Button } from './ui/Button';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import IrrigationCalendar from './IrrigationCalendar';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
} from 'chart.js';
import useIrrigationPrediction from '../hooks/useIrrigationPrediction';
import useSensorData from '../hooks/useSensorData';
import { useMqttContext } from '../contexts/MqttContext';
import MqttConnectionStatus from './MqttConnectionStatus';
import { 
  Droplets, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Thermometer,
  Gauge,
  Leaf,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Bell,
  BellOff
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

/**
 * Irrigation Prediction Dashboard Component
 * Provides comprehensive irrigation prediction visualization with real-time updates
 */
const IrrigationPredictionDashboard = ({ plantId, plantName = "Plant" }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Hooks
  const {
    prediction,
    schedule,
    recommendations,
    loading,
    error,
    lastUpdate,
    alerts,
    performance,
    predictIrrigation,
    createSchedule,
    clearAlerts,
    clearError,
    getPredictionHistory,
    mqttConnected
  } = useIrrigationPrediction(plantId, {
    enableAlerts: alertsEnabled,
    autoPredict: autoRefresh
  });

  const { sensorData, loading: sensorLoading } = useSensorData(plantId);

  // Auto-predict when sensor data changes
  useEffect(() => {
    if (sensorData && autoRefresh && !loading) {
      predictIrrigation(sensorData);
    }
  }, [sensorData, autoRefresh, predictIrrigation, loading]);

  // Prediction history for charts
  const predictionHistory = useMemo(() => {
    return getPredictionHistory();
  }, [getPredictionHistory, lastUpdate]);

  // Chart data for prediction trends
  const predictionTrendData = useMemo(() => {
    const history = predictionHistory.slice(-20); // Last 20 predictions
    
    return {
      labels: history.map(p => new Date(p.timestamp).toLocaleTimeString()),
      datasets: [
        {
          label: 'Confidence Score',
          data: history.map(p => p.confidence * 100),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Water Amount (ml)',
          data: history.map(p => p.waterAmount || 0),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          yAxisID: 'y1'
        }
      ]
    };
  }, [predictionHistory]);

  // Chart options for prediction trends
  const predictionTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top'
      },
      title: {
        display: true,
        text: 'Irrigation Prediction Trends'
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Confidence (%)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Water Amount (ml)'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  // Confidence gauge data
  const confidenceGaugeData = useMemo(() => {
    const confidence = prediction?.confidence || 0;
    return {
      labels: ['Confidence', 'Remaining'],
      datasets: [
        {
          data: [confidence * 100, (1 - confidence) * 100],
          backgroundColor: [
            confidence > 0.8 ? '#10b981' : confidence > 0.6 ? '#f59e0b' : '#ef4444',
            '#e5e7eb'
          ],
          borderWidth: 0
        }
      ]
    };
  }, [prediction?.confidence]);

  // Sensor data chart
  const sensorChartData = useMemo(() => {
    if (!sensorData) return null;

    return {
      labels: ['Soil Moisture', 'Temperature', 'Humidity', 'Light Level'],
      datasets: [
        {
          label: 'Current Values',
          data: [
            sensorData.soilMoisture || 0,
            sensorData.temperature || 0,
            sensorData.humidity || 0,
            (sensorData.lightLevel || 0) / 100 // Scale light level
          ],
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)'
          ]
        }
      ]
    };
  }, [sensorData]);

  // Handle manual prediction
  const handleManualPredict = async () => {
    if (sensorData) {
      await predictIrrigation(sensorData);
    }
  };

  // Handle schedule creation
  const handleCreateSchedule = async () => {
    if (!prediction) return;

    const scheduleData = {
      predictionBased: true,
      waterAmount: prediction.waterAmount,
      frequency: prediction.hoursUntilWater < 12 ? 'daily' : 'weekly',
      startTime: '06:00',
      duration: Math.ceil((prediction.waterAmount || 500) / 100) // Duration based on water amount
    };

    await createSchedule(scheduleData);
    setShowScheduleModal(false);
  };

  // Format time until next watering
  const formatTimeUntilWater = (hours) => {
    if (!hours) return 'Unknown';
    if (hours < 1) return `${Math.round(hours * 60)} minutes`;
    if (hours < 24) return `${Math.round(hours)} hours`;
    return `${Math.round(hours / 24)} days`;
  };

  // Get prediction status color
  const getPredictionStatusColor = (confidence) => {
    if (confidence > 0.8) return 'text-green-600';
    if (confidence > 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Irrigation Prediction</h1>
          <p className="text-gray-600 mt-1">AI-powered watering recommendations for {plantName}</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* MQTT Status */}
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
            mqttConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${mqttConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{mqttConnected ? 'Live' : 'Offline'}</span>
          </div>

          {/* Alert Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAlertsEnabled(!alertsEnabled)}
            className="flex items-center space-x-2"
          >
            {alertsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            <span>{alertsEnabled ? 'Alerts On' : 'Alerts Off'}</span>
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualPredict}
            disabled={loading || sensorLoading}
            className="flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <XCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
            <Button variant="outline" size="sm" onClick={clearError}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-orange-800 flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Active Alerts ({alerts.length})</span>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={clearAlerts}>
                Clear All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{alert.message}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
                {alert.waterAmount && (
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-600">
                      {alert.waterAmount}ml needed
                    </p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Prediction Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Droplets className="w-5 h-5 text-blue-600" />
              <span>Current Prediction</span>
            </CardTitle>
            <CardDescription>
              {lastUpdate ? `Last updated: ${new Date(lastUpdate).toLocaleString()}` : 'No prediction available'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {prediction ? (
              <>
                {/* Should Water Status */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {prediction.shouldWater ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium">
                        {prediction.shouldWater ? 'Watering Needed' : 'No Watering Needed'}
                      </p>
                      <p className="text-sm text-gray-600">
                        Confidence: <span className={getPredictionStatusColor(prediction.confidence)}>
                          {Math.round(prediction.confidence * 100)}%
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Prediction Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Next Watering</p>
                    <p className="font-semibold text-blue-900">
                      {formatTimeUntilWater(prediction.hoursUntilWater)}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <Droplets className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Water Amount</p>
                    <p className="font-semibold text-green-900">
                      {prediction.waterAmount || 0}ml
                    </p>
                  </div>
                </div>

                {/* Confidence Gauge */}
                <div className="h-48">
                  <Doughnut 
                    data={confidenceGaugeData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        title: {
                          display: true,
                          text: `Confidence: ${Math.round(prediction.confidence * 100)}%`
                        }
                      },
                      cutout: '70%'
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Droplets className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No prediction available</p>
                <Button 
                  onClick={handleManualPredict} 
                  disabled={loading || sensorLoading}
                  className="mt-4"
                >
                  {loading ? 'Predicting...' : 'Get Prediction'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Prediction Trends Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span>Prediction Trends</span>
            </CardTitle>
            <CardDescription>
              Historical prediction data and confidence levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {predictionHistory.length > 0 ? (
                <Line data={predictionTrendData} options={predictionTrendOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No prediction history available</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Predictions will appear here as they are generated
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Sensor Data */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gauge className="w-5 h-5 text-purple-600" />
              <span>Current Sensor Data</span>
            </CardTitle>
            <CardDescription>
              Real-time environmental conditions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sensorData ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Droplets className="w-6 h-6 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Soil Moisture</p>
                      <p className="font-semibold text-blue-900">{sensorData.soilMoisture}%</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                    <Thermometer className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="text-sm text-gray-600">Temperature</p>
                      <p className="font-semibold text-red-900">{sensorData.temperature}°C</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <Gauge className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Humidity</p>
                      <p className="font-semibold text-green-900">{sensorData.humidity}%</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <Leaf className="w-6 h-6 text-yellow-600" />
                    <div>
                      <p className="text-sm text-gray-600">Light Level</p>
                      <p className="font-semibold text-yellow-900">{sensorData.lightLevel} lux</p>
                    </div>
                  </div>
                </div>

                {sensorChartData && (
                  <div className="h-48">
                    <Bar 
                      data={sensorChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          title: {
                            display: true,
                            text: 'Environmental Conditions'
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Values'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <Gauge className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {sensorLoading ? 'Loading sensor data...' : 'No sensor data available'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations & Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>Schedule & Recommendations</span>
            </CardTitle>
            <CardDescription>
              AI-generated watering recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Schedule */}
            {schedule && (
              <div className="p-4 bg-indigo-50 rounded-lg">
                <h4 className="font-medium text-indigo-900 mb-2">Active Schedule</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Frequency:</span> {schedule.frequency}</p>
                  <p><span className="font-medium">Start Time:</span> {schedule.startTime}</p>
                  <p><span className="font-medium">Duration:</span> {schedule.duration} minutes</p>
                  <p><span className="font-medium">Water Amount:</span> {schedule.waterAmount}ml</p>
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Recent Recommendations</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {recommendations.length > 0 ? (
                  recommendations.slice(0, 5).map((rec, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{rec.message}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {new Date(rec.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-sm">No recommendations available</p>
                )}
              </div>
            </div>

            {/* Schedule Actions */}
            <div className="flex space-x-2 pt-4 border-t">
              <Button
                onClick={() => setShowScheduleModal(true)}
                disabled={!prediction}
                className="flex-1"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Create Schedule
              </Button>
              <Button variant="outline" className="flex-1">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third Row - Calendar */}
      <div className="grid grid-cols-1 gap-6">
        <IrrigationCalendar
          schedule={schedule ? [schedule] : []}
          predictions={predictionHistory.map(p => ({
            predictedTime: p.timestamp,
            waterAmount: p.waterAmount,
            confidence: p.confidence,
            urgent: p.shouldWater && p.confidence > 0.8
          }))}
          onDateSelect={(date) => {
            console.log('Selected date:', date);
          }}
          onScheduleEdit={(scheduleItem) => {
            console.log('Edit schedule:', scheduleItem);
            setShowScheduleModal(true);
          }}
        />
      </div>

      {/* Schedule Creation Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create Irrigation Schedule</CardTitle>
              <CardDescription>
                Based on current prediction: {prediction?.waterAmount}ml needed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                This will create an intelligent watering schedule based on the current AI prediction
                and your plant's specific needs.
              </p>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Recommended Schedule:</p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li>• Water amount: {prediction?.waterAmount || 0}ml</li>
                  <li>• Frequency: {prediction?.hoursUntilWater < 12 ? 'Daily' : 'Every 2-3 days'}</li>
                  <li>• Best time: Early morning (6:00 AM)</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowScheduleModal(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleCreateSchedule} className="flex-1">
                Create Schedule
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default IrrigationPredictionDashboard;