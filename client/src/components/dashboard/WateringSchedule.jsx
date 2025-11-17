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
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState({});



  if (!settings.widgets?.showWateringSchedule) {
    return null;
  }

  function formatCronExpression(cronExpression, duration = null) {
  if (!cronExpression) return t('schedule.noSchedule', 'No schedule');

  const parts = cronExpression.split(' ');
  if (parts.length < 5) return cronExpression; // fallback

  const [minute, hour, , , dayOfWeek] = parts;
  const day = t(`days.${dayOfWeek.toLowerCase()}`, dayOfWeek);
  const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

  return duration
    ? t('schedule.cronWithDuration', '{{day}} at {{time}} — {{duration}}s', {
        day,
        time,
        duration,
      })
    : t('schedule.cron', '{{day}} at {{time}}', {
        day,
        time,
      });
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

  useEffect(() => {
  async function loadSchedules() {
    const scheduleMap = {};
    for (const plant of plants) {
      try {
        const res = await plantApi.getWateringSchedule(plant.plant_id);
        scheduleMap[plant.plant_id] = res.data || [];
      } catch (err) {
        console.error(`Error fetching schedule for plant ${plant.plant_id}:`, err);
        scheduleMap[plant.plant_id] = [];
      }
    }
    setSchedules(scheduleMap);
  }

  if (plants.length > 0) {
    loadSchedules();
  }
}, [plants.map(p => p.plant_id).join(',')]);


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

  const handleAddSchedule = async () => {
    if (!selectedPlant) return alert('Please select a plant');
    setLoading(true);
    try {
      const schedule = [
        {
          dayOfWeek,
          hour: parseInt(hour),
          minute: parseInt(minute),
          duration: parseInt(duration),
          enabled: true,
        },
      ];
      await plantApi.setWateringSchedule(selectedPlant, { schedule });
      await plantApi.toggleAutoWatering(selectedPlant, true);
      alert('Watering schedule added!');
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to add schedule');
    } finally {
      setLoading(false);
    }
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
                    {Array.isArray(schedules[plant.plant_id]) && schedules[plant.plant_id].length > 0 && (
                      <div className="mt-1">
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {t('schedule.title', 'Schedule:')}:
                          {schedules[plant.plant_id].map((sch) => (
                          <span key={sch.schedule_id} className="text-xs ml-2">
                            {formatCronExpression(sch.cron_expression, sch.duration_seconds)}
                            {sch.is_active ? (
                              <span className="text-green-500 ml-1">(Active)</span>
                            ) : (
                              <span className="text-gray-400 ml-1">(Inactive)</span>
                            )}
                            </span>
                          ))}
                        </p>
                      </div>
                    )}

                  </span>
                  
                )}
              </p>
            </div>
            <button className={`px-2.5 py-1 text-xs rounded-full transition-colors border ${
              isDark
                ? 'bg-blue-900/30 text-blue-400 border-blue-700 hover:bg-blue-900/50'
                : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
            }`} onClick={() => setShowAddModal(true)}>
              {t('watering.waterNow', 'Water')}
            </button>
          </div>
        );
      })}
      
      <button
        onClick={() => setShowAddModal(true)}
        className={`w-full mt-2 py-1.5 text-xs flex items-center justify-center transition-colors ${
        isDark
          ? 'text-emerald-400 hover:text-emerald-300'
          : 'text-emerald-600 hover:text-emerald-700'
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-1"
        >
          <path d="M12 5v14"></path>
          <path d="M5 12h14"></path>
        </svg>
        {t('watering.addPlant', 'Add plant to schedule')}
      </button>

      {showAddModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div
            className={`p-4 rounded-xl shadow-lg w-80 ${
              isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
            }`}
          >
            <h3 className="text-sm font-semibold mb-2">Add Plant to Schedule</h3>

            <select
              className="w-full mb-2 border rounded p-1 text-sm"
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
            >
              <option value="">Select a plant...</option>
              {plants.filter((p) => p.device_key !== null).map((p) => (
                <option key={p.plant_id} value={p.plant_id}>
                  {p.name}
                </option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Day of Week
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </select>
              <input
                type="number"
                className="border rounded p-1 text-sm"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Duration (s)"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <input
                type="number"
                className="border rounded p-1 text-sm"
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                placeholder="Hour (0-23)"
              />
              <input
                type="number"
                className="border rounded p-1 text-sm"
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                placeholder="Minute (0-59)"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs px-3 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSchedule}
                disabled={loading}
                className="text-xs px-3 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}