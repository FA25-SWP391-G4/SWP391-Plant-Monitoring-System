import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import notificationApi from '../api/notificationApi';
import { useToast } from '../components/ui/use-toast';

// Initial state
const initialState = {
  notifications: [
    // Mock notifications for development
    {
      alert_id: 1,
      user_id: 1,
      title: 'Plant Alert',
      message: 'Your Snake Plant needs watering! Moisture level is below 20%.',
      type: 'plant',
      priority: 'high',
      status: 'unread',
      created_at: new Date(Date.now() - 30 * 60000).toISOString(),
      read_at: null,
      details: { plant_id: 1, moisture_level: 15 }
    },
    {
      alert_id: 2,
      user_id: 1,
      title: 'Device Connected',
      message: 'Your new soil moisture sensor has been successfully connected.',
      type: 'device',
      priority: 'normal',
      status: 'unread',
      created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
      read_at: null,
      details: { device_id: 5, device_type: 'moisture_sensor' }
    },
    {
      alert_id: 3,
      user_id: 1,
      title: 'Weekly Report Available',
      message: 'Your plant health weekly report is now available for review.',
      type: 'system',
      priority: 'low',
      status: 'read',
      created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      read_at: new Date(Date.now() - 20 * 3600000).toISOString(),
      details: { report_type: 'weekly', report_id: 123 }
    }
  ],
  unreadCount: 2,
  stats: {
    total: 3,
    unread: 2,
    critical: 0,
    high_priority: 1,
    recent: 2,
    by_type: {
      plant: 1,
      device: 1,
      system: 1
    }
  },
  loading: false,
  error: null,
  preferences: {
    email_notifications: true,
    push_notifications: true,
    in_app_notifications: true,
    notification_types: {
      plant_alert: true,
      device: true,
      system: true,
      payment: true,
      ai_analysis: true
    }
  },
  filter: {
    type: 'all',
    status: 'all',
    priority: 'all'
  }
};

// Action types
const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_NOTIFICATIONS: 'SET_NOTIFICATIONS',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  UPDATE_NOTIFICATION: 'UPDATE_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  SET_STATS: 'SET_STATS',
  SET_PREFERENCES: 'SET_PREFERENCES',
  SET_FILTER: 'SET_FILTER',
  MARK_AS_READ: 'MARK_AS_READ',
  MARK_ALL_AS_READ: 'MARK_ALL_AS_READ',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return { ...state, loading: action.payload };

    case actionTypes.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case actionTypes.CLEAR_ERROR:
      return { ...state, error: null };

    case actionTypes.SET_NOTIFICATIONS:
      return {
        ...state,
        notifications: Array.isArray(action.payload) ? action.payload : [],
        loading: false,
        error: null
      };

    case actionTypes.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: action.payload.status === 'unread' ? state.unreadCount + 1 : state.unreadCount,
        stats: {
          ...state.stats,
          total: state.stats.total + 1,
          unread: action.payload.status === 'unread' ? state.stats.unread + 1 : state.stats.unread
        }
      };

    case actionTypes.UPDATE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.alert_id === action.payload.id
            ? { ...notification, ...action.payload.updates }
            : notification
        )
      };

    case actionTypes.REMOVE_NOTIFICATION:
      const notificationToRemove = state.notifications.find(n => n.alert_id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(n => n.alert_id !== action.payload),
        unreadCount: notificationToRemove?.status === 'unread' ? state.unreadCount - 1 : state.unreadCount,
        stats: {
          ...state.stats,
          total: Math.max(0, state.stats.total - 1),
          unread: notificationToRemove?.status === 'unread' ? Math.max(0, state.stats.unread - 1) : state.stats.unread
        }
      };

    case actionTypes.SET_STATS:
      return {
        ...state,
        stats: action.payload,
        unreadCount: action.payload.unread
      };

    case actionTypes.SET_PREFERENCES:
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload }
      };

    case actionTypes.SET_FILTER:
      return {
        ...state,
        filter: { ...state.filter, ...action.payload }
      };

    case actionTypes.MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.alert_id === action.payload
            ? { ...notification, status: 'read', read_at: new Date().toISOString() }
            : notification
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
        stats: {
          ...state.stats,
          unread: Math.max(0, state.stats.unread - 1)
        }
      };

    case actionTypes.MARK_ALL_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          status: 'read',
          read_at: notification.status === 'unread' ? new Date().toISOString() : notification.read_at
        })),
        unreadCount: 0,
        stats: {
          ...state.stats,
          unread: 0
        }
      };

    default:
      return state;
  }
};

// Context
const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { toast } = useToast();

  // Load initial data
  useEffect(() => {
    loadNotifications();
    loadStats();
    loadPreferences();
  }, []);

  // Auto-refresh stats periodically
  useEffect(() => {
    const polling = notificationApi.startPolling((stats) => {
      dispatch({ type: actionTypes.SET_STATS, payload: stats });
    }, 60000); // Refresh every minute

    return () => polling.stop();
  }, []);

  // Actions
  const setLoading = (loading) => {
    dispatch({ type: actionTypes.SET_LOADING, payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: actionTypes.SET_ERROR, payload: error });
  };

  const clearError = () => {
    dispatch({ type: actionTypes.CLEAR_ERROR });
  };

  const loadNotifications = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      clearError();

      const filterParams = {
        ...state.filter,
        ...params
      };

      // Remove 'all' values for API call
      const apiParams = Object.entries(filterParams).reduce((acc, [key, value]) => {
        if (value !== 'all') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const response = await notificationApi.getNotifications(apiParams);
      
      // Handle different response structures
      let notificationsData = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          notificationsData = response.data;
        } else if (Array.isArray(response.data.data)) {
          notificationsData = response.data.data;
        } else if (Array.isArray(response.data.notifications)) {
          notificationsData = response.data.notifications;
        }
      }
      
      dispatch({ type: actionTypes.SET_NOTIFICATIONS, payload: notificationsData });
    } catch (error) {
      setError(error.message || 'Failed to load notifications');
      toast({
        title: "Failed to load notifications",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [state.filter, toast]);

  const loadStats = useCallback(async () => {
    try {
      const response = await notificationApi.getNotificationStats();
      dispatch({ type: actionTypes.SET_STATS, payload: response.data || response.data.data });
    } catch (error) {
      console.error('Failed to load notification stats:', error);
    }
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      const response = await notificationApi.getPreferences();
      dispatch({ type: actionTypes.SET_PREFERENCES, payload: response.data.data || response.data });
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
    }
  }, []);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);
      dispatch({ type: actionTypes.MARK_AS_READ, payload: notificationId });
    } catch (error) {
      setError(error.message || 'Failed to mark notification as read');
      throw error;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      dispatch({ type: actionTypes.MARK_ALL_AS_READ });
      toast({
        title: "All notifications marked as read",
        variant: "success"
      });
    } catch (error) {
      setError(error.message || 'Failed to mark all notifications as read');
      throw error;
    }
  }, [toast]);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationApi.deleteNotification(notificationId);
      dispatch({ type: actionTypes.REMOVE_NOTIFICATION, payload: notificationId });
    } catch (error) {
      setError(error.message || 'Failed to delete notification');
      throw error;
    }
  }, []);

  const updatePreferences = useCallback(async (preferences) => {
    try {
      await notificationApi.updatePreferences(preferences);
      dispatch({ type: actionTypes.SET_PREFERENCES, payload: preferences });
      toast({
        title: "Notification preferences updated",
        variant: "success"
      });
    } catch (error) {
      setError(error.message || 'Failed to update notification preferences');
      toast({
        title: "Failed to update preferences",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  const setFilter = useCallback((filter) => {
    dispatch({ type: actionTypes.SET_FILTER, payload: filter });
    loadNotifications(filter);
  }, [loadNotifications]);

  const addNotification = useCallback((notification) => {
    dispatch({ type: actionTypes.ADD_NOTIFICATION, payload: notification });
    
    // Show toast for new notifications
    if (notification.priority <= 2) {
      toast({
        title: notification.title || "New notification",
        description: notification.message,
        variant: notification.priority === 1 ? "destructive" : "default"
      });
    }
  }, [toast]);

  const createTestNotification = useCallback(async (data) => {
    try {
      await notificationApi.createTestNotification(data);
      await loadNotifications();
      toast({
        title: "Test notification created",
        variant: "success"
      });
    } catch (error) {
      setError(error.message || 'Failed to create test notification');
      throw error;
    }
  }, [loadNotifications, toast]);

  const value = {
    // State
    ...state,

    // Actions
    loadNotifications,
    loadStats,
    loadPreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    setFilter,
    addNotification,
    createTestNotification,
    clearError,

    // Utility
    refresh: () => {
      loadNotifications();
      loadStats();
    }
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use notification context
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;