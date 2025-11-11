import React, { useState, useEffect } from 'react';
import { 
    Bell, 
    Check, 
    CheckCircle, 
    Trash2, 
    Filter, 
    RefreshCw,
    AlertTriangle,
    Info,
    AlertCircle,
    X,
    Archive
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';
import { useToast } from '../ui/use-toast';

/**
 * NotificationList Component
 * Full-featured notification list with filtering, bulk actions, and pagination
 */
const NotificationList = ({ 
    notifications = [], 
    loading = false,
    totalCount = 0,
    onRefresh,
    onMarkAsRead,
    onMarkAllAsRead,
    onDeleteNotification,
    onFilterChange,
    onLoadMore,
    hasMore = false,
    filter = {},
    className = ""
}) => {
    // Ensure notifications is always an array
    const safeNotifications = Array.isArray(notifications) ? notifications : [];
    
    const [selectedNotifications, setSelectedNotifications] = useState(new Set());
    const [localFilter, setLocalFilter] = useState({
        type: 'all',
        status: 'all',
        priority: 'all',
        ...filter
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    // Notification type options
    const typeOptions = [
        { value: 'all', label: 'All Types' },
        { value: 'general', label: 'General' },
        { value: 'plant_alert', label: 'Plant Alerts' },
        { value: 'device', label: 'Device' },
        { value: 'system', label: 'System' },
        { value: 'payment', label: 'Payment' },
        { value: 'ai_analysis', label: 'AI Analysis' },
        { value: 'warning', label: 'Warning' },
        { value: 'error', label: 'Error' },
        { value: 'success', label: 'Success' },
        { value: 'info', label: 'Info' }
    ];

    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'unread', label: 'Unread' },
        { value: 'read', label: 'Read' }
    ];

    const priorityOptions = [
        { value: 'all', label: 'All Priority' },
        { value: '1', label: 'Critical' },
        { value: '2', label: 'High' },
        { value: '3', label: 'Medium' },
        { value: '4', label: 'Low' },
        { value: '5', label: 'Info' }
    ];

    const handleFilterChange = (key, value) => {
        const newFilter = { ...localFilter, [key]: value };
        setLocalFilter(newFilter);
        onFilterChange?.(newFilter);
    };

    const handleSelectAll = () => {
        if (selectedNotifications.size === safeNotifications.length) {
            setSelectedNotifications(new Set());
        } else {
            setSelectedNotifications(new Set(safeNotifications.map(n => n.alert_id)));
        }
    };

    const handleSelectNotification = (notificationId) => {
        const newSelected = new Set(selectedNotifications);
        if (newSelected.has(notificationId)) {
            newSelected.delete(notificationId);
        } else {
            newSelected.add(notificationId);
        }
        setSelectedNotifications(newSelected);
    };

    const handleBulkMarkAsRead = async () => {
        setIsProcessing(true);
        try {
            const promises = Array.from(selectedNotifications).map(id => 
                onMarkAsRead(id)
            );
            await Promise.all(promises);
            
            toast({
                title: `Marked ${selectedNotifications.size} notifications as read`,
                variant: "success"
            });
            setSelectedNotifications(new Set());
        } catch (error) {
            toast({
                title: "Failed to mark notifications as read",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkDelete = async () => {
        setIsProcessing(true);
        try {
            const promises = Array.from(selectedNotifications).map(id => 
                onDeleteNotification(id)
            );
            await Promise.all(promises);
            
            toast({
                title: `Deleted ${selectedNotifications.size} notifications`,
                variant: "success"
            });
            setSelectedNotifications(new Set());
        } catch (error) {
            toast({
                title: "Failed to delete notifications",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const getNotificationIcon = (type, priority) => {
        const iconClass = "w-5 h-5";
        
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

    const getPriorityBadge = (priority) => {
        switch (priority) {
            case 1:
                return <Badge variant="destructive">Critical</Badge>;
            case 2:
                return <Badge variant="secondary" className="bg-orange-500 text-white">High</Badge>;
            case 3:
                return <Badge variant="secondary">Medium</Badge>;
            case 4:
                return <Badge variant="outline">Low</Badge>;
            case 5:
                return <Badge variant="outline" className="text-gray-500">Info</Badge>;
            default:
                return null;
        }
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header with stats and bulk actions */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Notifications
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        {totalCount > 0 
                            ? `${totalCount} total notification${totalCount !== 1 ? 's' : ''}`
                            : 'No notifications'
                        }
                    </p>
                </div>
                
                <div className="flex items-center space-x-2">
                    {selectedNotifications.size > 0 && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBulkMarkAsRead}
                                disabled={isProcessing}
                            >
                                <Check className="w-4 h-4 mr-1" />
                                Mark Read ({selectedNotifications.size})
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleBulkDelete}
                                disabled={isProcessing}
                            >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete ({selectedNotifications.size})
                            </Button>
                        </>
                    )}
                    
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    
                    {safeNotifications.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onMarkAllAsRead}
                            disabled={loading}
                        >
                            Mark All Read
                        </Button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex items-center space-x-4">
                    <Filter className="w-4 h-4 text-gray-500" />
                    
                    <Select
                        value={localFilter.type}
                        onValueChange={(value) => handleFilterChange('type', value)}
                    >
                        <option value="">Select Type</option>
                        {typeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>

                    <Select
                        value={localFilter.status}
                        onValueChange={(value) => handleFilterChange('status', value)}
                    >
                        <option value="">Select Status</option>
                        {statusOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>

                    <Select
                        value={localFilter.priority}
                        onValueChange={(value) => handleFilterChange('priority', value)}
                    >
                        <option value="">Select Priority</option>
                        {priorityOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                </div>
            </Card>

            {/* Notification list */}
            <div className="space-y-2">
                {safeNotifications.length === 0 ? (
                    <Card className="p-8 text-center">
                        <Bell className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No notifications
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {Object.values(localFilter).some(v => v !== 'all') 
                                ? 'No notifications match your current filters.'
                                : 'You\'re all caught up! New notifications will appear here.'
                            }
                        </p>
                    </Card>
                ) : (
                    <>
                        {/* Select all checkbox */}
                        {safeNotifications.length > 0 && (
                            <div className="flex items-center p-2 border-b border-gray-200 dark:border-gray-700">
                                <input
                                    type="checkbox"
                                    checked={selectedNotifications.size === safeNotifications.length && safeNotifications.length > 0}
                                    onChange={handleSelectAll}
                                    className="mr-3"
                                />
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Select all notifications
                                </span>
                            </div>
                        )}

                        {safeNotifications.map((notification) => (
                            <Card
                                key={notification.alert_id}
                                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                                    notification.status === 'unread' 
                                        ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10' 
                                        : ''
                                }`}
                            >
                                <div className="flex items-start space-x-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedNotifications.has(notification.alert_id)}
                                        onChange={() => handleSelectNotification(notification.alert_id)}
                                        className="mt-1"
                                    />
                                    
                                    <div className="flex-shrink-0 mt-1">
                                        {getNotificationIcon(notification.type, notification.priority)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                {notification.title || 'Notification'}
                                            </h4>
                                            
                                            <div className="flex items-center space-x-2">
                                                {getPriorityBadge(notification.priority)}
                                                <Badge variant="outline" className="text-xs">
                                                    {notification.type}
                                                </Badge>
                                                {notification.status === 'unread' && (
                                                    <Badge variant="default" className="text-xs">
                                                        Unread
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-gray-700 dark:text-gray-300 mb-3">
                                            {notification.message}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {formatTimeAgo(notification.created_at)}
                                            </span>
                                            
                                            <div className="flex items-center space-x-2">
                                                {notification.action_url && notification.action_label && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => window.location.href = notification.action_url}
                                                    >
                                                        {notification.action_label}
                                                    </Button>
                                                )}
                                                
                                                {notification.status === 'unread' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onMarkAsRead(notification.alert_id)}
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onDeleteNotification(notification.alert_id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </>
                )}
            </div>

            {/* Load more button */}
            {hasMore && (
                <div className="text-center">
                    <Button
                        variant="outline"
                        onClick={onLoadMore}
                        disabled={loading}
                        className="px-8"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Loading...
                            </>
                        ) : (
                            'Load more notifications'
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default NotificationList;