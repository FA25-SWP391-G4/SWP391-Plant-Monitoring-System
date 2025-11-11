import React from 'react';
import PropTypes from 'prop-types';
import { Card } from './ui/Card';

/**
 * SensorStatsCard component
 * 
 * A specialized card for displaying sensor statistics with:
 * - Visual indicator of current value
 * - Historical min/max/average values
 * - Customizable thresholds and alerts
 */
export function SensorStatsCard({
  title,
  icon,
  value,
  unit,
  minValue,
  maxValue,
  avgValue,
  thresholds = {},
  timestamp,
  trend,
  className = '',
  ...props
}) {
  // Determine status based on thresholds
  const { min, max, warning, danger } = thresholds;
  
  let status = 'normal';
  let statusColor = 'bg-green-500';

  if (min !== undefined && value < min) {
    status = 'low';
    statusColor = 'bg-blue-500';
  } else if (max !== undefined && value > max) {
    status = 'high';
    statusColor = 'bg-orange-500';
  }

  if (warning !== undefined) {
    if (Array.isArray(warning) && (value < warning[0] || value > warning[1])) {
      status = 'warning';
      statusColor = 'bg-amber-500';
    } else if (!Array.isArray(warning) && value > warning) {
      status = 'warning';
      statusColor = 'bg-amber-500';
    }
  }

  if (danger !== undefined) {
    if (Array.isArray(danger) && (value < danger[0] || value > danger[1])) {
      status = 'danger';
      statusColor = 'bg-red-500';
    } else if (!Array.isArray(danger) && value > danger) {
      status = 'danger';
      statusColor = 'bg-red-500';
    }
  }

  // Determine trend indicator
  const getTrendIndicator = () => {
    if (!trend) return null;
    
    if (trend === 'up') {
      return <span className="text-green-500">↑</span>;
    } else if (trend === 'down') {
      return <span className="text-red-500">↓</span>;
    } else {
      return <span className="text-gray-500">→</span>;
    }
  };

  return (
    <Card className={`sensor-stats-card ${className}`} {...props}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-500">{icon}</span>}
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>
        <div className={`h-2 w-2 rounded-full ${statusColor}`} title={`Status: ${status}`}></div>
      </div>

      <div className="flex items-baseline">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        <span className="ml-1 text-lg text-gray-500">{unit}</span>
        <span className="ml-2">{getTrendIndicator()}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-center text-xs">
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-gray-500">Min</div>
          <div className="font-medium">{minValue}{unit}</div>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-gray-500">Avg</div>
          <div className="font-medium">{avgValue}{unit}</div>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <div className="text-gray-500">Max</div>
          <div className="font-medium">{maxValue}{unit}</div>
        </div>
      </div>

      {timestamp && (
        <div className="mt-3 text-xs text-gray-500 text-right">
          Last updated: {timestamp}
        </div>
      )}
    </Card>
  );
}

SensorStatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  icon: PropTypes.node,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  unit: PropTypes.string,
  minValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  maxValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  avgValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  thresholds: PropTypes.shape({
    min: PropTypes.number,
    max: PropTypes.number,
    warning: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.arrayOf(PropTypes.number)
    ]),
    danger: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.arrayOf(PropTypes.number)
    ])
  }),
  timestamp: PropTypes.string,
  trend: PropTypes.oneOf(['up', 'down', 'stable']),
  className: PropTypes.string
};

export default SensorStatsCard;