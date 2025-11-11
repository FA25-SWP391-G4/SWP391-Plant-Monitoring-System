'use client'

import { useTranslation } from 'react-i18next';
import { useAI } from '@/providers/AIProvider';

export default function AIInsightsWidget() {
  const { t } = useTranslation();
  const { insights, loading, error, refreshAIData } = useAI();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">{t('ai.insights.title', 'AI Insights')}</h3>
          <div className="animate-pulse w-6 h-6 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">{t('ai.insights.title', 'AI Insights')}</h3>
          <div className="text-red-500">⚠️</div>
        </div>
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🔌</div>
          <p className="text-gray-500 text-sm mb-3">
            {t('ai.insights.error', 'AI service temporarily unavailable')}
          </p>
          <button 
            onClick={refreshAIData}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            {t('common.retry', 'Try Again')}
          </button>
        </div>
      </div>
    );
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'low': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">{t('ai.insights.title', 'AI Insights')}</h3>
        <div className="flex items-center text-xs text-gray-500">
          <div className="w-2 h-2 bg-emerald-500 rounded-full mr-1 animate-pulse"></div>
          {t('ai.insights.live', 'Live')}
        </div>
      </div>

      <div className="space-y-3">
        {insights.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">🤖</div>
            <p className="text-gray-500 text-sm">
              {t('ai.insights.noInsights', 'No AI insights available yet')}
            </p>
          </div>
        ) : (
          insights.map(insight => (
            <div 
              key={insight.id}
              className={`p-3 rounded-lg border ${getPriorityColor(insight.priority)}`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-lg">{insight.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {insight.message}
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                        <div 
                          className="bg-current h-1.5 rounded-full" 
                          style={{ width: `${insight.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round(insight.confidence * 100)}% {t('ai.insights.confidence', 'confidence')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <button className="w-full text-sm text-emerald-600 hover:text-emerald-700 font-medium">
          {t('ai.insights.viewAll', 'View All AI Insights')}
        </button>
      </div>
    </div>
  );
}