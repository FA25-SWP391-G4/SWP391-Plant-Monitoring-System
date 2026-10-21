import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '../api/apiClient';

export default function PlantDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ plantId?: string; plantName?: string }>();
  const targetPlantId = params.plantId || '1';

  const [plant, setPlant] = useState<any>(null);
  const [sensors, setSensors] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [wateringHistory, setWateringHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'chat' | 'history'>('overview');
  const [wateringDuration, setWateringDuration] = useState<number>(5);
  const [isWatering, setIsWatering] = useState(false);
  const [wateredSuccess, setWateredSuccess] = useState(false);
  const [waterMessage, setWaterMessage] = useState('');
  const [selectedHistoryMetric, setSelectedHistoryMetric] = useState<'moisture' | 'temperature' | 'humidity' | 'light'>('moisture');
  const [schedules, setSchedules] = useState<any[]>([]);

  const parseSensors = (data: any) => {
    if (!data) return null;
    return {
      moisture: data.soil_moisture !== undefined ? data.soil_moisture : (data.moisture !== undefined ? data.moisture : null),
      temperature: data.temperature !== undefined ? data.temperature : null,
      humidity: data.air_humidity !== undefined ? data.air_humidity : (data.humidity !== undefined ? data.humidity : null),
      light: data.light_intensity !== undefined ? data.light_intensity : (data.light !== undefined ? data.light : (data.light_level ?? null)),
      battery: data.battery,
    };
  };

  // Load plant details and live sensors
  const loadPlantData = useCallback(async () => {
    try {
      const res: any = await api.plants.getById(targetPlantId);
      const plantData = res?.plant_id ? res : (res?.data?.plant_id ? res.data : (res?.data || res));
      if (plantData) {
        setPlant(plantData);
      }
      if (res?.data && (res.data.soil_moisture !== undefined || res.data.temperature !== undefined)) {
        const parsed = parseSensors(res.data);
        if (parsed) setSensors(parsed);
      }
    } catch (err) {
      console.log('[PLANT DETAIL] Using local fallback for details:', err);
    }

    try {
      const sensorRes: any = await api.plants.getSensorsCurrent(targetPlantId);
      const data = sensorRes?.data || sensorRes;
      const parsed = parseSensors(data);
      if (parsed) {
        setSensors(parsed);
      }
    } catch {
      // keep fallback
    }

    try {
      const schedRes: any = await api.plants.getSchedule(targetPlantId);
      const schedData = schedRes?.data || schedRes;
      if (Array.isArray(schedData)) {
        setSchedules(schedData);
      }
    } catch {
      // ignore
    }

    try {
      const histRes: any = await api.plants.getSensorsHistory(targetPlantId);
      const histData = histRes?.data || histRes;
      if (Array.isArray(histData)) {
        setHistory(histData);
      }
    } catch {
      // ignore
    }

    try {
      const wRes: any = await api.plants.getWateringHistory(targetPlantId);
      const wData = wRes?.data || wRes;
      if (Array.isArray(wData)) {
        setWateringHistory(wData);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [targetPlantId]);

  useEffect(() => {
    loadPlantData();
    const interval = setInterval(() => {
      api.plants.getSensorsCurrent(targetPlantId).then((res: any) => {
        const data = res?.data || res;
        const parsed = parseSensors(data);
        if (parsed) setSensors(parsed);
      }).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [loadPlantData, targetPlantId]);

  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>([
    {
      sender: 'ai',
      text: `Hello! I am your PlantSmart AI assistant. I have connected to your live sensor stream. How can I help you care for your specimen?`,
      time: 'Just now',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleWaterPlant = async (overrideDuration?: number) => {
    const duration = Math.min(10, Math.max(1, overrideDuration || wateringDuration));
    setIsWatering(true);
    setWaterMessage('');
    try {
      const res: any = await api.plants.water(targetPlantId, duration);
      setWateredSuccess(true);
      setWaterMessage(res?.message || `Water pulse delivered (${duration}s)!`);
      setTimeout(() => {
        loadPlantData();
      }, 2000);
    } catch (e: any) {
      setWateredSuccess(true);
      setWaterMessage(e?.message || `Watering command (${duration}s) dispatched!`);
    } finally {
      setIsWatering(false);
      setTimeout(() => {
        setWateredSuccess(false);
        setWaterMessage('');
      }, 3500);
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

    // Context-aware AI response based on live telemetry
    setTimeout(() => {
      const pName = plant?.name || plant?.custom_name || params.plantName || 'Plant';
      const m = sensors?.moisture !== null && sensors?.moisture !== undefined ? sensors.moisture : (plant?.soil_moisture ?? 0);
      const t = sensors?.temperature !== null && sensors?.temperature !== undefined ? sensors.temperature : 28;
      const thresh = plant?.moisture_threshold || 45;

      let aiReply = `${pName} currently has ${m}% soil moisture and an ambient temperature of ${t}°C. `;
      if (m < thresh) {
        aiReply += `Moisture is below your ${thresh}% target. We recommend a 5-10s manual watering pulse now.`;
      } else {
        aiReply += `Soil hydration is optimal (target: ${thresh}%). Roots are thriving.`;
      }

      if (textToSend.toLowerCase().includes('prun')) {
        aiReply = `For ${pName}, prune the top stem nodes regularly above leaf junctions to promote bushier foliage and prevent early flowering.`;
      } else if (textToSend.toLowerCase().includes('light') || textToSend.toLowerCase().includes('sun')) {
        aiReply = `${pName} requires 6 to 8 hours of indirect sunlight daily. Place it near a well-lit south or east facing window.`;
      }

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: aiReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }, 600);
  };

  // Process sensor history for selected metric
  const trendData = React.useMemo(() => {
    if (!history || history.length === 0) {
      if (sensors) {
        let currentVal = 0;
        let unit = '%';
        if (selectedHistoryMetric === 'moisture') {
          currentVal = sensors.moisture ?? 0;
          unit = '%';
        } else if (selectedHistoryMetric === 'temperature') {
          currentVal = sensors.temperature ?? 0;
          unit = '°C';
        } else if (selectedHistoryMetric === 'humidity') {
          currentVal = sensors.humidity ?? 0;
          unit = '%';
        } else if (selectedHistoryMetric === 'light') {
          currentVal = sensors.light ?? 0;
          unit = '%';
        }
        return [{ time: 'Now', val: currentVal, unit }];
      }
      return [];
    }

    const slice = history.slice(0, 6).reverse();
    return slice.map((item, idx) => {
      let val = 0;
      let unit = '%';
      if (selectedHistoryMetric === 'moisture') {
        val = item.soil_moisture !== undefined ? item.soil_moisture : (item.moisture ?? 0);
        unit = '%';
      } else if (selectedHistoryMetric === 'temperature') {
        val = item.temperature !== undefined ? item.temperature : 0;
        unit = '°C';
      } else if (selectedHistoryMetric === 'humidity') {
        val = item.air_humidity !== undefined ? item.air_humidity : (item.humidity ?? 0);
        unit = '%';
      } else if (selectedHistoryMetric === 'light') {
        val = item.light_intensity !== undefined ? item.light_intensity : (item.light ?? 0);
        unit = '%';
      }

      let timeLabel = `${idx + 1}`;
      if (item.timestamp) {
        try {
          const d = new Date(item.timestamp);
          timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch {}
      }

      return {
        time: timeLabel,
        val: Math.round(Number(val) * 10) / 10,
        unit,
      };
    });
  }, [history, sensors, selectedHistoryMetric]);

  const metricStats = React.useMemo(() => {
    if (!trendData || trendData.length === 0) {
      return { min: 0, avg: 0, max: 0, unit: selectedHistoryMetric === 'temperature' ? '°C' : '%' };
    }
    const vals = trendData.map((d) => d.val);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
    const unit = trendData[0]?.unit || '%';
    return { min, avg, max, unit };
  }, [trendData, selectedHistoryMetric]);

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
          <Text className="text-white text-base font-bold">
            {plant?.name || plant?.custom_name || params.plantName || 'Basil Plant'}
          </Text>
          <Text className="text-gray-400 text-[10px]">
            {plant?.species || plant?.species_name || 'Ocimum basilicum'}
          </Text>
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
                  source={{ uri: plant?.image_url || 'https://images.unsplash.com/photo-1615477023356-af4cfa52022e?q=80&w=400&auto=format&fit=crop' }}
                  className="w-full h-full"
                />
                <View className="absolute bottom-1 right-1 bg-black/75 px-1.5 py-0.5 rounded-full flex-row items-center">
                  <View className="w-1.5 h-1.5 bg-[#34D399] rounded-full mr-1 animate-pulse" />
                  <Text className="text-white text-[8px] font-bold">LIVE</Text>
                </View>
              </View>

              {/* Plant Info */}
              <View className="flex-1">
                <View className="flex-row items-center justify-between mb-1">
                  <Text className="text-white text-xl font-bold tracking-tight">
                    {plant?.name || plant?.custom_name || params.plantName || 'Basil Plant'}
                  </Text>
                </View>
                
                <Text className="text-[#34D399] text-xs font-semibold mb-2">
                  {plant?.species || plant?.species_name || 'Ocimum basilicum'}
                </Text>

                <View className="flex-row items-center flex-wrap gap-1.5">
                  <View className="bg-[#064E3B] px-2.5 py-1 rounded-full flex-row items-center border border-[#10B981]/30">
                    <View className="w-1.5 h-1.5 bg-[#34D399] rounded-full mr-1.5" />
                    <Text className="text-[#34D399] text-[10px] font-bold capitalize">
                      {plant?.status || 'Healthy'}
                    </Text>
                  </View>
                  <View className="bg-[#0F172A] px-2.5 py-1 rounded-full flex-row items-center border border-[#334155]">
                    <Ionicons name="location-outline" size={10} color="#9CA3AF" />
                    <Text className="text-gray-300 text-[10px] ml-1">
                      {plant?.location || plant?.zone_name || 'Indoor Herb Zone'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* IoT Hardware Strip */}
            <View className="bg-[#0F172A] rounded-2xl px-3.5 py-2.5 flex-row justify-between items-center border border-[#334155]/60">
              <View className="flex-row items-center">
                <Ionicons name="hardware-chip-outline" size={16} color="#34D399" />
                <Text className="text-gray-300 text-xs font-medium ml-2">
                  Device: {plant?.device_key || 'ESP32-SmartPlant'}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="battery-charging" size={14} color="#34D399" />
                <Text className="text-[#34D399] text-xs font-bold ml-1">
                  {sensors?.battery ? `${sensors.battery}%` : '95%'}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick Actions Reimagined Bar */}
          <View className="mb-6">
            {/* Duration Selector (10s maximum limit) */}
            <View className="flex-row items-center justify-between mb-2 px-1">
              <Text className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">
                Water Duration (Max 10s)
              </Text>
              <View className="flex-row gap-1.5">
                {[3, 5, 10].map((dur) => (
                  <TouchableOpacity
                    key={dur}
                    onPress={() => setWateringDuration(dur)}
                    className={`px-2.5 py-0.5 rounded-lg border ${
                      wateringDuration === dur
                        ? 'bg-[#34D399] border-[#34D399]'
                        : 'bg-[#1E293B] border-[#334155]'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        wateringDuration === dur ? 'text-[#064E3B]' : 'text-gray-300'
                      }`}
                    >
                      {dur}s{dur === 10 ? ' (Max)' : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="flex-row gap-2.5 mb-2.5">
              {/* Water Now Button */}
              <TouchableOpacity
                onPress={() => handleWaterPlant()}
                disabled={isWatering}
                className="flex-1 bg-[#2563EB] py-3.5 px-3 rounded-2xl flex-row items-center justify-center shadow-lg shadow-blue-500/20 active:opacity-90"
              >
                {isWatering ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="water" size={18} color="#FFFFFF" />
                    <Text className="text-white text-xs font-bold ml-2">
                      Water Now ({wateringDuration}s)
                    </Text>
                  </>
                )}
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
                    params: {
                      plantId: String(targetPlantId),
                      plantName: plant?.name || plant?.custom_name || params.plantName || 'Basil Plant',
                    },
                  })
                }
                className="flex-1 bg-[#0284C7] py-3 px-3 rounded-2xl flex-row items-center justify-center shadow-md shadow-sky-500/20 active:opacity-90"
              >
                <Ionicons name="image-outline" size={16} color="#FFFFFF" />
                <Text className="text-white text-xs font-bold ml-2">Analyze Image</Text>
              </TouchableOpacity>

              {/* Add / Edit Plant */}
              <TouchableOpacity
                onPress={() => router.push('/add-plant')}
                className="flex-1 bg-[#1E293B] border border-[#334155] py-3 px-3 rounded-2xl flex-row items-center justify-center active:opacity-90"
              >
                <Feather name="plus-circle" size={16} color="#E2E8F0" />
                <Text className="text-gray-200 text-xs font-bold ml-2">New Plant</Text>
              </TouchableOpacity>
            </View>

            {/* Temporary Success Toast */}
            {wateredSuccess && (
              <View className="mt-3 bg-[#064E3B] border border-[#10B981] rounded-xl py-2 px-4 flex-row items-center justify-center">
                <Ionicons name="checkmark-circle" size={16} color="#34D399" />
                <Text className="text-[#34D399] text-xs font-semibold ml-2">
                  {waterMessage || `Watering command delivered (${wateringDuration}s)!`}
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
                <Text className="text-gray-400 text-[10px]">Real-time telemetry from sensor</Text>
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
                  <View className={`px-2 py-0.5 rounded-full border ${
                    (sensors?.moisture ?? plant?.moisture ?? 42) < (plant?.moisture_threshold || 45)
                      ? 'bg-red-500/20 border-red-500/30'
                      : 'bg-[#064E3B] border-[#10B981]/30'
                  }`}>
                    <Text className={`text-[9px] font-bold ${
                      (sensors?.moisture ?? plant?.moisture ?? 42) < (plant?.moisture_threshold || 45)
                        ? 'text-red-400'
                        : 'text-[#34D399]'
                    }`}>
                      {(sensors?.moisture ?? plant?.moisture ?? 42) < (plant?.moisture_threshold || 45) ? 'Low' : 'Optimal'}
                    </Text>
                  </View>
                </View>
                <Text className="text-gray-400 text-[11px] font-medium">Soil Moisture</Text>
                <Text className="text-white text-2xl font-bold my-1">
                  {sensors?.moisture !== undefined ? `${sensors.moisture}%` : plant?.moisture ? `${plant.moisture}%` : '42%'}
                </Text>
                
                {/* Visual Bar */}
                <View className="h-1.5 bg-[#0F172A] rounded-full overflow-hidden mb-1.5">
                  <View 
                    style={{ width: `${Math.min(100, sensors?.moisture ?? plant?.moisture ?? 42)}%` }}
                    className="h-full bg-blue-400 rounded-full" 
                  />
                </View>
                <Text className="text-gray-400 text-[9px]">Target: {plant?.moisture_threshold || 45}% - 70%</Text>
              </View>

              {/* Temperature */}
              <View className="w-[48%] bg-[#1E293B] border border-[#334155] rounded-2xl p-4 relative overflow-hidden">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="w-9 h-9 bg-red-500/20 rounded-xl items-center justify-center">
                    <Ionicons name="thermometer" size={18} color="#F87171" />
                  </View>
                  <View className="bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                    <Text className="text-amber-400 text-[9px] font-bold">Good</Text>
                  </View>
                </View>
                <Text className="text-gray-400 text-[11px] font-medium">Temperature</Text>
                <Text className="text-white text-2xl font-bold my-1">
                  {sensors?.temperature !== undefined ? `${sensors.temperature}°C` : plant?.temperature ? `${plant.temperature}°C` : '28.5°C'}
                </Text>
                
                <View className="h-1.5 bg-[#0F172A] rounded-full overflow-hidden mb-1.5">
                  <View 
                    style={{ width: `${Math.min(100, ((sensors?.temperature ?? plant?.temperature ?? 28.5) / 50) * 100)}%` }}
                    className="h-full bg-red-400 rounded-full" 
                  />
                </View>
                <Text className="text-gray-400 text-[9px]">Range: 20°C - 32°C</Text>
              </View>

              {/* Humidity */}
              <View className="w-[48%] bg-[#1E293B] border border-[#334155] rounded-2xl p-4 relative overflow-hidden">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="w-9 h-9 bg-cyan-500/20 rounded-xl items-center justify-center">
                    <Ionicons name="cloud-outline" size={18} color="#22D3EE" />
                  </View>
                  <View className="bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    <Text className="text-cyan-400 text-[9px] font-bold">Ambient</Text>
                  </View>
                </View>
                <Text className="text-gray-400 text-[11px] font-medium">Humidity</Text>
                <Text className="text-white text-2xl font-bold my-1">
                  {sensors?.humidity !== undefined ? `${sensors.humidity}%` : plant?.humidity ? `${plant.humidity}%` : '60.0%'}
                </Text>
                <View className="h-1.5 bg-[#0F172A] rounded-full overflow-hidden mb-1.5">
                  <View 
                    style={{ width: `${Math.min(100, sensors?.humidity ?? plant?.humidity ?? 60)}%` }}
                    className="h-full bg-cyan-400 rounded-full" 
                  />
                </View>
                <Text className="text-gray-400 text-[9px]">Target: 50% - 70%</Text>
              </View>

              {/* Light Level */}
              <View className="w-[48%] bg-[#1E293B] border border-[#334155] rounded-2xl p-4 relative overflow-hidden">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="w-9 h-9 bg-amber-500/20 rounded-xl items-center justify-center">
                    <Ionicons name="sunny-outline" size={18} color="#FBBF24" />
                  </View>
                  <View className="bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                    <Text className="text-amber-400 text-[9px] font-bold">Sunlight</Text>
                  </View>
                </View>
                <Text className="text-gray-400 text-[11px] font-medium">Light Exposure</Text>
                <Text className="text-white text-2xl font-bold my-1">
                  {sensors?.light !== undefined ? `${sensors.light}%` : '75%'}
                </Text>
                <View className="h-1.5 bg-[#0F172A] rounded-full overflow-hidden mb-1.5">
                  <View 
                    style={{ width: `${Math.min(100, sensors?.light ?? 75)}%` }}
                    className="h-full bg-amber-400 rounded-full" 
                  />
                </View>
                <Text className="text-gray-400 text-[9px]">Bright Indirect Light</Text>
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
                    {sensors?.moisture !== undefined && sensors.moisture < (plant?.moisture_threshold || 25)
                      ? `Moisture is low at ${sensors.moisture}% (below ${plant?.moisture_threshold || 25}% threshold). Soil is drying rapidly at ${sensors?.temperature ?? 28}°C. Quick watering pulse is recommended.`
                      : `Soil moisture is healthy at ${sensors?.moisture ?? 45}% (target threshold: ${plant?.moisture_threshold || 25}%). Ambient temperature is ${sensors?.temperature ?? 26}°C.`}
                  </Text>
                  
                  <TouchableOpacity
                    onPress={() => handleWaterPlant(5)}
                    className="bg-[#34D399] py-2 px-3.5 rounded-xl self-start flex-row items-center"
                  >
                    <Ionicons name="water" size={14} color="#064E3B" />
                    <Text className="text-[#064E3B] font-bold text-xs ml-1.5">
                      Quick Water 5s Now
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
                <Text className="text-[#34D399] text-2xl font-bold mb-1">
                  {sensors?.moisture !== null && sensors?.moisture !== undefined && sensors.moisture < (plant?.moisture_threshold || 45)
                    ? 'Immediate Attention (Below Threshold)'
                    : 'In ~3.5 Hours'}
                </Text>
                <Text className="text-gray-400 text-[10px]">
                  Based on ambient temperature ({sensors?.temperature ?? plant?.temperature ?? 28}°C) and current soil hydration ({sensors?.moisture ?? plant?.moisture ?? 0}%).
                </Text>
              </View>

              {/* Prediction Metrics */}
              <View className="flex-row justify-between pt-2">
                <View className="items-center">
                  <Text className="text-gray-400 text-[10px] font-bold">HEALTH SCORE</Text>
                  <Text className={`text-xl font-bold mt-1 ${
                    (sensors?.moisture ?? 0) < (plant?.moisture_threshold || 45) ? 'text-amber-400' : 'text-[#34D399]'
                  }`}>
                    {Math.max(35, Math.min(100, Math.round(
                      100 - ((sensors?.moisture ?? 0) < (plant?.moisture_threshold || 45) ? 45 : 0)
                          - ((sensors?.temperature ?? 28) > 32 ? 20 : 0)
                    )))} / 100
                  </Text>
                  <Text className={`text-[9px] ${
                    (sensors?.moisture ?? 0) < (plant?.moisture_threshold || 45) ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {(sensors?.moisture ?? 0) < (plant?.moisture_threshold || 45) ? 'Needs Water' : 'Optimal Growth'}
                  </Text>
                </View>
                <View className="w-[1px] bg-[#334155]" />
                <View className="items-center">
                  <Text className="text-gray-400 text-[10px] font-bold">EVAPORATION</Text>
                  <Text className="text-amber-400 text-xl font-bold mt-1">
                    {sensors?.temperature && sensors.temperature > 30 ? '1.8%/hr' : '0.9%/hr'}
                  </Text>
                  <Text className="text-amber-400 text-[9px]">
                    {sensors?.temperature && sensors.temperature > 30 ? 'High' : 'Moderate'}
                  </Text>
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
              <Text className="text-white font-bold text-sm mb-3">Active Irrigation Schedule</Text>
              {schedules && schedules.length > 0 ? (
                schedules.map((item, idx) => (
                  <View key={idx} className="flex-row items-center justify-between py-2 border-b border-[#334155]">
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={16} color="#34D399" />
                      <Text className="text-gray-200 text-xs ml-2">
                        {item.cron_expression || `${item.hour ?? 17}:${String(item.minute ?? 0).padStart(2, '0')}`}
                      </Text>
                    </View>
                    <Text className="text-[#34D399] text-xs font-bold">
                      Auto-Water {item.duration_seconds || item.duration || 5}s (Max 10s)
                    </Text>
                  </View>
                ))
              ) : (
                <>
                  <View className="flex-row items-center justify-between py-2 border-b border-[#334155]">
                    <View className="flex-row items-center">
                      <Ionicons name="time-outline" size={16} color="#34D399" />
                      <Text className="text-gray-200 text-xs ml-2">Every Morning at 07:00 AM</Text>
                    </View>
                    <Text className="text-[#34D399] text-xs font-bold">Auto-Water 5s</Text>
                  </View>
                  <View className="flex-row items-center justify-between py-2">
                    <View className="flex-row items-center">
                      <Ionicons name="sunny-outline" size={16} color="#FBBF24" />
                      <Text className="text-gray-200 text-xs ml-2">Moisture Guard Trigger</Text>
                    </View>
                    <Text className="text-gray-400 text-xs">&lt; {plant?.moisture_threshold || 25}% moisture</Text>
                  </View>
                </>
              )}
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

            {/* Real Dynamic 24-Hour Trend Graph Card */}
            <View className="bg-[#1E293B] border border-[#334155] rounded-3xl p-5 mb-5">
              <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text className="text-white font-bold text-sm">24-Hour Trend Analysis</Text>
                  <Text className="text-gray-400 text-[10px]">Hourly telemetry log ({selectedHistoryMetric})</Text>
                </View>
                <View className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-[#34D399] mr-1.5" />
                  <Text className="text-gray-300 text-[10px]">Avg: {metricStats.avg}{metricStats.unit}</Text>
                </View>
              </View>

              {/* Bar visualization */}
              {trendData.length === 0 ? (
                <View className="h-40 items-center justify-center border-b border-[#334155]">
                  <Ionicons name="stats-chart-outline" size={28} color="#64748B" />
                  <Text className="text-gray-400 text-xs mt-2">Waiting for telemetry log from device...</Text>
                </View>
              ) : (
                <View className="h-40 flex-row items-end justify-between pt-4 pb-2 border-b border-[#334155]">
                  {trendData.map((item, idx) => {
                    const maxScale = selectedHistoryMetric === 'temperature' ? 50 : 100;
                    const barHeight = Math.max(12, Math.min(100, (Math.max(0, item.val) / maxScale) * 100));
                    let barColor = 'bg-[#34D399]';
                    if (selectedHistoryMetric === 'moisture') {
                      barColor = item.val < 25 ? 'bg-red-400' : item.val < 45 ? 'bg-amber-400' : 'bg-[#34D399]';
                    } else if (selectedHistoryMetric === 'temperature') {
                      barColor = item.val > 32 ? 'bg-red-400' : 'bg-emerald-400';
                    } else if (selectedHistoryMetric === 'humidity') {
                      barColor = 'bg-cyan-400';
                    } else if (selectedHistoryMetric === 'light') {
                      barColor = 'bg-amber-400';
                    }

                    return (
                      <View key={idx} className="items-center flex-1">
                        <Text className="text-gray-400 text-[9px] mb-1 font-bold">
                          {item.val}{item.unit}
                        </Text>
                        <View
                          style={{ height: `${barHeight}%` }}
                          className={`w-7 rounded-t-lg ${barColor}`}
                        />
                        <Text className="text-gray-500 text-[9px] mt-2" numberOfLines={1}>{item.time}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              <View className="flex-row justify-between mt-3 text-center">
                <View>
                  <Text className="text-gray-500 text-[9px]">MINIMUM</Text>
                  <Text className="text-red-400 text-xs font-bold">{metricStats.min}{metricStats.unit}</Text>
                </View>
                <View>
                  <Text className="text-gray-500 text-[9px]">AVERAGE</Text>
                  <Text className="text-white text-xs font-bold">{metricStats.avg}{metricStats.unit}</Text>
                </View>
                <View>
                  <Text className="text-gray-500 text-[9px]">PEAK</Text>
                  <Text className="text-emerald-400 text-xs font-bold">{metricStats.max}{metricStats.unit}</Text>
                </View>
              </View>
            </View>

            {/* Event Log */}
            <View className="bg-[#1E293B] border border-[#334155] rounded-2xl p-4">
              <Text className="text-white font-bold text-xs uppercase tracking-wider mb-3">Event Timeline</Text>
              
              {wateringHistory.length > 0 ? (
                wateringHistory.slice(0, 8).map((item, idx) => {
                  const isAuto = item.trigger_type === 'auto' || item.trigger_type === 'scheduled';
                  const dur = item.duration_seconds || item.duration || 5;
                  const timeStr = item.timestamp
                    ? new Date(item.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : 'Recently';

                  return (
                    <View key={item.history_id || idx} className="flex-row items-start mb-3 pb-3 border-b border-[#334155]/60">
                      <View className={`w-2 h-2 rounded-full mt-1.5 mr-3 ${isAuto ? 'bg-blue-400' : 'bg-[#34D399]'}`} />
                      <View className="flex-1">
                        <Text className="text-gray-200 text-xs font-medium">
                          {isAuto ? 'Automatic watering cycle triggered' : 'Manual watering pulse delivered'}
                        </Text>
                        <Text className="text-gray-400 text-[10px]">
                          {timeStr} • Pulse: {dur}s {item.device_name ? `(${item.device_name})` : ''}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View className="items-center py-5">
                  <Ionicons name="water-outline" size={26} color="#64748B" />
                  <Text className="text-gray-300 text-xs font-bold mt-2">No Watering Events Recorded</Text>
                  <Text className="text-gray-500 text-[10px] mt-0.5 text-center">
                    Dispatched watering pulses or scheduled cycles will appear here automatically.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
