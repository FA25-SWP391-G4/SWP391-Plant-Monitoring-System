import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import { useSensorPolling } from '../hooks/useSensorPolling';
import * as plantApi from '../api/plantApi';
import SensorCard from '../components/SensorCard';
import { colors, spacing, typography } from '../theme';
import { elevations } from '../theme/shadows';

const SensorDashboard = () => {
  const [plants, setPlants] = useState([]);
  const [selectedPlantId, setSelectedPlantId] = useState(null);
  const [plantsLoading, setPlantsLoading] = useState(true);
  const [pollingInterval, setPollingInterval] = useState(5000);
  const [debugMode, setDebugMode] = useState(false);

  const {
    data: sensorData,
    loading: sensorLoading,
    error: sensorError,
    isStale,
    startPolling,
    stopPolling,
  } = useSensorPolling(selectedPlantId, pollingInterval);

  // Fetch plants on mount
  useEffect(() => {
    fetchPlants();
  }, []);

  // Start polling when plant is selected
  useEffect(() => {
    if (selectedPlantId) {
      console.log('[SensorDashboard] Selected plant:', selectedPlantId);
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [selectedPlantId]);

  // Handle polling interval change
  useEffect(() => {
    if (selectedPlantId) {
      stopPolling();
      setTimeout(() => {
        startPolling();
      }, 100);
    }
  }, [pollingInterval]);

  const fetchPlants = async () => {
    try {
      setPlantsLoading(true);
      const response = await plantApi.getAll();
      if (response && response.data) {
        setPlants(response.data);
        if (response.data.length > 0) {
          setSelectedPlantId(response.data[0].id);
        }
      }
      setPlantsLoading(false);
    } catch (error) {
      console.error('[SensorDashboard] Fetch plants error:', error.message);
      Alert.alert('Error', 'Failed to load plants');
      setPlantsLoading(false);
    }
  };

  // Extract sensor values from data
  const extractSensorValue = (field) => {
    if (!sensorData) return null;
    
    // Handle different API response formats
    if (sensorData[field] !== undefined) {
      return sensorData[field];
    }
    
    // Fallback for nested properties
    if (sensorData.data && sensorData.data[field] !== undefined) {
      return sensorData.data[field];
    }
    
    return null;
  };

  const moistureValue = extractSensorValue('moisture') || extractSensorValue('soilMoisture');
  const temperatureValue = extractSensorValue('temperature') || extractSensorValue('temp');
  const humidityValue = extractSensorValue('humidity') || extractSensorValue('relativeHumidity');
  const lightValue = extractSensorValue('light') || extractSensorValue('lightIntensity');

  const getLastUpdatedTime = () => {
    if (!sensorData || !sensorData.timestamp) {
      return 'Never';
    }
    
    const timestamp = new Date(sensorData.timestamp);
    const now = new Date();
    const diff = Math.floor((now - timestamp) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return timestamp.toLocaleTimeString();
  };

  if (plantsLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading plants...</Text>
      </View>
    );
  }

  if (plants.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No plants found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Sensor Dashboard</Text>
      </View>

      {/* Plant Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Plant</Text>
        <FlatList
          scrollEnabled={false}
          data={plants}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelectedPlantId(item.id)}
              style={[
                styles.plantButton,
                selectedPlantId === item.id && styles.plantButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.plantButtonText,
                  selectedPlantId === item.id && styles.plantButtonTextActive,
                ]}
              >
                {item.name}
              </Text>
            </Pressable>
          )}
        />
      </View>

      {/* Polling Interval Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Polling Interval</Text>
        <View style={styles.intervalButtons}>
          {[1000, 5000, 10000, 30000].map((interval) => (
            <Pressable
              key={interval}
              onPress={() => setPollingInterval(interval)}
              style={[
                styles.intervalButton,
                pollingInterval === interval && styles.intervalButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.intervalButtonText,
                  pollingInterval === interval && styles.intervalButtonTextActive,
                ]}
              >
                {interval / 1000}s
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Sensor Cards */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Readings</Text>
        
        {sensorError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{sensorError}</Text>
          </View>
        )}

        <SensorCard
          label="Soil Moisture"
          value={moistureValue ? moistureValue.toFixed(1) : '—'}
          unit="%"
          loading={sensorLoading}
          error={sensorError}
          isStale={isStale}
          lastUpdated={getLastUpdatedTime()}
        />

        <SensorCard
          label="Temperature"
          value={temperatureValue ? temperatureValue.toFixed(1) : '—'}
          unit="°C"
          loading={sensorLoading}
          error={sensorError}
          isStale={isStale}
          lastUpdated={getLastUpdatedTime()}
        />

        <SensorCard
          label="Humidity"
          value={humidityValue ? humidityValue.toFixed(1) : '—'}
          unit="%"
          loading={sensorLoading}
          error={sensorError}
          isStale={isStale}
          lastUpdated={getLastUpdatedTime()}
        />

        <SensorCard
          label="Light Intensity"
          value={lightValue ? lightValue.toFixed(1) : '—'}
          unit="lux"
          loading={sensorLoading}
          error={sensorError}
          isStale={isStale}
          lastUpdated={getLastUpdatedTime()}
        />
      </View>

      {/* Debug Info */}
      {debugMode && (
        <View style={styles.debugBox}>
          <Text style={styles.debugLabel}>Debug Information</Text>
          <Text style={styles.debugText}>Plant ID: {selectedPlantId}</Text>
          <Text style={styles.debugText}>Polling: {pollingInterval}ms</Text>
          <Text style={styles.debugText}>Stale: {isStale ? 'Yes' : 'No'}</Text>
          <Text style={styles.debugText}>
            Data: {sensorData ? JSON.stringify(sensorData).slice(0, 100) : 'null'}
          </Text>
        </View>
      )}

      <Pressable onPress={() => setDebugMode(!debugMode)} style={styles.debugToggle}>
        <Text style={styles.debugToggleText}>
          {debugMode ? 'Hide Debug' : 'Show Debug'}
        </Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  title: {
    fontSize: typography.sizes.size5xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.lg,
    color: colors.textMuted,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  plantButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  plantButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  plantButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
  },
  plantButtonTextActive: {
    color: colors.white,
  },
  intervalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  intervalButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  intervalButtonActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  intervalButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
  },
  intervalButtonTextActive: {
    color: colors.white,
  },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderRadius: spacing.radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  errorText: {
    fontSize: typography.sizes.md,
    color: colors.error,
  },
  debugBox: {
    backgroundColor: colors.warningBg,
    borderRadius: spacing.radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  debugLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.warning,
    marginBottom: spacing.md,
  },
  debugText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginBottom: spacing.sm,
  },
  debugToggle: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.textPrimary,
    borderRadius: spacing.radius.md,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  debugToggleText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.white,
  },
});

export default SensorDashboard;