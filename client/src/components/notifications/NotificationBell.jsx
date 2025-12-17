import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, AlertTriangle, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { useToast } from '../ui/use-toast';

/**
 * NotificationBell Component
 * Displays a bell icon with notification count and dropdown
 */
const NotificationBell = ({ 
    unreadCount = 0, 
    notifications = [], 
    onNotificationClick,
    onMarkAsRead,
    onMarkAllAsRead,
    onRefresh,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const dropdownRef = useRef(null);
    const { toast } = useToast();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBellClick = () => {
        setIsOpen(!isOpen);
        if (!isOpen && onRefresh) {
            onRefresh();
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        setIsLoading(true);
        try {
            await onMarkAsRead(notificationId);
            toast({
                title: "Notification marked as read",
                variant: "success"
            });
        } catch (error) {
            toast({
                title: "Failed to mark notification as read",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkAllAsRead = async () => {
        setIsLoading(true);
        try {
            await onMarkAllAsRead();
            toast({
                title: "All notifications marked as read",
                variant: "success"
            });
        } catch (error) {
            toast({
                title: "Failed to mark all notifications as read",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const getNotificationIcon = (type, priority) => {
        const iconClass = "w-4 h-4";
        
        if (priority <= 2) {
            return <AlertCircle className={`${iconClass} text-red-500`} />;
        }
        
        switch (type) {
            case 'error':
                return <X className={`${iconClass} text-red-500`} />;
            case 'warning':
            case 'plant_alert':
                return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
            case 'success':
                return <CheckCircle className={`${iconClass} text-green-500`} />;
            case 'info':
            default:
                return <Info className={`${iconClass} text-blue-500`} />;
        }
    };

    const formatTimeAgo = (createdAt) => {
        const now = new Date();
        const created = new Date(createdAt);
        const diffInMinutes = Math.floor((now - created) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays}d ago`;
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Bell Icon with Badge */}
            <Button
                variant="ghost"
                size="icon"
                onClick={handleBellClick}
                className="relative hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 px-1 min-w-[16px] h-4 text-xs flex items-center justify-center"
                    >
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </Badge>
                )}
            </Button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden shadow-xl z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                Notifications
                                {unreadCount > 0 && (
                                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                                        ({unreadCount} unread)
                                    </span>
                                )}
                            </h3>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleMarkAllAsRead}
                                    disabled={isLoading}
                                    className="text-xs hover:bg-gray-200 dark:hover:bg-gray-700"
                                >
                                    Mark all read
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-64 overflow-y-auto bg-white dark:bg-gray-800">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No notifications</p>
                            </div>
                        ) : (
                            notifications.slice(0, 10).map((notification) => (
                                <div
                                    key={notification.alert_id}
                                    className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors last:border-b-0 ${
                                        notification.status === 'unread' 
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' 
                                            : ''
                                    }`}
                                    onClick={() => onNotificationClick?.(notification)}
                                >
                                    <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0 mt-1">
                                            {getNotificationIcon(notification.type, notification.priority)}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                                    {notification.title || 'Notification'}
                                                </p>
                                                {notification.status === 'unread' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMarkAsRead(notification.alert_id);
                                                        }}
                                                        disabled={isLoading}
                                                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600"
                                                        aria-label="Mark as read"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                            
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {formatTimeAgo(notification.created_at)}
                                                </span>
                                                
                                                {notification.priority <= 2 && (
                                                    <Badge 
                                                        variant="destructive" 
                                                        className="text-xs px-1 py-0"
                                                    >
                                                        {notification.priority === 1 ? 'Critical' : 'High'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setIsOpen(false);
                                    // Navigate to notifications page
                                    window.location.href = '/notifications';
                                }}
                                className="w-full text-center text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                            >
                                View all notifications
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;