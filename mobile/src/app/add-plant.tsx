import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Switch, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../api/apiClient';

export default function AddPlantScreen() {
  const router = useRouter();
  const [nickname, setNickname] = useState('Monstera Deliciosa');
  const [species, setSpecies] = useState('Monstera deliciosa');
  const [location, setLocation] = useState('Indoor Herb Zone');
  const [threshold, setThreshold] = useState(55);
  const [notes, setNotes] = useState('High humidity placement. Monitor soil moisture regularly.');
  const [autoIrrigation, setAutoIrrigation] = useState(true);
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDeviceKey, setSelectedDeviceKey] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadDevices() {
      try {
        const devList = await api.devices.getAll();
        if (Array.isArray(devList) && devList.length > 0) {
          setDevices(devList);
          setSelectedDeviceKey(devList[0].device_key || '');
        }
      } catch (err) {
        console.log('[ADD PLANT] Devices fetch notice:', err);
      }
    }
    loadDevices();
  }, []);

  const handleSavePlant = async () => {
    if (!nickname.trim()) {
      Alert.alert('Plant Name Required', 'Please enter a name or nickname for your plant.');
      return;
    }

    setSaving(true);
    try {
      await api.plants.create({
        name: nickname.trim(),
        species_name: species.trim(),
        location: location.trim(),
        notes: notes,
        moisture_threshold: threshold,
        device_key: selectedDeviceKey || undefined,
      });

      Alert.alert('Plant Added', `"${nickname.trim()}" has been added to your sanctuary!`, [
        { text: 'OK', onPress: () => router.push('/plants') },
      ]);
    } catch (err: any) {
      console.error('[ADD PLANT] Failed to save plant:', err);
      Alert.alert('Notice', err.message || 'Unable to register plant on backend. Check network connection.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#09121B]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-[#1E293B]">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="arrow-back" size={24} color="#34D399" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Monstera Deliciosa</Text>
        <View className="flex-row items-center">
          <TouchableOpacity className="p-2" onPress={() => router.push('/settings')}>
            <Ionicons name="settings-outline" size={22} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity className="p-2">
            <Ionicons name="notifications-outline" size={22} color="#34D399" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-5 pt-6 pb-32" showsVerticalScrollIndicator={false}>
        {/* Specimen Identification */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">Specimen Identification</Text>
          <View className="bg-[#064E3B] px-2 py-1 rounded flex-row items-center">
            <MaterialCommunityIcons name="star-four-points" size={10} color="#34D399" />
            <Text className="text-[#34D399] text-[9px] font-bold ml-1">AI Vision Ready</Text>
          </View>
        </View>
        
        <View className="bg-[#1E293B] rounded-2xl border border-dashed border-[#334155] p-6 items-center mb-6">
          <View className="w-10 h-10 bg-[#0F172A] rounded-full items-center justify-center mb-3">
            <Ionicons name="camera-outline" size={20} color="#34D399" />
          </View>
          <Text className="text-white text-sm font-bold mb-1">Upload Photo or Scan Foliage</Text>
          <Text className="text-gray-500 text-[10px] mb-4">PNG, JPG, HEIC up to 10MB</Text>
          
          <View className="flex-row space-x-3 w-full">
            <TouchableOpacity className="flex-1 bg-[#334155] py-2.5 rounded-xl flex-row justify-center items-center">
              <Ionicons name="cloud-upload-outline" size={16} color="#9CA3AF" />
              <Text className="text-gray-300 text-xs font-bold ml-2">Choose File</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-[#064E3B] py-2.5 rounded-xl flex-row justify-center items-center">
              <Ionicons name="scan-outline" size={16} color="#34D399" />
              <Text className="text-[#34D399] text-xs font-bold ml-2">Snap with Lens</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Plant Nickname */}
        <Text className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-2">Plant Nickname *</Text>
        <View className="bg-[#0F172A] border border-[#334155] rounded-xl flex-row items-center px-4 py-3 mb-5">
          <Ionicons name="pricetag-outline" size={16} color="#9CA3AF" />
          <TextInput
            className="flex-1 text-white ml-3 text-sm font-medium"
            value={nickname}
            onChangeText={setNickname}
            placeholder="e.g. Living Room Fern"
            placeholderTextColor="#475569"
          />
        </View>

        {/* Species / Botanical Name */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-gray-400 text-[10px] font-bold tracking-widest uppercase">Species / Botanical Name</Text>
          <View className="flex-row items-center">
            <Ionicons name="book-outline" size={12} color="#34D399" />
            <Text className="text-[#34D399] text-[10px] font-bold ml-1">Catalog</Text>
          </View>
        </View>
        <View className="bg-[#0F172A] border border-[#334155] rounded-xl flex-row items-center px-4 py-3 mb-2">
          <MaterialCommunityIcons name="flower-tulip-outline" size={18} color="#9CA3AF" />
          <TextInput
            className="flex-1 text-white ml-3 text-sm font-medium"
            value={species}
            onChangeText={setSpecies}
            placeholder="Search catalog..."
            placeholderTextColor="#475569"
          />
          <View className="flex-col">
            <Ionicons name="chevron-up" size={12} color="#9CA3AF" className="mb-[-4px]" />
            <Ionicons name="chevron-down" size={12} color="#9CA3AF" />
          </View>
        </View>
        <View className="flex-row flex-wrap items-center mb-6 gap-2">
          <Text className="text-gray-500 text-[10px] mr-1">SUGGESTIONS:</Text>
          <TouchableOpacity className="bg-[#064E3B]/30 px-2.5 py-1 rounded-md border border-[#064E3B]">
            <Text className="text-[#34D399] text-[10px]">Swiss Cheese Plant</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-[#1E293B] px-2.5 py-1 rounded-md border border-[#334155]">
            <Text className="text-gray-300 text-[10px]">Epipremnum aureum</Text>
          </TouchableOpacity>
        </View>

        {/* Location & Microclimate Zone */}
        <Text className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-3">Location & Microclimate Zone</Text>
        <View className="flex-row flex-wrap gap-2.5 mb-6">
          {['Indoor Herb Zone', 'Living Room South', 'Balcony Terrace', 'Kitchen Window'].map((loc) => {
            const isSelected = location === loc;
            return (
              <TouchableOpacity
                key={loc}
                onPress={() => setLocation(loc)}
                className={`px-3 py-2 rounded-xl flex-row items-center border ${
                  isSelected ? 'bg-[#34D399] border-[#34D399]' : 'bg-[#1E293B] border-[#334155]'
                }`}
              >
                <Ionicons
                  name={loc.includes('Balcony') ? 'sunny-outline' : 'home-outline'}
                  size={14}
                  color={isSelected ? '#064E3B' : '#9CA3AF'}
                />
                <Text
                  className={`text-xs ml-1.5 font-bold ${
                    isSelected ? 'text-[#064E3B]' : 'text-gray-300'
                  }`}
                >
                  {loc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Telemetry & Automation Triggers */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="access-point-network" size={20} color="#34D399" />
            <Text className="text-white text-base font-bold ml-2">Telemetry & Automation{'\n'}Triggers</Text>
          </View>
          <View className="bg-[#064E3B]/20 border border-[#064E3B] px-3 py-1.5 rounded-full flex-row items-center">
            <Text className="text-[#34D399] text-[10px] font-bold uppercase mr-2">Auto-{'\n'}Irrigation</Text>
            <Switch
              value={autoIrrigation}
              onValueChange={setAutoIrrigation}
              trackColor={{ false: '#334155', true: '#34D399' }}
              thumbColor={autoIrrigation ? '#fff' : '#9CA3AF'}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
        </View>

        <View className="bg-[#1E293B] rounded-2xl p-4 mb-8 border border-[#334155]">
          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-[#0F172A] rounded-lg items-center justify-center mr-3">
                <Ionicons name="water-outline" size={16} color="#34D399" />
              </View>
              <View>
                <Text className="text-white text-sm font-bold">Soil Moisture Threshold</Text>
                <Text className="text-gray-400 text-[10px]">Irrigation activates below this value</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-[#34D399] text-xl font-bold">{threshold}%</Text>
              <Text className="text-[#34D399] text-[8px] font-bold tracking-wider">TARGET</Text>
            </View>
          </View>

          {/* Threshold Presets */}
          <View className="flex-row gap-2 mb-3">
            {[35, 45, 55, 65].map((val) => (
              <TouchableOpacity
                key={val}
                onPress={() => setThreshold(val)}
                className={`flex-1 py-1.5 rounded-xl items-center border ${
                  threshold === val
                    ? 'bg-[#34D399] border-[#34D399]'
                    : 'bg-[#0F172A] border-[#334155]'
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    threshold === val ? 'text-[#064E3B]' : 'text-gray-300'
                  }`}
                >
                  {val}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="h-[1px] bg-[#334155] my-3" />

          {/* Hardware Device Link */}
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center flex-1 pr-2">
              <View className="w-8 h-8 bg-[#0F172A] rounded-lg items-center justify-center mr-3">
                <Ionicons name="hardware-chip-outline" size={16} color="#34D399" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-300 text-xs font-medium">Assigned Hardware</Text>
                {devices.length > 0 ? (
                  <View className="flex-row items-center">
                    <View className="w-1.5 h-1.5 bg-[#34D399] rounded-full mr-1" />
                    <Text className="text-[#34D399] text-[10px] font-bold" numberOfLines={1}>
                      {selectedDeviceKey ? `${selectedDeviceKey.slice(0, 16)}...` : 'Default ESP32'}
                    </Text>
                  </View>
                ) : (
                  <Text className="text-gray-400 text-[10px]">No ESP32 linked yet (Auto-probed)</Text>
                )}
              </View>
            </View>
            <TouchableOpacity 
              className="bg-[#334155] px-3 py-1.5 rounded-lg active:opacity-90"
              onPress={() => router.push('/add-device')}
            >
              <Text className="text-[#34D399] text-[10px] font-bold">Pair ESP32</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Cultivation Notes & Habits */}
        <Text className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-3">Cultivation Notes & Habits</Text>
        <View className="bg-[#0F172A] border border-[#334155] rounded-xl p-4 mb-4">
          <TextInput
            className="text-white text-sm"
            multiline
            value={notes}
            onChangeText={setNotes}
            textAlignVertical="top"
          />
        </View>

        <View className="flex-row flex-wrap gap-2 mb-8">
          <TouchableOpacity className="bg-[#1E293B] border border-[#334155] px-2.5 py-1.5 rounded-lg flex-row items-center">
            <Ionicons name="add" size={12} color="#9CA3AF" />
            <Text className="text-gray-400 text-[10px] ml-1">Indirect Sunlight</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-[#1E293B] border border-[#334155] px-2.5 py-1.5 rounded-lg flex-row items-center">
            <Ionicons name="add" size={12} color="#9CA3AF" />
            <Text className="text-gray-400 text-[10px] ml-1">Weekly Foliar Mist</Text>
          </TouchableOpacity>
          <TouchableOpacity className="bg-[#1E293B] border border-[#334155] px-2.5 py-1.5 rounded-lg flex-row items-center">
            <Ionicons name="add" size={12} color="#9CA3AF" />
            <Text className="text-gray-400 text-[10px] ml-1">Nitrogen Boost</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Actions inside scroll before fixed footer */}
        <TouchableOpacity 
          className="bg-[#34D399]/90 py-4 rounded-xl items-center flex-row justify-center mb-4 active:opacity-90"
          onPress={() => router.push('/add-device')}
        >
          <Ionicons name="add-circle-outline" size={18} color="#064E3B" />
          <Text className="text-[#064E3B] font-bold text-sm ml-2">Add Device</Text>
        </TouchableOpacity>
        
        <TouchableOpacity className="items-center mb-10">
          <Text className="text-gray-400 text-xs">Save as Inactive Draft</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-[#09121B] border-t border-[#1E293B] px-5 py-4 flex-row space-x-3">
        <TouchableOpacity 
          className="flex-1 bg-[#34D399] py-4 rounded-xl flex-row items-center justify-center shadow-lg shadow-[#34D399]/20 active:opacity-90" 
          onPress={handleSavePlant}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#064E3B" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#064E3B" />
              <Text className="text-[#064E3B] font-bold text-base ml-2">Save & Activate</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          className="bg-[#1E293B] border border-[#334155] w-14 rounded-xl items-center justify-center"
          onPress={() => router.push('/add-device')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#E2E8F0" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
