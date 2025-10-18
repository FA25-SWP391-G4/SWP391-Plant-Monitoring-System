import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FiCalendar, FiClock, FiSettings } from 'react-icons/fi';

/**
 * WateringSchedule component displays the upcoming watering events for a plant
 */
const WateringSchedule = ({ plantId, schedule = [] }) => {
  const { t } = useTranslation();
  
  // Get the day of week name
  const getDayName = (day) => {
    const days = {
      'monday': t('days.monday', 'Monday'),
      'tuesday': t('days.tuesday', 'Tuesday'),
      'wednesday': t('days.wednesday', 'Wednesday'),
      'thursday': t('days.thursday', 'Thursday'),
      'friday': t('days.friday', 'Friday'),
      'saturday': t('days.saturday', 'Saturday'),
      'sunday': t('days.sunday', 'Sunday')
    };
    return days[day.toLowerCase()] || day;
  };
  
  // Format the time string
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    try {
      // Handle different time formats
      let hours, minutes;
      
      if (timeString.includes(':')) {
        [hours, minutes] = timeString.split(':').map(Number);
      } else {
        hours = Math.floor(timeString / 100);
        minutes = timeString % 100;
      }
      
      return new Date(0, 0, 0, hours, minutes).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error('Error formatting time:', e);
      return timeString;
    }
  };
  
  // Get the next occurrence of a scheduled watering
  const getNextOccurrence = (schedule) => {
    if (!schedule.day) return null;
    
    const today = new Date();
    const todayWeekday = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Map day string to number (0 = Sunday, 1 = Monday, etc.)
    const weekdayMap = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    };
    
    const scheduleWeekday = weekdayMap[schedule.day.toLowerCase()];
    
    // Calculate days until next occurrence
    let daysUntil = scheduleWeekday - todayWeekday;
    if (daysUntil < 0) daysUntil += 7; // Wrap around to next week
    
    // Create the date of the next occurrence
    const nextOccurrence = new Date();
    nextOccurrence.setDate(today.getDate() + daysUntil);
    
    // Add the time
    if (schedule.time && schedule.time.includes(':')) {
      const [hours, minutes] = schedule.time.split(':').map(Number);
      nextOccurrence.setHours(hours, minutes, 0, 0);
    }
    
    return nextOccurrence;
  };
  
  // Sort schedules by next occurrence
  const sortedSchedule = [...schedule].sort((a, b) => {
    const dateA = getNextOccurrence(a);
    const dateB = getNextOccurrence(b);
    
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    return dateA - dateB;
  });
  
  return (
    <Card className="mb-6">
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{t('plants.wateringSchedule', 'Watering Schedule')}</h3>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-gray-500 hover:text-gray-700"
            onClick={() => {/* Navigate to watering settings */}}
          >
            <FiSettings className="h-4 w-4" />
          </Button>
        </div>
        
        {sortedSchedule.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiCalendar className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-1">
              {t('plants.noSchedule', 'No watering schedule set')}
            </p>
            <p className="text-sm text-gray-400">
              {t('plants.setUpSchedule', 'Set up automatic watering schedule')}
            </p>
            
            <Button
              className="mt-4"
              variant="outline"
              onClick={() => {/* Navigate to add schedule */}}
            >
              {t('plants.setSchedule', 'Set Schedule')}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedSchedule.slice(0, 3).map((item, index) => {
              const nextDate = getNextOccurrence(item);
              const isToday = nextDate && 
                nextDate.toDateString() === new Date().toDateString();
              
              return (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-2 rounded-full mr-3">
                      <FiCalendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {isToday ? 
                          t('time.today', 'Today') : 
                          getDayName(item.day)
                        }
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <FiClock className="h-3 w-3 mr-1" />
                        {formatTime(item.time)}
                        {item.duration && (
                          <span className="ml-1">• {item.duration} {t('common.min', 'min')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isToday && (
                    <div className="bg-green-100 text-green-600 text-xs font-medium px-2 py-1 rounded">
                      {t('time.today', 'Today')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {sortedSchedule.length > 3 && (
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800">
              {t('common.viewAll', 'View all')} ({sortedSchedule.length})
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default WateringSchedule;