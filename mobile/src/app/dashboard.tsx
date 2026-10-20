import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-[#09121B]">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-4 pb-6">
        <MaterialCommunityIcons name="flower-tulip-outline" size={28} color="#9CA3AF" />
        <Text className="text-white text-xl font-bold tracking-tight">PlantSmart</Text>
        <Ionicons name="notifications-outline" size={24} color="#9CA3AF" />
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Welcome Card */}
        <View className="rounded-2xl overflow-hidden mb-6 mt-2">
          <LinearGradient
            colors={['#10B981', '#22C55E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 24 }}
          >
            <Text className="text-white text-2xl font-extrabold mb-2">Welcome back, User!</Text>
            <Text className="text-white/90 text-sm font-medium mb-6">
              Here's an overview of your plant collection.
            </Text>
            <TouchableOpacity className="bg-white rounded-lg py-2.5 px-4 self-start" onPress={() => router.push('/add-plant')}>
              <Text className="text-[#10B981] font-bold text-sm">Add New Plant</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Plant Card */}
        <View className="bg-[#1E293B] rounded-3xl p-5 mb-6">
          {/* Plant Header */}
          <View className="flex-row items-start mb-5">
            <View className="w-14 h-14 bg-[#334155] rounded-xl items-center justify-center mr-4">
              <MaterialCommunityIcons name="flower" size={28} color="#9CA3AF" />
            </View>
            <View className="flex-1">
              <Text className="text-white text-xl font-bold mb-1">Basil Plant</Text>
              <Text className="text-gray-400 text-sm mb-1">Unknown Species</Text>
              <View className="flex-row items-center">
                <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                <Text className="text-gray-400 text-xs ml-1">Indoor Herb Zone</Text>
              </View>
            </View>
            <View className="items-end space-y-2">
              <View className="flex-row items-center bg-[#064E3B] px-2 py-1 rounded-full">
                <Ionicons name="checkmark" size={12} color="#34D399" />
                <Text className="text-[#34D399] text-[10px] font-bold ml-1">Healthy</Text>
              </View>
              <View className="flex-row items-center bg-[#4C1D95]/40 px-2 py-1 rounded-full border border-[#7C3AED]/30">
                <View className="w-1.5 h-1.5 bg-[#F87171] rounded-full mr-1" />
                <Text className="text-[#FCA5A5] text-[10px] font-bold">Offline</Text>
              </View>
            </View>
          </View>

          {/* Plant Metrics */}
          <View className="flex-row justify-between space-x-2 mb-5">
            <View className="flex-1 bg-[#0F172A] rounded-xl p-2 border-b-2 border-[#3B82F6]">
              <Text className="text-gray-400 text-[10px] font-semibold mb-1">Soil Moisture</Text>
              <View className="flex-row items-center">
                <Ionicons name="water-outline" size={14} color="#3B82F6" />
                <Text className="text-white text-sm font-bold ml-1">8%</Text>
              </View>
            </View>
            <View className="flex-1 bg-[#0F172A] rounded-xl p-2">
              <Text className="text-gray-400 text-[10px] font-semibold mb-1">Temperature</Text>
              <View className="flex-row items-center">
                <Ionicons name="thermometer-outline" size={14} color="#F87171" />
                <Text className="text-white text-sm font-bold ml-1">33.5°C</Text>
              </View>
            </View>
            <View className="flex-1 bg-[#0F172A] rounded-xl p-2">
              <Text className="text-gray-400 text-[10px] font-semibold mb-1">Light</Text>
              <View className="flex-row items-center">
                <Ionicons name="sunny-outline" size={14} color="#F59E0B" />
                <Text className="text-white text-sm font-bold ml-1">N/A</Text>
              </View>
            </View>
            <View className="flex-1 bg-[#0F172A] rounded-xl p-2">
              <Text className="text-gray-400 text-[10px] font-semibold mb-1">Humidity</Text>
              <View className="flex-row items-center">
                <Ionicons name="cloud-outline" size={14} color="#0D9488" />
                <Text className="text-white text-sm font-bold ml-1">57.5%</Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center mb-5">
            <Ionicons name="time-outline" size={14} color="#9CA3AF" />
            <Text className="text-gray-400 text-[11px] ml-1">Last Watered: 10/11/2025 (324 days ago)</Text>
            <Text className="text-gray-500 text-[10px] ml-2 bg-[#0F172A] px-1.5 py-0.5 rounded">manual</Text>
          </View>

          {/* Plant Buttons */}
          <View className="flex-row flex-wrap gap-2">
            <TouchableOpacity 
              className="bg-[#2563EB] rounded-lg py-2 px-3 items-center flex-1"
              onPress={() => router.push('/plant-detail')}
            >
              <Text className="text-white font-bold text-[11px]">View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-[#3B82F6] rounded-lg py-2 px-3 items-center flex-1">
              <Text className="text-white font-bold text-[11px]">Water Now</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-[#8B5CF6] rounded-lg py-2 px-3 items-center flex-1">
              <Text className="text-white font-bold text-[11px]">Ask AI</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-[#475569] rounded-lg py-2 px-3 items-center flex-1">
              <Text className="text-white font-bold text-[11px]">Log Activity</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Local Weather Card */}
        <View className="bg-[#1E293B] rounded-3xl p-5 mb-6">
          <View className="flex-row justify-between items-start mb-6">
            <View>
              <Text className="text-white text-sm font-bold mb-2">Local Weather</Text>
              <Text className="text-white text-5xl font-light tracking-tighter mb-2">22°C</Text>
              <Text className="text-gray-400 text-xs mb-1">Humidity: 65%</Text>
              <Text className="text-gray-400 text-xs">Wind: 8 km/h</Text>
            </View>
            <Ionicons name="partly-sunny-outline" size={32} color="#E2E8F0" />
          </View>

          {/* Forecast */}
          <View className="flex-row justify-between mb-5 px-2">
            <View className="items-center">
              <Text className="text-white font-bold text-xs mb-2">Today</Text>
              <Ionicons name="partly-sunny-outline" size={24} color="#E2E8F0" className="mb-2" />
              <Text className="text-white text-xs font-semibold">22° / 15°</Text>
            </View>
            <View className="items-center">
              <Text className="text-white font-bold text-xs mb-2">Tomorrow</Text>
              <Ionicons name="sunny-outline" size={24} color="#34D399" className="mb-2" />
              <Text className="text-white text-xs font-semibold">24° / 16°</Text>
            </View>
            <View className="items-center">
              <Text className="text-white font-bold text-xs mb-2">Wed</Text>
              <Ionicons name="rainy-outline" size={24} color="#9CA3AF" className="mb-2" />
              <Text className="text-white text-xs font-semibold">20° / 14°</Text>
            </View>
          </View>

          {/* Tip Banner */}
          <View className="bg-[#DBEAFE] rounded-xl p-3 flex-row items-center">
            <Ionicons name="information-circle-outline" size={16} color="#2563EB" />
            <Text className="text-[#1E3A8A] text-[11px] font-medium ml-2 flex-1">
              Monitor soil moisture daily based on current weather conditions.
            </Text>
          </View>
        </View>

        {/* Watering Schedule */}
        <View className="bg-[#1E293B] rounded-3xl p-5 mb-6">
          <View className="flex-row items-center mb-4">
            <Ionicons name="water-outline" size={18} color="#3B82F6" />
            <Text className="text-white text-sm font-bold ml-2">Watering Schedule</Text>
          </View>
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-white text-sm font-bold mb-1">Basil Plant</Text>
              <Text className="text-gray-400 text-[10px] mb-3">Last watered: 10/11/2025 (324 days ago)</Text>
              <Text className="text-gray-300 text-[11px] font-medium mb-1">• Schedule:</Text>
              <Text className="text-gray-400 text-[11px] ml-2">Tuesday at 09:00 <Text className="text-[#3B82F6]">(Active)</Text></Text>
              <Text className="text-gray-400 text-[11px] ml-2">Wednesday at 09:00 <Text className="text-[#3B82F6]">(Active)</Text></Text>
              <Text className="text-gray-400 text-[11px] ml-2">Thursday at 09:00 <Text className="text-[#3B82F6]">(Active)</Text></Text>
            </View>
            <TouchableOpacity className="border border-[#3B82F6] rounded-lg px-4 py-1.5">
              <Text className="text-[#3B82F6] text-[11px] font-bold">Water</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity className="mt-4 flex-row items-center justify-center">
            <Ionicons name="add" size={14} color="#3B82F6" />
            <Text className="text-[#3B82F6] text-xs font-semibold ml-1">Add plant to schedule</Text>
          </TouchableOpacity>
        </View>



        {/* Customize Dashboard */}
        <View className="bg-[#1E293B] rounded-3xl p-5 mb-6">
          <View className="flex-row items-center mb-1">
            <Ionicons name="settings-outline" size={18} color="#9CA3AF" />
            <Text className="text-white text-sm font-bold ml-2">Customize Your Dashboard</Text>
          </View>
          <Text className="text-gray-400 text-xs mb-4">Manage widget visibility and dashboard preferences</Text>
          <TouchableOpacity 
            className="bg-[#2563EB] rounded-xl py-2.5 px-4 self-start flex-row items-center active:opacity-90"
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="options-outline" size={16} color="white" />
            <Text className="text-white font-bold text-xs ml-2">Open Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <View className="bg-[#1E293B] rounded-3xl p-5 mb-24">
          <View className="flex-row items-center mb-5">
            <Ionicons name="time-outline" size={16} color="#9CA3AF" />
            <Text className="text-white text-sm font-bold ml-2">Recent Activity</Text>
          </View>
          
          <View className="pl-2 border-l border-gray-700 ml-2 space-y-6">
            <View className="relative">
              <View className="absolute -left-[13px] top-1 w-2 h-2 rounded-full bg-[#34D399]" />
              <Text className="text-white text-sm font-semibold mb-1 pl-4">Basil Plant watered manually.</Text>
              <Text className="text-gray-500 text-xs pl-4">2 hours ago</Text>
            </View>
            <View className="relative">
              <View className="absolute -left-[13px] top-1 w-2 h-2 rounded-full bg-[#F87171]" />
              <Text className="text-white text-sm font-semibold mb-1 pl-4">Temperature alert: High heat detected.</Text>
              <Text className="text-gray-500 text-xs pl-4">5 hours ago</Text>
            </View>
          </View>
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
