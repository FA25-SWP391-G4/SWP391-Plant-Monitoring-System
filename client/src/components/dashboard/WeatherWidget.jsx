import React from 'react';
import { useTranslation } from 'react-i18next';

export default function WeatherWidget() {
  const { t } = useTranslation();
  
  // Mock weather data - would come from API in a real app
  const weatherData = {
    temperature: 22,
    condition: 'partly-cloudy',
    humidity: 65,
    wind: 8,
    forecast: [
      { day: 'Today', high: 22, low: 15, condition: 'partly-cloudy' },
      { day: 'Tomorrow', high: 24, low: 16, condition: 'sunny' },
      { day: 'Wed', high: 20, low: 14, condition: 'rainy' }
    ]
  };
  
  const getWeatherIcon = (condition) => {
    switch(condition) {
      case 'sunny':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
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
        );
      case 'rainy':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
            <path d="M16 14v6"></path>
            <path d="M8 14v6"></path>
            <path d="M12 16v6"></path>
          </svg>
        );
      case 'partly-cloudy':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
            <path d="M12 2v2"></path>
            <path d="m4.93 4.93 1.41 1.41"></path>
            <path d="M20 12h2"></path>
            <path d="m19.07 4.93-1.41 1.41"></path>
            <path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"></path>
            <path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"></path>
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
          </svg>
        );
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Current weather */}
      <div className="p-5 border-b border-gray-100">
        <h3 className="font-medium text-gray-900 mb-4">{t('dashboard.weather', 'Local Weather')}</h3>
        
        <div className="flex items-center">
          <div className="flex-1">
            <div className="text-3xl font-semibold text-gray-900">{weatherData.temperature}°C</div>
            <div className="text-sm text-gray-500">{t('weather.humidity', 'Humidity')}: {weatherData.humidity}%</div>
            <div className="text-sm text-gray-500">{t('weather.wind', 'Wind')}: {weatherData.wind} km/h</div>
          </div>
          
          <div className="w-16 h-16 flex items-center justify-center">
            {getWeatherIcon(weatherData.condition)}
          </div>
        </div>
      </div>
      
      {/* 3-day forecast */}
      <div className="grid grid-cols-3 divide-x divide-gray-100">
        {weatherData.forecast.map((day, index) => (
          <div key={index} className="p-3 text-center">
            <div className="text-sm font-medium">{day.day}</div>
            <div className="my-2 flex justify-center">
              {getWeatherIcon(day.condition)}
            </div>
            <div className="text-xs">
              <span className="font-medium">{day.high}°</span>
              <span className="text-gray-500 mx-1">/</span>
              <span className="text-gray-500">{day.low}°</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Plant tip based on weather */}
      <div className="bg-emerald-50 p-3 text-sm text-emerald-800 flex items-start">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-700 mr-2 flex-shrink-0 mt-0.5">
          <circle cx="12" cy="12" r="9"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{t('weather.tip', 'Warm day ahead. Consider watering your outdoor plants in the early evening.')}</span>
      </div>
    </div>
  );
}