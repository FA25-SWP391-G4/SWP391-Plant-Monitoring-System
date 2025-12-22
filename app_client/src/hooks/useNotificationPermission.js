import { useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';

/**
 * useNotificationPermission - Hook for checking and requesting notification permissions
 * 
 * Features:
 * - Checks current notification permission status
 * - Requests permission from user
 * - Returns supported flag (gracefully handles unavailable Notifications API)
 * - No backend calls (UI-only)
 * 
 * @returns {Object} { permission, status, requestPermission, supported }
 */
export const useNotificationPermission = () => {
  const [permission, setPermission] = useState(null);
  const [status, setStatus] = useState(null);
  const [supported, setSupported] = useState(true);

  // Check current permission status on mount
  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      if (!Notifications || !Notifications.getPermissionsAsync) {
        console.warn('[useNotificationPermission] Notifications API not supported');
        setSupported(false);
        return;
      }

      const currentStatus = await Notifications.getPermissionsAsync();
      const permissionStatus = currentStatus.status;
      
      setStatus(permissionStatus);
      setPermission({
        status: permissionStatus,
        canAsk: currentStatus.canAskAgain ?? true,
      });

      console.log('[useNotificationPermission] Current permission:', permissionStatus);
    } catch (error) {
      console.error('[useNotificationPermission] Check permission error:', error.message);
      setSupported(false);
    }
  };

  const requestPermission = async () => {
    try {
      if (!supported || !Notifications || !Notifications.requestPermissionsAsync) {
        return {
          success: false,
          error: 'Notifications not supported on this device',
          status: 'not-supported',
        };
      }

      console.log('[useNotificationPermission] Requesting permission...');
      const newStatus = await Notifications.requestPermissionsAsync();
      
      setStatus(newStatus.status);
      setPermission({
        status: newStatus.status,
        canAsk: newStatus.canAskAgain ?? true,
      });

      if (newStatus.status === 'granted') {
        console.log('[useNotificationPermission] Permission granted');
        return {
          success: true,
          status: 'granted',
        };
      } else if (newStatus.status === 'denied') {
        return {
          success: false,
          status: 'denied',
          error: 'User denied notification permission',
        };
      } else {
        return {
          success: false,
          status: newStatus.status,
          error: 'Permission request failed',
        };
      }
    } catch (error) {
      console.error('[useNotificationPermission] Request permission error:', error.message);
      return {
        success: false,
        status: 'error',
        error: error.message,
      };
    }
  };

  return {
    permission,
    status,
    requestPermission,
    supported,
  };
};