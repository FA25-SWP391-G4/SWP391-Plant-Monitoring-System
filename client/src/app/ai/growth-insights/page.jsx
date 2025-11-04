'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, ArrowLeft, AlertCircle, Calendar, BarChart3, Loader, LineChart, Activity } from 'lucide-react';
import { useAuth } from '../../../providers/AuthProvider';
import aiApi from '../../../api/aiApi';

const GrowthInsightsPage = () => {
  const [plantId, setPlantId] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });
  const [timeRange, setTimeRange] = useState('30d');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);
  const [plants, setPlants] = useState([]);
  const { user } = useAuth();
  const router = useRouter();

  const hasAIAccess = () => {
    if (!user) return false;
    return user.isPremium || user.role === 'admin' || user.role === 'Admin' || user.role === 'Premium';
  };

  const timeRangeOptions = [
    { value: '7d', label: '7 Days', days: 7 },
    { value: '30d', label: '30 Days', days: 30 },
    { value: '90d', label: '3 Months', days: 90 },
    { value: '180d', label: '6 Months', days: 180 },
    { value: '365d', label: '1 Year', days: 365 },
    { value: 'custom', label: 'Custom Range', days: null }
  ];

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

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    if (range !== 'custom') {
      const option = timeRangeOptions.find(opt => opt.value === range);
      if (option) {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - option.days * 24 * 60 * 60 * 1000);
        setDateRange({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        });
      }
    }
  };

  const validateInputs = () => {
    if (!plantId) {
      setError('Please select a plant');
      return false;
    }

    if (!dateRange.startDate || !dateRange.endDate) {
      setError('Please select both start and end dates');
      return false;
    }

    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);

    if (start >= end) {
      setError('Start date must be before end date');
      return false;
    }

    const maxDays = 365; // Limit to 1 year
    const daysDiff = (end - start) / (1000 * 60 * 60 * 24);
    if (daysDiff > maxDays) {
      setError(`Date range cannot exceed ${maxDays} days`);
      return false;
    }

    return true;
  };

  const handleAnalyze = async () => {
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
        timeRange: {
          start: new Date(dateRange.startDate).toISOString(),
          end: new Date(dateRange.endDate).toISOString()
        }
      };

      const response = await aiApi.analyzeHistoricalData(requestData);
      
      if (response.success) {
        setInsights(response.data);
      } else {
        setError(response.error || 'Analysis failed. Please try again.');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError('An error occurred during analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getTrendColor = (trend) => {
    switch (trend?.toLowerCase()) {
      case 'improving':
      case 'positive':
      case 'up':
        return 'text-green-600 bg-green-100';
      case 'declining':
      case 'negative':
      case 'down':
        return 'text-red-600 bg-red-100';
      case 'stable':
      case 'neutral':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const clearForm = () => {
    setPlantId('');
    setTimeRange('30d');
    setDateRange({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    });
    setInsights(null);
    setError(null);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access growth insights</p>
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
          <p className="text-gray-600 mb-4">Upgrade to Premium or contact admin for growth insights analysis</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Growth Insights</h1>
            <p className="text-gray-600">Analyze historical data to understand your plant's growth patterns and trends</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp size={24} className="text-purple-600" />
                Analysis Parameters
              </h2>

              {/* Plant Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Plant *
                </label>
                <select
                  value={plantId}
                  onChange={(e) => setPlantId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Choose a plant...</option>
                  {plants.map((plant) => (
                    <option key={plant.id} value={plant.id}>
                      {plant.name} ({plant.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Range Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Range *
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {timeRangeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleTimeRangeChange(option.value)}
                      className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                        timeRange === option.value
                          ? 'bg-purple-100 border-purple-500 text-purple-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              {timeRange === 'custom' && (
                <div className="mb-6">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2">
                  <AlertCircle size={20} className="text-red-600" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <BarChart3 size={20} />
                      Analyze
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
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis Results</h2>

              {!insights && !isAnalyzing && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-600">Select a plant and date range to analyze growth patterns</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="text-center py-16">
                  <Loader size={48} className="mx-auto text-purple-600 animate-spin mb-4" />
                  <p className="text-gray-600">Analyzing historical data...</p>
                  <p className="text-sm text-gray-500 mt-2">Processing growth patterns and trends</p>
                </div>
              )}

              {insights && (
                <div className="space-y-6">
                  {/* Summary Stats */}
                  {insights.summary && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {insights.summary.total_days && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar size={20} className="text-blue-600" />
                            <h3 className="font-semibold text-blue-900">Analysis Period</h3>
                          </div>
                          <p className="text-2xl font-bold text-blue-700">{insights.summary.total_days} days</p>
                        </div>
                      )}
                      
                      {insights.summary.health_score && (
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Activity size={20} className="text-green-600" />
                            <h3 className="font-semibold text-green-900">Avg Health Score</h3>
                          </div>
                          <p className={`text-2xl font-bold ${getScoreColor(insights.summary.health_score)}`}>
                            {insights.summary.health_score}%
                          </p>
                        </div>
                      )}
                      
                      {insights.summary.growth_rate && (
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp size={20} className="text-purple-600" />
                            <h3 className="font-semibold text-purple-900">Growth Rate</h3>
                          </div>
                          <p className="text-2xl font-bold text-purple-700">{insights.summary.growth_rate}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Trend Analysis */}
                  {insights.trends && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <LineChart size={20} />
                        Trend Analysis
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(insights.trends).map(([key, trend]) => (
                          <div key={key} className={`p-3 rounded-lg ${getTrendColor(trend.direction)}`}>
                            <h4 className="font-medium capitalize mb-1">{key.replace('_', ' ')}</h4>
                            <p className="text-sm">{trend.description || trend.direction}</p>
                            {trend.value && <p className="font-semibold mt-1">{trend.value}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Insights */}
                  {insights.insights && insights.insights.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Key Insights</h3>
                      <ul className="space-y-2">
                        {insights.insights.map((insight, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-1">•</span>
                            <span className="text-gray-700">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {insights.recommendations && insights.recommendations.length > 0 && (
                    <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                        <TrendingUp size={20} />
                        Growth Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {insights.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-green-600 mt-1">•</span>
                            <span className="text-green-700">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Alerts/Warnings */}
                  {insights.alerts && insights.alerts.length > 0 && (
                    <div className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                      <h3 className="font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                        <AlertCircle size={20} />
                        Attention Required
                      </h3>
                      <ul className="space-y-2">
                        {insights.alerts.map((alert, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-yellow-600 mt-1">•</span>
                            <span className="text-yellow-700">{alert}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* General Response */}
                  {insights.response && (
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">Analysis Summary</h3>
                      <p className="text-gray-700">{insights.response}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrowthInsightsPage;