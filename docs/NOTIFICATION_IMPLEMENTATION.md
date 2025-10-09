# Real-Time Notifications Implementation

## Overview
This document describes the implementation of UC9: Real-Time Notifications for the Plant Monitoring System.

## Features Implemented

### Server-side Components
1. **Notification Controller** (`controllers/notificationController.js`)
   - User notification retrieval
   - Read/unread management
   - Notification preferences
   - Push notifications via Firebase Cloud Messaging
   - Email notifications for critical alerts

2. **Alert Model Enhancements** (`models/Alert.js`)
   - Added title, type, and details fields
   - JSON storage for structured notification data
   - Read/unread tracking
   - Helper methods for common notification types

3. **WebSocket Service** (`services/notificationService.js`)
   - Real-time notification delivery
   - User-specific notification channels
   - Authentication via JWT
   - Unread count management

4. **Database Migration** (`migrations/update_alerts_for_notifications.sql`)
   - New fields for enhanced notification data
   - FCM token storage in User model
   - Notification preferences storage

### API Endpoints
- `GET /api/notifications` - Get all notifications for the user
- `GET /api/notifications/unread` - Get only unread notifications
- `PUT /api/notifications/:notificationId/read` - Mark a notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:notificationId` - Delete a notification
- `GET /api/notifications/preferences` - Get notification preferences
- `PUT /api/notifications/preferences` - Update notification preferences

### WebSocket Events
- `notification` - Sent when a new notification is created
- `unread-count` - Sent when the unread count changes
- `unread-notifications` - Sent when a user connects to get initial notifications
- `mark-read` - Received when a user marks a notification as read
- `error` - Sent when an error occurs

## Integration Guide

### Backend Integration
To create and send notifications from other controllers:

```javascript
const notificationController = require('../controllers/notificationController');
const notificationService = require('../services/notificationService');

// Create and send notification (database only)
await notificationController.createNotification(
  userId,       // User ID
  'lowMoisture', // Notification type
  'Soil moisture is below threshold', // Message
  'Low Moisture Alert', // Title
  { plantId: 123, moistureLevel: 15 } // Additional details
);

// Create and send notification (database + WebSocket)
await notificationService.sendToUser(
  userId,       // User ID
  'lowMoisture', // Notification type
  'Soil moisture is below threshold', // Message
  'Low Moisture Alert', // Title
  { plantId: 123, moistureLevel: 15 } // Additional details
);

// Send to all users with a specific role
await notificationService.sendToRole(
  'Premium',    // Role (Regular, Premium, Admin)
  'system_maintenance',
  'System maintenance scheduled for tonight',
  'System Maintenance',
  { startTime: '2023-07-15T22:00:00Z', duration: '2h' }
);

// Broadcast to all users
await notificationService.broadcast(
  'system_announcement',
  'New features available!',
  'System Update',
  { features: ['AI chatbot', 'Enhanced dashboard'] }
);
```

### Frontend Integration (React)
Connect to WebSocket and handle notifications:

```jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function NotificationComponent() {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    // Get JWT token from localStorage or auth context
    const token = localStorage.getItem('token');
    
    // Connect to WebSocket with authentication
    const socketInstance = io(process.env.REACT_APP_WS_URL, {
      auth: { token }
    });
    
    // Handle connection events
    socketInstance.on('connect', () => {
      console.log('Connected to notification service');
    });
    
    // Handle notifications
    socketInstance.on('notification', (data) => {
      setNotifications(prev => [data.notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });
    
    // Handle unread count
    socketInstance.on('unread-count', (data) => {
      setUnreadCount(data.count);
    });
    
    // Handle initial unread notifications
    socketInstance.on('unread-notifications', (data) => {
      setNotifications(data.notifications);
    });
    
    setSocket(socketInstance);
    
    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, []);
  
  // Mark notification as read
  const markAsRead = (notificationId) => {
    socket.emit('mark-read', { notificationId });
  };
  
  return (
    <div className="notifications">
      <div className="badge">{unreadCount}</div>
      {notifications.map(notification => (
        <div 
          key={notification.alert_id} 
          className={notification.is_read ? 'read' : 'unread'}
          onClick={() => markAsRead(notification.alert_id)}
        >
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
          <span>{notification.age_string}</span>
        </div>
      ))}
    </div>
  );
}
```

## Testing
Unit tests for the notification controller are available in `tests/notificationController.test.js`.

## Security Considerations
- WebSocket connections are authenticated using JWT
- Users can only access their own notifications
- Firebase Cloud Messaging tokens are stored securely
- Email templates avoid exposing sensitive information