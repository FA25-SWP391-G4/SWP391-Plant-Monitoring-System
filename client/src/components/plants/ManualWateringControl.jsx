import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FiDroplet } from 'react-icons/fi';

/**
 * ManualWateringControl component allows users to manually trigger watering for a plant
 */
const ManualWateringControl = ({ plantId, isConnected = true }) => {
  const { t } = useTranslation();
  const [isWatering, setIsWatering] = useState(false);
  const [duration, setDuration] = useState(5);
  const [lastWatered, setLastWatered] = useState(null);

  const handleWatering = async () => {
    if (!isConnected) return;
    
    setIsWatering(true);
    
    try {
      // In a real app, this would be an API call to trigger watering
      // await api.plants.water(plantId, { duration });
      
      // Simulate API call with a timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update last watered timestamp
      const now = new Date();
      setLastWatered(now.toISOString());
      
    } catch (error) {
      console.error('Error watering plant:', error);
      // Handle error
    } finally {
      setIsWatering(false);
    }
  };

  return (
    <Card className="mb-6">
      <div className="p-5">
        <h3 className="text-lg font-medium mb-4">{t('plants.manualWatering', 'Manual Watering')}</h3>
        
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-full mr-3">
                <FiDroplet className="text-blue-600 h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{t('plants.wateringDuration', 'Watering Duration')}</p>
                <p className="text-sm text-gray-500">
                  {t('plants.setDuration', 'Set how long to water your plant')}
                </p>
              </div>
            </div>
            
            <div className="flex items-center">
              <input 
                type="number"
                min="1"
                max="30"
                className="w-16 p-2 border rounded-md text-center mr-2"
                value={duration}
                onChange={(e) => setDuration(Math.min(30, Math.max(1, parseInt(e.target.value) || 1)))}
              />
              <span className="text-gray-500">{t('common.minutes', 'min')}</span>
            </div>
          </div>
          
          <Button
            className="w-full"
            disabled={!isConnected || isWatering}
            onClick={handleWatering}
          >
            {isWatering ? (
              <>
                <span className="animate-pulse mr-2">💧</span>
                {t('plants.watering', 'Watering...')}
              </>
            ) : (
              <>
                <FiDroplet className="mr-2" />
                {t('plants.waterNow', 'Water Now')}
              </>
            )}
          </Button>
        </div>
        
        {!isConnected && (
          <div className="bg-amber-50 border border-amber-100 rounded-md p-3 text-sm text-amber-700">
            <p>{t('plants.deviceNotConnected', 'Watering device not connected. Please check your device connection.')}</p>
          </div>
        )}
        
        {lastWatered && (
          <div className="text-sm text-gray-500 mt-3">
            <p>{t('plants.lastWatered', 'Last watered')}: {new Date(lastWatered).toLocaleString()}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ManualWateringControl;