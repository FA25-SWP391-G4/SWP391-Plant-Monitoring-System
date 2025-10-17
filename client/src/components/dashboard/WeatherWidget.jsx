import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

export default function WeatherWidget() {
  const { t } = useTranslation();
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchWeather = async () => {
      try {
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
              day: index === 0 ? 'Today' : 
                   index === 1 ? 'Tomorrow' : 
                   new Date(day.valid_date).toLocaleDateString('en-US', { weekday: 'short' }),
              high: Math.round(day.max_temp),
              low: Math.round(day.min_temp),
              condition: mapWeatherCode(day.weather.code)
            })).slice(0, 3)
          };
          
          setWeatherData(mappedData);
        } else {
          throw new Error('Invalid data format from weather API');
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setError(err.message);
        setLoading(false);
        
        // Fallback to default weather data if API fails
        setWeatherData({
          temperature: 22,
          condition: 'partly-cloudy',
          humidity: 65,
          wind: 8,
          forecast: [
            { day: 'Today', high: 22, low: 15, condition: 'partly-cloudy' },
            { day: 'Tomorrow', high: 24, low: 16, condition: 'sunny' },
            { day: 'Wed', high: 20, low: 14, condition: 'rainy' }
          ]
        });
      }
    };
    
    fetchWeather();
    
    // Refresh weather data every 30 minutes
    const intervalId = setInterval(fetchWeather, 30 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);
  
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-5">
        <h3 className="font-medium text-gray-900 mb-4">{t('dashboard.weather', 'Local Weather')}</h3>
        <div className="flex justify-center items-center h-40">
          <div className="animate-pulse flex space-x-4">
            <div className="rounded-full bg-slate-200 h-10 w-10"></div>
            <div className="flex-1 space-y-6 py-1">
              <div className="h-2 bg-slate-200 rounded"></div>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="h-2 bg-slate-200 rounded col-span-2"></div>
                  <div className="h-2 bg-slate-200 rounded col-span-1"></div>
                </div>
                <div className="h-2 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !weatherData) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-5">
        <h3 className="font-medium text-gray-900 mb-4">{t('dashboard.weather', 'Local Weather')}</h3>
        <div className="p-4 text-center text-red-500">
          <p>{t('weather.error', 'Unable to fetch weather data')}</p>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

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
        <span>{getWeatherTip(weatherData)}</span>
      </div>
    </div>
  );
}