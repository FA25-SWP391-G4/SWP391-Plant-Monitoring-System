'use client'

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAI } from '@/providers/AIProvider';

export default function AIHistoryWidget() {
  const { t } = useTranslation();
  const { history, loading, error, refreshAIData } = useAI();
  const [activeTab, setActiveTab] = useState('all');



  const getTypeIcon = (type) => {
    switch (type) {
      case 'prediction': return '🔮';
      case 'image_analysis': return '📸';
      case 'chatbot': return '💬';
      default: return '🤖';
    }
  };

  const getResultColor = (result) => {
    switch (result) {
      case 'success': return 'text-emerald-600 bg-emerald-50';
      case 'warning': return 'text-amber-600 bg-amber-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return t('ai.history.daysAgo', '{{days}}d ago', { days: diffDays });
    } else if (diffHours > 0) {
      return t('ai.history.hoursAgo', '{{hours}}h ago', { hours: diffHours });
    } else {
      return t('ai.history.minutesAgo', '{{minutes}}m ago', { minutes: Math.max(1, diffMinutes) });
    }
  };

  const filteredHistory = activeTab === 'all' 
    ? history 
    : history.filter(item => item.type === activeTab);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">{t('ai.history.title', 'AI Activity')}</h3>
          <div className="animate-pulse w-6 h-6 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
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
          <h3 className="font-medium text-gray-900">{t('ai.history.title', 'AI Activity')}</h3>
          <div className="text-red-500">⚠️</div>
        </div>
        <div className="text-center py-6">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-500 text-sm mb-3">
            {t('ai.history.error', 'AI history service unavailable')}
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
        <h3 className="font-medium text-gray-900">{t('ai.history.title', 'AI Activity')}</h3>
        <div className="flex items-center text-xs text-gray-500">
          <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
          {t('ai.history.recent', 'Recent')}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex space-x-1 mb-4 bg-gray-100 rounded-lg p-1">
        {[
          { key: 'all', label: t('ai.history.all', 'All') },
          { key: 'prediction', label: t('ai.history.predictions', 'Predictions') },
          { key: 'image_analysis', label: t('ai.history.analysis', 'Analysis') },
          { key: 'chatbot', label: t('ai.history.chat', 'Chat') }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">📊</div>
            <p className="text-gray-500 text-sm">
              {t('ai.history.noActivity', 'No AI activity yet')}
            </p>
          </div>
        ) : (
          filteredHistory.map(item => (
            <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-shrink-0">
                <span className="text-lg">{getTypeIcon(item.type)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.action}
                  </p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getResultColor(item.result)}`}>
                    {item.result}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-1">
                  {item.plant_name} • {formatTimeAgo(item.timestamp)}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {item.details}
                </p>
                {item.confidence && (
                  <div className="flex items-center mt-1">
                    <div className="w-16 bg-gray-200 rounded-full h-1 mr-2">
                      <div 
                        className="bg-current h-1 rounded-full" 
                        style={{ width: `${item.confidence * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {Math.round(item.confidence * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100">
        <button className="w-full text-sm text-emerald-600 hover:text-emerald-700 font-medium">
          {t('ai.history.viewAll', 'View Full History')}
        </button>
      </div>
    </div>
  );
}