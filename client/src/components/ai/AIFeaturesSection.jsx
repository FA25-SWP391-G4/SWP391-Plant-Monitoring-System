import React, { useState } from 'react';
import { Brain, Camera, TrendingUp, MessageCircle, Zap, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import aiApi from '../api/aiApi';

const AIFeaturesSection = () => {
  const [isLoading, setIsLoading] = useState({});
  const [results, setResults] = useState({});
  const { user } = useAuth();

  // Check if user has access to AI features
  const hasAIAccess = () => {
    if (!user) return false;
    return user.isPremium || user.role === 'admin';
  };

  const handleFeatureClick = async (featureType, title) => {
    if (!hasAIAccess()) {
      alert('Ultimate subscription or admin access required for AI features');
      return;
    }

    setIsLoading(prev => ({ ...prev, [featureType]: true }));

    try {
      let response;
      
      switch (featureType) {
        case 'plant-analysis':
          // Create file input for image upload
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = 'image/*';
          fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
              const formData = new FormData();
              formData.append('image', file);
              response = await aiApi.analyzeImage(formData);
              handleFeatureResponse(featureType, response, title);
            }
          };
          fileInput.click();
          return;

        case 'irrigation-prediction':
          response = await aiApi.getIrrigationRecommendations({
            plant_id: user.user_id,
            current_moisture: Math.random() * 100,
            temperature: 20 + Math.random() * 15,
            humidity: 40 + Math.random() * 40
          });
          break;

        case 'historical-analysis':
          response = await aiApi.analyzeHistoricalData({
            plant_id: user.user_id,
            timeRange: {
              start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
              end: new Date().toISOString()
            }
          });
          break;

        default:
          return;
      }

      handleFeatureResponse(featureType, response, title);
    } catch (error) {
      console.error(`Error with ${featureType}:`, error);
      setResults(prev => ({
        ...prev,
        [featureType]: {
          success: false,
          error: 'An error occurred. Please try again.'
        }
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, [featureType]: false }));
    }
  };

  const handleFeatureResponse = (featureType, response, title) => {
    setResults(prev => ({
      ...prev,
      [featureType]: {
        title,
        ...response
      }
    }));
    setIsLoading(prev => ({ ...prev, [featureType]: false }));
  };

  const features = [
    {
      id: 'plant-analysis',
      title: 'Plant Health Analysis',
      description: 'Upload a photo to analyze your plant\'s health and detect diseases',
      icon: Camera,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600'
    },
    {
      id: 'irrigation-prediction',
      title: 'Smart Watering',
      description: 'Get AI-powered irrigation recommendations based on your plant\'s needs',
      icon: Zap,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600'
    },
    {
      id: 'historical-analysis',
      title: 'Growth Insights',
      description: 'Analyze historical data to understand your plant\'s growth patterns',
      icon: TrendingUp,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600'
    }
  ];

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <Brain className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Plant Features</h3>
          <p className="text-gray-600 mb-4">Please log in to access AI-powered plant care features</p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (!hasAIAccess()) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <Brain className="mx-auto h-12 w-12 text-amber-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Plant Features</h3>
          <p className="text-gray-600 mb-4">Upgrade to Premium or contact admin for AI-powered plant care features</p>
          <button className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg">
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="h-8 w-8 text-blue-600" />
        <h3 className="text-xl font-bold text-gray-900">AI Plant Features</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          const isFeatureLoading = isLoading[feature.id];
          
          return (
            <div
              key={feature.id}
              onClick={() => handleFeatureClick(feature.id, feature.title)}
              className={`${feature.color} ${feature.hoverColor} text-white p-6 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 shadow-lg ${
                isFeatureLoading ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex flex-col items-center text-center">
                {isFeatureLoading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mb-3"></div>
                ) : (
                  <Icon size={32} className="mb-3" />
                )}
                <h4 className="font-semibold text-lg mb-2">{feature.title}</h4>
                <p className="text-sm opacity-90">{feature.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Results Display */}
      {Object.keys(results).length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Results</h4>
          <div className="space-y-4">
            {Object.entries(results).map(([featureId, result]) => (
              <div key={featureId} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <History size={16} className="text-gray-500" />
                  <h5 className="font-medium text-gray-900">{result.title}</h5>
                </div>
                
                {result.success ? (
                  <div className="text-sm text-gray-700">
                    {result.data?.response && <p className="mb-2">{result.data.response}</p>}
                    {result.data?.analysis && (
                      <div className="bg-white p-3 rounded border">
                        <p><strong>Health Score:</strong> {result.data.analysis.health_score}%</p>
                        <p><strong>Condition:</strong> {result.data.analysis.condition}</p>
                        {result.data.analysis.recommendations && (
                          <div className="mt-2">
                            <strong>Recommendations:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {result.data.analysis.recommendations.map((rec, index) => (
                                <li key={index} className="text-sm">{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-red-600">
                    {result.requiresLogin && <p>Please log in to use this feature.</p>}
                    {result.requiresUltimate && <p>Ultimate subscription or admin access required.</p>}
                    {result.error && !result.requiresLogin && !result.requiresUltimate && <p>{result.error}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIFeaturesSection;