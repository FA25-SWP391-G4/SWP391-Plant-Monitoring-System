/**
 * AI Functions Grid Component
 * Grid layout for AI functions with clickable cards
 */
'use client'

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import {
  Bot,
  Camera,
  BarChart3,
  TrendingUp,
  MessageSquare,
  Brain,
  Leaf,
  Droplets,
  Sun,
  Thermometer,
  Lightbulb,
  Activity
} from 'lucide-react';

const AIFunctionsGrid = ({ isPremium = false }) => {
  const { t } = useTranslation();
  const router = useRouter();

  const aiFunctions = [
    {
      id: 'plant-analysis',
      title: t('ai.functions.plantAnalysis', 'Plant Health Analysis'),
      description: t('ai.functions.plantAnalysisDesc', 'Analyze your plant\'s overall health and get recommendations'),
      icon: <Leaf className="h-8 w-8" />,
      color: 'from-green-500 to-emerald-600',
      href: '/ai/analysis',
      category: 'analysis',
      premium: false
    },
    {
      id: 'plant-health-analysis',
      title: t('ai.functions.plantHealthAnalysis', 'Plant Health Analysis'),
      description: t('ai.functions.plantHealthAnalysisDesc', 'Upload plant photos for instant health assessment and disease detection'),
      icon: <Camera className="h-8 w-8" />,
      color: 'from-green-500 to-emerald-600',
      href: '/ai/plant-health',
      category: 'analysis',
      premium: true
    },
    {
      id: 'smart-watering',
      title: t('ai.functions.smartWatering', 'Smart Watering'),
      description: t('ai.functions.smartWateringDesc', 'Get AI-powered irrigation recommendations based on sensor data'),
      icon: <Droplets className="h-8 w-8" />,
      color: 'from-blue-500 to-cyan-600',
      href: '/ai/smart-watering',
      category: 'predictions',
      premium: true
    },
    {
      id: 'growth-insights',
      title: t('ai.functions.growthInsights', 'Growth Insights'),
      description: t('ai.functions.growthInsightsDesc', 'Analyze historical data to understand growth patterns and trends'),
      icon: <TrendingUp className="h-8 w-8" />,
      color: 'from-purple-500 to-violet-600',
      href: '/ai/growth-insights',
      category: 'predictions',
      premium: true
    },
    {
      id: 'environmental-analysis',
      title: t('ai.functions.environmentalAnalysis', 'Environmental Analysis'),
      description: t('ai.functions.environmentalAnalysisDesc', 'Analyze light, temperature, and humidity conditions'),
      icon: <Sun className="h-8 w-8" />,
      color: 'from-yellow-500 to-orange-600',
      href: '/ai/environmental-analysis',
      category: 'analysis',
      premium: true
    },
    {
      id: 'care-recommendations',
      title: t('ai.functions.careRecommendations', 'Smart Care Tips'),
      description: t('ai.functions.careRecommendationsDesc', 'Personalized care recommendations for your plants'),
      icon: <Lightbulb className="h-8 w-8" />,
      color: 'from-amber-500 to-yellow-600',
      href: '/ai/recommendations',
      category: 'guidance',
      premium: false
    },
    {
      id: 'chatbot',
      title: t('ai.functions.chatbot', 'AI Plant Assistant'),
      description: t('ai.functions.chatbotDesc', '24/7 AI assistant for all your plant care questions'),
      icon: <MessageSquare className="h-8 w-8" />,
      color: 'from-indigo-500 to-purple-600',
      href: '/ai/chat',
      category: 'assistance',
      premium: false
    },
    {
      id: 'advanced-analytics',
      title: t('ai.functions.advancedAnalytics', 'Advanced Analytics'),
      description: t('ai.functions.advancedAnalyticsDesc', 'Deep insights and comprehensive plant data analysis'),
      icon: <BarChart3 className="h-8 w-8" />,
      color: 'from-teal-500 to-cyan-600',
      href: '/ai/analytics',
      category: 'analysis',
      premium: true
    }
  ];

  const handleFunctionClick = (func) => {
    if (func.premium && !isPremium) {
      router.push('/premium');
      return;
    }
    router.push(func.href);
  };

  const categories = [
    { id: 'all', name: t('ai.categories.all', 'All Functions'), icon: <Brain className="h-5 w-5" /> },
    { id: 'analysis', name: t('ai.categories.analysis', 'Analysis'), icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'diagnosis', name: t('ai.categories.diagnosis', 'Diagnosis'), icon: <Activity className="h-5 w-5" /> },
    { id: 'predictions', name: t('ai.categories.predictions', 'Predictions'), icon: <TrendingUp className="h-5 w-5" /> },
    { id: 'guidance', name: t('ai.categories.guidance', 'Guidance'), icon: <Lightbulb className="h-5 w-5" /> },
    { id: 'assistance', name: t('ai.categories.assistance', 'Assistance'), icon: <MessageSquare className="h-5 w-5" /> }
  ];

  const [selectedCategory, setSelectedCategory] = React.useState('all');

  const filteredFunctions = selectedCategory === 'all' 
    ? aiFunctions 
    : aiFunctions.filter(func => func.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Bot className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('ai.functions.title', 'AI Plant Care Functions')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          {t('ai.functions.subtitle', 'Discover powerful AI-driven features to optimize your plant care routine. Click on any function to get started.')}
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`btn-transition flex items-center gap-2 px-4 py-2 rounded-full ${
              selectedCategory === category.id
                ? 'bg-blue-500 text-white shadow-lg scale-105'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-blue-300'
            }`}
          >
            {category.icon}
            <span className="text-sm font-medium">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Functions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFunctions.map((func, index) => (
          <Card 
            key={func.id}
            className={`ai-function-card card-hover group cursor-pointer border-2 border-transparent hover:border-blue-200 ${
              func.premium && !isPremium ? 'relative overflow-hidden' : ''
            }`}
            onClick={() => handleFunctionClick(func)}
            style={{
              animationDelay: `${index * 100}ms`
            }}
          >
            {/* Premium Overlay */}
            {func.premium && !isPremium && (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-[1px] flex items-center justify-center z-10">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-purple-200">
                  <span className="text-purple-600 font-medium text-sm">Premium</span>
                </div>
              </div>
            )}

            <div className="p-6">
              {/* Icon */}
              <div className={`w-14 h-14 bg-gradient-to-br ${func.color} rounded-xl flex items-center justify-center mb-4 text-white group-hover:scale-110 transition-transform duration-300`}>
                {func.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                {func.title}
              </h3>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                {func.description}
              </p>

              {/* Action Button */}
              <Button 
                className={`w-full btn-transition ${
                  func.premium && !isPremium 
                    ? 'bg-purple-100 text-purple-600 hover:bg-purple-200' 
                    : 'group-hover:bg-blue-600 group-hover:text-white'
                }`}
                variant={func.premium && !isPremium ? "outline" : "default"}
              >
                {func.premium && !isPremium 
                  ? t('ai.functions.upgrade', 'Upgrade to Access')
                  : t('ai.functions.tryNow', 'Try Now')
                }
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredFunctions.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('ai.functions.noFunctions', 'No functions found')}
          </h3>
          <p className="text-gray-500">
            {t('ai.functions.noFunctionsDesc', 'Try selecting a different category')}
          </p>
        </div>
      )}

      {/* Call to Action for Non-Premium Users */}
      {!isPremium && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bot className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('ai.functions.upgradeTitle', 'Unlock All AI Features')}
            </h3>
            <p className="text-gray-600 mb-4">
              {t('ai.functions.upgradeDesc', 'Get access to advanced AI features including image recognition, disease detection, and predictive analytics.')}
            </p>
            <Button 
              onClick={() => router.push('/premium')}
              className="bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700"
            >
              {t('ai.functions.upgradeToPremium', 'Upgrade to Premium')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AIFunctionsGrid;