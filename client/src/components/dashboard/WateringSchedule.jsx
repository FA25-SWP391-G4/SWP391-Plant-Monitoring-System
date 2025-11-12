import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/providers/SettingsProvider';
import plantApi from '@/api/plantApi';

export default function WateringSchedule({ plants = [] }) {
  const { t } = useTranslation();
  const { isDark, themeColors } = useTheme();
  const { settings } = useSettings();
  const [lastWateredData, setLastWateredData] = useState({});

  if (!settings.dashboard.showWateringStatus) {
    return null;
  }

  // Load last watered data for all plants
  const loadLastWateredForPlants = async () => {
    const lastWateredMap = {};
    for (const plant of plants) {
      try {
        const lastWateredInfo = await plantApi.getLastWatered(plant.plant_id);
        lastWateredMap[plant.plant_id] = lastWateredInfo;
      } catch (error) {
        console.error(`Error loading last watered info for plant ${plant.plant_id}:`, error);
        lastWateredMap[plant.plant_id] = null;
      }
    }
    setLastWateredData(lastWateredMap);
  };

  useEffect(() => {
    if (plants.length > 0) {
      loadLastWateredForPlants();
    }
  }, [plants.map(plant => plant.plant_id).join(',')]);

  // Get days since last watered
  const getDaysSinceLastWatered = (plantId, fallbackDate) => {
    const lastWateredInfo = lastWateredData[plantId];
    let lastWateredDate;
    
    if (lastWateredInfo?.data?.last_watered?.timestamp) {
      lastWateredDate = new Date(lastWateredInfo.data.last_watered.timestamp);
    } else if (fallbackDate) {
      lastWateredDate = new Date(fallbackDate);
    } else {
      return null;
    }
    
    const now = new Date();
    const diffTime = Math.abs(now - lastWateredDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Get last watered display info
  const getLastWateredDisplay = (plantId, fallbackDate) => {
    const lastWateredInfo = lastWateredData[plantId];
    
    if (lastWateredInfo?.data?.last_watered) {
      const lastWateredDate = new Date(lastWateredInfo.data.last_watered.timestamp);
      return {
        date: lastWateredDate.toLocaleDateString(),
        timeAgo: lastWateredInfo.data.last_watered.time_ago,
        triggerType: lastWateredInfo.data.last_watered.trigger_type
      };
    }
    
    if (fallbackDate) {
      return {
        date: new Date(fallbackDate).toLocaleDateString(),
        timeAgo: null,
        triggerType: null
      };
    }
    
    return {
      date: t('plants.neverWatered', 'Never watered'),
      timeAgo: null,
      triggerType: null
    };
  };

  // Get watering urgency indicator
  const getWateringIndicator = (plant) => {
    const daysSince = getDaysSinceLastWatered(plant.plant_id, plant.lastWatered);
    
    if (plant.status === 'needs_water') {
      return {
        bgColor: '#ef4444', // red-500
        text: t('watering.needsWater', 'Needs water now')
      };
    }
    
    if (daysSince && daysSince > 5) {
      return {
        bgColor: '#f59e0b', // amber-500
        text: t('watering.soon', 'Water soon')
      };
    }
    
    return {
      bgColor: '#10b981', // emerald-500
      text: t('watering.ok', 'Recently watered')
    };
  };
  
  // Sort plants by those needing water first - memoized to avoid unnecessary re-sorting
  const sortedPlants = useMemo(() => {
    return [...plants].sort((a, b) => {
      // Plants that need water go first
      if (a.status === 'needs_water' && b.status !== 'needs_water') return -1;
      if (a.status !== 'needs_water' && b.status === 'needs_water') return 1;
      
      // Then sort by days since last watered (oldest first)  
      const daysA = getDaysSinceLastWatered(a.plant_id, a.lastWatered) || 0;
      const daysB = getDaysSinceLastWatered(b.plant_id, b.lastWatered) || 0;
      return daysB - daysA;
    });
  }, [plants, lastWateredData]);

  if (plants.length === 0) {
    return (
      <div className="text-center py-4">
        <p className={`text-sm ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>{t('watering.noPlants', 'No plants in your collection')}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {sortedPlants.map((plant) => {
        const indicator = getWateringIndicator(plant);
        const lastWateredInfo = getLastWateredDisplay(plant.plant_id, plant.lastWatered);
        
        return (
          <div key={plant.plant_id} className="flex items-center">
            <div 
              className="w-1.5 h-1.5 rounded-full mr-2.5 mt-0.5" 
              style={{ backgroundColor: indicator.bgColor }}
            ></div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>{plant.name}</p>
              <p className={`text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {t('watering.lastWatered', 'Last watered')}: {lastWateredInfo.date}
                {lastWateredInfo.timeAgo && (
                  <span className="text-xs text-gray-400 ml-2">
                    ({lastWateredInfo.timeAgo})
                  </span>
                )}
              </p>
            </div>
            <button className={`px-2.5 py-1 text-xs rounded-full transition-colors border ${
              isDark
                ? 'bg-blue-900/30 text-blue-400 border-blue-700 hover:bg-blue-900/50'
                : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
            }`}>
              {t('watering.waterNow', 'Water')}
            </button>
          </div>
        );
      })}
      
      <button className={`w-full mt-2 py-1.5 text-xs flex items-center justify-center transition-colors ${
        isDark
          ? 'text-emerald-400 hover:text-emerald-300'
          : 'text-emerald-600 hover:text-emerald-700'
      }`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
          <path d="M12 5v14"></path>
          <path d="M5 12h14"></path>
        </svg>
        {t('watering.addPlant', 'Add plant to schedule')}
      </button>
    </div>
  );
}