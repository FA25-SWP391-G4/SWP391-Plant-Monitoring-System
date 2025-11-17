import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion';
import PlantHistoryChart from './PlantHistoryChart';
import ManualWateringControl from './ManualWateringControl';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/providers/SettingsProvider';
import sensorApi from '@/api/sensorApi';
import deviceApi from '@/api/deviceApi';
import { plantApi } from '@/api';
import { formatDate, formatTime } from '@/utils/dateFormat';

export default function PlantCard({ plant, sensorData = {} }) {
  const { t } = useTranslation();
  const { isDark, themeColors } = useTheme();
  const { settings } = useSettings();

  // Widget/settings derived flags
  const showTitles = settings?.widgets?.showWidgetTitles ?? true;
  const showIcons = settings?.widgets?.showWidgetIcons ?? true;
  const compactMode = settings?.widgets?.compactMode ?? false;
  const animationsEnabled = settings?.widgets?.animationsEnabled ?? true;
  const enableAI = settings?.widgets?.enableAIFeatures ?? true;
  const [showHistory, setShowHistory] = useState(false);
  const [activeChart, setActiveChart] = useState('soil_moisture');
  const [sensorHistory, setSensorHistory] = useState(null);
  const [lastWatered, setLastWatered] = useState(null);
  const [wateringHistory, setWateringHistory] = useState(null);
  const [showWateringLog, setShowWateringLog] = useState(false);
  const [showWateringControls, setShowWateringControls] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

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

  const locale = getCurrentLocale();

    const loadSensorHistory = async () => {
    if (!showHistory) return;
    try {
      const response = await plantApi.getSensorHistory(plant.plant_id);
      
      // Transform the API response data for chart consumption
      if (response?.data && Array.isArray(response.data)) {
        const transformedData = {
          soil_moisture: response.data.map(item => ({
            timestamp: item.timestamp,
            value: item.soil_moisture
          })).filter(item => item.value !== null),
          
          temperature: response.data.map(item => ({
            timestamp: item.timestamp,
            value: item.temperature
          })).filter(item => item.value !== null),
          
          air_humidity: response.data.map(item => ({
            timestamp: item.timestamp,
            value: item.air_humidity
          })).filter(item => item.value !== null),
          
          light_intensity: response.data.map(item => ({
            timestamp: item.timestamp,
            value: item.light_intensity
          })).filter(item => item.value !== null)
        };
        
        setSensorHistory(transformedData);
      } else {
        // Fallback for empty or invalid response
        setSensorHistory({
          soil_moisture: [],
          temperature: [],
          air_humidity: [],
          light_intensity: []
        });
      }
    } catch (error) {
      console.error('Error loading sensor history:', error);
      // Set empty arrays on error
      setSensorHistory({
        soil_moisture: [],
        temperature: [],
        air_humidity: [],
        light_intensity: []
      });
    }
  };

  const loadLastWatered = async () => {
    try {
      const lastWateredData = await plantApi.getLastWatered(plant.plant_id);
      setLastWatered(lastWateredData);
    } catch (error) {
      console.error('Error loading last watered info:', error);
    }
  };

  const loadWateringHistory = async () => {
    try {
      const history = await plantApi.getWateringHistory(plant.plant_id);
      setWateringHistory(history);
    } catch (error) {
      console.error('Error loading watering history:', error);
    }
  };

  useEffect(() => {
    if (showHistory) {
      loadSensorHistory();
    }
  }, [showHistory, plant.plant_id]);

  useEffect(() => {
    // Load last watered info on component mount
    loadLastWatered();
  }, [plant.plant_id]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIsRefreshing(true);

      Promise.all([
        loadLastWatered(),
        getDeviceStatus(),
        loadSensorHistory(),
        loadWateringHistory()
      ])
        .catch((error) => {
          console.error('Error refreshing plant card data:', error);
        })
        .finally(() => {
          setLastRefresh(new Date());
          setIsRefreshing(false);
        });
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [plant.plant_id]);

  // Calculate device status based on last sensor data timestamp
  const getDeviceStatus = () => {
    const now = new Date();
    // Priority: realtime sensorData (from prop) -> plant.device_last_seen -> plant.last_sensor_data

    // Find first valid timestamp candidate
    let lastUpdate = null;
    const parsed = new Date(sensorData?.timestamp);

    // If no timestamp available, treat as offline
    if (!isNaN(parsed.getTime())) return 'offline';

    const timeDiffMinutes = (now - lastUpdate) / (1000 * 60);
    const THRESHOLD_MINUTES = 5; // adjust if you want a different recency window
    return timeDiffMinutes <= THRESHOLD_MINUTES ? 'online' : 'offline';
  };
  
  const deviceStatus = getDeviceStatus();
  
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
  
  // Get last watered date from API data or fallback to plant data
  const getLastWateredDisplay = () => {
    if (lastWatered?.data?.last_watered) {
      const lastWateredDate = new Date(lastWatered.data.last_watered.timestamp);
      return {
        date: !isNaN(lastWateredDate.getTime()) ? lastWateredDate : null,
        timeAgo: lastWatered.data.last_watered.time_ago,
        triggerType: lastWatered.data.last_watered.trigger_type
      };
    }
    if (plant.lastWatered) {
      const plantLastWatered = new Date(plant.lastWatered);
      return {
        date: !isNaN(plantLastWatered.getTime()) ? plantLastWatered : null,
        timeAgo: null,
        triggerType: null
      };
    }
    return {
      date: null,
      timeAgo: null,
      triggerType: null
    };
  };

  const lastWateredInfo = getLastWateredDisplay();

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
    hover: { scale: 1.02, transition: { duration: 0.2 } }
  };
  
  return (
    <motion.div 
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={animationsEnabled ? "hover" : undefined}
      className={`rounded-xl shadow-sm border ${compactMode ? 'p-2' : 'p-4'} flex flex-col sm:flex-row hover:shadow-md transition-all ${animationsEnabled ? 'duration-200 ease-in-out fade-in' : ''} card-hover ${
      isDark
        ? 'bg-gray-800 border-gray-700'
        : 'bg-white border-gray-100'
    }`}>
      {/* Plant Image */}
      <div className={`w-full ${compactMode ? 'sm:w-24 h-24' : 'sm:w-40 h-40'} rounded-lg flex items-center justify-center overflow-hidden mb-4 sm:mb-0 sm:mr-6 ${
        isDark ? 'bg-gray-700' : 'bg-gray-100'
      }`}>
        {plant.image ? (
          <img 
            src={plant.image} 
            alt={plant.name} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className={
            isDark ? 'text-gray-500' : 'text-gray-300'
          }>
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
            <h3 className={`${showTitles ? (compactMode ? 'text-base font-semibold' : 'text-xl font-semibold') : 'hidden'} ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>{plant.name}</h3>
            <p className={`${showTitles ? 'text-sm' : 'hidden'} ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>{plant.species}</p>
          </div>
        <div className="flex items-center space-x-2">
          <div className={`${statusInfo.bgColor} ${statusInfo.color} px-2 py-1 rounded-full flex items-center text-xs font-medium`}>
            {showIcons && statusInfo.icon}
            {statusInfo.text}
          </div>
          {plant.device_key && (
          <div className={`px-2 py-1 rounded-full flex items-center text-xs font-medium ${
            deviceStatus === 'online' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            <div className={`w-2 h-2 rounded-full mr-1 ${
              deviceStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            {deviceStatus === 'online' ? t('device.online', 'Online') : t('device.offline', 'Offline')}
          </div>
          )}
          {/* Auto-refresh indicator */}
          <div className="flex items-center text-xs text-gray-400" title={`Last updated: ${lastRefresh.toLocaleTimeString(locale)}`}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="12" 
              height="12" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className={`${isRefreshing ? 'animate-spin' : ''}`}
            >
              <path d="M23 4v6h-6"/>
              <path d="M1 20v-6h6"/>
              <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10"/>
              <path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/>
            </svg>
          </div>
        </div>
        </div>
        
        {/* Plant Location */}
        <div className={`flex items-center text-sm mb-4 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          {plant.location}
        </div>
        
        {plant.device_key && (
        /* Sensor data */
        <div className="grid grid-cols-4 gap-2 mb-2">
          {/* Moisture level */}
          <div 
            className={`flex flex-col ${activeChart === 'soil_moisture' ? 'bg-blue-50 rounded p-1' : ''} cursor-pointer`}
            onClick={() => { setActiveChart('soil_moisture'); setShowHistory(true); }}
          >
            <span className="text-xs text-gray-500 mb-1">{t('metrics.soil_moisture', 'Soil Moisture')}</span>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mr-1">
                <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 15 5 15a7 7 0 0 0 7 7z"></path>
              </svg>
              <span className="font-medium">{`${sensorData?.soil_moisture ?? 'N/A'}%`}</span>
            </div>
          </div>

          {/* Device Status Indicator */}
  {/* <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium text-gray-700">
              {t('watering.deviceStatus', 'Device Status')}
            </span>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                deviceStatus === 'online' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className={`text-sm font-medium ${
                deviceStatus === 'online' ? 'text-green-700' : 'text-red-700'
              }`}>
                {deviceStatus === 'online' 
                  ? t('devices.online', 'Online') 
                  : t('devices.offline', 'Offline')
                }
              </span>
            </div>
          </div> */}

          {/* Temperature */}
          <div 
            className={`flex flex-col ${activeChart === 'temperature' ? 'bg-red-50 rounded p-1' : ''} cursor-pointer`}
            onClick={() => { setActiveChart('temperature'); setShowHistory(true); }}
          >
            <span className="text-xs text-gray-500 mb-1">{t('metrics.temperature', 'Temperature')}</span>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mr-1">
                <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"></path>
              </svg>
              <span className="font-medium">{`${sensorData?.temperature ?? 'N/A'}°C`}</span>
            </div>
          </div>
          
          {/* Light level */}
          <div 
            className={`flex flex-col ${activeChart === 'light_intensity' ? 'bg-amber-50 rounded p-1' : ''} cursor-pointer`}
            onClick={() => { setActiveChart('light_intensity'); setShowHistory(true); }}
          >
            <span className="text-xs text-gray-500 mb-1">{t('metrics.light_intensity', 'Light')}</span>
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
              <span className="font-medium">{`${sensorData?.light_intensity ?? 'N/A'} lux`}</span>
            </div>
          </div>
          {/* Humidity */}
          <div 
            className={`flex flex-col ${activeChart === 'air_humidity' ? 'bg-cyan-50 rounded p-1' : ''} cursor-pointer`}
            onClick={() => { setActiveChart('air_humidity'); setShowHistory(true); }}
          >
            <span className="text-xs text-gray-500 mb-1">{t('metrics.air_humidity', 'Air Humidity')}</span>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500 mr-1">
                <path d="M12 2s-6 6.5-6 11a6 6 0 0 0 12 0c0-4.5-6-11-6-11z"></path>
                <circle cx="12" cy="13" r="3"></circle>
              </svg>
              <span className="font-medium">{`${sensorData?.air_humidity ?? 'N/A'}%`}</span>
            </div>
          </div>
        </div>
        )}
        
        
        {/* History chart - conditionally shown */}
        {plant.device_key && showHistory && (
          <div className="mt-2 mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">{t('charts.history', 'Sensor History')}</h4>
              <button 
                onClick={() => setShowHistory(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {t('common.hide', 'Hide')}
              </button>
            </div>
            <PlantHistoryChart 
              data={sensorHistory?.[activeChart] || []}
              dataType={activeChart}
              timeRange="day"
            />
          </div>
        )}
        
        {/* Last watered */}
        {plant.plantId && (
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>
            {t('plants.lastWatered', 'Last watered')}: {
              lastWateredInfo.date ? 
                formatDate(lastWateredInfo.date, settings.language.dateFormat) : 
                t('plants.neverWatered', 'Never watered')
            }
            {lastWateredInfo.timeAgo && (
              <span className="text-xs text-gray-400 ml-2">
                ({lastWateredInfo.timeAgo})
              </span>
            )}
            {lastWateredInfo.triggerType && (
              <span className="text-xs bg-gray-100 text-gray-600 px-1 rounded ml-2">
                {lastWateredInfo.triggerType}
              </span>
            )}
          </span>
        </div>
        )}
        
        {/* AI Prediction Banner */}
        {enableAI && sensorData?.moisture && sensorData.moisture < 40 && (
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
        <div className={`flex flex-wrap gap-2 mb-4 ${compactMode ? 'text-sm' : ''}`}>
          <Link href={`/plants/${plant.plant_id}`} className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition-all btn-transition">
            {t('common.viewDetails', 'View Details')}
          </Link>
          {plant.device_key && (
          <button 
            onClick={() => setShowWateringControls(!showWateringControls)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-all btn-transition"
          >
            {t('watering.waterNow', 'Water Now')}
          </button>
          )}
          {enableAI && (
            <Link href={`/ai/chat?plant=${plant.plant_id}`} className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-all btn-transition">
              {t('ai.askAI', 'Ask AI')}
            </Link>
          )}
          <button 
            onClick={() => {
              setShowWateringLog(!showWateringLog);
              if (!showWateringLog && !wateringHistory) {
                loadWateringHistory();
              }
            }}
            className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors btn-transition"
          >
            {t('plants.log', 'Log Activity')}
          </button>
        </div>        
        {/* Manual Watering Controls - conditionally shown */}
        {plant.device_key && showWateringControls && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium text-blue-900">{t('watering.manualControl', 'Manual Watering')}</h4>
              <button 
                onClick={() => setShowWateringControls(false)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {t('common.hide', 'Hide')}
              </button>
            </div>
            <ManualWateringControl 
              plantId={plant.plant_id}
              deviceStatus={deviceStatus}
              isEmbedded={true}
            />
          </div>
        )}

        {/* Watering History Log - conditionally shown */}
        {showWateringLog && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-medium">{t('plants.wateringHistory', 'Watering History')}</h4>
              <button 
                onClick={() => setShowWateringLog(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {t('common.hide', 'Hide')}
              </button>
            </div>
            {wateringHistory?.data && wateringHistory.data.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {wateringHistory.data.slice(0, 10).map((entry, index) => (
                  <div key={entry.history_id || index} className="flex justify-between items-center text-xs bg-white dark:bg-gray-700 p-2 rounded border dark:border-gray-600">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      {entry.trigger_type && (
                        <span className="ml-2 px-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                          {entry.trigger_type}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-500 dark:text-gray-400">
                      {entry.duration_seconds ? `${entry.duration_seconds}s` : 'N/A'}
                      {entry.device_name && ` • ${entry.device_name}`}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t('plants.noWateringHistory', 'No watering history available')}</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}