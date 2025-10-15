import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Droplets,
  Clock,
  AlertCircle
} from 'lucide-react';

/**
 * Irrigation Calendar Component
 * Displays irrigation schedule in calendar format with predictions
 */
const IrrigationCalendar = ({ 
  schedule = [], 
  predictions = [], 
  onDateSelect,
  onScheduleEdit,
  className = '' 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Get current month and year
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const firstDayWeekday = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      days.push(date);
    }

    return days;
  }, [currentMonth, currentYear]);

  // Get events for a specific date
  const getEventsForDate = (date) => {
    if (!date) return [];

    const dateStr = date.toISOString().split('T')[0];
    const events = [];

    // Check scheduled irrigations
    schedule.forEach(item => {
      const scheduleDate = new Date(item.scheduledTime).toISOString().split('T')[0];
      if (scheduleDate === dateStr) {
        events.push({
          type: 'scheduled',
          time: new Date(item.scheduledTime).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          amount: item.waterAmount,
          status: item.status || 'pending'
        });
      }
    });

    // Check predictions
    predictions.forEach(pred => {
      const predDate = new Date(pred.predictedTime).toISOString().split('T')[0];
      if (predDate === dateStr) {
        events.push({
          type: 'prediction',
          confidence: pred.confidence,
          amount: pred.waterAmount,
          urgent: pred.urgent || false
        });
      }
    });

    return events;
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Handle date click
  const handleDateClick = (date) => {
    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }
  };

  // Check if date is today
  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is selected
  const isSelected = (date) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  // Get day cell classes
  const getDayCellClasses = (date) => {
    if (!date) return 'p-2';

    const events = getEventsForDate(date);
    const hasScheduled = events.some(e => e.type === 'scheduled');
    const hasPrediction = events.some(e => e.type === 'prediction');
    const hasUrgent = events.some(e => e.urgent);

    let classes = 'p-2 min-h-[80px] border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors relative';

    if (isToday(date)) {
      classes += ' bg-blue-50 border-blue-200';
    }

    if (isSelected(date)) {
      classes += ' bg-blue-100 border-blue-300';
    }

    if (hasUrgent) {
      classes += ' border-red-300 bg-red-50';
    } else if (hasScheduled) {
      classes += ' border-green-300 bg-green-50';
    } else if (hasPrediction) {
      classes += ' border-yellow-300 bg-yellow-50';
    }

    return classes;
  };

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Day names
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-indigo-600" />
            <span>Irrigation Calendar</span>
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold min-w-[140px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-200 border border-green-300 rounded"></div>
            <span className="text-sm text-gray-600">Scheduled</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-200 border border-yellow-300 rounded"></div>
            <span className="text-sm text-gray-600">Predicted</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-200 border border-red-300 rounded"></div>
            <span className="text-sm text-gray-600">Urgent</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-200 border border-blue-300 rounded"></div>
            <span className="text-sm text-gray-600">Today</span>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
          {/* Day headers */}
          {dayNames.map(day => (
            <div key={day} className="p-3 bg-gray-100 text-center font-medium text-sm text-gray-700 border-b border-gray-200">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {calendarDays.map((date, index) => (
            <div
              key={index}
              className={getDayCellClasses(date)}
              onClick={() => date && handleDateClick(date)}
            >
              {date && (
                <>
                  {/* Day number */}
                  <div className="font-medium text-sm text-gray-900 mb-1">
                    {date.getDate()}
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {getEventsForDate(date).map((event, eventIndex) => (
                      <div key={eventIndex} className="text-xs">
                        {event.type === 'scheduled' && (
                          <div className={`flex items-center space-x-1 px-1 py-0.5 rounded ${
                            event.status === 'completed' ? 'bg-green-200 text-green-800' :
                            event.status === 'missed' ? 'bg-red-200 text-red-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span>{event.time}</span>
                          </div>
                        )}
                        
                        {event.type === 'prediction' && (
                          <div className={`flex items-center space-x-1 px-1 py-0.5 rounded ${
                            event.urgent ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                          }`}>
                            {event.urgent ? (
                              <AlertCircle className="w-3 h-3" />
                            ) : (
                              <Droplets className="w-3 h-3" />
                            )}
                            <span>{event.amount}ml</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Selected Date Details */}
        {selectedDate && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">
              {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h4>
            
            <div className="space-y-2">
              {getEventsForDate(selectedDate).map((event, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center space-x-3">
                    {event.type === 'scheduled' ? (
                      <Clock className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Droplets className="w-4 h-4 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {event.type === 'scheduled' ? 'Scheduled Irrigation' : 'AI Prediction'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {event.type === 'scheduled' 
                          ? `${event.time} - ${event.amount}ml`
                          : `${event.amount}ml (${Math.round(event.confidence * 100)}% confidence)`
                        }
                      </p>
                    </div>
                  </div>
                  
                  {event.type === 'scheduled' && onScheduleEdit && (
                    <Button variant="outline" size="sm" onClick={() => onScheduleEdit(event)}>
                      Edit
                    </Button>
                  )}
                </div>
              ))}
              
              {getEventsForDate(selectedDate).length === 0 && (
                <p className="text-gray-600 text-sm">No irrigation events for this date</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IrrigationCalendar;