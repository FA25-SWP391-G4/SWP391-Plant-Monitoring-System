import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

const WateringScheduleControl = ({ 
  plantId, 
  schedule, 
  isPremium, 
  onUpdateSchedule 
}) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [scheduleData, setScheduleData] = useState(schedule || {
    frequency: 'daily',
    time: '08:00',
    duration: 30,
    enabled: false
  });

  const handleSave = () => {
    onUpdateSchedule(scheduleData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setScheduleData(schedule || {
      frequency: 'daily',
      time: '08:00',
      duration: 30,
      enabled: false
    });
    setIsEditing(false);
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
    <div className="space-y-6">
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
              {!isEditing && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  {t('schedule.edit', 'Edit')}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('schedule.frequency', 'Frequency')}
                </label>
                <select 
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={scheduleData.frequency}
                  onChange={(e) => setScheduleData({...scheduleData, frequency: e.target.value})}
                >
                  <option value="daily">{t('schedule.daily', 'Daily')}</option>
                  <option value="every2days">{t('schedule.every2days', 'Every 2 days')}</option>
                  <option value="every3days">{t('schedule.every3days', 'Every 3 days')}</option>
                  <option value="weekly">{t('schedule.weekly', 'Weekly')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('schedule.time', 'Time')}
                </label>
                <input 
                  type="time"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={scheduleData.time}
                  onChange={(e) => setScheduleData({...scheduleData, time: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('schedule.duration', 'Duration (seconds)')}
                </label>
                <input 
                  type="number"
                  min="10"
                  max="300"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={scheduleData.duration}
                  onChange={(e) => setScheduleData({...scheduleData, duration: parseInt(e.target.value)})}
                />
              </div>
              
              <div className="flex items-center">
                <input 
                  type="checkbox"
                  id="enabled"
                  className="mr-2"
                  checked={scheduleData.enabled}
                  onChange={(e) => setScheduleData({...scheduleData, enabled: e.target.checked})}
                />
                <label htmlFor="enabled" className="text-sm font-medium text-gray-700">
                  {t('schedule.enable', 'Enable automatic watering')}
                </label>
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleSave}>
                  {t('schedule.save', 'Save')}
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  {t('schedule.cancel', 'Cancel')}
                </Button>
              </div>
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WateringScheduleControl;