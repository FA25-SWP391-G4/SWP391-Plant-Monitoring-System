'use client'

import { useTranslation } from 'react-i18next';
import { useAI } from '@/providers/AIProvider';

export default function AIPredictionsWidget() {
  const { t } = useTranslation();
  const { predictions, loading, error, refreshAIData } = useAI();

  const formatTimeUntil = (dateString) => {
    const now = new Date();
    const target = new Date(dateString);
    const diffMs = target - now;
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 0) {
      return t('ai.predictions.overdue', 'Overdue');
    } else if (diffHours < 24) {
      return t('ai.predictions.inHours', 'In {{hours}}h', { hours: diffHours });
    } else {
      const diffDays = Math.ceil(diffHours / 24);
      return t('ai.predictions.inDays', 'In {{days}}d', { days: diffDays });
    }
  };

  const getUrgencyColor = (dateString) => {
    const now = new Date();
    const target = new Date(dateString);
    const diffHours = (target - now) / (1000 * 60 * 60);
    
    if (diffHours < 0) return 'text-red-600 bg-red-50';
    if (diffHours < 12) return 'text-amber-600 bg-amber-50';
    return 'text-emerald-600 bg-emerald-50';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">{t('ai.predictions.title', 'AI Predictions')}</h3>
          <div className="animate-pulse w-6 h-6 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
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
          <h3 className="font-medium text-gray-900">{t('ai.predictions.title', 'AI Predictions')}</h3>
          <div className="text-red-500">⚠️</div>
        </div>
        <div className="text-center py-6">
          <div className="text-4xl mb-2">🔮</div>
          <p className="text-gray-500 text-sm mb-3">
            {t('ai.predictions.error', 'Prediction service unavailable')}
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">{t('ai.predictions.title', 'AI Predictions')}</h3>
        <div className="flex items-center text-xs text-gray-500">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          {t('ai.predictions.updated', 'Updated 5m ago')}
        </div>
      </div>

      <div className="space-y-3">
        {predictions.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">🔮</div>
            <p className="text-gray-500 text-sm">
              {t('ai.predictions.noPredictions', 'No predictions available')}
            </p>
          </div>
        ) : (
          predictions.map(prediction => (
            <div key={prediction.id} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {prediction.plant_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    💧 {t('ai.predictions.watering', 'Watering')}
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(prediction.next_action)}`}>
                  {formatTimeUntil(prediction.next_action)}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center space-x-4">
                  <span>
                    {t('ai.predictions.moisture', 'Moisture')}: {prediction.details.current_moisture}%
                  </span>
                  <span>
                    {t('ai.predictions.amount', 'Amount')}: {prediction.details.recommended_amount}ml
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-12 bg-gray-200 rounded-full h-1 mr-1">
                    <div 
                      className="bg-emerald-500 h-1 rounded-full" 
                      style={{ width: `${prediction.confidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500">
                    {Math.round(prediction.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <button className="w-full text-sm text-emerald-600 hover:text-emerald-700 font-medium">
          {t('ai.predictions.viewAll', 'View All Predictions')}
        </button>
      </div>
    </div>
  );
}