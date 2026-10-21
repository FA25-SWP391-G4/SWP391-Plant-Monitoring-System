import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import api from '../api/apiClient';

interface DiagnosticResult {
  status: string;
  verdict: 'CONFIDENT' | 'MODERATE' | 'UNCERTAIN' | string;
  predicted_class: string;
  predicted_species: string;
  predicted_condition: string;
  confidence: number;
  confidence_margin: number;
  shannon_entropy: number;
  normalized_entropy: number;
  species_confidence: number;
  species_entropy: number;
  segmented_leaf_base64?: string | null;
  user_guidance: string;
  condition_details?: string;
  treatment_recommendation?: string;
  top3_predictions?: Array<{
    class: string;
    species: string;
    condition: string;
    confidence: number;
  }>;
  timing_breakdown_ms?: {
    segmentation: number;
    isolation_smoothing: number;
    classification: number;
    total_latency: number;
  };
}

// Preset samples for 1-click test directly from mobile
const SAMPLE_PRESETS = [
  {
    id: 'spider_plant',
    label: 'Spider Plant',
    condition: 'Leaf Tip Necrosis',
    uri: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?q=80&w=600&auto=format&fit=crop',
    description: 'Crisp brown tips on leaf ribbons',
  },
  {
    id: 'money_plant',
    label: 'Money Plant',
    condition: 'Manganese Toxicity',
    uri: 'https://images.unsplash.com/photo-1598880940371-c756e015fea1?q=80&w=600&auto=format&fit=crop',
    description: 'Yellowing margins and brown speckles',
  },
  {
    id: 'snake_plant',
    label: 'Snake Plant',
    condition: 'Healthy Leaf',
    uri: 'https://images.unsplash.com/photo-1599598425947-5202edd564c5?q=80&w=600&auto=format&fit=crop',
    description: 'Firm sword-shaped succulent leaf',
  },
];

export default function AnalyzeImageScreen() {
  const router = useRouter();
  const { plantId, plantName } = useLocalSearchParams<{ plantId?: string; plantName?: string }>();
  
  const targetPlantName = plantName || 'Basil Plant';
  
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [fileName, setFileName] = useState<string>('plant_leaf.jpg');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosticResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeImageTab, setActiveImageTab] = useState<'isolated' | 'original'>('isolated');

  // Launch camera
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to capture photos of plant leaves.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImageUri(asset.uri);
        setMimeType(asset.mimeType || 'image/jpeg');
        setFileName(asset.fileName || 'camera_leaf.jpg');
        setDiagnosisResult(null);
        setErrorMessage(null);
      }
    } catch (err: any) {
      console.warn('Camera launch error:', err);
      setErrorMessage(`Camera error: ${err.message || 'Unable to open camera'}`);
    }
  };

  // Launch gallery picker
  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Media gallery permission is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedImageUri(asset.uri);
        setMimeType(asset.mimeType || 'image/jpeg');
        setFileName(asset.fileName || 'gallery_leaf.jpg');
        setDiagnosisResult(null);
        setErrorMessage(null);
      }
    } catch (err: any) {
      console.warn('Gallery pick error:', err);
      setErrorMessage(`Gallery error: ${err.message || 'Unable to open photo picker'}`);
    }
  };

  // Select sample preset
  const handleSelectSample = (sample: typeof SAMPLE_PRESETS[0]) => {
    setSelectedImageUri(sample.uri);
    setMimeType('image/jpeg');
    setFileName(`${sample.id}.jpg`);
    setDiagnosisResult(null);
    setErrorMessage(null);
  };

  // Run AI diagnosis
  const handleRunDiagnosis = async () => {
    if (!selectedImageUri) {
      setErrorMessage('Please capture or select a leaf photo first.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const result = await api.ai.diagnoseImage(selectedImageUri, mimeType, fileName);
      setDiagnosisResult(result);
      setActiveImageTab(result.segmented_leaf_base64 ? 'isolated' : 'original');
    } catch (err: any) {
      console.error('Diagnosis failed:', err);
      setErrorMessage(
        err.message || 'Failed to reach AI Diagnostic Server. Make sure python app.py is running on port 8000.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset to analyze another leaf
  const handleReset = () => {
    setSelectedImageUri(null);
    setDiagnosisResult(null);
    setErrorMessage(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#0F172A]" edges={['top', 'left', 'right']}>
      {/* Top Navigation Bar */}
      <View className="px-5 py-3 flex-row items-center justify-between border-b border-[#1E293B]">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-xl bg-[#1E293B] border border-[#334155] items-center justify-center active:bg-[#334155]"
        >
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View className="items-center flex-1 mx-3">
          <View className="flex-row items-center">
            <Text className="text-base mr-1.5">🌿</Text>
            <Text className="text-white text-base font-bold tracking-tight">Leaf Health Analyzer</Text>
          </View>
          <View className="flex-row items-center mt-0.5">
            <View className="w-1.5 h-1.5 rounded-full bg-[#10B981] mr-1.5 animate-pulse" />
            <Text className="text-gray-400 text-[11px]">Target: </Text>
            <Text className="text-[#34D399] text-[11px] font-semibold">{targetPlantName}</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleReset}
          className="w-10 h-10 rounded-xl bg-[#1E293B] border border-[#334155] items-center justify-center active:bg-[#334155]"
        >
          <Ionicons name="refresh-outline" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-5 pt-4 pb-10" showsVerticalScrollIndicator={false}>
        {/* Error Alert Box */}
        {errorMessage && (
          <View className="mb-4 bg-red-950/40 border border-red-500/50 rounded-2xl p-4 flex-row items-start">
            <Ionicons name="alert-circle" size={20} color="#EF4444" className="mt-0.5 mr-2.5" />
            <View className="flex-1">
              <Text className="text-red-400 font-bold text-xs">Diagnosis Warning</Text>
              <Text className="text-red-200 text-xs mt-0.5 leading-relaxed">{errorMessage}</Text>
            </View>
          </View>
        )}

        {/* =========================================================================
            STATE 1: NO IMAGE SELECTED YET (VIEWFINDER / SOURCE SELECTOR)
           ========================================================================= */}
        {!selectedImageUri && (
          <View>
            {/* Viewfinder Target Card */}
            <View className="bg-[#1E293B] border border-[#334155] rounded-3xl p-6 items-center mb-6 shadow-xl relative overflow-hidden">
              <View className="absolute -right-10 -top-10 w-40 h-40 bg-[#10B981]/10 rounded-full blur-2xl" />

              {/* Reticle Viewfinder */}
              <View className="w-64 h-64 border-2 border-dashed border-[#10B981]/80 rounded-3xl items-center justify-center bg-black/40 mb-5 relative">
                {/* Reticle Corner Accents */}
                <View className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#34D399] rounded-tl" />
                <View className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#34D399] rounded-tr" />
                <View className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#34D399] rounded-bl" />
                <View className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#34D399] rounded-br" />

                <View className="w-16 h-16 rounded-full bg-[#10B981]/20 items-center justify-center mb-3">
                  <MaterialCommunityIcons name="leaf" size={32} color="#34D399" />
                </View>

                <View className="bg-black/60 px-3 py-1.5 rounded-full border border-[#334155]">
                  <Text className="text-[#34D399] text-xs font-semibold">Frame leaf inside box</Text>
                </View>
              </View>

              <Text className="text-white text-base font-bold text-center mb-1">
                AI Plant Disease Diagnostic
              </Text>
              <Text className="text-gray-400 text-xs text-center max-w-[280px] leading-relaxed">
                Take a close-up photo of the affected or healthy leaf. Our Edge AI isolates the leaf and identifies 14 conditions in ~300ms.
              </Text>
            </View>

            {/* Action Buttons: Camera & Upload */}
            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity
                onPress={handleTakePhoto}
                className="flex-1 bg-[#10B981] py-4 px-3 rounded-2xl flex-row items-center justify-center shadow-lg shadow-emerald-500/20 active:opacity-90"
              >
                <Ionicons name="camera" size={20} color="#FFFFFF" />
                <Text className="text-white text-sm font-bold ml-2">Snap Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePickFromGallery}
                className="flex-1 bg-[#1E293B] border border-[#334155] py-4 px-3 rounded-2xl flex-row items-center justify-center active:bg-[#334155]"
              >
                <Ionicons name="images-outline" size={20} color="#E2E8F0" />
                <Text className="text-gray-200 text-sm font-bold ml-2">Upload Photo</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Test Presets Section */}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white text-xs font-bold uppercase tracking-wider text-gray-400">
                  Or Test With Preset Samples
                </Text>
                <Text className="text-[#34D399] text-[11px] font-semibold">Instant 1-Click</Text>
              </View>

              <View className="gap-2.5">
                {SAMPLE_PRESETS.map((sample) => (
                  <TouchableOpacity
                    key={sample.id}
                    onPress={() => handleSelectSample(sample)}
                    className="bg-[#1E293B] border border-[#334155] rounded-2xl p-3 flex-row items-center active:border-[#10B981]"
                  >
                    <Image
                      source={{ uri: sample.uri }}
                      className="w-14 h-14 rounded-xl bg-gray-800 mr-3.5"
                    />
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-white text-sm font-bold">{sample.label}</Text>
                        <View className="bg-[#0F172A] px-2 py-0.5 rounded-full border border-[#334155]">
                          <Text className="text-[#34D399] text-[10px] font-semibold">{sample.condition}</Text>
                        </View>
                      </View>
                      <Text className="text-gray-400 text-xs mt-0.5">{sample.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#64748B" className="ml-2" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* =========================================================================
            STATE 2: PHOTO SELECTED & READY TO ANALYZE (OR IN-PROGRESS)
           ========================================================================= */}
        {selectedImageUri && !diagnosisResult && (
          <View className="mb-6">
            <View className="bg-[#1E293B] border border-[#334155] rounded-3xl overflow-hidden mb-5 shadow-2xl relative">
              <View className="h-80 w-full bg-black items-center justify-center relative">
                <Image
                  source={{ uri: selectedImageUri }}
                  className="w-full h-full"
                  resizeMode="contain"
                />

                {/* Retake Button Overlay */}
                <TouchableOpacity
                  onPress={handleReset}
                  className="absolute top-4 right-4 bg-black/75 border border-white/20 px-3.5 py-2 rounded-xl flex-row items-center shadow-lg backdrop-blur-md active:bg-black"
                >
                  <Ionicons name="swap-horizontal" size={16} color="#FFFFFF" />
                  <Text className="text-white text-xs font-semibold ml-1.5">Choose Another</Text>
                </TouchableOpacity>
              </View>

              <View className="p-4 bg-[#1E293B] border-t border-[#334155] flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="image-outline" size={18} color="#34D399" />
                  <Text className="text-white text-xs font-semibold ml-2">Photo Ready for AI</Text>
                </View>
                <Text className="text-gray-400 text-[11px]">Edge CPU Inference</Text>
              </View>
            </View>

            {/* Run Diagnosis CTA Button */}
            <TouchableOpacity
              onPress={handleRunDiagnosis}
              disabled={isAnalyzing}
              className="w-full rounded-2xl overflow-hidden shadow-xl shadow-emerald-500/25 active:opacity-90"
            >
              <LinearGradient
                colors={['#10B981', '#059669', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="py-4 px-5 flex-row items-center justify-center"
              >
                {isAnalyzing ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" className="mr-3" />
                    <View>
                      <Text className="text-white text-sm font-bold">Diagnosing Plant Leaf...</Text>
                      <Text className="text-emerald-100 text-[10px]">Isolating leaf via u2netp & MobileNetV3</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <MaterialCommunityIcons name="star-four-points" size={20} color="#FFFFFF" />
                    <Text className="text-white text-sm font-extrabold ml-2">
                      Diagnose Leaf Disease with AI
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* =========================================================================
            STATE 3: DIAGNOSIS RESULTS
           ========================================================================= */}
        {diagnosisResult && (
          <View className="space-y-4 mb-8">
            {/* Header Verdict Card */}
            <View
              className={`p-4 rounded-3xl border mb-4 ${
                diagnosisResult.verdict === 'CONFIDENT'
                  ? 'bg-[#064E3B]/70 border-[#10B981]'
                  : diagnosisResult.verdict === 'MODERATE'
                  ? 'bg-amber-950/60 border-amber-500'
                  : 'bg-red-950/60 border-red-500'
              }`}
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-gray-300 text-[10px] font-bold uppercase tracking-wider">
                  DIAGNOSIS VERDICT
                </Text>
                <View
                  className={`px-3 py-1 rounded-full flex-row items-center ${
                    diagnosisResult.verdict === 'CONFIDENT'
                      ? 'bg-[#10B981]'
                      : diagnosisResult.verdict === 'MODERATE'
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                >
                  <Text className="text-white text-[11px] font-extrabold uppercase">
                    {diagnosisResult.verdict} ({Math.round(diagnosisResult.confidence * 100)}%)
                  </Text>
                </View>
              </View>

              <Text className="text-white text-xl font-extrabold tracking-tight">
                {diagnosisResult.predicted_species} — {diagnosisResult.predicted_condition}
              </Text>

              <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-white/10">
                <Text className="text-emerald-200 text-xs">
                  Class: <Text className="font-semibold">{diagnosisResult.predicted_class}</Text>
                </Text>
                <Text className="text-gray-400 text-[11px]">
                  Latency: {diagnosisResult.timing_breakdown_ms?.total_latency ?? '~300'} ms
                </Text>
              </View>
            </View>

            {/* Dual Leaf Preview: Original Photo vs AI Isolated Leaf (u2netp) */}
            <View className="bg-[#1E293B] border border-[#334155] rounded-3xl p-4 mb-4">
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-white text-xs font-bold uppercase tracking-wider">
                  Vision Segmentation
                </Text>

                {/* Tab Pill: Isolated vs Original */}
                <View className="bg-[#0F172A] p-1 rounded-xl flex-row border border-[#334155]">
                  <TouchableOpacity
                    onPress={() => setActiveImageTab('isolated')}
                    className={`px-3 py-1 rounded-lg ${
                      activeImageTab === 'isolated' ? 'bg-[#10B981]' : 'bg-transparent'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        activeImageTab === 'isolated' ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      AI Masked
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setActiveImageTab('original')}
                    className={`px-3 py-1 rounded-lg ${
                      activeImageTab === 'original' ? 'bg-[#10B981]' : 'bg-transparent'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        activeImageTab === 'original' ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      Original
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View className="h-64 w-full bg-black rounded-2xl overflow-hidden items-center justify-center relative border border-[#334155]">
                {activeImageTab === 'isolated' && diagnosisResult.segmented_leaf_base64 ? (
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${diagnosisResult.segmented_leaf_base64}` }}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                ) : (
                  <Image
                    source={{ uri: selectedImageUri! }}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                )}

                <View className="absolute bottom-2.5 left-2.5 bg-black/80 px-2.5 py-1 rounded-full border border-white/10 flex-row items-center">
                  <View className="w-1.5 h-1.5 rounded-full bg-[#10B981] mr-1.5" />
                  <Text className="text-white text-[10px] font-semibold">
                    {activeImageTab === 'isolated'
                      ? 'u2netp Salient Object Detection (Background Removed)'
                      : 'Raw Camera Input'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Top Predictions Bar Breakdown */}
            {diagnosisResult.top3_predictions && diagnosisResult.top3_predictions.length > 0 && (
              <View className="bg-[#1E293B] border border-[#334155] rounded-3xl p-4 mb-4">
                <Text className="text-white text-xs font-bold uppercase tracking-wider mb-3">
                  Confidence Breakdown (Top Candidates)
                </Text>
                <View className="space-y-3">
                  {diagnosisResult.top3_predictions.map((item, idx) => {
                    const pct = Math.round(item.confidence * 100);
                    return (
                      <View key={item.class} className="mb-2.5">
                        <View className="flex-row justify-between items-center mb-1">
                          <Text className="text-white text-xs font-semibold">
                            {idx + 1}. {item.species} — {item.condition}
                          </Text>
                          <Text className="text-[#34D399] text-xs font-bold">{pct}%</Text>
                        </View>
                        <View className="w-full h-2 bg-[#0F172A] rounded-full overflow-hidden border border-[#334155]/40">
                          <View
                            className={`h-full rounded-full ${
                              idx === 0 ? 'bg-[#10B981]' : 'bg-[#64748B]'
                            }`}
                            style={{ width: `${Math.max(pct, 2)}%` }}
                          />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Observations & Biological Guidance */}
            <View className="bg-[#1E293B] border border-[#334155] rounded-3xl p-4 mb-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="information-circle-outline" size={18} color="#34D399" />
                <Text className="text-white text-xs font-bold uppercase tracking-wider ml-1.5">
                  AI Clinical Observation
                </Text>
              </View>
              <Text className="text-gray-200 text-xs leading-relaxed mb-3">
                {diagnosisResult.user_guidance}
              </Text>

              {diagnosisResult.condition_details && (
                <View className="bg-[#0F172A] p-3 rounded-2xl border border-[#334155]/60">
                  <Text className="text-gray-400 text-[10px] uppercase font-bold mb-1">
                    Tissue & Pathogen Details:
                  </Text>
                  <Text className="text-gray-300 text-xs leading-relaxed">
                    {diagnosisResult.condition_details}
                  </Text>
                </View>
              )}
            </View>

            {/* Treatment & Care Action Card */}
            <View className="bg-[#064E3B]/40 border-2 border-[#10B981] rounded-3xl p-5 mb-5 shadow-lg shadow-emerald-950/40">
              <View className="flex-row items-center mb-2.5">
                <Text className="text-xl mr-2">💊</Text>
                <Text className="text-[#34D399] text-sm font-bold uppercase tracking-wide">
                  Prescribed Treatment & Care Plan
                </Text>
              </View>
              <Text className="text-emerald-100 text-xs leading-relaxed">
                {diagnosisResult.treatment_recommendation ||
                  'Maintain optimal indirect light and ensure regular pot drainage.'}
              </Text>
            </View>

            {/* Action Buttons: Analyze Another / Done */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleReset}
                className="flex-1 bg-[#1E293B] border border-[#334155] py-3.5 rounded-2xl items-center justify-center active:bg-[#334155]"
              >
                <Text className="text-white text-xs font-bold">Analyze Another Leaf</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.back()}
                className="flex-1 bg-[#10B981] py-3.5 rounded-2xl items-center justify-center active:opacity-90 shadow-md shadow-emerald-500/20"
              >
                <Text className="text-white text-xs font-bold">Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
