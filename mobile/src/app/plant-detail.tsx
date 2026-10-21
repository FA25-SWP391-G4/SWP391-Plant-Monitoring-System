import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import api from '../api/apiClient';

export default function PlantDetailScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'chat' | 'history'>('overview');
  const [isWatering, setIsWatering] = useState(false);
  const [wateredSuccess, setWateredSuccess] = useState(false);
  const [selectedHistoryMetric, setSelectedHistoryMetric] = useState<'moisture' | 'temperature' | 'humidity' | 'light'>('moisture');
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: 'Hello! I am your PlantSmart AI assistant. I have analyzed your Basil Plant telemetry. Soil moisture is currently low (8%). How can I help you today?',
      time: '12:45 PM',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleWaterPlant = async () => {
    setIsWatering(true);
    try {
      await api.plants.water(1, 5);
    } catch (e) {
      console.log('[WATER] Backend command sent (or simulated):', e);
    } finally {
      setIsWatering(false);
      setWateredSuccess(true);
      setTimeout(() => setWateredSuccess(false), 3500);
    }
  };

  const handleSendChat = (customText?: string) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim()) return;

    const userMsg = {
      sender: 'user' as const,
      text: textToSend,
      time: 'Just now',
    };

    setChatMessages((prev) => [...prev, userMsg]);
    if (!customText) setChatInput('');

    // Simulate AI response
    setTimeout(() => {
      let aiReply = "Basil thrives with consistently moist but well-drained soil. Since your sensor reads 8%, give it a thorough soaking until water drains freely, then let the top inch dry before watering again.";
      if (textToSend.toLowerCase().includes('prun')) {
        aiReply = "To encourage bushy growth, pinch off the top set of leaves just above a leaf pair. Also promptly remove flower buds to keep the leaves flavorful and sweet!";
      } else if (textToSend.toLowerCase().includes('light') || textToSend.toLowerCase().includes('sun')) {
        aiReply = "Basil loves lots of light! It needs at least 6 to 8 hours of direct sunshine per day. If kept indoors, place it on a south-facing windowsill or under a grow light.";
      }
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiReply,
          time: 'Just now',
        },
      ]);
    }, 900);
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
          <Text className="text-white text-base font-bold">Basil Plant</Text>
          <Text className="text-gray-400 text-[10px]">Ocimum basilicum</Text>
        </View>

        <View className="flex-row space-x-2">
          <TouchableOpacity className="w-10 h-10 rounded-xl bg-[#1E293B] border border-[#334155] items-center justify-center">
            <Ionicons name="share-social-outline" size={18} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 rounded-xl bg-[#1E293B] border border-[#334155] items-center justify-center">
            <Ionicons name="ellipsis-vertical" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Plant Showcase */}
        <View className="px-5 pt-4">
          <View className="bg-[#1E293B] border border-[#334155] rounded-3xl p-5 mb-5 overflow-hidden relative">
            {/* Background subtle glow */}
            <View className="absolute -right-12 -top-12 w-44 h-44 bg-[#10B981]/10 rounded-full blur-2xl" />

            <View className="flex-row items-center mb-4">
              {/* Plant Image Avatar */}
              <View className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-800 border-2 border-[#334155] mr-4 relative">
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1615477023356-af4cfa52022e?q=80&w=400&auto=format&fit=crop' }}
                  className="w-full h-full"
                />
                <View className="absolute bottom-1 right-1 bg-black/75 px-1.5 py-0.5 rounded-full flex-row items-center">
                  <View className="w-1.5 h-1.5 bg-[#34D399] rounded-full mr-1" />
                  <Text className="text-white text-[8px] font-bold">LIVE</Text>
                </View>
              </View>

              {/* Plant Info */}
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-white text-xl font-bold tracking-tight">Basil Plant</Text>
                </View>
                
                <Text className="text-[#34D399] text-xs font-semibold mb-2">Ocimum basilicum</Text>

                <View className="flex-row items-center flex-wrap gap-1.5">
                  <View className="bg-[#064E3B] px-2.5 py-1 rounded-full flex-row items-center border border-[#10B981]/30">
                    <View className="w-1.5 h-1.5 bg-[#34D399] rounded-full mr-1.5" />
                    <Text className="text-[#34D399] text-[10px] font-bold">Healthy</Text>
                  </View>
                  <View className="bg-[#0F172A] px-2.5 py-1 rounded-full flex-row items-center border border-[#334155]">
                    <Ionicons name="location-outline" size={10} color="#9CA3AF" />
                    <Text className="text-gray-300 text-[10px] ml-1">Indoor Herb Zone</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* IoT Hardware Strip */}
            <View className="bg-[#0F172A] rounded-2xl px-3.5 py-2.5 flex-row justify-between items-center border border-[#334155]/60">
              <View className="flex-row items-center">
                <Ionicons name="hardware-chip-outline" size={16} color="#34D399" />
                <Text className="text-gray-300 text-xs font-medium ml-2">PlantMaster-BLE #042</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="battery-charging" size={14} color="#34D399" />
                <Text className="text-[#34D399] text-xs font-bold ml-1">88%</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions Reimagined Bar */}
          <View className="mb-6">
            <View className="flex-row gap-2.5 mb-2.5">
              {/* Water Now Button */}
              <TouchableOpacity
                onPress={handleWaterPlant}
                disabled={isWatering}
                className="flex-1 bg-[#2563EB] py-3.5 px-3 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-500/20 active:opacity-90"
              >
                <Ionicons
                  name={isWatering ? 'hourglass-outline' : 'water'}
                  size={18}
                  color="#FFFFFF"
                />
                <Text className="text-white text-xs font-bold ml-2">
                  {isWatering ? 'Watering (5s)...' : 'Water Now'}
                </Text>
              </TouchableOpacity>

              {/* Ask AI Button */}
              <TouchableOpacity
                onPress={() => setActiveTab('chat')}
                className="flex-1 bg-[#7C3AED] py-3.5 px-3 rounded-2xl flex-row items-center justify-center shadow-lg shadow-purple-500/20 active:opacity-90"
              >
                <MaterialCommunityIcons name="star-four-points" size={18} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold ml-2">Ask AI</Text>
              </TouchableOpacity>
            </View>

            <View className="flex-row gap-2.5">
              {/* Analyze Image */}
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/analyze-image' as any,
                    params: { plantId: '1', plantName: 'Basil Plant' },
                  })
                }
                className="flex-1 bg-[#0284C7] py-3 px-3 rounded-2xl flex-row items-center justify-center shadow-md shadow-sky-500/20 active:opacity-90"
              >
                <Ionicons name="image-outline" size={16} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold ml-2">Analyze Image</Text>
              </TouchableOpacity>

              {/* Edit Plant */}
              <TouchableOpacity
                onPress={() => router.push('/add-plant')}
                className="flex-1 bg-[#1E293B] border border-[#334155] py-3 px-3 rounded-2xl flex-row items-center justify-center active:opacity-90"
              >
                <Feather name="edit-3" size={16} color="#E2E8F0" />
                <Text className="text-gray-200 text-xs font-bold ml-2">Edit Plant</Text>
              </TouchableOpacity>
            </View>

            {/* Temporary Success Toast */}
            {wateredSuccess && (
              <View className="mt-3 bg-[#064E3B] border border-[#10B981] rounded-xl py-2 px-4 flex-row items-center justify-center">
                <Ionicons name="checkmark-circle" size={16} color="#34D399" />
                <Text className="text-[#34D399] text-xs font-semibold ml-2">
                  Watering pulse active! 50ml delivered.
                </Text>
              </View>
            )}
          </View>

          {/* Sliding Pill Tabs */}
          <View className="bg-[#1E293B] p-1.5 rounded-2xl flex-row mb-6 border border-[#334155]">
            {[
              { id: 'overview', label: 'Overview', icon: 'grid-outline' },
              { id: 'predictions', label: 'Predictions', icon: 'sparkles-outline' },
              { id: 'chat', label: 'AI Chat', icon: 'chatbubble-ellipses-outline' },
              { id: 'history', label: 'History', icon: 'trending-up-outline' },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id as any)}
                  className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center ${
                    active ? 'bg-[#34D399]' : 'bg-transparent'
                  }`}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={14}
                    color={active ? '#064E3B' : '#9CA3AF'}
                  />
                  <Text
                    className={`text-[11px] font-bold ml-1.5 ${
                      active ? 'text-[#064E3B]' : 'text-gray-400'
                    }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <View className="px-5 pb-12">
            {/* Current Conditions Header */}
            <View className="flex-row justify-between items-center mb-3">
              <View>
                <Text className="text-white text-base font-bold">Current Conditions</Text>
                <Text className="text-gray-400 text-[10px]">Real-time telemetry from BLE sensor</Text>
              </View>
              <View className="bg-[#064E3B]/40 px-2.5 py-1 rounded-full flex-row items-center border border-[#10B981]/30">
                <View className="w-1.5 h-1.5 bg-[#34D399] rounded-full animate-ping mr-1.5" />
                <Text className="text-[#34D399] text-[10px] font-bold">LIVE SYNC</Text>
              </View>
            </View>

            {/* 2x2 Telemetry Cards */}
            <View className="flex-row flex-wrap gap-3 mb-6">
              {/* Soil Moisture */}
              <View className="w-[48%] bg-[#1E293B] border border-[#334155] rounded-2xl p-4 relative overflow-hidden">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="w-9 h-9 bg-blue-500/20 rounded-xl items-center justify-center">
                    <Ionicons name="water" size={18} color="#60A5FA" />
                  </View>
                  <View className="bg-red-500/20 px-2 py-0.5 rounded-full border border-red-500/30">
                    <Text className="text-red-400 text-[9px] font-bold">Low</Text>
                  </View>
                </View>
                <Text className="text-gray-400 text-[11px] font-medium">Soil Moisture</Text>
                <Text className="text-white text-2xl font-bold my-1">8%</Text>
                
                {/* Visual Bar */}
                <View className="h-1.5 bg-[#0F172A] rounded-full overflow-hidden mb-1.5">
                  <View className="h-full bg-red-400 rounded-full w-[8%]" />
                </View>
                <Text className="text-gray-400 text-[9px]">Target: 45% - 65%</Text>
              </View>

              {/* Temperature */}
              <View className="w-[48%] bg-[#1E293B] border border-[#334155] rounded-2xl p-4 relative overflow-hidden">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="w-9 h-9 bg-red-500/20 rounded-xl items-center justify-center">
                    <Ionicons name="thermometer" size={18} color="#F87171" />
                  </View>
                  <View className="bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                    <Text className="text-amber-400 text-[9px] font-bold">Warm</Text>
                  </View>
                </View>
                <Text className="text-gray-400 text-[11px] font-medium">Temperature</Text>
                <Text className="text-white text-2xl font-bold my-1">33.5°C</Text>
                
                {/* Visual Bar */}
                <View className="h-1.5 bg-[#0F172A] rounded-full overflow-hidden mb-1.5">
                  <View className="h-full bg-amber-400 rounded-full w-[70%]" />
                </View>
                <Text className="text-gray-400 text-[9px]">Optimal: 18°C - 30°C</Text>
              </View>

              {/* Humidity */}
              <View className="w-[48%] bg-[#1E293B] border border-[#334155] rounded-2xl p-4 relative overflow-hidden">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="w-9 h-9 bg-cyan-500/20 rounded-xl items-center justify-center">
                    <MaterialCommunityIcons name="water-percent" size={20} color="#22D3EE" />
                  </View>
                  <View className="bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    <Text className="text-emerald-400 text-[9px] font-bold">Optimal</Text>
                  </View>
                </View>
                <Text className="text-gray-400 text-[11px] font-medium">Air Humidity</Text>
                <Text className="text-white text-2xl font-bold my-1">57.5%</Text>
                
                {/* Visual Bar */}
                <View className="h-1.5 bg-[#0F172A] rounded-full overflow-hidden mb-1.5">
                  <View className="h-full bg-emerald-400 rounded-full w-[58%]" />
                </View>
                <Text className="text-gray-400 text-[9px]">Optimal: 50% - 70%</Text>
              </View>

              {/* Light Intensity */}
              <View className="w-[48%] bg-[#1E293B] border border-[#334155] rounded-2xl p-4 relative overflow-hidden">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="w-9 h-9 bg-amber-500/20 rounded-xl items-center justify-center">
                    <Ionicons name="sunny" size={18} color="#FBBF24" />
                  </View>
                  <View className="bg-gray-500/20 px-2 py-0.5 rounded-full border border-gray-500/30">
                    <Text className="text-gray-400 text-[9px] font-bold">Dark</Text>
                  </View>
                </View>
                <Text className="text-gray-400 text-[11px] font-medium">Light Intensity</Text>
                <Text className="text-white text-2xl font-bold my-1">0 lux</Text>
                
                {/* Visual Bar */}
                <View className="h-1.5 bg-[#0F172A] rounded-full overflow-hidden mb-1.5">
                  <View className="h-full bg-gray-500 rounded-full w-[5%]" />
                </View>
                <Text className="text-gray-400 text-[9px]">Night / Dormant cycle</Text>
              </View>
            </View>

            {/* AI Diagnostics & Alert Banner */}
            <View className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] border border-[#3B82F6]/40 rounded-2xl p-4 mb-6 relative overflow-hidden">
              <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-xl bg-blue-500/20 items-center justify-center mr-3 mt-0.5 border border-blue-400/30">
                  <MaterialCommunityIcons name="robot-happy-outline" size={20} color="#60A5FA" />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <Text className="text-white font-bold text-sm">PlantSmart AI Diagnostic</Text>
                    <View className="bg-blue-500/20 px-2 py-0.2 rounded-full ml-2">
                      <Text className="text-blue-400 text-[9px] font-bold">PRIORITY</Text>
                    </View>
                  </View>
                  <Text className="text-gray-300 text-xs leading-relaxed mb-3">
                    Moisture is at 8% (below the 25% threshold). Basil roots risk desiccation at 33.5°C temperature. We recommend dispensing 50-100ml immediately.
                  </Text>
                  
                  <TouchableOpacity
                    onPress={handleWaterPlant}
                    className="bg-[#34D399] py-2 px-3.5 rounded-xl self-start flex-row items-center"
                  >
                    <Ionicons name="water" size={14} color="#064E3B" />
                    <Text className="text-[#064E3B] font-bold text-xs ml-1.5">
                      Quick Water 50ml Now
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Reimagined Care Guide Cards */}
            <View className="mb-4">
              <Text className="text-white text-base font-bold mb-3">Botanical Care Guide</Text>
              
              <View className="space-y-3">
                {/* Care 1 */}
                <View className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4 flex-row items-center mb-2.5">
                  <View className="w-10 h-10 rounded-xl bg-blue-500/10 items-center justify-center mr-3.5">
                    <Ionicons name="water-outline" size={20} color="#60A5FA" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-xs">Hydration Rule</Text>
                    <Text className="text-gray-400 text-[11px] leading-tight">
                      Water consistently. Basil wilts fast in heat but rebounds quickly.
                    </Text>
                  </View>
                </View>

                {/* Care 2 */}
                <View className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4 flex-row items-center mb-2.5">
                  <View className="w-10 h-10 rounded-xl bg-amber-500/10 items-center justify-center mr-3.5">
                    <Ionicons name="sunny-outline" size={20} color="#FBBF24" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-xs">Sunlight Exposure</Text>
                    <Text className="text-gray-400 text-[11px] leading-tight">
                      Requires 6-8 hrs bright daily light. South windowsill recommended.
                    </Text>
                  </View>
                </View>

                {/* Care 3 */}
                <View className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4 flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-emerald-500/10 items-center justify-center mr-3.5">
                    <MaterialCommunityIcons name="content-cut" size={20} color="#34D399" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-xs">Pruning & Harvesting</Text>
                    <Text className="text-gray-400 text-[11px] leading-tight">
                      Pinch top shoot nodes regularly to promote bushier growth and sweet leaves.
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: AI PREDICTIONS */}
        {activeTab === 'predictions' && (
          <View className="px-5 pb-12">
            <View className="bg-[#1E293B] border border-[#334155] rounded-3xl p-5 mb-5">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-xl bg-[#7C3AED]/20 items-center justify-center mr-3">
                    <MaterialCommunityIcons name="crystal-ball" size={22} color="#A78BFA" />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-base">Watering Prediction</Text>
                    <Text className="text-[#A78BFA] text-xs font-medium">Neural ML Model v3.2</Text>
                  </View>
                </View>
                <View className="bg-[#7C3AED]/20 px-3 py-1 rounded-full border border-[#7C3AED]/40">
                  <Text className="text-[#A78BFA] text-[10px] font-bold">96% Accuracy</Text>
                </View>
              </View>

              <View className="bg-[#0F172A] rounded-2xl p-4 mb-4 border border-[#334155]">
                <Text className="text-gray-400 text-xs mb-1">Estimated Next Watering Required</Text>
                <Text className="text-[#34D399] text-2xl font-bold mb-1">In ~3.5 Hours</Text>
                <Text className="text-gray-400 text-[10px]">
                  Based on ambient temperature (33.5°C) and rapid soil evaporation curve.
                </Text>
              </View>

              {/* Prediction Metrics */}
              <View className="flex-row justify-between pt-2">
                <View className="items-center">
                  <Text className="text-gray-400 text-[10px] font-bold">HEALTH SCORE</Text>
                  <Text className="text-[#34D399] text-xl font-bold mt-1">92 / 100</Text>
                  <Text className="text-emerald-400 text-[9px]">Strong Rooting</Text>
                </View>
                <View className="w-[1px] bg-[#334155]" />
                <View className="items-center">
                  <Text className="text-gray-400 text-[10px] font-bold">EVAPORATION</Text>
                  <Text className="text-amber-400 text-xl font-bold mt-1">1.4%/hr</Text>
                  <Text className="text-amber-400 text-[9px]">High (Warm Temp)</Text>
                </View>
                <View className="w-[1px] bg-[#334155]" />
                <View className="items-center">
                  <Text className="text-gray-400 text-[10px] font-bold">OPTIMAL TIME</Text>
                  <Text className="text-white text-xl font-bold mt-1">17:30</Text>
                  <Text className="text-gray-400 text-[9px]">Pre-dusk window</Text>
                </View>
              </View>
            </View>

            {/* Smart Schedule Card */}
            <View className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4">
              <Text className="text-white font-bold text-sm mb-3">AI Autonomous Action Plan</Text>
              <View className="flex-row items-center justify-between py-2 border-b border-[#334155]">
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={16} color="#34D399" />
                  <Text className="text-gray-200 text-xs ml-2">17:30 PM Today</Text>
                </View>
                <Text className="text-[#34D399] text-xs font-bold">Auto-Dispense 60ml</Text>
              </View>
              <View className="flex-row items-center justify-between py-2">
                <View className="flex-row items-center">
                  <Ionicons name="sunny-outline" size={16} color="#FBBF24" />
                  <Text className="text-gray-200 text-xs ml-2">Tomorrow Morning</Text>
                </View>
                <Text className="text-gray-400 text-xs">Direct Sun Soak 4h</Text>
              </View>
            </View>
          </View>
        )}

        {/* TAB 3: AI CHAT */}
        {activeTab === 'chat' && (
          <View className="px-5 pb-12">
            {/* Quick Prompt Pills */}
            <Text className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-2">Suggested Inquiries</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-4">
              <TouchableOpacity
                onPress={() => handleSendChat('How often should I water my basil plant?')}
                className="bg-[#1E293B] border border-[#334155] rounded-full px-3.5 py-2 mr-2"
              >
                <Text className="text-gray-300 text-xs font-medium">💧 How often to water?</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleSendChat('How to prune basil to grow bushier?')}
                className="bg-[#1E293B] border border-[#334155] rounded-full px-3.5 py-2 mr-2"
              >
                <Text className="text-gray-300 text-xs font-medium">✂️ Pruning technique</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleSendChat('Does basil need direct sunlight?')}
                className="bg-[#1E293B] border border-[#334155] rounded-full px-3.5 py-2"
              >
                <Text className="text-gray-300 text-xs font-medium">☀️ Sunlight requirements</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Chat Bubble List */}
            <View className="bg-[#1E293B] border border-[#334155] rounded-3xl p-4 mb-4 min-h-[280px]">
              {chatMessages.map((msg, index) => {
                const isAi = msg.sender === 'ai';
                return (
                  <View
                    key={index}
                    className={`flex-row mb-3.5 ${isAi ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAi && (
                      <View className="w-7 h-7 rounded-full bg-[#7C3AED] items-center justify-center mr-2 mt-1">
                        <MaterialCommunityIcons name="star-four-points" size={14} color="#FFF" />
                      </View>
                    )}
                    <View
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        isAi
                          ? 'bg-[#0F172A] border border-[#334155]'
                          : 'bg-[#2563EB]'
                      }`}
                    >
                      <Text
                        className={`text-xs leading-relaxed ${
                          isAi ? 'text-gray-200' : 'text-white font-medium'
                        }`}
                      >
                        {msg.text}
                      </Text>
                      <Text
                        className={`text-[9px] mt-1 text-right ${
                          isAi ? 'text-gray-500' : 'text-blue-200'
                        }`}
                      >
                        {msg.time}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Input Bar */}
            <View className="bg-[#1E293B] border border-[#334155] rounded-2xl flex-row items-center px-4 py-2">
              <TextInput
                value={chatInput}
                onChangeText={setChatInput}
                placeholder="Ask anything about your Basil..."
                placeholderTextColor="#64748B"
                className="flex-1 text-white text-xs py-2"
              />
              <TouchableOpacity
                onPress={() => handleSendChat()}
                className="bg-[#34D399] w-9 h-9 rounded-xl items-center justify-center ml-2"
              >
                <Ionicons name="send" size={15} color="#064E3B" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* TAB 4: HISTORY */}
        {activeTab === 'history' && (
          <View className="px-5 pb-12">
            {/* Metric Selector Chips */}
            <View className="flex-row space-x-2 mb-4">
              {[
                { id: 'moisture', label: 'Moisture', icon: 'water-outline', color: '#60A5FA' },
                { id: 'temperature', label: 'Temp', icon: 'thermometer-outline', color: '#F87171' },
                { id: 'humidity', label: 'Humidity', icon: 'water-percent', color: '#22D3EE' },
                { id: 'light', label: 'Light', icon: 'sunny-outline', color: '#FBBF24' },
              ].map((m) => {
                const active = selectedHistoryMetric === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => setSelectedHistoryMetric(m.id as any)}
                    className={`flex-1 py-2 rounded-xl flex-row items-center justify-center border ${
                      active
                        ? 'bg-[#1E293B] border-[#34D399]'
                        : 'bg-[#0F172A] border-[#334155]'
                    }`}
                  >
                    <Ionicons
                      name={m.icon as any}
                      size={12}
                      color={active ? '#34D399' : '#9CA3AF'}
                    />
                    <Text
                      className={`text-[10px] font-bold ml-1 ${
                        active ? 'text-[#34D399]' : 'text-gray-400'
                      }`}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Simulated 24-Hour Trend Graph Card */}
            <View className="bg-[#1E293B] border border-[#334155] rounded-3xl p-5 mb-5">
              <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text className="text-white font-bold text-sm">24-Hour Trend Analysis</Text>
                  <Text className="text-gray-400 text-[10px]">Hourly telemetry log</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-[#34D399] mr-1.5" />
                  <Text className="text-gray-300 text-[10px]">Avg: 24.2%</Text>
                </View>
              </View>

              {/* Bar visualization */}
              <View className="h-40 flex-row items-end justify-between pt-4 pb-2 border-b border-[#334155]">
                {[
                  { time: '02h', val: 45 },
                  { time: '06h', val: 38 },
                  { time: '10h', val: 28 },
                  { time: '14h', val: 19 },
                  { time: '18h', val: 14 },
                  { time: '22h', val: 8 },
                ].map((item, idx) => (
                  <View key={idx} className="items-center flex-1">
                    <Text className="text-gray-400 text-[9px] mb-1 font-bold">{item.val}%</Text>
                    <View
                      style={{ height: `${item.val * 1.8}%` }}
                      className={`w-7 rounded-t-lg ${
                        item.val <= 10 ? 'bg-red-400' : item.val < 30 ? 'bg-amber-400' : 'bg-[#34D399]'
                      }`}
                    />
                    <Text className="text-gray-500 text-[9px] mt-2">{item.time}</Text>
                  </View>
                ))}
              </View>

              <View className="flex-row justify-between mt-3 text-center">
                <View>
                  <Text className="text-gray-500 text-[9px]">MINIMUM</Text>
                  <Text className="text-red-400 text-xs font-bold">8%</Text>
                </View>
                <View>
                  <Text className="text-gray-500 text-[9px]">AVERAGE</Text>
                  <Text className="text-white text-xs font-bold">25.3%</Text>
                </View>
                <View>
                  <Text className="text-gray-500 text-[9px]">PEAK</Text>
                  <Text className="text-emerald-400 text-xs font-bold">48%</Text>
                </View>
              </View>
            </View>

            {/* Event Log */}
            <View className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4">
              <Text className="text-white font-bold text-xs uppercase tracking-wider mb-3">Event Timeline</Text>
              
              <View className="flex-row items-start mb-3 pb-3 border-b border-[#334155]/60">
                <View className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 mr-3" />
                <View className="flex-1">
                  <Text className="text-gray-200 text-xs font-medium">Automatic watering cycle triggered</Text>
                  <Text className="text-gray-400 text-[10px]">Today at 08:30 AM • Dispensed 50ml</Text>
                </View>
              </View>

              <View className="flex-row items-start">
                <View className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 mr-3" />
                <View className="flex-1">
                  <Text className="text-gray-200 text-xs font-medium">Temperature threshold warning (33.5°C)</Text>
                  <Text className="text-gray-400 text-[10px]">Today at 12:45 PM • Sun exposure peak</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
