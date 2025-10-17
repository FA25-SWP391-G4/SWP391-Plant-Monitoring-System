'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function AIHistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch AI history
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        // Mock history data - would come from API
        const mockHistory = [
          {
            id: 1,
            type: 'prediction',
            action: 'Watering prediction generated',
            plant_name: 'Snake Plant',
            timestamp: '2024-10-17T10:30:00Z',
            result: 'success',
            confidence: 0.89,
            details: 'Predicted watering needed in 2 days based on current moisture levels and historical patterns',
            data: { current_moisture: 72, predicted_moisture: 35, recommended_amount: 250 }
          },
          {
            id: 2,
            type: 'image_analysis',
            action: 'Disease detection completed',
            plant_name: 'Monstera',
            timestamp: '2024-10-17T09:15:00Z',
            result: 'warning',
            confidence: 0.92,
            details: 'Early blight detected with high confidence. Immediate treatment recommended.',
            data: { disease: 'Early Blight', severity: 'moderate', treatment_urgency: 'high' }
          },
          {
            id: 3,
            type: 'chatbot',
            action: 'Plant care consultation',
            plant_name: 'Peace Lily',
            timestamp: '2024-10-17T08:45:00Z',
            result: 'success',
            confidence: 0.85,
            details: 'Provided comprehensive watering and light recommendations based on current conditions',
            data: { topics: ['watering', 'lighting', 'humidity'], recommendations: 3 }
          },
          {
            id: 4,
            type: 'prediction',
            action: 'Schedule optimization',
            plant_name: 'All Plants',
            timestamp: '2024-10-16T20:00:00Z',
            result: 'success',
            confidence: 0.78,
            details: 'Optimized watering schedule across all plants for improved efficiency and water conservation',
            data: { water_savings: '15%', plants_affected: 3, schedule_changes: 5 }
          },
          {
            id: 5,
            type: 'image_analysis',
            action: 'Health assessment',
            plant_name: 'Snake Plant',
            timestamp: '2024-10-16T16:20:00Z',
            result: 'success',
            confidence: 0.94,
            details: 'Comprehensive health analysis completed. Plant appears healthy with no issues detected.',
            data: { health_score: 95, issues_found: 0, recommendations: 2 }
          },
          {
            id: 6,
            type: 'chatbot',
            action: 'Troubleshooting session',
            plant_name: 'Monstera',
            timestamp: '2024-10-16T14:10:00Z',
            result: 'success',
            confidence: 0.88,
            details: 'Helped diagnose yellowing leaves issue and provided step-by-step treatment plan',
            data: { issue: 'yellowing_leaves', solution_steps: 4, follow_up: true }
          }
        ];

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setHistory(mockHistory);
      } catch (error) {
        console.error('Error fetching AI history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchHistory();
    }
  }, [user]);

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
      case 'success': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'warning': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const filteredHistory = history.filter(item => 
    filter === 'all' || item.type === filter
  );

  const sortedHistory = [...filteredHistory].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.timestamp) - new Date(a.timestamp);
    } else {
      return new Date(a.timestamp) - new Date(b.timestamp);
    }
  });

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-emerald-200 mb-4"></div>
          <div className="h-4 w-24 bg-emerald-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="text-4xl mr-3">📊</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('ai.history.title', 'AI Activity History')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('ai.history.subtitle', 'Complete record of all AI interactions and analyses')}
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Filter by type */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                {t('ai.history.filterBy', 'Filter by:')}
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">{t('ai.history.all', 'All Activities')}</option>
                <option value="prediction">{t('ai.history.predictions', 'Predictions')}</option>
                <option value="image_analysis">{t('ai.history.imageAnalysis', 'Image Analysis')}</option>
                <option value="chatbot">{t('ai.history.chatbot', 'Chatbot')}</option>
              </select>
            </div>

            {/* Sort by */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">
                {t('ai.history.sortBy', 'Sort by:')}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="newest">{t('ai.history.newest', 'Newest First')}</option>
                <option value="oldest">{t('ai.history.oldest', 'Oldest First')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-4">
          {sortedHistory.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('ai.history.noHistory', 'No AI activity yet')}
              </h3>
              <p className="text-gray-600">
                {t('ai.history.startUsing', 'Start using AI features to see your activity history here')}
              </p>
            </div>
          ) : (
            sortedHistory.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                      {getTypeIcon(item.type)}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {item.action}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getResultColor(item.result)}`}>
                        {item.result}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <span className="mr-4">
                        <strong>{t('ai.history.plant', 'Plant')}:</strong> {item.plant_name}
                      </span>
                      <span className="mr-4">
                        <strong>{t('ai.history.date', 'Date')}:</strong> {formatDate(item.timestamp)}
                      </span>
                      {item.confidence && (
                        <span>
                          <strong>{t('ai.history.confidence', 'Confidence')}:</strong> {Math.round(item.confidence * 100)}%
                        </span>
                      )}
                    </div>

                    <p className="text-gray-700 mb-4">
                      {item.details}
                    </p>

                    {/* Additional data */}
                    {item.data && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">
                          {t('ai.history.additionalData', 'Additional Data')}
                        </h4>
                        <div className="text-xs text-gray-600">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(item.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {sortedHistory.length > 0 && (
          <div className="text-center mt-8">
            <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
              {t('ai.history.loadMore', 'Load More History')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}