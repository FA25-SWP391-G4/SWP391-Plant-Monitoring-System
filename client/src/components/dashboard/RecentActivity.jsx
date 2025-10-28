import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';

export default function RecentActivity() {
  const { t } = useTranslation();
  const { isDark, themeColors } = useTheme();
  
  // Mock activity data - would come from API in a real app
  const activities = [
    {
      id: 1,
      type: 'watering',
      plantName: 'Snake Plant',
      timestamp: '2023-11-15T10:30:00Z',
      details: { amount: '250ml' }
    },
    {
      id: 2,
      type: 'fertilizing',
      plantName: 'Monstera',
      timestamp: '2023-11-14T15:45:00Z',
      details: { fertilizer: 'NPK 5-5-5' }
    },
    {
      id: 3,
      type: 'repotting',
      plantName: 'Peace Lily',
      timestamp: '2023-11-10T09:15:00Z',
      details: { newPotSize: '15cm' }
    },
    {
      id: 4,
      type: 'pruning',
      plantName: 'Pothos',
      timestamp: '2023-11-08T14:20:00Z',
      details: { notes: 'Removed yellow leaves' }
    }
  ];
  
  const getActivityIcon = (type) => {
    switch(type) {
      case 'watering':
        return (
          <div className={`p-2 rounded-full ${
            isDark
              ? 'bg-blue-900/30 text-blue-400'
              : 'bg-blue-100 text-blue-600'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 15 5 15a7 7 0 0 0 7 7z"></path>
            </svg>
          </div>
        );
      case 'fertilizing':
        return (
          <div className={`p-2 rounded-full ${
            isDark
              ? 'bg-emerald-900/30 text-emerald-400'
              : 'bg-emerald-100 text-emerald-600'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 22 16 8"></path>
              <path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"></path>
              <path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"></path>
              <path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z"></path>
              <path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z"></path>
            </svg>
          </div>
        );
      case 'repotting':
        return (
          <div className={`p-2 rounded-full ${
            isDark
              ? 'bg-amber-900/30 text-amber-400'
              : 'bg-amber-100 text-amber-600'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 22h8"></path>
              <path d="M12 22v-7"></path>
              <path d="M4 15h16"></path>
              <path d="M2 8h20"></path>
              <path d="M5 15v-3c0-3 3-3.97 3-5"></path>
              <path d="M19 15v-3c0-3-3-3.97-3-5"></path>
              <path d="M12 2v3"></path>
            </svg>
          </div>
        );
      case 'pruning':
        return (
          <div className={`p-2 rounded-full ${
            isDark
              ? 'bg-purple-900/30 text-purple-400'
              : 'bg-purple-100 text-purple-600'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 7c0-1.1.9-2 2-2h3a2 2 0 0 1 2 2v.5"></path>
              <path d="M11 9a2 2 0 0 1 2 2v.5"></path>
              <path d="M16.5 19H19a2 2 0 0 0 0-4h-5"></path>
              <path d="M11 13h5a2 2 0 1 1 0 4h-4"></path>
              <path d="M6 16a2 2 0 0 0-2 2"></path>
              <path d="m3 3 18 18"></path>
            </svg>
          </div>
        );
      default:
        return (
          <div className={`p-2 rounded-full ${
            isDark
              ? 'bg-gray-700 text-gray-400'
              : 'bg-gray-100 text-gray-600'
          }`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
              <path d="m12 17 5-5-5-5"></path>
              <path d="M7 12h10"></path>
            </svg>
          </div>
        );
    }
  };
  
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds} seconds ago`;
    
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  };
  
  const getActivityText = (activity) => {
    switch(activity.type) {
      case 'watering':
        return `${t('activity.watered', 'Watered')} ${activity.plantName} (${activity.details.amount})`;
      case 'fertilizing':
        return `${t('activity.fertilized', 'Fertilized')} ${activity.plantName}`;
      case 'repotting':
        return `${t('activity.repotted', 'Repotted')} ${activity.plantName}`;
      case 'pruning':
        return `${t('activity.pruned', 'Pruned')} ${activity.plantName}`;
      default:
        return `${t('activity.updated', 'Updated')} ${activity.plantName}`;
    }
  };
  
  if (activities.length === 0) {
    return (
      <div className="text-center py-4">
        <p className={`text-sm ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>{t('activity.noRecent', 'No recent activity')}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start">
          {getActivityIcon(activity.type)}
          <div className="ml-3">
            <p className={`text-sm font-medium ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              {getActivityText(activity)}
            </p>
            <p className={`text-xs ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {formatTimeAgo(activity.timestamp)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}