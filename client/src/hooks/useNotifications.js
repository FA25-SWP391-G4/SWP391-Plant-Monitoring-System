/**
 * ============================================================================
 * NOTIFICATION WEBSOCKET CLIENT HOOK - FRONTEND INTEGRATION
 * ============================================================================
 * 
 * This React hook connects to the WebSocket notification service
 * to provide real-time notifications for UC9.
 * 
 * Place this file in the client/src/hooks/ directory
 */

import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../contexts/AuthContext'; // Adjust path as needed

/**
 * React hook for connecting to the notification WebSocket service
 * @returns {Object} Notification state and functions
 */
const useNotifications = () => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { token } = useAuth(); // Assumes an auth context that provides the token
  
  // Initialize socket connection
  useEffect(() => {
    if (!token) {
      setError('Authentication token required');
      setLoading(false);
      return;
    }
    
    // Get WebSocket URL from environment or use default
    const wsUrl = process.env.REACT_APP_WS_URL || window.location.origin;
    
    // Connect to WebSocket server with authentication
    const socketInstance = io(wsUrl, {
      auth: { token }
    });
    
    // Handle connection events
    socketInstance.on('connect', () => {
      console.log('Connected to notification service');
      setConnected(true);
      setError(null);
    });
    
    socketInstance.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
      setError(`Connection error: ${err.message}`);
      setConnected(false);
    });
    
    socketInstance.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      setConnected(false);
    });
    
    // Handle notification events
    socketInstance.on('notification', (data) => {
      setNotifications(prev => [data.notification, ...prev]);
      // Play notification sound if available
      const notifSound = document.getElementById('notification-sound');
      if (notifSound) {
        notifSound.play().catch(e => console.log('Could not play notification sound'));
      }
    });
    
    socketInstance.on('unread-count', (data) => {
      setUnreadCount(data.count);
    });
    
    socketInstance.on('unread-notifications', (data) => {
      setNotifications(data.notifications || []);
      setLoading(false);
    });
    
    socketInstance.on('error', (data) => {
      console.error('Socket error:', data.message);
      setError(data.message);
    });
    
    setSocket(socketInstance);
    
    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [token]);
  
  /**
   * Mark a notification as read
   * @param {number} notificationId - ID of the notification to mark as read
   */
  const markAsRead = useCallback((notificationId) => {
    if (!socket || !connected) return;
    
    socket.emit('mark-read', { notificationId });
    
    // Optimistically update UI
    setNotifications(prev => 
      prev.map(notif => 
        notif.alert_id === notificationId 
          ? { ...notif, is_read: true }
          : notif
      )
    );
  }, [socket, connected]);
  
  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      // Optimistically update UI
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
      setError(error.message);
    }
  }, [token]);
  
  /**
   * Delete a notification
   * @param {number} notificationId - ID of the notification to delete
   */
  const deleteNotification = useCallback(async (notificationId) => {
    if (!token) return;
    
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
      
      // Update UI
      setNotifications(prev => 
        prev.filter(notif => notif.alert_id !== notificationId)
      );
      
      // Update unread count if it was an unread notification
      const wasUnread = notifications.find(
        n => n.alert_id === notificationId && !n.is_read
      );
      
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError(error.message);
    }
  }, [token, notifications]);
  
  /**
   * Fetch notification preferences
   * @returns {Object} User notification preferences
   */
  const getNotificationPreferences = useCallback(async () => {
    if (!token) return null;
    
    try {
      const response = await fetch('/api/notifications/preferences', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences');
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setError(error.message);
      return null;
    }
  }, [token]);
  
  /**
   * Update notification preferences
   * @param {Object} preferences - Updated preferences object
   * @returns {boolean} Success status
   */
  const updateNotificationPreferences = useCallback(async (preferences) => {
    if (!token) return false;
    
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ preferences })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }
      
      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      setError(error.message);
      return false;
    }
  }, [token]);
  
  return {
    notifications,
    unreadCount,
    loading,
    error,
    connected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationPreferences,
    updateNotificationPreferences
  };
};

export default useNotifications;