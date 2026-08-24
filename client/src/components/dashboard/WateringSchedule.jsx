import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { useSettings } from '@/providers/SettingsProvider';
import plantApi from '@/api/plantApi';

const CustomTimePicker = ({ time, setTime, isDark }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('hours'); // 'hours' or 'minutes'
  const containerRef = useRef(null);

  // Parse time for UI
  const [h24, mVal] = time.split(':').map(Number);
  const isPM = h24 >= 12;
  const h12 = h24 % 12 || 12;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleHourSelect = (val) => {
    let newH24 = val;
    if (isPM && val < 12) newH24 += 12;
    if (!isPM && val === 12) newH24 = 0;
    setTime(`${newH24.toString().padStart(2, '0')}:${mVal.toString().padStart(2, '0')}`);
    setView('minutes');
  };

  const handleMinuteSelect = (val) => {
    setTime(`${h24.toString().padStart(2, '0')}:${val.toString().padStart(2, '0')}`);
  };
  
  const toggleAMPM = (toPM) => {
    let newH24 = h12;
    if (toPM && h12 < 12) newH24 += 12;
    if (!toPM && h12 === 12) newH24 = 0;
    setTime(`${newH24.toString().padStart(2, '0')}:${mVal.toString().padStart(2, '0')}`);
  };

  // Generate clock numbers (12 at top, 3 at right, 6 at bottom, 9 at left)
  // For index 0 to 11, angle = i * 30 degrees. i=0 is top (12).
  const clockNumbers = view === 'hours' 
    ? Array.from({length: 12}, (_, i) => i === 0 ? 12 : i)
    : Array.from({length: 12}, (_, i) => i * 5);

  const currentValue = view === 'hours' ? h12 : mVal;

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className={`w-full border rounded-md px-2 py-1.5 text-sm cursor-pointer flex justify-between items-center transition-colors ${isDark ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'}`}
        onClick={() => { setIsOpen(!isOpen); setView('hours'); }}
      >
        <span>{time}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={isDark ? "text-gray-400" : "text-gray-500"}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
      </div>

      {isOpen && (
        <div className={`absolute z-[60] bottom-full mb-1 w-64 p-4 rounded-2xl shadow-2xl border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-[#eef3ea] border-gray-200 text-gray-900'}`}>
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-baseline space-x-1">
              <span 
                className={`text-4xl cursor-pointer px-2 py-1 rounded-xl transition-colors font-semibold ${view === 'hours' ? 'bg-[#b6f09c] text-[#1f4a13]' : isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-[#d5e0cd]'}`}
                onClick={() => setView('hours')}
              >
                {h12}
              </span>
              <span className="text-2xl font-bold">:</span>
              <span 
                className={`text-4xl cursor-pointer px-2 py-1 rounded-xl transition-colors font-semibold ${view === 'minutes' ? 'bg-[#b6f09c] text-[#1f4a13]' : isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-[#d5e0cd]'}`}
                onClick={() => setView('minutes')}
              >
                {mVal.toString().padStart(2, '0')}
              </span>
            </div>
            
            <div className={`flex flex-col border rounded overflow-hidden text-xs font-semibold ${isDark ? 'border-gray-600' : 'border-[#b8c7ad]'}`}>
              <button 
                onClick={() => toggleAMPM(false)}
                className={`px-3 py-2 transition-colors ${!isPM ? 'bg-[#bfe6e0] text-[#19403a]' : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-transparent text-gray-600 hover:bg-[#d5e0cd]'}`}
              >AM</button>
              <button 
                onClick={() => toggleAMPM(true)}
                className={`px-3 py-2 border-t transition-colors ${isDark ? 'border-gray-600' : 'border-[#b8c7ad]'} ${isPM ? 'bg-[#bfe6e0] text-[#19403a]' : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-transparent text-gray-600 hover:bg-[#d5e0cd]'}`}
              >PM</button>
            </div>
          </div>

          <div className={`relative w-48 h-48 mx-auto rounded-full ${isDark ? 'bg-gray-700' : 'bg-[#e0e8d8]'}`}>
            {/* Center dot */}
            <div className="absolute w-2 h-2 rounded-full bg-[#3c7028]" style={{ top: 'calc(50% - 4px)', left: 'calc(50% - 4px)' }}></div>
            
            {/* Clock line */}
            {(() => {
              const valIndex = view === 'hours' ? (h12 === 12 ? 0 : h12) : mVal / 5;
              const deg = valIndex * 30 - 90;
              return (
                <div 
                  className="absolute bg-[#3c7028] origin-left"
                  style={{
                    top: 'calc(50% - 1px)',
                    left: '50%',
                    width: '38%',
                    height: '2px',
                    transform: `rotate(${deg}deg)`
                  }}
                ></div>
              );
            })()}

            {/* Clock numbers */}
            {clockNumbers.map((num, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const isSelected = num === currentValue;
              return (
                <button
                  key={num}
                  onClick={() => view === 'hours' ? handleHourSelect(num) : handleMinuteSelect(num)}
                  className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center text-sm transition-colors ${
                    isSelected ? 'bg-[#3c7028] text-white font-bold' : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-800 hover:bg-white hover:shadow'
                  }`}
                  style={{
                    left: `${50 + 42 * Math.cos(angle)}%`,
                    top: `${50 + 42 * Math.sin(angle)}%`
                  }}
                >
                  {view === 'minutes' ? num.toString().padStart(2, '0') : num}
                </button>
              );
            })}
          </div>

          <div className="flex justify-end mt-4 space-x-4 pr-2">
            <button 
              className={`text-sm font-semibold tracking-wide ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-[#3c7028] hover:text-[#2d521d]'}`}
              onClick={() => setIsOpen(false)}
            >
              CANCEL
            </button>
            <button 
              className={`text-sm font-semibold tracking-wide ${isDark ? 'text-emerald-400 hover:text-emerald-300' : 'text-[#3c7028] hover:text-[#2d521d]'}`}
              onClick={() => setIsOpen(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function WateringSchedule({ plants = [] }) {
  const { t } = useTranslation();
  const { isDark, themeColors } = useTheme();
  const { settings } = useSettings();
  const [lastWateredData, setLastWateredData] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlant, setSelectedPlant] = useState('');
  const [selectedDays, setSelectedDays] = useState(['Monday']);
  const [time, setTime] = useState('08:00');
  const [duration, setDuration] = useState(5);

  const toggleDay = (day) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState({});



  if (!settings.dashboard.showWateringStatus) {
    return null;
  }

  function formatCronExpression(cronExpression, duration = null) {
  if (!cronExpression) return 'No schedule set';

  const parts = cronExpression.split(' ');
  if (parts.length < 5) return cronExpression; // fallback

  const [minute, hour, , , dayOfWeek] = parts;
  const day =
    dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1).toLowerCase();
  const time = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

  return duration
    ? `${day} at ${time} — ${duration}s`
    : `${day} at ${time}`;
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
      if (selectedDays.length === 0) {
        alert('Please select at least one day');
        setLoading(false);
        return;
      }
      const [hourStr, minuteStr] = time.split(':');
      const schedule = selectedDays.map(day => ({
        dayOfWeek: day,
        hour: parseInt(hourStr, 10) || 0,
        minute: parseInt(minuteStr, 10) || 0,
        duration: parseInt(duration, 10) || 5,
        enabled: true,
      }));
      await plantApi.setWateringSchedule(selectedPlant, { schedule });
      await plantApi.toggleAutoWatering(selectedPlant, true);

      

      alert('Watering schedule added!');
      setShowAddModal(false);

      const res = await plantApi.getWateringSchedule(selectedPlant);

      setSchedules(prev => ({
        ...prev,
        [selectedPlant]: res.data || []
      }));
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
                          Schedule:
                        </p>
                        {schedules[plant.plant_id].map((sch) => (
                          <div key={sch.schedule_id} className="text-xs ml-2">
                            {formatCronExpression(sch.cron_expression, sch.duration_seconds)}
                            {sch.is_active ? (
                              <span className="text-green-500 ml-1">(Active)</span>
                            ) : (
                              <span className="text-gray-400 ml-1">(Inactive)</span>
                            )}
                          </div>
                        ))}
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
            }`}>
              {t('watering.waterNow', 'Water')}
            </button>
          </div>
        );
      })}
      
      {!showAddModal ? (
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
      ) : (
        <div
          className={`mt-3 p-4 rounded-xl shadow-sm border ${
            isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-gray-50 text-gray-900 border-gray-200'
          }`}
        >
            <h3 className="text-sm font-semibold mb-2">Add Plant to Schedule</h3>

            <select
              className={`w-full mb-2 border rounded p-1 text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
            >
              <option value="">Select a plant...</option>
              {plants.map((p) => (
                <option key={p.plant_id} value={p.plant_id}>
                  {p.name}
                </option>
              ))}
            </select>

            <label className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Days of Week
            </label>
            <div className="flex justify-between mb-4">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                    selectedDays.includes(day)
                      ? 'bg-emerald-500 text-white shadow-md transform scale-105'
                      : isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {day.charAt(0)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Time
                </label>
                <CustomTimePicker time={time} setTime={setTime} isDark={isDark} />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  Duration: <span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>{duration}s</span>
                </label>
                <div className="flex items-center h-[34px]">
                  <input
                    type="range"
                    min="1"
                    max="60"
                    step="1"
                    className="w-full accent-emerald-500 cursor-pointer"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAddModal(false)}
                className={`text-xs px-3 py-1 border rounded ${isDark ? 'border-gray-600 hover:bg-gray-700 text-gray-300' : 'border-gray-300 hover:bg-gray-100 text-gray-700'}`}
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
      )}
    </div>
  );
}