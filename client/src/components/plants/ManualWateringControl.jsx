import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import plantApi from '@/api/plantApi';

const ManualWateringControl = ({ plantId, deviceStatus, className, isEmbedded = false }) => {
  const { t } = useTranslation();
  const [isWatering, setIsWatering] = useState(false);
  const [showControls, setShowControls] = useState(isEmbedded);
  const [duration, setDuration] = useState(3); // default to 3s (within 10s max)
  const [wateringHistory, setWateringHistory] = useState(null);

  useEffect(() => {
    if (showControls) {
      fetchWateringHistory();
    }
  }, [showControls]);

  const fetchWateringHistory = async () => {
    try {
      const history = await plantApi.getWateringHistory(plantId);
      setWateringHistory(history);
    } catch (error) {
      console.error('Failed to fetch watering history:', error);
    }
  };

  const handleWater = async () => {
    if (deviceStatus !== 'online') {
      alert(t('watering.deviceOffline', 'Device is offline. Cannot start watering.'));
      return;
    }

    if (isWatering) {
      // Stop watering
      try {
        setIsWatering(false);
        await plantApi.waterPlant(plantId, null, 'pump_off'); // explicit stop
        alert(t('watering.stopped', 'Watering stopped successfully!'));
        await fetchWateringHistory(); // Refresh history after stopping
      } catch (error) {
        console.error('Failed to stop watering:', error);
        alert(t('watering.stopFailed', 'Failed to stop watering. Please try again.'));
        setIsWatering(true);
      }
    } else {
      // Start watering - strictly capped at 10 seconds maximum
      const safeDuration = Math.min(10, Math.max(1, duration));
      setIsWatering(true);
      try {
        await plantApi.waterPlant(plantId, safeDuration);
        alert(t('watering.success', 'Watering started successfully!'));
        await fetchWateringHistory(); // Refresh history after starting

        // Auto stop after duration
        setTimeout(async () => {
          try {
            await plantApi.waterPlant(plantId, null, 'pump_off'); // Stop watering after duration
            setIsWatering(false);
            await fetchWateringHistory(); // Refresh history after auto-stop
          } catch (error) {
            console.error('Failed to stop watering after timeout:', error);
          }
        }, safeDuration * 1000);
      } catch (error) {
        console.error('Watering failed:', error);
        alert(t('watering.failed', 'Failed to start watering. Please try again.'));
        setIsWatering(false);
      }
    }
  };

  const presetDurations = [
    { value: 2, label: '2s' },
    { value: 5, label: '5s' },
    { value: 8, label: '8s' },
    { value: 10, label: '10s' }
  ];

  return (
    <div className="w-full">
      {!isEmbedded && (
        <button
          onClick={() => deviceStatus === 'online' && setShowControls(!showControls)}
          disabled={deviceStatus !== 'online' || isWatering}
          className={`${className} flex items-center justify-center ${isWatering ? 'animate-pulse' : ''}`}
        >
          <div className={`w-2 h-2 rounded-full mr-2 ${deviceStatus === 'online' ? (isWatering ? 'bg-white' : 'bg-white opacity-75') : 'bg-red-500'
            }`} />
          {isWatering ? t('watering.inProgress', 'Watering...') : t('watering.water', 'Water')}
        </button>
      )}

      {showControls && (
        <div className={`${isEmbedded ? '' : 'mt-2 mb-4'} w-full ${isEmbedded ? '' : 'bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700'} ${isEmbedded ? 'space-y-4' : 'p-4 space-y-4'}`}>
          {!isEmbedded && (
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('watering.controls', 'Watering Controls')}</h3>
              <button onClick={() => setShowControls(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                ✕
              </button>
            </div>
          )}

          {/* Duration Selection */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('watering.duration', 'Watering Duration')}
              </label>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                Max 10s
              </span>
            </div>

            {/* Preset Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {presetDurations.map((preset) => (
                <Button
                  key={preset.value}
                  variant={duration === preset.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDuration(preset.value)}
                  className="text-xs font-semibold"
                >
                  {preset.label}
                </Button>
              ))}
            </div>

            {/* Custom Duration Input */}
            <div className="flex items-center space-x-3">
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={duration}
                onChange={(e) => setDuration(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-sm font-bold text-gray-800 dark:text-gray-200 min-w-[45px] text-right tabular-nums">
                {duration}s
              </span>
            </div>
          </div>

          {/* Water Button */}
          <Button
            onClick={handleWater}
            disabled={isWatering || deviceStatus !== 'online'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition shadow-sm disabled:opacity-50"
            size="lg"
          >
            {isWatering ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('watering.inProgress', 'Watering...')}
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
                </svg>
                {t('watering.startWatering', 'Start Watering')}
              </div>
            )}
          </Button>

          {/* Warning Message */}
          {deviceStatus !== 'online' && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800/60 rounded-lg">
              <div className="flex">
                <svg className="w-5 h-5 text-yellow-500 dark:text-yellow-400 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                    {t('watering.deviceOfflineWarning', 'Device Offline')}
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400">
                    {t('watering.checkConnection', 'Please check your device connection and try again.')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Last Watering Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {t('watering.tip', 'Tip: Monitor your plant after watering to ensure optimal moisture levels.')}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualWateringControl;

//funny debug