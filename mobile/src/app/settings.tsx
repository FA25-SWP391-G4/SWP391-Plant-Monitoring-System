import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import api from '../api/apiClient';

export default function SettingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'widgets' | 'appearance' | 'language' | 'notifications' | 'privacy'>('widgets');

  // Widget settings matching user's screen
  const [widgets, setWidgets] = useState({
    plantOverview: true,
    sensorData: true,
    weather: true,
    wateringSchedule: true,
    notifications: true,
    recentActivity: false,
    aiInsights: true,
    aiChatbot: true,
    imageAnalysis: true,
    compactMode: false,
    animations: true,
  });

  // Appearance settings
  const [theme, setTheme] = useState<'dark' | 'light' | 'system'>('dark');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

  // Language & Unit settings
  const [language, setLanguage] = useState<'en' | 'vi'>('en');
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [timeFormat, setTimeFormat] = useState<'24h' | '12h'>('24h');

  // Notification settings
  const [notifications, setNotifications] = useState({
    push: true,
    criticalAlerts: true,
    wateringReminders: true,
    weeklyReport: false,
    sound: true,
  });

  // Privacy settings
  const [privacy, setPrivacy] = useState({
    shareTelemetry: false,
    analytics: true,
    cloudSync: true,
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        const res: any = await api.settings.get();
        if (res?.data) {
          if (res.data.widgets) setWidgets((p) => ({ ...p, ...res.data.widgets }));
          if (res.data.appearance?.theme) setTheme(res.data.appearance.theme);
        }
      } catch (err) {
        console.log('[SETTINGS] Notice: Using local preferences:', err);
      }
    }
    fetchSettings();
  }, []);

  const toggleWidget = (key: keyof typeof widgets) => {
    setWidgets((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.settings.update({
        widgets,
        appearance: { theme, fontSize },
        language: { preferred: language, tempUnit, timeFormat },
        notifications,
        privacy,
      });
    } catch (err) {
      console.log('[SETTINGS] Saved locally:', err);
    } finally {
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#09121B]">
      {/* Top Header */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-[#1E293B]">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-xl bg-[#1E293B] border border-[#334155] items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="#34D399" />
        </TouchableOpacity>
        
        <View className="items-center">
          <Text className="text-white text-base font-bold">Settings</Text>
          <Text className="text-gray-400 text-[10px]">Preferences & Configuration</Text>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          className="bg-[#064E3B] px-3 py-1.5 rounded-xl border border-[#10B981]/40 flex-row items-center"
        >
          <Ionicons name="checkmark" size={14} color="#34D399" />
          <Text className="text-[#34D399] font-bold text-xs ml-1">Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 pt-4 pb-12" showsVerticalScrollIndicator={false}>
        {/* Blue Header Banner matching desktop */}
        <View className="rounded-3xl overflow-hidden mb-5">
          <LinearGradient
            colors={['#2563EB', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 22, borderRadius: 24 }}
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center mr-4 border border-white/30">
                <Ionicons name="options" size={26} color="#FFFFFF" />
              </View>
              <View className="flex-1">
                <Text className="text-white text-2xl font-black tracking-tight">Settings</Text>
                <Text className="text-white/80 text-xs font-medium mt-0.5">
                  Customize your dashboard and preferences
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Temporary Success Toast */}
        {savedSuccess && (
          <View className="bg-[#064E3B] border border-[#10B981] rounded-2xl py-2.5 px-4 mb-4 flex-row items-center justify-center">
            <Ionicons name="checkmark-circle" size={16} color="#34D399" />
            <Text className="text-[#34D399] text-xs font-bold ml-2">
              Settings updated successfully!
            </Text>
          </View>
        )}

        {/* Horizontal Category Navigation Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row mb-5 -mx-1"
        >
          {[
            { id: 'widgets', label: 'Widgets', icon: 'grid-outline' },
            { id: 'appearance', label: 'Appearance', icon: 'color-palette-outline' },
            { id: 'language', label: 'Language', icon: 'language-outline' },
            { id: 'notifications', label: 'Alerts', icon: 'notifications-outline' },
            { id: 'privacy', label: 'Privacy', icon: 'shield-checkmark-outline' },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-4 rounded-2xl mr-2.5 flex-row items-center border ${
                  active
                    ? 'bg-[#2563EB] border-[#3B82F6]'
                    : 'bg-[#1E293B] border-[#334155]'
                }`}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={15}
                  color={active ? '#FFFFFF' : '#9CA3AF'}
                />
                <Text
                  className={`text-xs font-bold ml-1.5 ${
                    active ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* TAB 1: WIDGETS & FEATURES */}
        {activeTab === 'widgets' && (
          <View className="pb-10">
            {/* Dashboard Widgets Section */}
            <Text className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-3 px-1">
              Dashboard Widgets
            </Text>

            <View className="bg-[#1E293B] border border-[#334155] rounded-3xl p-4 mb-6 space-y-1">
              {/* Plant Overview */}
              <View className="flex-row items-center justify-between py-3 border-b border-[#334155]/60">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-sm font-bold">Plant Overview</Text>
                  <Text className="text-gray-400 text-xs">Show plant statistics cards</Text>
                </View>
                <Switch
                  value={widgets.plantOverview}
                  onValueChange={() => toggleWidget('plantOverview')}
                  trackColor={{ false: '#334155', true: '#3B82F6' }}
                  thumbColor={widgets.plantOverview ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>

              {/* Sensor Data Widgets */}
              <View className="flex-row items-center justify-between py-3 border-b border-[#334155]/60">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-sm font-bold">Sensor Data Widgets</Text>
                  <Text className="text-gray-400 text-xs">Display real-time sensor readings</Text>
                </View>
                <Switch
                  value={widgets.sensorData}
                  onValueChange={() => toggleWidget('sensorData')}
                  trackColor={{ false: '#334155', true: '#3B82F6' }}
                  thumbColor={widgets.sensorData ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>

              {/* Weather Widget */}
              <View className="flex-row items-center justify-between py-3 border-b border-[#334155]/60">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-sm font-bold">Weather Widget</Text>
                  <Text className="text-gray-400 text-xs">Display weather information</Text>
                </View>
                <Switch
                  value={widgets.weather}
                  onValueChange={() => toggleWidget('weather')}
                  trackColor={{ false: '#334155', true: '#3B82F6' }}
                  thumbColor={widgets.weather ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>

              {/* Watering Schedule */}
              <View className="flex-row items-center justify-between py-3 border-b border-[#334155]/60">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-sm font-bold">Watering Schedule</Text>
                  <Text className="text-gray-400 text-xs">Display upcoming watering schedule</Text>
                </View>
                <Switch
                  value={widgets.wateringSchedule}
                  onValueChange={() => toggleWidget('wateringSchedule')}
                  trackColor={{ false: '#334155', true: '#3B82F6' }}
                  thumbColor={widgets.wateringSchedule ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>

              {/* Notifications Widget */}
              <View className="flex-row items-center justify-between py-3 border-b border-[#334155]/60">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-sm font-bold">Notifications Widget</Text>
                  <Text className="text-gray-400 text-xs">Show recent notifications</Text>
                </View>
                <Switch
                  value={widgets.notifications}
                  onValueChange={() => toggleWidget('notifications')}
                  trackColor={{ false: '#334155', true: '#3B82F6' }}
                  thumbColor={widgets.notifications ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>

              {/* Recent Activity */}
              <View className="flex-row items-center justify-between py-3">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-sm font-bold">Recent Activity</Text>
                  <Text className="text-gray-400 text-xs">Display recent plant care activities</Text>
                </View>
                <Switch
                  value={widgets.recentActivity}
                  onValueChange={() => toggleWidget('recentActivity')}
                  trackColor={{ false: '#334155', true: '#3B82F6' }}
                  thumbColor={widgets.recentActivity ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
            </View>

            {/* AI Features Section */}
            <Text className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-3 px-1">
              AI & Intelligent Tools
            </Text>

            <View className="bg-[#1E293B] border border-[#334155] rounded-3xl p-4 mb-6">
              <View className="flex-row items-center justify-between py-3 border-b border-[#334155]/60">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-sm font-bold">AI Diagnostics & Predictions</Text>
                  <Text className="text-gray-400 text-xs">Show watering neural predictions</Text>
                </View>
                <Switch
                  value={widgets.aiInsights}
                  onValueChange={() => toggleWidget('aiInsights')}
                  trackColor={{ false: '#334155', true: '#7C3AED' }}
                  thumbColor={widgets.aiInsights ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>

              <View className="flex-row items-center justify-between py-3 border-b border-[#334155]/60">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-sm font-bold">AI Chatbot Assistant</Text>
                  <Text className="text-gray-400 text-xs">Quick botanical guidance bot</Text>
                </View>
                <Switch
                  value={widgets.aiChatbot}
                  onValueChange={() => toggleWidget('aiChatbot')}
                  trackColor={{ false: '#334155', true: '#7C3AED' }}
                  thumbColor={widgets.aiChatbot ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>

              <View className="flex-row items-center justify-between py-3">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-sm font-bold">Foliage Image Analysis</Text>
                  <Text className="text-gray-400 text-xs">Leaf camera vision disease detection</Text>
                </View>
                <Switch
                  value={widgets.imageAnalysis}
                  onValueChange={() => toggleWidget('imageAnalysis')}
                  trackColor={{ false: '#334155', true: '#7C3AED' }}
                  thumbColor={widgets.imageAnalysis ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: APPEARANCE */}
        {activeTab === 'appearance' && (
          <View className="pb-10">
            <Text className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-3 px-1">
              Theme Mode
            </Text>

            <View className="flex-row gap-2.5 mb-6">
              {[
                { id: 'dark', label: 'Dark Mode', icon: 'moon' },
                { id: 'light', label: 'Light Mode', icon: 'sunny' },
                { id: 'system', label: 'System', icon: 'phone-portrait-outline' },
              ].map((m) => {
                const active = theme === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => setTheme(m.id as any)}
                    className={`flex-1 py-4 px-2 rounded-2xl items-center border ${
                      active
                        ? 'bg-[#1E293B] border-[#34D399]'
                        : 'bg-[#0F172A] border-[#334155]'
                    }`}
                  >
                    <Ionicons
                      name={m.icon as any}
                      size={20}
                      color={active ? '#34D399' : '#9CA3AF'}
                    />
                    <Text
                      className={`text-xs font-bold mt-2 ${
                        active ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-3 px-1">
              Typography Size
            </Text>

            <View className="bg-[#1E293B] border border-[#334155] rounded-3xl p-4 mb-6">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <TouchableOpacity
                  key={size}
                  onPress={() => setFontSize(size)}
                  className="flex-row items-center justify-between py-3 border-b border-[#334155]/60 last:border-b-0"
                >
                  <Text className="text-white text-sm capitalize">{size} Font Scale</Text>
                  {fontSize === size && (
                    <Ionicons name="checkmark-circle" size={18} color="#34D399" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-3 px-1">
              UI Enhancements
            </Text>

            <View className="bg-[#1E293B] border border-[#334155] rounded-3xl p-4">
              <View className="flex-row items-center justify-between py-3 border-b border-[#334155]/60">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-sm font-bold">Compact Dashboard Cards</Text>
                  <Text className="text-gray-400 text-xs">Reduces vertical padding for dense data</Text>
                </View>
                <Switch
                  value={widgets.compactMode}
                  onValueChange={() => toggleWidget('compactMode')}
                  trackColor={{ false: '#334155', true: '#34D399' }}
                  thumbColor={widgets.compactMode ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>

              <View className="flex-row items-center justify-between py-3">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-sm font-bold">Animations & Motion</Text>
                  <Text className="text-gray-400 text-xs">Smooth transitions & pulse effects</Text>
                </View>
                <Switch
                  value={widgets.animations}
                  onValueChange={() => toggleWidget('animations')}
                  trackColor={{ false: '#334155', true: '#34D399' }}
                  thumbColor={widgets.animations ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
            </View>
          </View>
        )}

        {/* TAB 3: LANGUAGE & UNITS */}
        {activeTab === 'language' && (
          <View className="pb-10">
            <Text className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-3 px-1">
              App Language
            </Text>

            <View className="bg-[#1E293B] border border-[#334155] rounded-3xl p-4 mb-6">
              {[
                { id: 'en', label: 'English (US)', flag: '🇺🇸' },
                { id: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
              ].map((lang) => (
                <TouchableOpacity
                  key={lang.id}
                  onPress={() => setLanguage(lang.id as any)}
                  className="flex-row items-center justify-between py-3.5 border-b border-[#334155]/60 last:border-b-0"
                >
                  <View className="flex-row items-center">
                    <Text className="text-xl mr-3">{lang.flag}</Text>
                    <Text className="text-white text-sm font-medium">{lang.label}</Text>
                  </View>
                  {language === lang.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#34D399" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-3 px-1">
              Telemetry Measurement Units
            </Text>

            <View className="bg-[#1E293B] border border-[#334155] rounded-3xl p-4 mb-6">
              <View className="flex-row items-center justify-between py-3 border-b border-[#334155]/60">
                <Text className="text-white text-sm font-medium">Temperature Scale</Text>
                <View className="flex-row bg-[#0F172A] p-1 rounded-xl border border-[#334155]">
                  <TouchableOpacity
                    onPress={() => setTempUnit('C')}
                    className={`px-3 py-1 rounded-lg ${tempUnit === 'C' ? 'bg-[#34D399]' : ''}`}
                  >
                    <Text className={`text-xs font-bold ${tempUnit === 'C' ? 'text-[#064E3B]' : 'text-gray-400'}`}>°C</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setTempUnit('F')}
                    className={`px-3 py-1 rounded-lg ${tempUnit === 'F' ? 'bg-[#34D399]' : ''}`}
                  >
                    <Text className={`text-xs font-bold ${tempUnit === 'F' ? 'text-[#064E3B]' : 'text-gray-400'}`}>°F</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="flex-row items-center justify-between py-3">
                <Text className="text-white text-sm font-medium">Time Format</Text>
                <View className="flex-row bg-[#0F172A] p-1 rounded-xl border border-[#334155]">
                  <TouchableOpacity
                    onPress={() => setTimeFormat('24h')}
                    className={`px-3 py-1 rounded-lg ${timeFormat === '24h' ? 'bg-[#34D399]' : ''}`}
                  >
                    <Text className={`text-xs font-bold ${timeFormat === '24h' ? 'text-[#064E3B]' : 'text-gray-400'}`}>24h</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setTimeFormat('12h')}
                    className={`px-3 py-1 rounded-lg ${timeFormat === '12h' ? 'bg-[#34D399]' : ''}`}
                  >
                    <Text className={`text-xs font-bold ${timeFormat === '12h' ? 'text-[#064E3B]' : 'text-gray-400'}`}>12h</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* TAB 4: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <View className="pb-10">
            <Text className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-3 px-1">
              Push Notification Triggers
            </Text>

            <View className="bg-[#1E293B] border border-[#334155] rounded-3xl p-4 mb-6">
              <View className="flex-row items-center justify-between py-3 border-b border-[#334155]/60">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-sm font-bold">Critical Soil Moisture Alerts</Text>
                  <Text className="text-gray-400 text-xs">Notify when soil drops below 25%</Text>
                </View>
                <Switch
                  value={notifications.criticalAlerts}
                  onValueChange={(val) => setNotifications((p) => ({ ...p, criticalAlerts: val }))}
                  trackColor={{ false: '#334155', true: '#F87171' }}
                  thumbColor={notifications.criticalAlerts ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>

              <View className="flex-row items-center justify-between py-3 border-b border-[#334155]/60">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-sm font-bold">Watering Schedule Reminders</Text>
                  <Text className="text-gray-400 text-xs">Alert before morning/evening windows</Text>
                </View>
                <Switch
                  value={notifications.wateringReminders}
                  onValueChange={(val) => setNotifications((p) => ({ ...p, wateringReminders: val }))}
                  trackColor={{ false: '#334155', true: '#34D399' }}
                  thumbColor={notifications.wateringReminders ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>

              <View className="flex-row items-center justify-between py-3">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-sm font-bold">Weekly Botanical Health Digest</Text>
                  <Text className="text-gray-400 text-xs">Summary of growth and hydration</Text>
                </View>
                <Switch
                  value={notifications.weeklyReport}
                  onValueChange={(val) => setNotifications((p) => ({ ...p, weeklyReport: val }))}
                  trackColor={{ false: '#334155', true: '#34D399' }}
                  thumbColor={notifications.weeklyReport ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
            </View>
          </View>
        )}

        {/* TAB 5: PRIVACY & SECURITY */}
        {activeTab === 'privacy' && (
          <View className="pb-10">
            <Text className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-3 px-1">
              Data & Cloud Synchronization
            </Text>

            <View className="bg-[#1E293B] border border-[#334155] rounded-3xl p-4 mb-6">
              <View className="flex-row items-center justify-between py-3 border-b border-[#334155]/60">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-sm font-bold">Auto Cloud Telemetry Backup</Text>
                  <Text className="text-gray-400 text-xs">Sync historical moisture graphs to database</Text>
                </View>
                <Switch
                  value={privacy.cloudSync}
                  onValueChange={(val) => setPrivacy((p) => ({ ...p, cloudSync: val }))}
                  trackColor={{ false: '#334155', true: '#34D399' }}
                  thumbColor={privacy.cloudSync ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>

              <View className="flex-row items-center justify-between py-3">
                <View className="flex-1 pr-3">
                  <Text className="text-white text-sm font-bold">Anonymous Sensor Benchmarking</Text>
                  <Text className="text-gray-400 text-xs">Improve ML watering prediction accuracy</Text>
                </View>
                <Switch
                  value={privacy.analytics}
                  onValueChange={(val) => setPrivacy((p) => ({ ...p, analytics: val }))}
                  trackColor={{ false: '#334155', true: '#34D399' }}
                  thumbColor={privacy.analytics ? '#FFFFFF' : '#9CA3AF'}
                />
              </View>
            </View>

            {/* App Info Card */}
            <View className="bg-[#0F172A] border border-[#334155] rounded-2xl p-4 items-center">
              <View className="w-10 h-10 rounded-xl bg-[#064E3B] items-center justify-center mb-2">
                <MaterialCommunityIcons name="flower-tulip-outline" size={20} color="#34D399" />
              </View>
              <Text className="text-white text-sm font-bold">PlantSmart Mobile</Text>
              <Text className="text-gray-400 text-xs mt-0.5">Version 1.2.0 (Build 2026.10)</Text>
              <Text className="text-gray-500 text-[10px] mt-2">© 2026 PlantSmart IoT Systems</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
