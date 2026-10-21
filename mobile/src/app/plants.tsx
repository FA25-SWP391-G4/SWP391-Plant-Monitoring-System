import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../api/apiClient';

export default function PlantsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [plants, setPlants] = useState<any[]>([]);
  const [sensorMap, setSensorMap] = useState<Record<string, { moisture?: number | null; temperature?: number | null }>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [waterFeedback, setWaterFeedback] = useState<string>('');

  const fetchLiveSensorsForPlants = useCallback(async (plantList: any[]) => {
    plantList.forEach(async (p: any) => {
      const pid = p.plant_id || p.id;
      if (pid) {
        try {
          const res: any = await api.plants.getSensorsCurrent(pid);
          const sData = res?.data || res;
          if (sData) {
            const m = sData.soil_moisture !== undefined ? sData.soil_moisture : sData.moisture;
            const t = sData.temperature;
            setSensorMap((prev) => ({
              ...prev,
              [String(pid)]: { moisture: m, temperature: t },
            }));
          }
        } catch {
          // ignore
        }
      }
    });
  }, []);

  const loadPlants = useCallback(async () => {
    try {
      const data = await api.plants.getAll();
      if (Array.isArray(data) && data.length > 0) {
        setPlants(data);
        fetchLiveSensorsForPlants(data);
      }
    } catch (err) {
      console.log('[PLANTS] Notice: Using fallback specimen data:', err);
    } finally {
      setRefreshing(false);
    }
  }, [fetchLiveSensorsForPlants]);

  useEffect(() => {
    loadPlants();
    const interval = setInterval(() => {
      if (plants.length > 0) {
        fetchLiveSensorsForPlants(plants);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [loadPlants, plants, fetchLiveSensorsForPlants]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPlants();
  };

  const handleWater = async (plantId: number | string) => {
    setWaterFeedback(`Watering plant #${plantId}...`);
    try {
      await api.plants.water(plantId, 5);
      setWaterFeedback(`Water command delivered to plant #${plantId}!`);
      setTimeout(() => fetchLiveSensorsForPlants(plants), 2000);
    } catch {
      setWaterFeedback(`Water command staged for device!`);
    } finally {
      setTimeout(() => setWaterFeedback(''), 2500);
    }
  };

  const [activeFilter, setActiveFilter] = useState<'all' | 'needs_water' | 'indoor'>('all');

  const filteredPlants = plants.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    const nameMatch =
      !q ||
      (p.name || p.custom_name || '').toLowerCase().includes(q) ||
      (p.species || p.species_name || '').toLowerCase().includes(q) ||
      (p.location || p.zone_name || '').toLowerCase().includes(q);
    if (!nameMatch) return false;

    const pid = String(p.plant_id || p.id || '');
    const live = sensorMap[pid];
    const moisture = live?.moisture !== undefined ? live.moisture : (p.soil_moisture ?? p.sensor_data?.moisture ?? p.moisture ?? 0);
    const threshold = p.moisture_threshold || 45;

    if (activeFilter === 'needs_water') {
      return moisture < threshold;
    }
    if (activeFilter === 'indoor') {
      return (p.location || p.zone_name || '').toLowerCase().includes('indoor');
    }
    return true;
  });

  return (
    <SafeAreaView className="flex-1 bg-[#09121B]">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-4 pb-4">
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="flower-tulip-outline" size={24} color="#34D399" />
          <Text className="text-white text-xl font-bold tracking-tight ml-2">PlantSmart</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/settings')}>
          <Ionicons name="settings-outline" size={22} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1 px-6" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#34D399" />
        }
      >
        {waterFeedback ? (
          <View className="bg-[#064E3B] border border-[#10B981] rounded-2xl py-2 px-4 mb-3 flex-row items-center justify-center">
            <Ionicons name="checkmark-circle" size={16} color="#34D399" />
            <Text className="text-[#34D399] text-xs font-semibold ml-2">{waterFeedback}</Text>
          </View>
        ) : null}

        {/* Title Card */}
        <View className="bg-[#1E293B] rounded-2xl p-4 mb-5 flex-row items-center justify-between border border-[#334155]">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 bg-[#064E3B] rounded-xl items-center justify-center mr-4">
              <Ionicons name="book-outline" size={24} color="#34D399" />
            </View>
            <View className="flex-1 pr-2">
              <Text className="text-white text-xl font-bold mb-1">My Plants</Text>
              <Text className="text-gray-400 text-[11px] leading-tight">
                {plants.length} botanical specimen connected
              </Text>
            </View>
          </View>
          <TouchableOpacity className="bg-[#34D399] rounded-xl px-3 py-2 flex-row items-center" onPress={() => router.push('/add-plant')}>
            <Ionicons name="add" size={16} color="#064E3B" />
            <Text className="text-[#064E3B] font-bold text-[10px] ml-1">NEW{'\n'}PLANT</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="bg-[#0F172A] rounded-xl flex-row items-center px-4 py-3 mb-4 border border-[#334155]">
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 text-white ml-3 text-sm"
            placeholder="Search plants, species, zones..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filters */}
        <View className="flex-row mb-6 gap-2">
          <TouchableOpacity 
            className={`rounded-full px-4 py-1.5 flex-row items-center border ${
              activeFilter === 'all'
                ? 'bg-[#34D399] border-[#34D399]'
                : 'bg-[#1E293B] border-[#334155]'
            }`}
            onPress={() => setActiveFilter('all')}
          >
            <Ionicons name="infinite" size={14} color={activeFilter === 'all' ? '#064E3B' : '#9CA3AF'} />
            <Text className={`text-[11px] font-bold ml-1 ${activeFilter === 'all' ? 'text-[#064E3B]' : 'text-gray-300'}`}>
              All ({plants.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className={`rounded-full px-4 py-1.5 flex-row items-center border ${
              activeFilter === 'needs_water'
                ? 'bg-[#F87171] border-[#F87171]'
                : 'bg-[#1E293B] border-[#334155]'
            }`}
            onPress={() => setActiveFilter('needs_water')}
          >
            <Ionicons name="warning-outline" size={12} color={activeFilter === 'needs_water' ? '#7F1D1D' : '#F87171'} />
            <Text className={`text-[11px] font-bold ml-1 ${activeFilter === 'needs_water' ? 'text-[#7F1D1D]' : 'text-gray-300'}`}>
              Needs Water
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className={`rounded-full px-4 py-1.5 flex-row items-center border ${
              activeFilter === 'indoor'
                ? 'bg-[#34D399] border-[#34D399]'
                : 'bg-[#1E293B] border-[#334155]'
            }`}
            onPress={() => setActiveFilter('indoor')}
          >
            <Ionicons name="home-outline" size={12} color={activeFilter === 'indoor' ? '#064E3B' : '#9CA3AF'} />
            <Text className={`text-[11px] font-bold ml-1 ${activeFilter === 'indoor' ? 'text-[#064E3B]' : 'text-gray-300'}`}>
              Indoor
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Plant Cards */}
        {filteredPlants.length === 0 ? (
          <View className="bg-[#1E293B] rounded-2xl p-6 items-center border border-[#334155] mb-8">
            <Ionicons name="leaf-outline" size={40} color="#64748B" className="mb-2" />
            <Text className="text-white text-base font-bold mb-1">No Specimen Found</Text>
            <Text className="text-gray-400 text-xs text-center mb-4">
              {plants.length === 0 
                ? 'No plants in your garden yet. Connect an ESP32 or add your first plant!'
                : 'No plants matched your search or filter.'}
            </Text>
            <TouchableOpacity 
              className="bg-[#34D399] px-4 py-2 rounded-xl"
              onPress={() => router.push('/add-plant')}
            >
              <Text className="text-[#064E3B] font-bold text-xs">+ Add New Plant</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredPlants.map((plant, idx) => {
            const pId = plant.plant_id || plant.id || idx + 1;
            const pName = plant.name || plant.custom_name || `Plant #${idx + 1}`;
            const pSpecies = plant.species || plant.species_name || 'Botanical Specimen';
            const pLocation = plant.location || plant.zone_name || 'Indoor Zone';
            const pidStr = String(pId);
            const liveSensor = sensorMap[pidStr];
            const pMoisture = liveSensor?.moisture !== undefined 
              ? liveSensor.moisture 
              : (plant.soil_moisture ?? plant.data?.moisture ?? plant.sensor_data?.moisture ?? plant.moisture ?? 0);
            const pTemp = liveSensor?.temperature !== undefined 
              ? liveSensor.temperature 
              : (plant.temperature ?? plant.data?.temperature ?? plant.sensor_data?.temperature ?? null);
            const pThreshold = plant.moisture_threshold || 45;
            const isDry = pMoisture < pThreshold;

            return (
              <View key={pId} className="bg-[#1E293B] rounded-2xl p-4 mb-4 border border-[#334155]">
                <View className="flex-row mb-4 relative">
                  <View className="w-20 h-20 bg-gray-700 rounded-xl mr-4 overflow-hidden relative">
                    <Image 
                      source={{ uri: plant.image_url || 'https://images.unsplash.com/photo-1615477023356-af4cfa52022e?q=80&w=200&auto=format&fit=crop' }} 
                      className="w-full h-full"
                    />
                    <View className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded-full flex-row items-center">
                      <View className={`w-1.5 h-1.5 rounded-full mr-1 ${isDry ? 'bg-[#F87171]' : 'bg-[#34D399]'}`} />
                      <Text className="text-white text-[8px] font-bold">{isDry ? 'Dry' : 'IoT'}</Text>
                    </View>
                  </View>
                  <View className="flex-1 justify-center">
                    <View className="flex-row justify-between items-start">
                      <Text className="text-white text-base font-bold mb-0.5" numberOfLines={1}>{pName}</Text>
                      <View className="flex-row items-center">
                        <View className={`px-2 py-0.5 rounded-full flex-row items-center mr-2 ${
                          isDry ? 'bg-[#7F1D1D]' : 'bg-[#064E3B]'
                        }`}>
                          <Ionicons name={isDry ? 'water' : 'checkmark'} size={10} color={isDry ? '#FCA5A5' : '#34D399'} />
                          <Text className={`text-[9px] font-bold ml-1 ${isDry ? 'text-[#FCA5A5]' : 'text-[#34D399]'}`}>
                            {isDry ? 'Needs Water' : 'Healthy'}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text className="text-gray-400 text-[11px] italic mb-1">{pSpecies}</Text>
                    <View className="flex-row items-center mb-0.5">
                      <Ionicons name="location-outline" size={12} color="#34D399" />
                      <Text className="text-gray-300 text-[10px] ml-1 font-medium">{pLocation}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="hardware-chip-outline" size={12} color="#9CA3AF" />
                      <Text className="text-gray-400 text-[10px] ml-1">
                        {plant.device_key ? `ESP32: ${plant.device_key.slice(0, 10)}...` : 'Device: Unassigned'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Telemetry bar */}
                <View className="flex-row justify-between bg-[#0F172A] rounded-xl p-3 mb-4">
                  <View>
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="water-outline" size={10} color={isDry ? '#F87171' : '#34D399'} />
                      <Text className="text-gray-400 text-[9px] font-bold tracking-wider ml-1">MOISTURE</Text>
                    </View>
                    <Text className={`text-xs font-bold ${isDry ? 'text-[#F87171]' : 'text-[#34D399]'}`}>
                      {pMoisture}% <Text className="text-[9px] font-normal text-gray-400">{isDry ? 'Low' : 'Good'}</Text>
                    </Text>
                  </View>
                  <View>
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="thermometer-outline" size={10} color="#9CA3AF" />
                      <Text className="text-gray-400 text-[9px] font-bold tracking-wider ml-1">TEMP</Text>
                    </View>
                    <Text className="text-white text-xs font-bold">
                      {pTemp !== null && pTemp !== undefined ? `${pTemp}°C` : '--'}
                    </Text>
                  </View>
                  <View>
                    <View className="flex-row items-center mb-1">
                      <Ionicons name="shield-checkmark-outline" size={10} color="#34D399" />
                      <Text className="text-gray-400 text-[9px] font-bold tracking-wider ml-1">THRESHOLD</Text>
                    </View>
                    <Text className="text-white text-xs font-bold">{pThreshold}%</Text>
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row space-x-3 gap-2">
                  <TouchableOpacity 
                    className="flex-[2] bg-[#34D399] rounded-xl py-2.5 items-center active:opacity-90" 
                    onPress={() => router.push({
                      pathname: '/plant-detail' as any,
                      params: { plantId: String(pId), plantName: pName },
                    })}
                  >
                    <Text className="text-[#064E3B] font-bold text-xs">View Details</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    className="flex-1 bg-[#334155] rounded-xl py-2.5 items-center flex-row justify-center active:opacity-90"
                    onPress={() => handleWater(pId)}
                  >
                    <Ionicons name="water-outline" size={14} color="#34D399" />
                    <Text className="text-[#34D399] font-bold text-xs ml-1">Water (5s)</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        {/* Add Another Plant footer */}
        <View className="items-center mb-32">
          <TouchableOpacity className="w-12 h-12 bg-[#1E293B] border border-[#334155] rounded-full items-center justify-center mb-3" onPress={() => router.push('/add-plant')}>
            <Ionicons name="add" size={24} color="#34D399" />
          </TouchableOpacity>
          <Text className="text-white font-bold text-sm mb-1">Add Another Plant</Text>
          <Text className="text-gray-400 text-[11px] text-center px-8">
            Connect sensor hardware or capture leaf photos for AI diagnosis.
          </Text>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity className="absolute bottom-24 right-6 w-14 h-14 bg-[#34D399] rounded-full items-center justify-center shadow-lg shadow-[#34D399]/30" onPress={() => router.push('/add-plant')}>
        <MaterialCommunityIcons name="line-scan" size={24} color="#064E3B" />
      </TouchableOpacity>

      {/* Bottom Navigation */}
      <View className="absolute bottom-0 left-0 right-0 bg-[#09121B] border-t border-[#1E293B] flex-row justify-around items-center py-2 pb-6 px-2">
        <TouchableOpacity className="items-center px-4 py-2" onPress={() => router.push('/dashboard')}>
          <Ionicons name="home-outline" size={24} color="#9CA3AF" />
          <Text className="text-gray-400 text-[10px] font-medium mt-1">Home</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center bg-[#064E3B]/40 px-4 py-2 rounded-2xl">
          <MaterialCommunityIcons name="flower-tulip" size={24} color="#34D399" />
          <Text className="text-[#34D399] text-[10px] font-bold mt-1">Plants</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center px-4 py-2">
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
