import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export default function WateringSchedule({ plants = [] }) {
  const { t } = useTranslation();
  
  // Sort plants by those needing water first - memoized to avoid unnecessary re-sorting
  const sortedPlants = useMemo(() => {
    return [...plants].sort((a, b) => {
      // Plants that need water go first
      if (a.status === 'needs_water' && b.status !== 'needs_water') return -1;
      if (a.status !== 'needs_water' && b.status === 'needs_water') return 1;
      
      // Then sort by last watered date (oldest first)
      return new Date(a.lastWatered) - new Date(b.lastWatered);
    });
  }, [plants]);
  
  // Get days since last watered
  const getDaysSinceLastWatered = (lastWateredDate) => {
    const lastWatered = new Date(lastWateredDate);
    const now = new Date();
    const diffTime = Math.abs(now - lastWatered);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  // Get watering urgency indicator
  const getWateringIndicator = (plant) => {
    if (plant.status === 'needs_water') {
      return {
        bgColor: 'bg-blue-600',
        text: t('watering.needsWater', 'Needs water now')
      };
    }
    
    const daysSinceLastWatered = getDaysSinceLastWatered(plant.lastWatered);
    
    if (daysSinceLastWatered > 5) {
      return {
        bgColor: 'bg-amber-500',
        text: t('watering.soon', 'Water soon')
      };
    }
    
    return {
      bgColor: 'bg-emerald-500',
      text: t('watering.ok', 'Recently watered')
    };
  };
  
  if (plants.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-500">{t('watering.noPlants', 'No plants in your collection')}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {sortedPlants.map((plant) => {
        const indicator = getWateringIndicator(plant);
        const daysSinceLastWatered = getDaysSinceLastWatered(plant.lastWatered);
        
        return (
          <div key={plant.plant_id} className="flex items-center">
            <div className="w-1.5 h-1.5 rounded-full mr-2.5 mt-0.5" style={{ backgroundColor: indicator.bgColor }}></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{plant.name}</p>
              <p className="text-xs text-gray-500">
                {t('watering.lastWatered', 'Last watered')}: {daysSinceLastWatered} {daysSinceLastWatered === 1 ? t('common.day', 'day') : t('common.days', 'days')} {t('common.ago', 'ago')}
              </p>
            </div>
            <button className="px-2.5 py-1 text-xs rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200">
              {t('watering.waterNow', 'Water')}
            </button>
          </div>
        );
      })}
      
      <button className="w-full mt-2 py-1.5 text-xs text-emerald-600 hover:text-emerald-700 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
          <path d="M12 5v14"></path>
          <path d="M5 12h14"></path>
        </svg>
        {t('watering.addPlant', 'Add plant to schedule')}
      </button>
    </div>
  );
}