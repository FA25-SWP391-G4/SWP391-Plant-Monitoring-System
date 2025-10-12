import React from 'react';
import PropTypes from 'prop-types';
import { FiDroplet, FiSun, FiThermometer, FiAlertCircle, FiHeart, FiCalendar } from 'react-icons/fi';
import './PlantStatusCard.css';

/**
 * PlantStatusCard component
 * 
 * A specialized card showing the current status of a plant with:
 * - Image display
 * - Key metrics (moisture, light, temperature)
 * - Status indicator
 * - Quick action buttons
 */
export function PlantStatusCard({
  plantId,
  name,
  species,
  imageUrl,
  metrics = {},
  status = 'healthy',
  lastWatered,
  onWater,
  onClick,
  className = '',
  ...props
}) {
  // Define status styles
  const statusMap = {
    healthy: { 
      label: 'Healthy', 
      color: 'text-green-500 bg-green-50',
      icon: null
    },
    needsWater: { 
      label: 'Needs Water', 
      color: 'text-blue-500 bg-blue-50',
      icon: <FiDroplet className="mr-1" />
    },
    needsLight: { 
      label: 'Low Light', 
      color: 'text-amber-500 bg-amber-50',
      icon: <FiSun className="mr-1" />
    },
    temperatureAlert: { 
      label: 'Temp Alert', 
      color: 'text-orange-500 bg-orange-50',
      icon: <FiThermometer className="mr-1" />
    },
    danger: { 
      label: 'Critical', 
      color: 'text-red-500 bg-red-50',
      icon: <FiAlertCircle className="mr-1" />
    }
  };

  const currentStatus = statusMap[status] || statusMap.healthy;

  // Default metrics if not provided
  const {
    moisture = '--',
    light = '--',
    temperature = '--',
  } = metrics;

  const handleClick = () => {
    if (onClick) onClick(plantId);
  };

  const handleWater = (e) => {
    e.stopPropagation();
    if (onWater) onWater(plantId);
  };

  return (
    <div 
      className={`plant-status-card bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${className}`}
      onClick={handleClick}
      {...props}
    >
      <div className="relative h-40">
        <img 
          src={imageUrl || '/placeholder-plant.jpg'} 
          alt={name}
          className="w-full h-full object-cover"
        />
        <span className={`absolute top-2 right-2 text-xs font-medium px-2 py-1 rounded-full flex items-center ${currentStatus.color}`}>
          {currentStatus.icon}
          {currentStatus.label}
        </span>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-900">{name}</h3>
        <p className="text-sm text-gray-500">{species}</p>

        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Moisture</span>
            <span className="font-medium flex items-center justify-center gap-1">
              <FiDroplet className="text-blue-500" />
              {moisture}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Light</span>
            <span className="font-medium flex items-center justify-center gap-1">
              <FiSun className="text-amber-500" />
              {light}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-gray-500">Temp</span>
            <span className="font-medium flex items-center justify-center gap-1">
              <FiThermometer className="text-orange-500" />
              {temperature}°C
            </span>
          </div>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {lastWatered ? `Last watered ${lastWatered}` : 'Not watered yet'}
          </span>
          <button 
            className="text-sm py-1 px-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
            onClick={handleWater}
          >
            Water
          </button>
        </div>
      </div>
    </div>
  );
}

PlantStatusCard.propTypes = {
  plantId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  name: PropTypes.string.isRequired,
  species: PropTypes.string.isRequired,
  imageUrl: PropTypes.string,
  metrics: PropTypes.shape({
    moisture: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    light: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    temperature: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }),
  status: PropTypes.oneOf(['healthy', 'needsWater', 'needsLight', 'temperatureAlert', 'danger']),
  lastWatered: PropTypes.string,
  onWater: PropTypes.func,
  onClick: PropTypes.func,
  className: PropTypes.string
};

export default PlantStatusCard;