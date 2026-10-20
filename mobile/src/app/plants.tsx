import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PlantsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <SafeAreaView className="flex-1 bg-[#09121B]">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-4 pb-4">
        <View className="flex-row items-center">
          <MaterialCommunityIcons name="flower-tulip-outline" size={24} color="#34D399" />
          <Text className="text-white text-xl font-bold tracking-tight ml-2">PlantSmart</Text>
        </View>
        <Ionicons name="notifications-outline" size={24} color="#9CA3AF" />
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Title Card */}
        <View className="bg-[#1E293B] rounded-2xl p-4 mb-5 flex-row items-center justify-between border border-[#334155]">
          <View className="flex-row items-center flex-1">
            <View className="w-12 h-12 bg-[#064E3B] rounded-xl items-center justify-center mr-4">
              <Ionicons name="book-outline" size={24} color="#34D399" />
            </View>
            <View className="flex-1 pr-2">
              <Text className="text-white text-xl font-bold mb-1">My Plants</Text>
              <Text className="text-gray-400 text-[11px] leading-tight">Manage & monitor your sanctuary</Text>
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
            placeholder="Search plants, sensors..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <Ionicons name="options-outline" size={18} color="#9CA3AF" />
        </View>

        {/* Filters */}
        <View className="flex-row mb-6 space-x-3">
          <TouchableOpacity className="bg-[#34D399] rounded-full px-4 py-1.5 flex-row items-center">
            <Ionicons name="infinite" size={14} color="#064E3B" />
            <Text className="text-[#064E3B] text-[11px] font-bold ml-1">All (3)</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-[#1E293B] border border-[#334155] rounded-full px-4 py-1.5 flex-row items-center">
            <Ionicons name="warning-outline" size={12} color="#9CA3AF" />
            <Text className="text-gray-300 text-[11px] font-medium ml-1">Needs Water (1)</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-[#1E293B] border border-[#334155] rounded-full px-4 py-1.5 flex-row items-center">
            <Ionicons name="home-outline" size={12} color="#9CA3AF" />
            <Text className="text-gray-300 text-[11px] font-medium ml-1">Indoor</Text>
          </TouchableOpacity>
        </View>

        {/* Active Collection Header */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <Text className="text-gray-300 text-[10px] font-bold tracking-widest uppercase">Active Collection</Text>
            <View className="bg-[#064E3B] w-5 h-5 rounded-full items-center justify-center ml-2">
              <Text className="text-[#34D399] text-[10px] font-bold">3</Text>
            </View>
          </View>
          <View className="flex-row space-x-3">
            <Ionicons name="reorder-two" size={20} color="#34D399" />
            <Ionicons name="grid-outline" size={16} color="#64748B" />
          </View>
        </View>

        {/* Plant 1: Basil */}
        <View className="bg-[#1E293B] rounded-2xl p-4 mb-4 border border-[#334155]">
          <View className="flex-row mb-4 relative">
            <View className="w-20 h-20 bg-gray-700 rounded-xl mr-4 overflow-hidden relative">
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1615477023356-af4cfa52022e?q=80&w=200&auto=format&fit=crop' }} 
                className="w-full h-full"
              />
              <View className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded-full flex-row items-center">
                <View className="w-1.5 h-1.5 bg-[#34D399] rounded-full mr-1" />
                <Text className="text-white text-[8px] font-bold">IoT</Text>
              </View>
            </View>
            <View className="flex-1 justify-center">
              <View className="flex-row justify-between items-start">
                <Text className="text-white text-base font-bold mb-0.5">Basil Plant</Text>
                <View className="flex-row items-center">
                  <View className="bg-[#064E3B] px-2 py-0.5 rounded-full flex-row items-center mr-2">
                    <Ionicons name="checkmark" size={10} color="#34D399" />
                    <Text className="text-[#34D399] text-[9px] font-bold ml-1">Healthy</Text>
                  </View>
                  <Ionicons name="ellipsis-vertical" size={16} color="#9CA3AF" />
                </View>
              </View>
              <Text className="text-gray-400 text-[11px] italic mb-1">Ocimum basilicum</Text>
              <View className="flex-row items-center mb-0.5">
                <Ionicons name="location-outline" size={12} color="#34D399" />
                <Text className="text-gray-300 text-[10px] ml-1 font-medium">Indoor Herb Zone</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="water-outline" size={12} color="#9CA3AF" />
                <Text className="text-gray-400 text-[10px] ml-1">Last: 2 days ago</Text>
              </View>
            </View>
          </View>
          <View className="flex-row justify-between bg-[#0F172A] rounded-xl p-3 mb-4">
            <View>
              <View className="flex-row items-center mb-1">
                <Ionicons name="water-outline" size={10} color="#F87171" />
                <Text className="text-gray-400 text-[9px] font-bold tracking-wider ml-1">MOISTURE</Text>
              </View>
              <Text className="text-[#F87171] text-xs font-bold">8% <Text className="text-[9px] font-normal text-[#FCA5A5]">Low</Text></Text>
            </View>
            <View>
              <View className="flex-row items-center mb-1">
                <Ionicons name="thermometer-outline" size={10} color="#9CA3AF" />
                <Text className="text-gray-400 text-[9px] font-bold tracking-wider ml-1">TEMP</Text>
              </View>
              <Text className="text-white text-xs font-bold">33.5°C</Text>
            </View>
            <View>
              <View className="flex-row items-center mb-1">
                <Ionicons name="sunny-outline" size={10} color="#34D399" />
                <Text className="text-gray-400 text-[9px] font-bold tracking-wider ml-1">SUNLIGHT</Text>
              </View>
              <Text className="text-white text-xs font-bold">Moderate</Text>
            </View>
          </View>
          <View className="flex-row space-x-3">
            <TouchableOpacity 
              className="flex-[2] bg-[#34D399] rounded-xl py-2.5 items-center" 
              onPress={() => router.push('/plant-detail')}
            >
              <Text className="text-[#064E3B] font-bold text-xs">View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-[#334155] rounded-xl py-2.5 items-center flex-row justify-center">
              <Ionicons name="water-outline" size={14} color="#34D399" />
              <Text className="text-[#34D399] font-bold text-xs ml-1">Water</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plant 2: Monstera */}
        <View className="bg-[#1E293B] rounded-2xl p-4 mb-4 border border-[#334155]">
          <View className="flex-row mb-4 relative">
            <View className="w-20 h-20 bg-gray-700 rounded-xl mr-4 overflow-hidden relative">
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=200&auto=format&fit=crop' }} 
                className="w-full h-full"
              />
              <View className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded-full flex-row items-center">
                <View className="w-1.5 h-1.5 bg-[#34D399] rounded-full mr-1" />
                <Text className="text-white text-[8px] font-bold">IoT</Text>
              </View>
            </View>
            <View className="flex-1 justify-center">
              <View className="flex-row justify-between items-start">
                <Text className="text-white text-base font-bold mb-0.5" numberOfLines={1}>Monstera D...</Text>
                <View className="flex-row items-center">
                  <View className="border border-[#34D399] px-2 py-0.5 rounded-full flex-row items-center mr-2">
                    <Ionicons name="checkmark-done-outline" size={10} color="#34D399" />
                    <Text className="text-[#34D399] text-[9px] font-bold ml-1">Optimal</Text>
                  </View>
                  <Ionicons name="ellipsis-vertical" size={16} color="#9CA3AF" />
                </View>
              </View>
              <Text className="text-gray-400 text-[11px] italic mb-1">Swiss Cheese Plant</Text>
              <View className="flex-row items-center mb-0.5">
                <Ionicons name="location-outline" size={12} color="#34D399" />
                <Text className="text-gray-300 text-[10px] ml-1 font-medium">Living Room Window</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="water-outline" size={12} color="#9CA3AF" />
                <Text className="text-gray-400 text-[10px] ml-1">Last: Today, 08:30 AM</Text>
              </View>
            </View>
          </View>
          <View className="flex-row justify-between bg-[#0F172A] rounded-xl p-3 mb-4">
            <View>
              <View className="flex-row items-center mb-1">
                <Ionicons name="water-outline" size={10} color="#34D399" />
                <Text className="text-gray-400 text-[9px] font-bold tracking-wider ml-1">MOISTURE</Text>
              </View>
              <Text className="text-[#34D399] text-xs font-bold">65% <Text className="text-[9px] font-normal text-gray-400">Good</Text></Text>
            </View>
            <View>
              <View className="flex-row items-center mb-1">
                <Ionicons name="thermometer-outline" size={10} color="#9CA3AF" />
                <Text className="text-gray-400 text-[9px] font-bold tracking-wider ml-1">TEMP</Text>
              </View>
              <Text className="text-white text-xs font-bold">24.2°C</Text>
            </View>
            <View>
              <View className="flex-row items-center mb-1">
                <Ionicons name="sunny-outline" size={10} color="#34D399" />
                <Text className="text-gray-400 text-[9px] font-bold tracking-wider ml-1">SUNLIGHT</Text>
              </View>
              <Text className="text-white text-xs font-bold">Bright Ind.</Text>
            </View>
          </View>
          <View className="flex-row space-x-3">
            <TouchableOpacity className="flex-[2] bg-[#334155] rounded-xl py-2.5 items-center">
              <Text className="text-white font-bold text-xs">View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-[#334155] rounded-xl py-2.5 items-center flex-row justify-center">
              <Ionicons name="water-outline" size={14} color="#34D399" />
              <Text className="text-[#34D399] font-bold text-xs ml-1">Mist</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plant 3: Snake Plant */}
        <View className="bg-[#1E293B] rounded-2xl p-4 mb-8 border border-[#334155]">
          <View className="flex-row mb-4 relative">
            <View className="w-20 h-20 bg-gray-700 rounded-xl mr-4 overflow-hidden relative">
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1599598425947-33002629ee8f?q=80&w=200&auto=format&fit=crop' }} 
                className="w-full h-full"
              />
              <View className="absolute bottom-1 right-1 bg-black/60 px-1.5 py-0.5 rounded-full flex-row items-center">
                <View className="w-1.5 h-1.5 bg-[#F87171] rounded-full mr-1" />
                <Text className="text-white text-[8px] font-bold">Dry</Text>
              </View>
            </View>
            <View className="flex-1 justify-center">
              <View className="flex-row justify-between items-start">
                <Text className="text-white text-base font-bold mb-0.5" numberOfLines={1}>Snake Pl...</Text>
                <View className="flex-row items-center">
                  <View className="bg-[#7F1D1D] px-2 py-1 rounded-lg flex-row items-center mr-2">
                    <Text className="text-[#FCA5A5] text-[9px] font-bold text-center leading-tight">Needs{'\n'}Water</Text>
                  </View>
                  <Ionicons name="ellipsis-vertical" size={16} color="#9CA3AF" />
                </View>
              </View>
              <Text className="text-gray-400 text-[11px] italic mb-1">Dracaena trifasciata</Text>
              <View className="flex-row items-center mb-0.5">
                <Ionicons name="location-outline" size={12} color="#34D399" />
                <Text className="text-gray-300 text-[10px] ml-1 font-medium">Master Bedroom</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="water-outline" size={12} color="#9CA3AF" />
                <Text className="text-gray-400 text-[10px] ml-1">Last: 14 days ago</Text>
              </View>
            </View>
          </View>
          <View className="flex-row justify-between bg-[#0F172A] rounded-xl p-3 mb-4">
            <View>
              <View className="flex-row items-center mb-1">
                <Ionicons name="water-outline" size={10} color="#F87171" />
                <Text className="text-gray-400 text-[9px] font-bold tracking-wider ml-1">MOISTURE</Text>
              </View>
              <Text className="text-[#F87171] text-xs font-bold">15% <Text className="text-[9px] font-normal text-[#FCA5A5]">Crit.</Text></Text>
            </View>
            <View>
              <View className="flex-row items-center mb-1">
                <Ionicons name="thermometer-outline" size={10} color="#9CA3AF" />
                <Text className="text-gray-400 text-[9px] font-bold tracking-wider ml-1">TEMP</Text>
              </View>
              <Text className="text-white text-xs font-bold">21.8°C</Text>
            </View>
            <View>
              <View className="flex-row items-center mb-1">
                <Ionicons name="sunny-outline" size={10} color="#34D399" />
                <Text className="text-gray-400 text-[9px] font-bold tracking-wider ml-1">SUNLIGHT</Text>
              </View>
              <Text className="text-white text-xs font-bold">Low Light</Text>
            </View>
          </View>
          <View className="flex-row space-x-3">
            <TouchableOpacity className="flex-[2] bg-[#34D399] rounded-xl py-2.5 items-center">
              <Text className="text-[#064E3B] font-bold text-xs">Water Now</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-[#334155] rounded-xl py-2.5 items-center">
              <Text className="text-white font-bold text-xs">Details</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Add Another Plant */}
        <View className="items-center mb-32">
          <TouchableOpacity className="w-12 h-12 bg-[#1E293B] border border-[#334155] rounded-full items-center justify-center mb-3" onPress={() => router.push('/add-plant')}>
            <Ionicons name="add" size={24} color="#34D399" />
          </TouchableOpacity>
          <Text className="text-white font-bold text-sm mb-1">Add Another Plant</Text>
          <Text className="text-gray-400 text-[11px] text-center px-8">
            Scan an NFC tag, barcode, or use AI leaf photo diagnosis to connect.
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
