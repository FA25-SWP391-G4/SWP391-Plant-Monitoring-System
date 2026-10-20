import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-[#09121B]">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
          {/* Top Section */}
          <View className="px-6 pt-8 pb-12">
            {/* Logo */}
            <View className="flex-row items-center mb-8">
              <View className="w-8 h-8 bg-[#22C55E] rounded-md mr-3" />
              <Text className="text-white text-xl font-bold tracking-tight">PlantSmart</Text>
            </View>

            {/* Welcome Text */}
            <View className="mb-8">
              <View className="w-10 h-1 bg-[#22C55E] rounded-full mb-6 opacity-30" />
              <Text className="text-white text-4xl font-extrabold mb-1">Welcome Back to</Text>
              <Text className="text-[#22C55E] text-4xl font-extrabold">PlantSmart</Text>
            </View>

            {/* Checklist */}
            <View className="space-y-4">
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle-outline" size={22} color="#22C55E" />
                <Text className="text-gray-300 ml-3 text-sm font-medium pr-4">Automated Watering precision irrigation scheduled for every leaf.</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle-outline" size={22} color="#22C55E" />
                <Text className="text-gray-300 ml-3 text-sm font-medium">Health alerts and expert recommendations.</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle-outline" size={22} color="#22C55E" />
                <Text className="text-gray-300 ml-3 text-sm font-medium">Beautiful dashboard across all your devices.</Text>
              </View>
            </View>
          </View>

          {/* Bottom Card Section */}
          <View className="flex-1 bg-white rounded-t-[36px] px-6 pt-8 pb-6">
            <Text className="text-2xl text-[#1E293B] font-semibold mb-6">Welcome Back</Text>

            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-gray-500 text-sm font-medium mb-2">Email</Text>
              <View className="flex-row items-center bg-[#333333] rounded-xl px-4 py-3.5">
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                <TextInput 
                  className="flex-1 text-white ml-3 text-base"
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
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-500 text-sm font-medium">Password</Text>
                <TouchableOpacity>
                  <Text className="text-[#22C55E] text-xs font-bold">Forgot Password</Text>
                </TouchableOpacity>
              </View>
              <View className="flex-row items-center bg-[#333333] rounded-xl px-4 py-3.5">
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                <TextInput 
                  className="flex-1 text-white ml-3 text-base"
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            {/* Remember Me & Create Account */}
            <View className="flex-row justify-between items-center mb-6 mt-1">
              <TouchableOpacity 
                className="flex-row items-center" 
                activeOpacity={0.7}
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View className={`w-4 h-4 rounded-full border items-center justify-center mr-2 ${rememberMe ? 'border-[#22C55E]' : 'border-gray-300'}`}>
                  {rememberMe && <View className="w-2.5 h-2.5 bg-[#22C55E] rounded-full" />}
                </View>
                <Text className="text-gray-500 text-sm font-medium">Remember me</Text>
              </TouchableOpacity>
              
              <TouchableOpacity>
                <Text className="text-[#22C55E] text-xs font-bold">Create Account</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              className="bg-[#22C55E] rounded-xl py-4 items-center mb-6"
              onPress={() => router.push('/dashboard')}
            >
              <Text className="text-white font-bold text-base">Login</Text>
            </TouchableOpacity>

            {/* OR Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-[1px] bg-gray-200" />
              <Text className="text-gray-400 font-semibold px-4 text-xs">OR</Text>
              <View className="flex-1 h-[1px] bg-gray-200" />
            </View>

            {/* Google Button */}
            <TouchableOpacity className="flex-row items-center justify-center bg-white border border-gray-200 rounded-xl py-3.5 mb-6">
              <Ionicons name="logo-google" size={18} color="#000" />
              <Text className="text-[#1E293B] font-semibold text-sm ml-3">Continue with Google</Text>
            </TouchableOpacity>

            {/* Bottom Buttons */}
            <View className="flex-row justify-between mb-6">
              <TouchableOpacity className="flex-1 bg-white border border-[#22C55E] rounded-xl py-3.5 items-center mr-2">
                <Text className="text-[#22C55E] font-bold text-sm">Create Account</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-[#0D9488] rounded-xl py-3.5 items-center ml-2">
                <Text className="text-white font-bold text-sm">Back to Site</Text>
              </TouchableOpacity>
            </View>

            {/* Terms and Privacy */}
            <Text className="text-center text-gray-400 text-[11px] px-8">
              By continuing, you agree to our <Text className="underline">Terms of Service</Text> and <Text className="underline">Privacy Policy</Text>.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
