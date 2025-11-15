import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import WateringScheduleModal from '../modals/WateringScheduleModal';

const WateringScheduleControl = ({ 
  plantId, 
  schedule, 
  isPremium, 
  onUpdateSchedule,
  deviceStatus = 'offline',
  deviceOnline = false
}) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [scheduleData, setScheduleData] = useState(schedule || {
    frequency: 'daily',
    time: '08:00',
    duration: 30,
    enabled: false
  });

  const handleSave = async (newScheduleData) => {
    setScheduleData(newScheduleData);
    if (onUpdateSchedule) {
      await onUpdateSchedule(newScheduleData);
    }
  };

  if (!isPremium) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <div className="text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <p className="text-lg font-medium mb-2">
              {t('schedule.premiumFeature', 'Premium Feature')}
            </p>
            <p className="text-sm">
              {t('schedule.upgradeMessage', 'Upgrade to Premium to access automatic watering schedules')}
            </p>
          </div>
          <Button variant="outline">
            {t('premium.upgrade', 'Upgrade to Premium')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('schedule.title', 'Watering Schedule')}</CardTitle>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                scheduleData.enabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {scheduleData.enabled 
                  ? t('schedule.active', 'Active') 
                  : t('schedule.inactive', 'Inactive')
                }
              </span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowModal(true)}
              >
                {t('schedule.edit', 'Edit')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Device Status Warning */}
          {!deviceOnline && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {t('schedule.deviceOfflineWarning', 'Device Offline')}
                  </p>
                  <p className="text-sm text-yellow-700">
                    {t('schedule.deviceOfflineMessage', 'Your device is currently offline. Scheduled watering will not work until the device is back online.')}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('schedule.frequency', 'Frequency')}:</span>
              <span className="font-medium">
                {scheduleData.frequency === 'daily' && t('schedule.daily', 'Daily')}
                {scheduleData.frequency === 'every2days' && t('schedule.every2days', 'Every 2 days')}
                {scheduleData.frequency === 'every3days' && t('schedule.every3days', 'Every 3 days')}
                {scheduleData.frequency === 'weekly' && t('schedule.weekly', 'Weekly')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('schedule.time', 'Time')}:</span>
              <span className="font-medium">{scheduleData.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('schedule.duration', 'Duration')}:</span>
              <span className="font-medium">{scheduleData.duration}s</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Watering Schedule Modal */}
      <WateringScheduleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
        schedule={scheduleData}
        isPremium={isPremium}
        deviceOnline={deviceOnline}
      />
    </>
  );
};

export default WateringScheduleControl;