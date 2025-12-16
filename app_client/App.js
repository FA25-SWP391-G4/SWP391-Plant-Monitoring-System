import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
}


// import React, { useEffect, useState } from 'react';
// import { StatusBar } from 'expo-status-bar';
// import { NavigationContainer } from '@react-navigation/native';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import { 
//   View, 
//   Text, 
//   ActivityIndicator, 
//   StyleSheet, 
//   LogBox 
// } from 'react-native';

// // Ignore specific warnings that are not critical
// LogBox.ignoreLogs([
//   'Reanimated 2',
//   'AsyncStorage has been extracted',
//   'expo-app-loading is deprecated'
// ]);

// // Import context providers
// import { AuthProvider } from './src/context/AuthContext';
// import { ThemeProvider } from './src/context/ThemeContext';
// import { LanguageProvider } from './src/context/LanguageContext';
// import { PaymentProvider } from './src/context/PaymentContext';

// // Import root navigator
// import RootNavigator from './src/navigation/RootNavigator';

// // Import version configuration
// import { APP_VERSION, FEATURES } from './src/utils/version';

// export default function App() {
//   const [isLoading, setIsLoading] = useState(true);
  
//   // Simulating initialization tasks
//   useEffect(() => {
//     const initializeApp = async () => {
//       try {
//         // Any initialization code here (like loading fonts, etc)
//         await new Promise(resolve => setTimeout(resolve, 1000));
//       } catch (error) {
//         console.error('Initialization error:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     };
    
//     initializeApp();
//   }, []);
  
//   if (isLoading) {
//     return (
//       <View style={styles.container}>
//         <ActivityIndicator size="large" color="#4CAF50" />
//         <Text style={styles.loadingText}>PlantSmart v{APP_VERSION}</Text>
//       </View>
//     );
//   }

//   return (
//     <SafeAreaProvider>
//       <AuthProvider>
//         <ThemeProvider>
//           <LanguageProvider>
//             <PaymentProvider>
//               <NavigationContainer>
//                 <StatusBar style="auto" />
//                 <RootNavigator />
//               </NavigationContainer>
//             </PaymentProvider>
//           </LanguageProvider>
//         </ThemeProvider>
//       </AuthProvider>
//     </SafeAreaProvider>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   loadingText: {
//     marginTop: 20,
//     fontSize: 16,
//     color: '#4CAF50',
//   },
// });