import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FiCalendar, FiClock, FiPlus, FiTrash2 } from 'react-icons/fi';

/**
 * WateringScheduleControl component that allows users to manage automatic watering schedules
 */
const WateringScheduleControl = ({ plantId, initialSchedules = [] }) => {
  const { t } = useTranslation();
  const [schedules, setSchedules] = useState(initialSchedules);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    day: 'monday',
    time: '08:00',
    duration: 5
  });
  
  const weekdays = [
    { value: 'monday', label: t('days.monday', 'Monday') },
    { value: 'tuesday', label: t('days.tuesday', 'Tuesday') },
    { value: 'wednesday', label: t('days.wednesday', 'Wednesday') },
    { value: 'thursday', label: t('days.thursday', 'Thursday') },
    { value: 'friday', label: t('days.friday', 'Friday') },
    { value: 'saturday', label: t('days.saturday', 'Saturday') },
    { value: 'sunday', label: t('days.sunday', 'Sunday') },
  ];

  const handleAddSchedule = () => {
    // In a real app, this would call an API to save the schedule
    const updatedSchedules = [...schedules, {
      id: Date.now(), // Temporary ID for demo purposes
      ...newSchedule
    }];
    
    setSchedules(updatedSchedules);
    setIsAddingSchedule(false);
    setNewSchedule({
      day: 'monday',
      time: '08:00',
      duration: 5
    });
  };

  const handleDeleteSchedule = (id) => {
    // In a real app, this would call an API to delete the schedule
    const updatedSchedules = schedules.filter(schedule => schedule.id !== id);
    setSchedules(updatedSchedules);
  };

  return (
    <Card className="mb-6">
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{t('plants.wateringSchedule', 'Watering Schedule')}</h3>
          <Button 
            size="sm" 
            onClick={() => setIsAddingSchedule(true)}
            disabled={isAddingSchedule}
          >
            <FiPlus className="mr-1" />
            {t('common.add', 'Add')}
          </Button>
        </div>

        {/* Schedule list */}
        {schedules.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-2">
              {t('plants.noSchedules', 'No watering schedules set')}
            </p>
            <p className="text-sm text-gray-400">
              {t('plants.addScheduleHint', 'Add a schedule for automatic watering')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map((schedule) => (
              <div key={schedule.id} className="flex justify-between items-center p-3 border rounded-md">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <FiCalendar className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {weekdays.find(d => d.value === schedule.day)?.label}
                    </p>
                    <div className="flex items-center text-sm text-gray-500">
                      <FiClock className="mr-1" size={14} />
                      <span>{schedule.time}</span>
                      <span className="mx-1">•</span>
                      <span>{schedule.duration} min</span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleDeleteSchedule(schedule.id)}
                >
                  <FiTrash2 className="text-gray-400 hover:text-red-500" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {/* Add schedule form */}
        {isAddingSchedule && (
          <div className="mt-4 p-4 border rounded-md">
            <h4 className="font-medium mb-3">{t('plants.addSchedule', 'Add Schedule')}</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t('plants.day', 'Day')}</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={newSchedule.day}
                  onChange={(e) => setNewSchedule({...newSchedule, day: e.target.value})}
                >
                  {weekdays.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-1">{t('plants.time', 'Time')}</label>
                <input 
                  type="time" 
                  className="w-full p-2 border rounded-md"
                  value={newSchedule.time}
                  onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  {t('plants.duration', 'Duration')} (min)
                </label>
                <input 
                  type="number" 
                  min="1" 
                  max="30"
                  className="w-full p-2 border rounded-md"
                  value={newSchedule.duration}
                  onChange={(e) => setNewSchedule({...newSchedule, duration: parseInt(e.target.value) || 1})}
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline"
                onClick={() => setIsAddingSchedule(false)}
              >
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button onClick={handleAddSchedule}>
                {t('common.save', 'Save')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default WateringScheduleControl;