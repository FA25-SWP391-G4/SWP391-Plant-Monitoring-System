import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { FiDroplet } from 'react-icons/fi';

/**
 * WateringHistory component displays a log of past watering events for a plant
 */
const WateringHistory = ({ plantId, history = [] }) => {
  const { t } = useTranslation();
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  // Get appropriate label based on the watering type
  const getWateringTypeLabel = (type) => {
    switch (type) {
      case 'automatic':
        return t('watering.automatic', 'Automatic');
      case 'manual':
        return t('watering.manual', 'Manual');
      case 'scheduled':
        return t('watering.scheduled', 'Scheduled');
      default:
        return t('watering.unknown', 'Unknown');
    }
  };

  return (
    <Card className="mb-6">
      <div className="p-5">
        <h3 className="text-lg font-medium mb-4">{t('plants.wateringHistory', 'Watering History')}</h3>
        
        {history.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiDroplet className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-1">
              {t('plants.noWateringHistory', 'No watering history available')}
            </p>
            <p className="text-sm text-gray-400">
              {t('plants.wateringRecordsWillAppear', 'Watering records will appear here')}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {history.map((entry, index) => (
              <div key={entry.id || index} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${
                      entry.type === 'automatic' ? 'bg-blue-100 text-blue-600' : 
                      entry.type === 'manual' ? 'bg-green-100 text-green-600' : 
                      'bg-amber-100 text-amber-600'
                    }`}>
                      <FiDroplet className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">{getWateringTypeLabel(entry.type)}</p>
                      <div className="text-sm text-gray-500">
                        {formatDate(entry.timestamp)} • {formatTime(entry.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium">
                      {entry.duration} {t('common.minutes', 'min')}
                    </span>
                    {entry.userId && (
                      <p className="text-xs text-gray-500">
                        {t('plants.by', 'by')} {entry.userName || entry.userId}
                      </p>
                    )}
                  </div>
                </div>
                
                {entry.notes && (
                  <div className="mt-2 ml-10 text-sm text-gray-600 italic">
                    "{entry.notes}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {history.length > 0 && (
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800">
              {t('common.viewMore', 'View more')}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default WateringHistory;