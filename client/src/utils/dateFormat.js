'use client';

import { format } from 'date-fns';

export function formatDate(date, formatPattern = 'MM/DD/YYYY') {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Convert the format pattern from user-friendly to date-fns format
  const formatMap = {
    'MM/DD/YYYY': 'MM/dd/yyyy',
    'DD/MM/YYYY': 'dd/MM/yyyy',
    'YYYY-MM-DD': 'yyyy-MM-dd'
  };

  return format(d, formatMap[formatPattern] || formatMap['MM/DD/YYYY']);
}

export function formatTime(time, use24Hour = false) {
  if (!time) return '';
  
  const d = typeof time === 'string' ? new Date(time) : time;
  
  return format(d, use24Hour ? 'HH:mm' : 'hh:mm a');
}

export function formatDateTime(datetime, dateFormat = 'MM/DD/YYYY', use24Hour = false) {
  if (!datetime) return '';
  
  const d = typeof datetime === 'string' ? new Date(datetime) : datetime;
  
  return `${formatDate(d, dateFormat)} ${formatTime(d, use24Hour)}`;
}