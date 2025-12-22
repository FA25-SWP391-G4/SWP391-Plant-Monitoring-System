import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/SensorDashboard';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}


// import React from 'react';
// import { createStackNavigator } from '@react-navigation/stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { Ionicons } from '@expo/vector-icons';

// // Import screens
// import LoginScreen from '../screens/auth/LoginScreen';
// import RegisterScreen from '../screens/auth/RegisterScreen';
// import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
// import DashboardScreen from '../screens/dashboard/DashboardScreen';
// import PlantsScreen from '../screens/plants/PlantsScreen';
// import DevicesScreen from '../screens/devices/DevicesScreen';
// import DeviceDiscoveryScreen from '../screens/devices/DeviceDiscoveryScreen';
// import DeviceSetupScreen from '../screens/devices/DeviceSetupScreen';
// import SettingsScreen from '../screens/settings/SettingsScreen';
// import ImageAnalysisScreen from '../screens/reports/ImageAnalysisScreen';
// import SubscriptionScreen from '../screens/subscription/SubscriptionScreen';
// import TermsAndConditionsScreen from '../screens/legal/TermsAndConditionsScreen';
// import PrivacyPolicyScreen from '../screens/legal/PrivacyPolicyScreen';

// // Import theme and language hook
// import { useLanguage } from '../context/LanguageContext';
// import theme from '../themes/theme';

// // Create navigators
// const Stack = createStackNavigator();
// const Tab = createBottomTabNavigator();

// // Main tab navigator
// const TabNavigator = () => {
//   const { t } = useLanguage();
  
//   return (
//     <Tab.Navigator
//       screenOptions={({ route }) => ({
//         tabBarIcon: ({ focused, color, size }) => {
//           let iconName;
          
//           if (route.name === 'Dashboard') {
//             iconName = focused ? 'home' : 'home-outline';
//           } else if (route.name === 'Plants') {
//             iconName = focused ? 'leaf' : 'leaf-outline';
//           } else if (route.name === 'Devices') {
//             iconName = focused ? 'hardware-chip' : 'hardware-chip-outline';
//           } else if (route.name === 'Reports') {
//             iconName = focused ? 'analytics' : 'analytics-outline';
//           } else if (route.name === 'Settings') {
//             iconName = focused ? 'settings' : 'settings-outline';
//           }
          
//           return <Ionicons name={iconName} size={size} color={color} />;
//         },
//         tabBarActiveTintColor: theme.COLORS.primary.main,
//         tabBarInactiveTintColor: theme.COLORS.neutral.grey500,
//         headerShown: false,
//       })}
//     >
//       <Tab.Screen 
//         name="Dashboard" 
//         component={DashboardScreen} 
//         options={{ title: t('navigation.dashboard') }}
//       />
//       <Tab.Screen 
//         name="Plants" 
//         component={PlantsScreen} 
//         options={{ title: t('navigation.plants') }}
//       />
//       <Tab.Screen 
//         name="Devices" 
//         component={DevicesScreen} 
//         options={{ title: t('navigation.devices') }}
//       />
//       <Tab.Screen 
//         name="Reports" 
//         component={ImageAnalysisScreen} 
//         options={{ title: t('navigation.reports') }}
//       />
//       <Tab.Screen 
//         name="Settings" 
//         component={SettingsScreen} 
//         options={{ title: t('navigation.settings') }}
//       />
//     </Tab.Navigator>
//   );
// };

// // Root stack navigator
// const RootNavigator = () => {
//   const { t } = useLanguage();
  
//   return (
//     <Stack.Navigator
//       screenOptions={{
//         headerShown: false,
//       }}
//     >
//       {/* Auth screens */}
//       <Stack.Screen name="Login" component={LoginScreen} />
//       <Stack.Screen name="Register" component={RegisterScreen} />
//       <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      
//       {/* Main app */}
//       <Stack.Screen name="Main" component={TabNavigator} />
      
//       {/* Device screens */}
//       <Stack.Screen 
//         name="DeviceDiscovery" 
//         component={DeviceDiscoveryScreen}
//         options={{
//           headerShown: true,
//           title: t('deviceDiscovery.title'),
//           headerTintColor: theme.COLORS.primary.main
//         }}
//       />
//       <Stack.Screen 
//         name="DeviceSetup" 
//         component={DeviceSetupScreen}
//         options={{
//           headerShown: false
//         }}
//       />
      
//       {/* Subscription screens */}
//       <Stack.Screen 
//         name="Subscription" 
//         component={SubscriptionScreen}
//         options={{
//           headerShown: false
//         }}
//       />
      
//       {/* Legal screens */}
//       <Stack.Screen 
//         name="TermsAndConditions" 
//         component={TermsAndConditionsScreen}
//         options={{
//           headerShown: true,
//           title: t('legal.terms'),
//           headerTintColor: theme.COLORS.text.primary
//         }}
//       />
//       <Stack.Screen 
//         name="PrivacyPolicy" 
//         component={PrivacyPolicyScreen}
//         options={{
//           headerShown: true,
//           title: t('legal.privacy'),
//           headerTintColor: theme.COLORS.text.primary
//         }}
//       />
//     </Stack.Navigator>
//   );
// };

// export default RootNavigator;