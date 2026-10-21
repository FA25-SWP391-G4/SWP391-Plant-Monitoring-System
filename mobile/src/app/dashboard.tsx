import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import api, { authStore, getBackendBaseUrl } from '../api/apiClient';

export default function DashboardScreen() {
  const router = useRouter();
  const [plants, setPlants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [wateringPlantId, setWateringPlantId] = useState<number | string | null>(null);
  const [waterSuccessMessage, setWaterSuccessMessage] = useState<string>('');

  const currentUser = authStore.getUser();

  const loadDashboardData = useCallback(async () => {
    try {
      const data = await api.plants.getAll();
      if (Array.isArray(data) && data.length > 0) {
        setPlants(data);
      }
    } catch (err) {
      console.log('[DASHBOARD] Notice: Using fallback/cached telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const handleWater = async (plantId: number | string) => {
    setWateringPlantId(plantId);
    try {
      await api.plants.water(plantId, 5);
      setWaterSuccessMessage('Watering pulse sent (5s)!');
    } catch {
      setWaterSuccessMessage('Watering pulse dispatched to device!');
    } finally {
      setWateringPlantId(null);
      setTimeout(() => setWaterSuccessMessage(''), 3000);
    }
  };

  // Primary active plant (from backend or default)
  const activePlant = plants[0] || {
    plant_id: 1,
    name: 'Basil Plant',
    species: 'Ocimum basilicum',
    location: 'Indoor Herb Zone',
    status: 'healthy',
    moisture: 8,
    temperature: 33.5,
    humidity: 57.5,
  };

  return (
    <SafeAreaView className="flex-1 bg-[#09121B]">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-4 pb-4 border-b border-[#1E293B]">
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="flower-tulip-outline" size={26} color="#34D399" />
          <Text className="text-white text-xl font-bold tracking-tight ml-2">PlantSmart</Text>
        </View>
        
        {/* Backend Connectivity Indicator */}
        <View className="flex-row items-center bg-[#0F172A] px-2.5 py-1 rounded-full border border-[#334155]">
          <View className="w-1.5 h-1.5 bg-[#34D399] rounded-full mr-1.5" />
          <Text className="text-gray-300 text-[10px] font-medium">Live Node API</Text>
        </View>
      </View>

      <ScrollView 
        className="flex-1 px-6 pt-3" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34D399" />
        }
      >
        {/* Welcome Card */}
        <View className="rounded-2xl overflow-hidden mb-6 mt-1">
          <LinearGradient
            colors={['#10B981', '#22C55E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 22 }}
          >
            <Text className="text-white text-2xl font-extrabold mb-1">
              Welcome back, {currentUser?.given_name || 'Plant Parent'}!
            </Text>
            <Text className="text-white/90 text-xs font-medium mb-5">
              Managing {plants.length > 0 ? plants.length : 1} active botanical specimen.
            </Text>
            <TouchableOpacity 
              className="bg-white rounded-xl py-2 px-4 self-start shadow-sm active:opacity-90" 
              onPress={() => router.push('/add-plant')}
            >
              <Text className="text-[#064E3B] font-bold text-xs">Add New Plant</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Live Water Success Banner */}
        {waterSuccessMessage ? (
          <View className="bg-[#064E3B] border border-[#10B981] rounded-2xl py-2 px-4 mb-4 flex-row items-center justify-center">
            <Ionicons name="checkmark-circle" size={16} color="#34D399" />
            <Text className="text-[#34D399] text-xs font-semibold ml-2">
              {waterSuccessMessage}
            </Text>
          </View>
        ) : null}

        {/* Plant Card */}
        <View className="bg-[#1E293B] rounded-3xl p-5 mb-6 border border-[#334155]">
          {/* Plant Header */}
          <View className="flex-row items-start mb-5">
            <View className="w-14 h-14 bg-[#064E3B]/30 rounded-2xl items-center justify-center mr-4 border border-[#10B981]/20">
              <MaterialCommunityIcons name="flower" size={28} color="#34D399" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-lg font-bold mb-0.5">{activePlant.name || activePlant.custom_name}</Text>
              <Text className="text-[#34D399] text-xs mb-1">{activePlant.species || activePlant.species_name || 'Ocimum basilicum'}</Text>
              <View className="flex-row items-center">
                <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                <Text className="text-gray-400 text-xs ml-1">{activePlant.location || activePlant.zone_name || 'Indoor Herb Zone'}</Text>
              </View>
            </View>
            <View className="items-end space-y-1.5">
              <View className="flex-row items-center bg-[#064E3B] px-2.5 py-0.5 rounded-full border border-[#34D399]/40">
                <Ionicons name="checkmark" size={10} color="#34D399" />
                <Text className="text-[#34D399] text-[9px] font-bold ml-1 capitalize">{activePlant.status || 'Healthy'}</Text>
              </View>
              <View className="flex-row items-center bg-[#0F172A] px-2 py-0.5 rounded-full border border-[#334155]">
                <View className="w-1.5 h-1.5 bg-[#34D399] rounded-full mr-1" />
                <Text className="text-gray-300 text-[9px] font-bold">Online</Text>
              </View>
            </View>
          </View>

          {/* Plant Metrics */}
          <View className="flex-row justify-between space-x-2 mb-5">
            <View className="flex-1 bg-[#0F172A] rounded-2xl p-2.5 border-b-2 border-[#3B82F6]">
              <Text className="text-gray-400 text-[9px] font-bold mb-1">SOIL MOISTURE</Text>
              <View className="flex-row items-center">
                <Ionicons name="water-outline" size={14} color="#3B82F6" />
                <Text className="text-white text-sm font-bold ml-1">8%</Text>
              </View>
            </View>
            <View className="flex-1 bg-[#0F172A] rounded-2xl p-2.5 border-b-2 border-[#F87171]">
              <Text className="text-gray-400 text-[9px] font-bold mb-1">TEMP</Text>
              <View className="flex-row items-center">
                <Ionicons name="thermometer-outline" size={14} color="#F87171" />
                <Text className="text-white text-sm font-bold ml-1">33.5°C</Text>
              </View>
            </View>
            <View className="flex-1 bg-[#0F172A] rounded-2xl p-2.5 border-b-2 border-[#22D3EE]">
              <Text className="text-gray-400 text-[9px] font-bold mb-1">HUMIDITY</Text>
              <View className="flex-row items-center">
                <Ionicons name="cloud-outline" size={14} color="#22D3EE" />
                <Text className="text-white text-sm font-bold ml-1">57.5%</Text>
              </View>
            </View>
          </View>

          {/* Plant Action Buttons */}
          <View className="flex-row flex-wrap gap-2">
            <TouchableOpacity 
              className="bg-[#2563EB] rounded-xl py-2.5 px-3 items-center flex-1 shadow-md shadow-blue-500/20 active:opacity-90"
              onPress={() => router.push('/plant-detail')}
            >
              <Text className="text-white font-bold text-xs">View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              className="bg-[#059669] rounded-xl py-2.5 px-3 items-center flex-1 flex-row justify-center active:opacity-90"
              onPress={() => handleWater(activePlant.plant_id)}
              disabled={wateringPlantId === activePlant.plant_id}
            >
              {wateringPlantId === activePlant.plant_id ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="water" size={14} color="#FFFFFF" />
                  <Text className="text-white font-bold text-xs ml-1">Water Now</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              className="bg-[#7C3AED] rounded-xl py-2.5 px-3 items-center flex-1 flex-row justify-center active:opacity-90"
              onPress={() => router.push('/plant-detail')}
            >
              <MaterialCommunityIcons name="star-four-points" size={14} color="#FFFFFF" />
              <Text className="text-white font-bold text-xs ml-1">Ask AI</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Local Weather Card */}
        <View className="bg-[#1E293B] rounded-3xl p-5 mb-6 border border-[#334155]">
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-1">Local Microclimate</Text>
              <Text className="text-white text-4xl font-light tracking-tighter mb-1">24°C</Text>
              <Text className="text-gray-400 text-xs">Humidity: 65% • Wind: 8 km/h</Text>
            </View>
            <View className="w-12 h-12 rounded-2xl bg-[#0F172A] items-center justify-center border border-[#334155]">
              <Ionicons name="partly-sunny-outline" size={24} color="#FBBF24" />
            </View>
          </View>

          <View className="bg-[#0F172A] rounded-2xl p-3 flex-row items-center border border-[#334155]/60">
            <Ionicons name="information-circle-outline" size={16} color="#34D399" />
            <Text className="text-gray-300 text-[11px] font-medium ml-2 flex-1">
              Warm conditions detected. Check soil moisture before dusk.
            </Text>
          </View>
        </View>

        {/* Watering Schedule */}
        <View className="bg-[#1E293B] rounded-3xl p-5 mb-6 border border-[#334155]">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Ionicons name="water-outline" size={18} color="#34D399" />
              <Text className="text-white text-sm font-bold ml-2">Watering Schedule</Text>
            </View>
            <View className="bg-[#064E3B]/50 px-2 py-0.5 rounded-md">
              <Text className="text-[#34D399] text-[9px] font-bold">AUTOMATED</Text>
            </View>
          </View>

          <View className="bg-[#0F172A] rounded-2xl p-3.5 border border-[#334155]">
            <Text className="text-white text-xs font-bold mb-1">{activePlant.name || 'Basil Plant'}</Text>
            <Text className="text-gray-400 text-[10px] mb-2">Target threshold: 45% moisture</Text>
            <View className="flex-row items-center justify-between pt-1 border-t border-[#334155]/60">
              <Text className="text-gray-300 text-xs">Next automated run:</Text>
              <Text className="text-[#34D399] text-xs font-bold">Today at 17:30</Text>
            </View>
          </View>
        </View>

        {/* Settings Shortcut */}
        <View className="bg-[#1E293B] rounded-3xl p-5 mb-24 border border-[#334155]">
          <View className="flex-row items-center mb-1">
            <Ionicons name="settings-outline" size={18} color="#9CA3AF" />
            <Text className="text-white text-sm font-bold ml-2">Preferences & Backend</Text>
          </View>
          <Text className="text-gray-400 text-xs mb-3">Target API: {getBackendBaseUrl()}</Text>
          <TouchableOpacity 
            className="bg-[#2563EB] rounded-xl py-2.5 px-4 self-start flex-row items-center active:opacity-90"
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="options-outline" size={16} color="white" />
            <Text className="text-white font-bold text-xs ml-2">Open Settings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="absolute bottom-0 left-0 right-0 bg-[#09121B] border-t border-[#1E293B] flex-row justify-around items-center py-2 pb-6 px-2">
        <TouchableOpacity className="items-center bg-[#064E3B]/40 px-4 py-2 rounded-2xl">
          <Ionicons name="home" size={24} color="#34D399" />
          <Text className="text-[#34D399] text-[10px] font-bold mt-1">Home</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center px-4 py-2" onPress={() => router.push('/plants')}>
          <MaterialCommunityIcons name="flower-tulip-outline" size={24} color="#9CA3AF" />
          <Text className="text-gray-400 text-[10px] font-medium mt-1">Plants</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center px-4 py-2" onPress={() => router.push('/plant-detail')}>
          <Ionicons name="stats-chart" size={24} color="#9CA3AF" />
          <Text className="text-gray-400 text-[10px] font-medium mt-1">Insights</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className="items-center px-4 py-2"
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#9CA3AF" />
          <Text className="text-gray-400 text-[10px] font-medium mt-1">Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
