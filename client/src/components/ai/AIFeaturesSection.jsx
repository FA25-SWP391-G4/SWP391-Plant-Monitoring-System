import React from 'react';
import { Brain, Camera, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '../../providers/AuthProvider';

const AIFeaturesSection = () => {
  const { user } = useAuth();

  // Check if user has access to AI features
  const hasAIAccess = () => {
    if (!user) {
      console.log('[AI FEATURES] No user found - access denied');
      return false;
    }
    
    const hasAccess = user.isPremium || user.role === 'Premium' || user.role === 'Admin' || user.role === 'admin';
    console.log('[AI FEATURES] Access check:', {
      user: user.email,
      role: user.role,
      isPremium: user.isPremium,
      hasAccess
    });
    
    return hasAccess;
  };

  const handleFeatureClick = (featureType) => {
    if (!hasAIAccess()) {
      alert('Premium subscription or admin access required for AI features');
      return;
    }

    // Navigate to dedicated pages
    switch (featureType) {
      case 'plant-analysis':
        window.location.href = '/ai/plant-health';
        break;
      case 'irrigation-prediction':
        window.location.href = '/ai/smart-watering';
        break;
      case 'historical-analysis':
        window.location.href = '/ai/growth-insights';
        break;
      default:
        break;
    }
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {features.map((feature) => {
          const Icon = feature.icon;
          
          return (
            <div
              key={feature.id}
              onClick={() => handleFeatureClick(feature.id)}
              className={`${feature.color} ${feature.hoverColor} text-white p-6 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 shadow-lg`}
            >
              <div className="flex flex-col items-center text-center">
                <Icon size={32} className="mb-3" />
                <h4 className="font-semibold text-lg mb-2">{feature.title}</h4>
                <p className="text-sm opacity-90">{feature.description}</p>
                <div className="mt-4 text-xs opacity-75">
                  Click to open dedicated page
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AIFeaturesSection;