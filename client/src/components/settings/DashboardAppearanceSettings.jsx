/**
 * Dashboard Appearance Settings Component
 * Controls for dashboard visibility and appearance
 */
'use client'

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboardWidgets } from '@/providers/DashboardWidgetProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { toast } from 'sonner';
import { 
  Save, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Monitor, 
  Palette,
  Layout,
  BarChart3,
  Bot,
  Bell,
  Calendar,
  Activity,
  Droplets,
  Thermometer,
  Sun,
  Leaf
} from 'lucide-react';

const DashboardAppearanceSettings = () => {
  const { t } = useTranslation();
  const { 
    widgetSettings, 
    updateWidgetSettings, 
    toggleWidget, 
    resetToDefaults, 
    loading 
  } = useDashboardWidgets();

  // Save settings (already handled by the provider)
  const saveSettings = async () => {
    toast.success(t('settings.saved', 'Settings saved successfully'));
  };

  // Reset to defaults using provider method
  const handleResetToDefaults = () => {
    resetToDefaults();
    toast.info(t('settings.resetToDefaults', 'Settings reset to defaults'));
  };

  const dashboardWidgets = [
    {
      key: 'showPlantOverview',
      title: t('dashboard.widgets.plantOverview', 'Plant Overview'),
      description: t('dashboard.widgets.plantOverviewDesc', 'Shows overall plant status and quick stats'),
      icon: <Leaf className="h-5 w-5" />,
      category: 'main'
    },
    {
      key: 'showSensorData',
      title: t('dashboard.widgets.sensorData', 'Sensor Data'),
      description: t('dashboard.widgets.sensorDataDesc', 'Real-time sensor readings and charts'),
      icon: <Activity className="h-5 w-5" />,
      category: 'main'
    },
    {
      key: 'showAIInsights',
      title: t('dashboard.widgets.aiInsights', 'AI Insights'),
      description: t('dashboard.widgets.aiInsightsDesc', 'AI-powered plant care recommendations'),
      icon: <Bot className="h-5 w-5" />,
      category: 'ai'
    },
    {
      key: 'showAIPredictions',
      title: t('dashboard.widgets.aiPredictions', 'AI Predictions'),
      description: t('dashboard.widgets.aiPredictionsDesc', 'Growth and watering predictions'),
      icon: <BarChart3 className="h-5 w-5" />,
      category: 'ai'
    },
    {
      key: 'showAIHistory',
      title: t('dashboard.widgets.aiHistory', 'AI Activity History'),
      description: t('dashboard.widgets.aiHistoryDesc', 'Recent AI analysis and recommendations'),
      icon: <Calendar className="h-5 w-5" />,
      category: 'ai'
    },
    {
      key: 'showWateringSchedule',
      title: t('dashboard.widgets.wateringSchedule', 'Watering Schedule'),
      description: t('dashboard.widgets.wateringScheduleDesc', 'Upcoming watering tasks and reminders'),
      icon: <Droplets className="h-5 w-5" />,
      category: 'main'
    },
    {
      key: 'showWeatherWidget',
      title: t('dashboard.widgets.weather', 'Weather Widget'),
      description: t('dashboard.widgets.weatherDesc', 'Local weather conditions affecting your plants'),
      icon: <Sun className="h-5 w-5" />,
      category: 'main'
    },
    {
      key: 'showNotifications',
      title: t('dashboard.widgets.notifications', 'Notifications'),
      description: t('dashboard.widgets.notificationsDesc', 'Important alerts and reminders'),
      icon: <Bell className="h-5 w-5" />,
      category: 'main'
    },
    {
      key: 'showQuickActions',
      title: t('dashboard.widgets.quickActions', 'Quick Actions'),
      description: t('dashboard.widgets.quickActionsDesc', 'Frequently used plant care actions'),
      icon: <Layout className="h-5 w-5" />,
      category: 'main'
    },
    {
      key: 'showRecentActivity',
      title: t('dashboard.widgets.recentActivity', 'Recent Activity'),
      description: t('dashboard.widgets.recentActivityDesc', 'Your recent plant care activities'),
      icon: <Activity className="h-5 w-5" />,
      category: 'main'
    },
    {
      key: 'showPlantHealth',
      title: t('dashboard.widgets.plantHealth', 'Plant Health Monitor'),
      description: t('dashboard.widgets.plantHealthDesc', 'Health status of all your plants'),
      icon: <Leaf className="h-5 w-5" />,
      category: 'main'  
    },
    {
      key: 'showEnvironmentalData',
      title: t('dashboard.widgets.environmentalData', 'Environmental Data'),
      description: t('dashboard.widgets.environmentalDataDesc', 'Temperature, humidity, and light levels'),
      icon: <Thermometer className="h-5 w-5" />,
      category: 'main'
    }
  ];

  const aiWidgets = [
    {
      key: 'showChatbot',
      title: t('dashboard.widgets.chatbot', 'AI Chatbot'),
      description: t('dashboard.widgets.chatbotDesc', 'AI assistant for plant care questions'),
      icon: <Bot className="h-5 w-5" />
    },
    {
      key: 'showImageAnalysis',
      title: t('dashboard.widgets.imageAnalysis', 'Image Analysis'),
      description: t('dashboard.widgets.imageAnalysisDesc', 'AI-powered plant photo analysis'),
      icon: <Eye className="h-5 w-5" />
    },
    {
      key: 'showDiseaseDetection',
      title: t('dashboard.widgets.diseaseDetection', 'Disease Detection'),
      description: t('dashboard.widgets.diseaseDetectionDesc', 'Automatic plant disease identification'),
      icon: <Activity className="h-5 w-5" />
    },
    {
      key: 'showGrowthPredictions',
      title: t('dashboard.widgets.growthPredictions', 'Growth Predictions'),
      description: t('dashboard.widgets.growthPredictionsDesc', 'AI-powered growth forecasting'),
      icon: <BarChart3 className="h-5 w-5" />
    }
  ];

  const appearanceSettings = [
    {
      key: 'compactMode',
      title: t('dashboard.appearance.compactMode', 'Compact Mode'),
      description: t('dashboard.appearance.compactModeDesc', 'Show more widgets in less space'),
      icon: <Layout className="h-5 w-5" />
    },
    {
      key: 'showWidgetTitles',
      title: t('dashboard.appearance.showTitles', 'Show Widget Titles'),
      description: t('dashboard.appearance.showTitlesDesc', 'Display titles on dashboard widgets'),
      icon: <Eye className="h-5 w-5" />
    },
    {
      key: 'showWidgetIcons',
      title: t('dashboard.appearance.showIcons', 'Show Widget Icons'),
      description: t('dashboard.appearance.showIconsDesc', 'Display icons on dashboard widgets'),
      icon: <Palette className="h-5 w-5" />
    },
    {
      key: 'animationsEnabled',
      title: t('dashboard.appearance.animations', 'Enable Animations'),
      description: t('dashboard.appearance.animationsDesc', 'Smooth transitions and hover effects'),
      icon: <Monitor className="h-5 w-5" />
    },
    {
      key: 'darkModeCompatible',
      title: t('dashboard.appearance.darkMode', 'Dark Mode Compatible'),
      description: t('dashboard.appearance.darkModeDesc', 'Optimize widgets for dark theme'),
      icon: <EyeOff className="h-5 w-5" />
    }
  ];

  const mainWidgets = dashboardWidgets.filter(w => w.category === 'main');
  const aiWidgetsFiltered = dashboardWidgets.filter(w => w.category === 'ai');

  return (
    <div className="space-y-6 fade-in">
      {/* Main Dashboard Widgets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            {t('settings.dashboardWidgets', 'Dashboard Widgets')}
          </CardTitle>
          <CardDescription>
            {t('settings.dashboardWidgetsDesc', 'Choose which widgets appear on your main dashboard')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mainWidgets.map((widget) => (
              <div key={widget.key} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 interactive-hover">
                <div className="flex items-start gap-3">
                  <div className="text-gray-500 mt-1">
                    {widget.icon}
                  </div>
                  <div>
                    <Label htmlFor={widget.key} className="font-medium cursor-pointer">
                      {widget.title}
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">
                      {widget.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={widget.key}
                  checked={widgetSettings[widget.key]}
                  onCheckedChange={() => toggleWidget(widget.key)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Section Widgets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {t('settings.aiWidgets', 'AI Features')}
          </CardTitle>
          <CardDescription>
            {t('settings.aiWidgetsDesc', 'Configure AI-powered features and widgets')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiWidgetsFiltered.concat(aiWidgets).map((widget) => (
              <div key={widget.key} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 interactive-hover">
                <div className="flex items-start gap-3">
                  <div className="text-gray-500 mt-1">
                    {widget.icon}
                  </div>
                  <div>
                    <Label htmlFor={widget.key} className="font-medium cursor-pointer">
                      {widget.title}
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">
                      {widget.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={widget.key}
                  checked={widgetSettings[widget.key]}
                  onCheckedChange={() => toggleWidget(widget.key)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            {t('settings.appearance', 'Appearance')}
          </CardTitle>
          <CardDescription>
            {t('settings.appearanceDesc', 'Customize the look and feel of your dashboard')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {appearanceSettings.map((setting) => (
              <div key={setting.key} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 interactive-hover">
                <div className="flex items-start gap-3">
                  <div className="text-gray-500 mt-1">
                    {setting.icon}
                  </div>
                  <div>
                    <Label htmlFor={setting.key} className="font-medium cursor-pointer">
                      {setting.title}
                    </Label>
                    <p className="text-sm text-gray-500 mt-1">
                      {setting.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={setting.key}
                  checked={widgetSettings[setting.key]}
                  onCheckedChange={() => toggleWidget(setting.key)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Button
          variant="outline"
          onClick={handleResetToDefaults}
          className="flex items-center gap-2 btn-transition"
        >
          <RotateCcw className="h-4 w-4" />
          {t('settings.resetDefaults', 'Reset to Defaults')}
        </Button>
        
        <Button
          onClick={saveSettings}
          disabled={loading}
          className="flex items-center gap-2 btn-transition"
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {t('settings.saveChanges', 'Save Changes')}
        </Button>
      </div>
    </div>
  );
};

export default DashboardAppearanceSettings;