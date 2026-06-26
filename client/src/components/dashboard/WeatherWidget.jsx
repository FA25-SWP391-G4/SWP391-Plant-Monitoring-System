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

  // Hide the widget if weather widget is disabled in settings
  if (!settings.widgets?.showWeatherWidget) {
    return null;
  }

  // Widget settings
  const showTitles = settings?.widgets?.showWidgetTitles ?? true;
  const showIcons = settings?.widgets?.showWidgetIcons ?? true;
  const compactMode = settings?.widgets?.compactMode ?? false;
  const animationsEnabled = settings?.widgets?.animationsEnabled ?? true;
  
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Custom location and search states
  const [selectedCity, setSelectedCity] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('weather_selected_city') || '';
    }
    return '';
  });
  const [showSearch, setShowSearch] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  
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

  const fetchWeather = async () => {
    try {
      await fetchWithDebug(async () => {
        setLoading(true);
        setError(null);
        
        const openWeatherKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
        const weatherbitKey = process.env.NEXT_PUBLIC_WEATHERBIT_API_KEY;
        const apiKey = weatherbitKey || openWeatherKey;

        if (!apiKey) {
          throw new Error('Weather API key is not configured');
        }

        let lat = null, lon = null;
        let queryCity = selectedCity;

        // If no custom city is selected, try geolocation
        if (!queryCity) {
          try {
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
          } catch (geoErr) {
            console.warn('Geolocation failed or was denied, falling back to default city:', geoErr);
            queryCity = 'Hanoi';
          }
        }

        // If still no lat/lon and no city name (e.g., geolocation not supported), use default city
        if (!lat && !lon && !queryCity) {
          queryCity = 'Hanoi';
        }

        let mappedData = null;

        if (weatherbitKey) {
          // Call Weatherbit API
          let url = '';
          let forecastUrl = '';
          
          if (queryCity) {
            url = `https://api.weatherbit.io/v2.0/current?city=${encodeURIComponent(queryCity)}&key=${weatherbitKey}&units=M`;
            forecastUrl = `https://api.weatherbit.io/v2.0/forecast/daily?city=${encodeURIComponent(queryCity)}&key=${weatherbitKey}&units=M&days=3`;
          } else {
            url = `https://api.weatherbit.io/v2.0/current?lat=${lat}&lon=${lon}&key=${weatherbitKey}&units=M`;
            forecastUrl = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${weatherbitKey}&units=M&days=3`;
          }

          const [response, forecastResponse] = await Promise.all([
            axios.get(url),
            axios.get(forecastUrl)
          ]);

          if (response.data && response.data.data && response.data.data[0]) {
            const currentWeather = response.data.data[0];
            const dailyForecasts = [];

            if (forecastResponse.data && forecastResponse.data.data) {
              forecastResponse.data.data.slice(0, 3).forEach((item, index) => {
                const date = new Date(item.ts * 1000);
                dailyForecasts.push({
                  day: getLocalizedWeekday(date, index === 0, index === 1),
                  high: Math.round(item.high_temp || item.max_temp || 0),
                  low: Math.round(item.low_temp || item.min_temp || 0),
                  condition: mapWeatherCode(item.weather.code)
                });
              });
            }

            mappedData = {
              temperature: Math.round(currentWeather.temp),
              condition: mapWeatherCode(currentWeather.weather.code),
              humidity: currentWeather.rh,
              wind: Math.round(currentWeather.wind_spd * 3.6),
              location: currentWeather.city_name,
              forecast: dailyForecasts
            };
          } else {
            throw new Error('Invalid data format from Weatherbit API');
          }
        } else if (openWeatherKey) {
          // Call OpenWeatherMap API
          let url = '';
          let forecastUrl = '';
          
          if (queryCity) {
            url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(queryCity)}&appid=${openWeatherKey}&units=metric`;
            forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(queryCity)}&appid=${openWeatherKey}&units=metric`;
          } else {
            url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${openWeatherKey}&units=metric`;
            forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${openWeatherKey}&units=metric`;
          }

          const [response, forecastResponse] = await Promise.all([
            axios.get(url),
            axios.get(forecastUrl)
          ]);

          if (response.data && response.data.main) {
            const currentWeather = response.data;
            const dailyForecasts = [];

            if (forecastResponse.data && forecastResponse.data.list) {
              const forecastList = forecastResponse.data.list;
              const dailyData = {};

              forecastList.forEach(item => {
                const date = new Date(item.dt * 1000);
                const dateStr = date.toDateString();

                if (!dailyData[dateStr]) {
                  dailyData[dateStr] = {
                    date: date,
                    temps: [],
                    conditions: [],
                    weatherIds: []
                  };
                }

                dailyData[dateStr].temps.push(item.main.temp);
                dailyData[dateStr].conditions.push(item.weather[0].main);
                dailyData[dateStr].weatherIds.push(item.weather[0].id);
              });

              const dates = Object.keys(dailyData).slice(0, 3);
              dates.forEach((dateStr, index) => {
                const data = dailyData[dateStr];
                const high = Math.round(Math.max(...data.temps));
                const low = Math.round(Math.min(...data.temps));

                const mostFrequentId = data.weatherIds
                  .sort((a, b) => data.weatherIds.filter(v => v === a).length - data.weatherIds.filter(v => v === b).length)
                  .pop();

                dailyForecasts.push({
                  day: getLocalizedWeekday(data.date, index === 0, index === 1),
                  high: high,
                  low: low,
                  condition: mapWeatherCode(mostFrequentId)
                });
              });
            }

            mappedData = {
              temperature: Math.round(currentWeather.main.temp),
              condition: mapWeatherCode(currentWeather.weather[0].id),
              humidity: currentWeather.main.humidity,
              wind: Math.round(currentWeather.wind.speed * 3.6),
              location: currentWeather.name,
              forecast: dailyForecasts
            };
          } else {
            throw new Error('Invalid data format from OpenWeatherMap API');
          }
        }

        setWeatherData(mappedData);
        setLastUpdated(new Date());
        setLoading(false);
        setError(null);
      }, 'weather-data-fetch');
    } catch (err) {
      console.error('Error fetching weather data:', err);
      setLoading(false);
      
      let errorMessage = t('weather.error.general', 'Unable to fetch weather data');
      
      if (err.message && err.message.includes('API key')) {
        errorMessage = t('weather.error.apiKey', 'Weather service configuration error');
      } else if (err.response?.status === 401) {
        errorMessage = t('weather.error.unauthorized', 'Weather service authentication failed');
      } else if (err.response?.status === 404) {
        errorMessage = t('weather.error.notFound', 'City not found');
      } else if (err.response?.status >= 500) {
        errorMessage = t('weather.error.serverError', 'Weather service temporarily unavailable');
      } else if (err.code === 'NETWORK_ERROR' || !navigator.onLine) {
        errorMessage = t('weather.error.network', 'Check your internet connection');
      }
      
      setError(errorMessage);
      setWeatherData({
        error: true,
        message: errorMessage
      });
    }
  };

  useEffect(() => {
    fetchWeather();
    
    // Refresh weather data every 30 minutes
    const intervalId = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [t, selectedCity]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      const city = searchInput.trim();
      setSelectedCity(city);
      if (typeof window !== 'undefined') {
        localStorage.setItem('weather_selected_city', city);
      }
      setShowSearch(false);
    }
  };

  const handleResetLocation = () => {
    setSelectedCity('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('weather_selected_city');
    }
    setSearchInput('');
    setShowSearch(false);
  };
  
  // Map OpenWeatherMap weather IDs to our simplified condition categories
  const mapWeatherCode = (weatherId) => {
    // Thunderstorm (200-232)
    if (weatherId >= 200 && weatherId < 300) return 'rainy';
    // Drizzle (300-321)
    if (weatherId >= 300 && weatherId < 400) return 'rainy';
    // Rain (500-531)
    if (weatherId >= 500 && weatherId < 600) return 'rainy';
    // Snow (600-622)
    if (weatherId >= 600 && weatherId < 700) return 'rainy';
    // Atmosphere (701-781) - mist, smoke, haze, dust, fog, sand, dust, ash, squalls, tornado
    if (weatherId >= 700 && weatherId < 800) return 'partly-cloudy';
    // Clear sky (800)
    if (weatherId === 800) return 'sunny';
    // Clouds (801-804) - few clouds, scattered clouds, broken clouds, overcast clouds
    if (weatherId >= 801 && weatherId <= 804) return 'partly-cloudy';
    
    return 'partly-cloudy'; // Default fallback
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
      <div className={`rounded-xl shadow-sm border overflow-hidden ${compactMode ? 'p-3 h-32' : 'p-5 h-60'} ${animationsEnabled ? 'transition-all duration-200 ease-in-out' : ''} ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${showTitles ? 'font-medium' : 'hidden'} ${
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

  if (error || (weatherData && weatherData.error)) {
    return (
      <div className={`rounded-xl shadow-sm border overflow-hidden ${compactMode ? 'p-3' : 'p-5'} ${animationsEnabled ? 'transition-all duration-200 ease-in-out' : ''} ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`${showTitles ? 'font-medium' : 'hidden'} ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>{t('dashboard.weather', 'Local Weather')}</h3>
          {selectedCity && (
            <button
              onClick={handleResetLocation}
              title={t('weather.useMyLocation', 'Use Geolocation')}
              className={`p-1 rounded-md transition-colors ${
                isDark ? 'hover:bg-gray-700 text-emerald-400 hover:text-emerald-300' : 'hover:bg-gray-100 text-emerald-600 hover:text-emerald-700'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 2v2M12 20v2M4 12H2M20 12h2"></path>
              </svg>
            </button>
          )}
        </div>
        <div className="p-4 text-center">
          <div className="flex items-center justify-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          </div>
          <p className="text-red-500 dark:text-red-400 font-medium text-sm mb-3">
            {error || weatherData?.message || t('weather.error.general', 'Unable to fetch weather data')}
          </p>
          
          <form onSubmit={handleSearchSubmit} className="flex items-center max-w-xs mx-auto gap-2 mb-3">
            <input
              type="text"
              placeholder={t('weather.enterCity', 'Enter city (e.g. Hanoi)...')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={`flex-1 text-xs px-2.5 py-1.5 rounded-lg border outline-none ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
              }`}
            />
            <button 
              type="submit" 
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDark 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white'
              }`}
            >
              {t('weather.search', 'Search')}
            </button>
          </form>

          <div className="flex items-center justify-center gap-2">
            <button 
              onClick={fetchWeather} 
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {t('weather.retry', 'Try Again')}
            </button>
            {selectedCity && (
              <button 
                onClick={handleResetLocation} 
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isDark 
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                {t('weather.reset', 'Reset to GPS')}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl shadow-sm border overflow-hidden ${animationsEnabled ? 'transition-all duration-200 ease-in-out hover:shadow-md' : ''} ${
      isDark 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-100'
    }`}>
      {/* Current weather */}
      <div className={`${compactMode ? 'p-3' : 'p-5'} border-b ${
        isDark ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <div className="flex items-center justify-between mb-4 min-h-[28px]">
          {showSearch ? (
            <form onSubmit={handleSearchSubmit} className="flex items-center w-full gap-2">
              <input
                type="text"
                placeholder={t('weather.searchPlaceholder', 'Enter city...')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`flex-1 text-xs px-2 py-1 rounded border outline-none ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                }`}
                autoFocus
              />
              <button 
                type="submit" 
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-emerald-600 dark:text-emerald-400"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </button>
              <button 
                type="button" 
                onClick={() => { setShowSearch(false); setSearchInput(''); }}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </form>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <h3 className={`${showTitles ? 'font-medium' : 'hidden'} ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>{t('dashboard.weather', 'Local Weather')}</h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowSearch(true)}
                    title={t('weather.searchLocation', 'Search City')}
                    className={`p-1 rounded-md transition-colors ${
                      isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </button>
                  {selectedCity && (
                    <button
                      onClick={handleResetLocation}
                      title={t('weather.useMyLocation', 'Use Geolocation')}
                      className={`p-1 rounded-md transition-colors ${
                        isDark ? 'hover:bg-gray-700 text-emerald-400 hover:text-emerald-300' : 'hover:bg-gray-100 text-emerald-600 hover:text-emerald-700'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 2v2M12 20v2M4 12H2M20 12h2"></path>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {lastUpdated && (
                <span className={`text-[10px] ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {formatDateTime(
                    lastUpdated, 
                    settings.language.dateFormat,
                    settings.language.timeFormat === '24h'
                  )}
                </span>
              )}
            </>
          )}
        </div>
        
        <div className="flex items-center">
          <div className="flex-1">
            <div className={`text-3xl font-semibold ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>{weatherData.temperature}°C</div>
            {weatherData.location && (
              <div className={`text-sm font-medium ${
                isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>{weatherData.location}</div>
            )}
            <div className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>{t('weather.humidity', 'Humidity')}: {weatherData.humidity}%</div>
            <div className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>{t('weather.wind', 'Wind')}: {weatherData.wind} km/h</div>
          </div>
          
          <div className="w-16 h-16 flex items-center justify-center">
            {showIcons && getWeatherIcon(weatherData.condition)}
          </div>
        </div>
      </div>
      
      {/* 3-day forecast */}
      {weatherData.forecast && weatherData.forecast.length > 0 && (
        <div className={`grid grid-cols-3 divide-x ${
          isDark ? 'divide-gray-700' : 'divide-gray-100'
        }`}>
          {weatherData.forecast.map((day, index) => (
            <div key={index} className={`${compactMode ? 'p-2' : 'p-3'} text-center`}>
              <div className={`text-sm font-medium ${
                isDark ? 'text-gray-200' : 'text-gray-900'
              }`}>{day.day}</div>
              <div className="my-2 flex justify-center">
                {showIcons && getWeatherIcon(day.condition)}
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
      )}
      
      {/* Plant tip based on weather */}
      <div className={`${compactMode ? 'p-2' : 'p-3'} text-sm flex items-start ${
        isDark 
          ? 'bg-emerald-900/30 text-emerald-200' 
          : 'bg-emerald-50 text-emerald-800'
      }`}>
        {showIcons && (
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`mr-2 flex-shrink-0 mt-0.5 ${
            isDark ? 'text-emerald-300' : 'text-emerald-700'
          }`}>
            <circle cx="12" cy="12" r="9"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        )}
        <span>{getWeatherTip(weatherData)}</span>
      </div>
    </div>
  );
}