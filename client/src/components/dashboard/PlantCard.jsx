import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function PlantCard({ plant, sensorData = {} }) {
  const { t } = useTranslation();
  
  // Calculate health status and water status
  const getStatusInfo = () => {
    if (plant.status === 'healthy') {
      return { 
        color: 'text-emerald-600', 
        bgColor: 'bg-emerald-100', 
        text: t('status.healthy', 'Healthy'),
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <path d="m9 11 3 3L22 4"></path>
          </svg>
        )
      };
    }
    
    if (plant.status === 'needs_water') {
      return {
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        text: t('status.needsWater', 'Needs Water'),
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"></path>
          </svg>
        )
      };
    }
    
    return {
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      text: t('status.needsAttention', 'Needs Attention'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      )
    };
  };

  const statusInfo = getStatusInfo();
  const lastWateredDate = new Date(plant.lastWatered).toLocaleDateString();
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row hover:shadow-md transition-shadow">
      {/* Plant Image */}
      <div className="w-full sm:w-40 h-40 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden mb-4 sm:mb-0 sm:mr-6">
        {plant.image ? (
          <img 
            src={plant.image} 
            alt={plant.name} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
            <path d="M12 10a6 6 0 0 0-6-6H4v12h2a6 6 0 0 0 6-6Z"></path>
            <path d="M12 10a6 6 0 0 1 6-6h2v12h-2a6 6 0 0 1-6-6Z"></path>
            <path d="M12 22v-8.3"></path>
          </svg>
        )}
      </div>
      
      {/* Plant Info */}
      <div className="flex-1">
        {/* Plant name and status */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{plant.name}</h3>
            <p className="text-sm text-gray-500">{plant.species}</p>
          </div>
          <div className={`${statusInfo.bgColor} ${statusInfo.color} px-2 py-1 rounded-full flex items-center text-xs font-medium`}>
            {statusInfo.icon}
            {statusInfo.text}
          </div>
        </div>
        
        {/* Plant Location */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          {plant.location}
        </div>
        
        {/* Sensor data */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {/* Moisture level */}
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">{t('metrics.moisture', 'Moisture')}</span>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mr-1">
                <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 15 5 15a7 7 0 0 0 7 7z"></path>
              </svg>
              <span className="font-medium">{sensorData?.soil_moisture ?? 'N/A'}%</span>
            </div>
          </div>
          
          {/* Temperature */}
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">{t('metrics.temperature', 'Temperature')}</span>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mr-1">
                <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"></path>
              </svg>
              <span className="font-medium">{sensorData?.temperature || 'N/A'}°C</span>
            </div>
          </div>
          
          {/* Light level */}
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 mb-1">{t('metrics.light', 'Light')}</span>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 mr-1">
                <circle cx="12" cy="12" r="4"></circle>
                <path d="M12 2v2"></path>
                <path d="M12 20v2"></path>
                <path d="m4.93 4.93 1.41 1.41"></path>
                <path d="m17.66 17.66 1.41 1.41"></path>
                <path d="M2 12h2"></path>
                <path d="M20 12h2"></path>
                <path d="m6.34 17.66-1.41 1.41"></path>
                <path d="m19.07 4.93-1.41 1.41"></path>
              </svg>
              <span className="font-medium">{sensorData?.light_intensity ?? 'N/A'}lux</span>
            </div>
          </div>
        </div>
        
        {/* Last watered */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          {t('plants.lastWatered', 'Last watered')}: {lastWateredDate}
        </div>
        
        {/* AI Prediction Banner */}
        {sensorData?.moisture && sensorData.moisture < 40 && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3 mb-4">
            <div className="flex items-center">
              <div className="text-blue-600 mr-2">🤖</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">
                  {t('ai.prediction.wateringSoon', 'AI predicts watering needed in 2 days')}
                </p>
                <p className="text-xs text-blue-700">
                  {t('ai.prediction.confidence', 'Confidence: 89%')} • {t('ai.prediction.amount', 'Recommended: 250ml')}
                </p>
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                {t('ai.prediction.details', 'Details')}
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Link href={`/plants/${plant.plant_id}`} className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition-colors">
            {t('common.viewDetails', 'View Details')}
          </Link>
          <button className="px-3 py-1.5 bg-blue-50 text-blue-600 text-sm rounded hover:bg-blue-100 transition-colors border border-blue-200">
            {t('plants.water', 'Water Now')}
          </button>
          <Link href={`/ai/chat?plant=${plant.plant_id}`} className="px-3 py-1.5 bg-purple-50 text-purple-600 text-sm rounded hover:bg-purple-100 transition-colors border border-purple-200">
            {t('ai.askAI', 'Ask AI')}
          </Link>
          <button className="px-3 py-1.5 bg-gray-50 text-gray-600 text-sm rounded hover:bg-gray-100 transition-colors">
            {t('plants.log', 'Log Activity')}
          </button>
        </div>
      </div>
    </div>
  );
}