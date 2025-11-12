import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/providers/SettingsProvider';
import { formatDateTime } from '@/utils/dateFormat';
import axios from 'axios';
import ThemedLoader from '../ThemedLoader';
import { format } from 'date-fns';
import { useRenderDebug, useDataFetchDebug } from '@/utils/renderDebug';

export default function WeatherWidget() {
  const { t } = useTranslation();
  const { isDark, themeColors } = useTheme();
  const { settings } = useSettings();

  // Hide the widget if weather info is disabled in settings
  if (!settings.dashboard.showWeatherInfo) {
    return null;
  }
  
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // 🚀 RENDER DEBUG
  const renderDebug = useRenderDebug('WeatherWidget', {
    hasWeatherData: !!weatherData,
    loading,
    hasError: !!error,
    lastUpdated,
    isDark
  });
  
  const { fetchState, fetchWithDebug } = useDataFetchDebug('WeatherWidget');
  
  // Get current locale for date formatting
  const getCurrentLocale = () => {
    const language = t('locale', 'en-US');
    // Map supported languages to proper locale codes
    const localeMap = {
      'en': 'en-US',
      'ja': 'ja-JP', 
      'zh': 'zh-CN',
      'kr': 'ko-KR',
      'vi': 'vi-VN',
      'fr': 'fr-FR'
    };
    
    const currentLang = language.split('-')[0];
    return localeMap[currentLang] || 'en-US';
  };

  // Get time format based on locale (12-hour for en/fr, 24-hour for others)
  const getTimeFormat = () => {
    const language = t('locale', 'en-US');
    const currentLang = language.split('-')[0];
    
    // 12-hour format for English and French
    const use12HourFormat = ['en', 'fr'].includes(currentLang);
    return use12HourFormat;
  };

  // Get localized weekday names
  const getLocalizedWeekday = (date, isToday = false, isTomorrow = false) => {
    if (isToday) {
      return t('weather.today', 'Today');
    }
    if (isTomorrow) {
      return t('weather.tomorrow', 'Tomorrow');
    }
    
    const currentLang = t('locale', 'en-US').split('-')[0];
    const locale = getCurrentLocale();
    const dayIndex = new Date(date).getDay();
    
    // For languages supported by API (en, ja, zh), use browser's localization
    const apiSupportedLanguages = ['en', 'ja', 'zh'];
    if (apiSupportedLanguages.includes(currentLang)) {
      return new Date(date).toLocaleDateString(locale, { weekday: 'short' });
    }
    
    // For other languages, use direct translation key access
    const weekdayTranslations = {
      kr: ['일', '월', '화', '수', '목', '금', '토'],
      vi: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
      fr: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
    };
    
    if (weekdayTranslations[currentLang]) {
      return weekdayTranslations[currentLang][dayIndex];
    }
    
    // Try to get from translation file as fallback
    try {
      const weekdays = t('weather.weekdays.short', { returnObjects: true });
      console.log('Translation file weekdays:', weekdays);
      if (Array.isArray(weekdays) && weekdays[dayIndex]) {
        const result = weekdays[dayIndex];
        console.log('Using translation file result:', result);
        return result;
      }
    } catch (error) {
      console.warn('Failed to get localized weekdays from translation:', error);
    }
    
    // Final fallback to English
    const fallback = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
    console.log('Using fallback result:', fallback);
    return fallback;
  };

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        await fetchWithDebug(async () => {
          setLoading(true);
          
          // Default to Hanoi coordinates if geolocation is not available
          let lat = 21.0278;
          let lon = 105.8342;
          
          // Try to get user's location
          if (navigator.geolocation) {
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                maximumAge: 60000 // Cache for 1 minute
              });
            });
            
            lat = position.coords.latitude;
            lon = position.coords.longitude;
          }
          
          // Fetch current weather data from Weatherbit API
          const apiKey = process.env.NEXT_PUBLIC_WEATHERBIT_API_KEY;
          const response = await axios.get(`https://api.weatherbit.io/v2.0/current?lat=${lat}&lon=${lon}&key=${apiKey}`);
          
          if (response.data && response.data.data && response.data.data[0]) {
            const currentWeather = response.data.data[0];
          
          // Get forecast data for next 3 days
          const forecastResponse = await axios.get(`https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&days=3&key=${apiKey}`);
          
          // Map API data to our format
          const mappedData = {
            temperature: Math.round(currentWeather.temp),
            condition: mapWeatherCode(currentWeather.weather.code),
            humidity: currentWeather.rh,
            wind: Math.round(currentWeather.wind_spd * 3.6), // Convert m/s to km/h
            forecast: forecastResponse.data.data.map((day, index) => ({
              day: getLocalizedWeekday(day.valid_date, index === 0, index === 1),
              high: Math.round(day.max_temp),
              low: Math.round(day.min_temp),
              condition: mapWeatherCode(day.weather.code)
            })).slice(0, 3)
          };
          
            setWeatherData(mappedData);
            setLastUpdated(new Date());
            setLoading(false);
            return mappedData;
          } else {
            throw new Error('Invalid data format from weather API');
          }
        }, 'weather-data-fetch');
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError(err.message);
        setLoading(false);
        
        // Fallback to default weather data if API fails
        const today = new Date();
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        const dayAfter = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
        
        setWeatherData({
          temperature: 22,
          condition: 'partly-cloudy',
          humidity: 65,
          wind: 8,
          forecast: [
            { day: getLocalizedWeekday(today, true, false), high: 22, low: 15, condition: 'partly-cloudy' },
            { day: getLocalizedWeekday(tomorrow, false, true), high: 24, low: 16, condition: 'sunny' },
            { day: getLocalizedWeekday(dayAfter, false, false), high: 20, low: 14, condition: 'rainy' }
          ]
        });
        setLastUpdated(new Date());
      }
    };
    
    fetchWeather();
    
    // Refresh weather data every 30 minutes
    const intervalId = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [t]); // Re-fetch when language changes
  
  // Map Weatherbit weather codes to our simplified condition categories
  const mapWeatherCode = (code) => {
    // Thunderstorm
    if (code >= 200 && code < 300) return 'rainy';
    // Drizzle and Rain
    if ((code >= 300 && code < 400) || (code >= 500 && code < 600)) return 'rainy';
    // Snow
    if (code >= 600 && code < 700) return 'rainy';
    // Atmosphere (fog, haze, etc.)
    if (code >= 700 && code < 800) return 'partly-cloudy';
    // Clear
    if (code === 800) return 'sunny';
    // Clouds
    if (code > 800 && code < 900) return 'partly-cloudy';
    
    return 'partly-cloudy'; // Default
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
  
  const getWeatherTip = (weatherData) => {
    if (!weatherData) return t('weather.tip.default', 'Check weather conditions for plant care recommendations.');
    
    if (weatherData.condition === 'sunny' && weatherData.temperature > 28) {
      return t('weather.tip.hot', 'Hot day ahead. Water your plants early morning or evening to prevent evaporation.');
    } else if (weatherData.condition === 'rainy') {
      return t('weather.tip.rainy', 'Rainy weather. Check indoor plants for proper drainage to prevent root rot.');
    } else if (weatherData.humidity < 40) {
      return t('weather.tip.dry', 'Low humidity. Consider misting your tropical plants to increase humidity.');
    } else if (weatherData.wind > 20) {
      return t('weather.tip.windy', 'Windy conditions. Move delicate potted plants to sheltered locations.');
    }
    
    return t('weather.tip.default', 'Monitor soil moisture daily based on current weather conditions.');
  };

  if (loading) {
    return (
      <div className={`rounded-xl shadow-sm border overflow-hidden p-5 h-40 ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-medium ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>{t('dashboard.weather', 'Local Weather')}</h3>
        </div>
        <ThemedLoader 
          size="lg" 
          showText={true} 
          text={t('weather.loading', 'Loading weather data...')}
          className="h-32"
        />
      </div>
    );
  }

  if (error && !weatherData) {
    return (
      <div className={`rounded-xl shadow-sm border overflow-hidden p-5 ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-medium ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>{t('dashboard.weather', 'Local Weather')}</h3>
        </div>
        <div className="p-4 text-center text-red-500 dark:text-red-400">
          <p>{t('weather.error', 'Unable to fetch weather data')}</p>
          <p className={`text-sm mt-2 ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-sm border overflow-hidden ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-100'
    }`}>
      {/* Current weather */}
      <div className={`p-5 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-medium ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>{t('dashboard.weather', 'Local Weather')}</h3>
          {lastUpdated && (
            <span className={`text-xs ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {t('weather.updatedAt', 'Updated at')} {formatDateTime(
                lastUpdated, 
                settings.language.dateFormat,
                settings.language.timeFormat === '24h'
              )}
            </span>
          )}
        </div>
        
        <div className="flex items-center">
          <div className="flex-1">
            <div className={`text-3xl font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>{weatherData.temperature}°C</div>
            <div className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>{t('weather.humidity', 'Humidity')}: {weatherData.humidity}%</div>
            <div className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>{t('weather.wind', 'Wind')}: {weatherData.wind} km/h</div>
          </div>
          
          <div className="w-16 h-16 flex items-center justify-center">
            {getWeatherIcon(weatherData.condition)}
          </div>
        </div>
      </div>
      
      {/* 3-day forecast */}
      <div className={`grid grid-cols-3 divide-x ${
        isDark ? 'divide-gray-700' : 'divide-gray-100'
      }`}>
        {weatherData.forecast.map((day, index) => (
          <div key={index} className="p-3 text-center">
            <div className={`text-sm font-medium ${
              isDark ? 'text-gray-200' : 'text-gray-900'
            }`}>{day.day}</div>
            <div className="my-2 flex justify-center">
              {getWeatherIcon(day.condition)}
            </div>
            <div className="text-xs">
              <span className={`font-medium ${
                isDark ? 'text-gray-200' : 'text-gray-900'
              }`}>{day.high}°</span>
              <span className={`mx-1 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>/</span>
              <span className={`${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>{day.low}°</span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Plant tip based on weather */}
      <div className={`p-3 text-sm flex items-start ${
        isDark 
          ? 'bg-emerald-900/30 text-emerald-200' 
          : 'bg-emerald-50 text-emerald-800'
      }`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`mr-2 flex-shrink-0 mt-0.5 ${
          isDark ? 'text-emerald-300' : 'text-emerald-700'
        }`}>
          <circle cx="12" cy="12" r="9"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>{getWeatherTip(weatherData)}</span>
      </div>
    </div>
  );
}