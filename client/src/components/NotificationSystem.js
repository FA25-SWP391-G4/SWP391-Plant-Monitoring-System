/**
 * ============================================================================
 * NOTIFICATION COMPONENT - FRONTEND IMPLEMENTATION
 * ============================================================================
 * 
 * This component provides the UI for the notification system
 * for UC9: Receive Real-Time Notifications
 * 
 * Place this file in the client/src/components/ directory
 */

import React, { useState, useEffect, useRef } from 'react';
import useNotifications from '../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns'; // This requires installing date-fns package

// Notification bell icon with unread count badge
const NotificationBell = ({ unreadCount, onClick }) => {
  return (
    <div className="notification-bell" onClick={onClick}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
      {unreadCount > 0 && (
        <span className="notification-badge">{unreadCount}</span>
      )}
    </div>
  );
};

// Individual notification item
const NotificationItem = ({ notification, onRead, onDelete }) => {
  const { alert_id, title, message, type, details, is_read, created_at } = notification;
  
  // Format the notification time
  const formattedTime = formatDistanceToNow(new Date(created_at), { addSuffix: true });
  
  // Get icon based on notification type
  const getIcon = () => {
    switch (type) {
      case 'lowMoisture':
        return '🌱';
      case 'highTemperature':
        return '🔥';
      case 'watering_completed':
        return '💧';
      case 'deviceOffline':
        return '📡';
      case 'pumpActivation':
        return '🚿';
      case 'payment_success':
        return '💳';
      case 'system_maintenance':
        return '🔧';
      default:
        return '🔔';
    }
  };
  
  return (
    <div className={`notification-item ${is_read ? 'read' : 'unread'}`}>
      <div className="notification-icon">
        {getIcon()}
      </div>
      <div className="notification-content" onClick={() => onRead(alert_id)}>
        <div className="notification-header">
          <h4 className="notification-title">{title}</h4>
          <button 
            className="notification-delete" 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(alert_id);
            }}
          >
            &times;
          </button>
        </div>
        <p className="notification-message">{message}</p>
        <span className="notification-time">{formattedTime}</span>
      </div>
    </div>
  );
};

// Notification panel component
const NotificationPanel = ({ visible, onClose }) => {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useNotifications();
  
  const panelRef = useRef(null);
  
  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onClose]);
  
  if (!visible) return null;
  
  return (
    <div className="notification-panel-backdrop">
      <div className="notification-panel" ref={panelRef}>
        <div className="notification-panel-header">
          <h3>Notifications</h3>
          <div>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={markAllAsRead}>
                Mark all as read
              </button>
            )}
            <button className="close-panel" onClick={onClose}>
              &times;
            </button>
          </div>
        </div>
        
        <div className="notification-panel-content">
          {loading ? (
            <div className="notification-loading">Loading notifications...</div>
          ) : error ? (
            <div className="notification-error">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              No notifications to display
            </div>
          ) : (
            notifications.map(notification => (
              <NotificationItem
                key={notification.alert_id}
                notification={notification}
                onRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Main notification component
const NotificationSystem = () => {
  const { unreadCount } = useNotifications();
  const [panelVisible, setPanelVisible] = useState(false);
  
  const togglePanel = () => {
    setPanelVisible(prev => !prev);
  };
  
  return (
    <>
      {/* Hidden audio element for notification sounds */}
      <audio id="notification-sound" preload="auto">
        <source src="/sounds/notification.mp3" type="audio/mpeg" />
      </audio>
      
      <NotificationBell 
        unreadCount={unreadCount} 
        onClick={togglePanel} 
      />
      
      <NotificationPanel 
        visible={panelVisible}
        onClose={() => setPanelVisible(false)}
      />
    </>
  );
};

export default NotificationSystem;