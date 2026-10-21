import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '../api/apiClient';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await api.auth.login(email.trim(), password);
      if (res?.success || res?.data?.token) {
        router.push('/dashboard');
      } else {
        setErrorMessage(res?.error || res?.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#09121B]">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }} 
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Top Section */}
            <View className="px-6 pt-6 pb-6">
              {/* Logo */}
              <View className="flex-row items-center mb-5">
                <View className="w-8 h-8 bg-[#22C55E] rounded-md mr-3" />
                <Text className="text-white text-xl font-bold tracking-tight">PlantSmart</Text>
              </View>

              {/* Welcome Text */}
              <View className="mb-4">
                <View className="w-10 h-1 bg-[#22C55E] rounded-full mb-3 opacity-30" />
                <Text className="text-white text-3xl font-extrabold mb-1">Welcome Back to</Text>
                <Text className="text-[#22C55E] text-3xl font-extrabold">PlantSmart</Text>
              </View>

              {/* Checklist */}
              <View className="space-y-2">
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle-outline" size={18} color="#22C55E" />
                  <Text className="text-gray-300 ml-2.5 text-xs font-medium pr-4">Automated IoT watering precision scheduled for every leaf.</Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="checkmark-circle-outline" size={18} color="#22C55E" />
                  <Text className="text-gray-300 ml-2.5 text-xs font-medium">Real-time telemetry and health warnings.</Text>
                </View>
              </View>
            </View>

            {/* Bottom Card Section */}
            <View className="flex-1 bg-white rounded-t-[36px] px-6 pt-7 pb-8 shadow-2xl">
              <Text className="text-2xl text-[#1E293B] font-semibold mb-4">Sign In</Text>

              {/* Error Message */}
              {errorMessage ? (
                <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 flex-row items-center">
                  <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                  <Text className="text-red-600 text-xs ml-2 flex-1">{errorMessage}</Text>
                </View>
              ) : null}

              {/* Email Input */}
              <View className="mb-4">
                <Text className="text-gray-500 text-xs font-medium mb-1.5">Email</Text>
                <View className="flex-row items-center bg-[#1E293B] rounded-xl px-4 py-3">
                  <Ionicons name="mail-outline" size={18} color="#9CA3AF" />
                  <TextInput 
                    className="flex-1 text-white ml-3 text-sm"
                    placeholder="you@greenspace.com"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-1.5">
                  <Text className="text-gray-500 text-xs font-medium">Password</Text>
                  <TouchableOpacity>
                    <Text className="text-[#22C55E] text-xs font-bold">Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row items-center bg-[#1E293B] rounded-xl px-4 py-3">
                  <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
                  <TextInput 
                    className="flex-1 text-white ml-3 text-sm"
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </View>

              {/* Remember Me */}
              <View className="flex-row justify-between items-center mb-6 mt-1">
                <TouchableOpacity 
                  className="flex-row items-center" 
                  activeOpacity={0.7}
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View className={`w-4 h-4 rounded-full border items-center justify-center mr-2 ${rememberMe ? 'border-[#22C55E]' : 'border-gray-300'}`}>
                    {rememberMe && <View className="w-2.5 h-2.5 bg-[#22C55E] rounded-full" />}
                  </View>
                  <Text className="text-gray-500 text-xs font-medium">Remember me</Text>
                </TouchableOpacity>
              </View>

              {/* Clean Production Login Button */}
              <TouchableOpacity 
                className="bg-[#22C55E] rounded-xl py-3.5 items-center mb-4 shadow-md shadow-emerald-500/20 active:opacity-90"
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-bold text-base">Login</Text>
                )}
              </TouchableOpacity>

              {/* Footer Note */}
              <Text className="text-center text-gray-400 text-[10px] px-4 mt-2">
                Connected securely to PlantSmart cloud.
              </Text>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
