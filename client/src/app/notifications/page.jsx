/**
 * Notifications Page
 * Simplified notification management interface
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { 
    Bell, 
    Settings, 
    TestTube,
    BarChart3,
    Check,
    Trash2,
    RefreshCw
} from 'lucide-react';

/**
 * Notifications Page
 * Basic notifications management page with mock data
 */
const NotificationsPage = () => {
    const {
        notifications = [],
        stats = { total: 0, unread: 0, critical: 0, recent: 0, by_type: {} },
        loading = false,
        error = null,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        createTestNotification,
        clearError,
        refresh
    } = useNotifications();

    const [showSettings, setShowSettings] = useState(false);
    const [showStats, setShowStats] = useState(false);

    // Safe array for notifications
    const safeNotifications = Array.isArray(notifications) ? notifications : [];

    const handleCreateTestNotification = async () => {
        try {
            await createTestNotification({
                title: 'Test Notification',
                message: 'This is a test notification created from the notifications page.',
                type: 'info',
                priority: 3
            });
        } catch (error) {
            console.error('Failed to create test notification:', error);
        }
    };

    const getTypeStats = () => {
        if (!stats.by_type) return [];
        
        return Object.entries(stats.by_type)
            .map(([type, count]) => ({ type, count: count || 0 }))
            .sort((a, b) => b.count - a.count);
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

    const getNotificationIcon = (type, priority) => {
        const iconClass = 'w-4 h-4';
        
        if (priority === 'critical' || priority === 'high') {
            return <Bell className={`${iconClass} text-red-500`} />;
        }
        
        switch (type) {
            case 'plant':
            case 'plant_alert':
                return <Bell className={`${iconClass} text-green-500`} />;
            case 'device':
                return <Settings className={`${iconClass} text-blue-500`} />;
            case 'system':
                return <Settings className={`${iconClass} text-gray-500`} />;
            default:
                return <Bell className={`${iconClass} text-blue-500`} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <main className="container mx-auto px-4 py-8">
                {/* Welcome Banner */}
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-800 rounded-xl shadow-lg mb-8 p-6 text-white flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
                            <Bell className="h-8 w-8" />
                        </div>
                        
                        <div>
                            <h1 className="text-2xl font-bold mb-2">
                                Notifications
                            </h1>
                            <p className="opacity-90">
                                Manage your alerts and notification preferences
                            </p>
                        </div>
                    </div>

                    <div className="hidden md:flex items-center space-x-3">
                        <button
                            onClick={() => setShowStats(!showStats)}
                            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                            <BarChart3 className="w-4 h-4" />
                            <span>Stats</span>
                        </button>

                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                        </button>

                        <button
                            onClick={handleCreateTestNotification}
                            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
                        >
                            <TestTube className="w-4 h-4" />
                            <span>Test</span>
                        </button>
                    </div>
                </div>

            {/* Error display */}
            {error && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-700 p-4 mb-6">
                    <div className="flex items-center justify-between">
                        <p className="text-red-600 dark:text-red-400">{error}</p>
                        <button
                            onClick={clearError}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            )}

            {/* Stats Panel */}
            {showStats && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {stats.total || 0}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Total Notifications
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {stats.unread || 0}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Unread
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {stats.critical || 0}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Critical
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {stats.recent || 0}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                Recent (24h)
                            </div>
                        </div>
                    </div>

                    {/* Type breakdown */}
                    {getTypeStats().length > 0 && (
                        <div className="mt-6">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                                Notifications by Type
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {getTypeStats().map(({ type, count }) => (
                                    <span
                                        key={type}
                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            count > 0 
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}
                                    >
                                        {type.replace('_', ' ')} ({count})
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Notification List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                {/* List Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        Notifications ({safeNotifications.length})
                    </h3>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={refresh}
                            disabled={loading}
                            className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                        
                        {safeNotifications.some(n => n.status === 'unread') && (
                            <button
                                onClick={markAllAsRead}
                                className="px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                            >
                                Mark All Read
                            </button>
                        )}
                    </div>
                </div>

                {/* Notification Items */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {safeNotifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>No notifications yet</p>
                            <p className="text-sm mt-1">Your alerts will appear here</p>
                        </div>
                    ) : (
                        safeNotifications.map((notification) => (
                            <div
                                key={notification.alert_id}
                                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                                    notification.status === 'unread' 
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-4 border-l-emerald-500' 
                                        : ''
                                }`}
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 mt-1">
                                        {getNotificationIcon(notification.type, notification.priority)}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                                {notification.title || 'Notification'}
                                            </p>
                                            <div className="flex items-center space-x-2">
                                                {notification.status === 'unread' && (
                                                    <button
                                                        onClick={() => markAsRead(notification.alert_id)}
                                                        className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded transition-colors"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(notification.alert_id)}
                                                    className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                            {notification.message}
                                        </p>
                                        
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {formatTimeAgo(notification.created_at)}
                                            </span>
                                            
                                            {(notification.priority === 'critical' || notification.priority === 'high') && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                    {notification.priority}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </main>
        </div>
    );
};

export default NotificationsPage;