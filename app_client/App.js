import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import SensorDashboard from './src/screens/SensorDashboard';
import { colors } from './src/theme';

/**
 * Main App Component
 * Entry point for the React Native + Expo mobile application
 * Renders SensorDashboard as the main screen
 */
export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <SensorDashboard />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
  },
});
