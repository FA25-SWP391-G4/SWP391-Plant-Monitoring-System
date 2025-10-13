import React from 'react';
import { useTranslation } from 'react-i18next';

export default function PlantDetails({ plant }) {
  const { t } = useTranslation();
  
  if (!plant) {
    return (
      <div className="text-center p-8">
        <p>{t('plants.noData', 'No plant data available')}</p>
      </div>
    );
  }
  
  return (
    <div>
      {/* Plant basic information */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Plant image */}
        <div className="w-full md:w-1/3">
          {plant.image ? (
            <img 
              src={plant.image} 
              alt={plant.name} 
              className="w-full h-48 md:h-56 object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-48 md:h-56 bg-gray-200 flex items-center justify-center rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        
        {/* Plant info */}
        <div className="w-full md:w-2/3">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {plant.name}
          </h2>
          {plant.species && (
            <p className="text-gray-600 italic mb-4">
              {plant.species}
            </p>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <InfoItem 
              label={t('plants.location', 'Location')}
              value={plant.location || t('common.notSpecified', 'Not specified')}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
            />
            <InfoItem 
              label={t('plants.dateAdded', 'Date Added')}
              value={plant.created_at ? new Date(plant.created_at).toLocaleDateString() : t('common.unknown', 'Unknown')}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              }
            />
            <InfoItem 
              label={t('plants.lastWatered', 'Last Watered')}
              value={plant.last_watered ? new Date(plant.last_watered).toLocaleString() : t('plants.notWateredYet', 'Not watered yet')}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              }
            />
            <InfoItem 
              label={t('plants.zone', 'Zone')}
              value={plant.zone || t('common.notSpecified', 'Not specified')}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              }
            />
          </div>
          
          {plant.notes && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-1">
                {t('plants.notes', 'Notes')}
              </h3>
              <p className="text-gray-600 text-sm">
                {plant.notes}
              </p>
            </div>
          )}
          
          {/* Care info */}
          {plant.care_info && (
            <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
              <h3 className="text-sm font-medium text-blue-700 mb-1 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('plants.careInfo', 'Care Information')}
              </h3>
              <p className="text-blue-600 text-sm">
                {plant.care_info}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Plant thresholds and parameters */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-4">
          {t('plants.monitoringParameters', 'Monitoring Parameters')}
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ParameterCard 
            name={t('parameters.soilMoisture', 'Soil Moisture')}
            currentValue={plant.current_moisture || '--'}
            unit="%"
            min={plant.min_moisture || 20}
            max={plant.max_moisture || 60}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            }
          />
          
          <ParameterCard 
            name={t('parameters.light', 'Light')}
            currentValue={plant.current_light || '--'}
            unit="lux"
            min={plant.min_light || 500}
            max={plant.max_light || 10000}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
          
          <ParameterCard 
            name={t('parameters.temperature', 'Temperature')}
            currentValue={plant.current_temperature || '--'}
            unit="°C"
            min={plant.min_temperature || 15}
            max={plant.max_temperature || 30}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            }
          />
          
          <ParameterCard 
            name={t('parameters.humidity', 'Humidity')}
            currentValue={plant.current_humidity || '--'}
            unit="%"
            min={plant.min_humidity || 40}
            max={plant.max_humidity || 80}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            }
          />
        </div>
      </div>
      
      {/* Device association section */}
      {plant.device && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-4">
            {t('plants.associatedDevice', 'Associated Device')}
          </h3>
          
          <div className="flex items-center">
            <div className="p-2 bg-white rounded-lg border border-gray-200 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">
                {plant.device.name || `Device ${plant.device.id}`}
              </h4>
              <div className="flex items-center mt-1">
                <div className={`w-2 h-2 rounded-full mr-2 ${plant.device.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm text-gray-600">
                  {plant.device.status === 'online' 
                    ? t('devices.online', 'Online') 
                    : t('devices.offline', 'Offline')}
                </span>
                <span className="mx-2 text-gray-300">•</span>
                <span className="text-sm text-gray-600">
                  {t('devices.lastSeen', 'Last seen {{time}}', { 
                    time: plant.device.last_seen ? new Date(plant.device.last_seen).toLocaleString() : t('common.unknown', 'Unknown') 
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value, icon }) {
  return (
    <div className="flex items-center">
      <div className="flex-shrink-0 mr-2">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function ParameterCard({ name, currentValue, unit, min, max, icon }) {
  // Calculate whether current value is within range
  const isWithinRange = 
    currentValue !== '--' && 
    parseFloat(currentValue) >= parseFloat(min) && 
    parseFloat(currentValue) <= parseFloat(max);
  
  // If current value is missing, we can't determine if it's out of range
  const isOutOfRange = currentValue !== '--' && !isWithinRange;
  
  // Background color based on status
  const bgColor = isOutOfRange 
    ? 'bg-red-50 border-red-100' 
    : 'bg-white border-gray-200';
  
  // Text color for value
  const valueColor = isOutOfRange ? 'text-red-600 font-medium' : 'text-gray-900';
  
  return (
    <div className={`rounded-lg p-4 ${bgColor} border`}>
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium text-gray-700 flex items-center">
          <span className="mr-2">{icon}</span>
          {name}
        </h4>
        {isOutOfRange && (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
            <svg className="mr-1 h-3 w-3 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-7.59V6h2v6.59l3.7 3.7-1.42 1.42L12 14.41l-3.29 3.3-1.42-1.42 3.7-3.7z" />
            </svg>
            Alert
          </span>
        )}
      </div>
      <div className="flex items-end mb-1">
        <p className={`text-2xl ${valueColor}`}>
          {currentValue}
        </p>
        <p className="text-sm text-gray-500 ml-1">{unit}</p>
      </div>
      <div className="text-xs text-gray-500">
        Range: {min} - {max} {unit}
      </div>
    </div>
  );
}