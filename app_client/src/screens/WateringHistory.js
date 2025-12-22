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
  TextInput,
} from 'react-native';
import * as plantApi from '../api/plantApi';
import * as exportService from '../services/exportService';
import { colors, spacing, typography } from '../theme';

const WateringHistory = () => {
  const [plants, setPlants] = useState([]);
  const [selectedPlantId, setSelectedPlantId] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch plants on mount
  useEffect(() => {
    fetchPlants();
  }, []);

  // Fetch history when plant or dates change
  useEffect(() => {
    if (selectedPlantId) {
      fetchHistory();
    }
  }, [selectedPlantId, startDate, endDate]);

  const fetchPlants = async () => {
    try {
      const response = await plantApi.getAll();
      if (response && response.data) {
        setPlants(response.data);
        if (response.data.length > 0) {
          setSelectedPlantId(response.data[0].id);
        }
      }
    } catch (error) {
      console.error('[WateringHistory] Fetch plants error:', error.message);
      Alert.alert('Error', 'Failed to load plants');
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await plantApi.getWateringHistory(selectedPlantId);
      
      if (response && response.data) {
        let filteredData = response.data;

        // Filter by date range if provided
        if (startDate || endDate) {
          filteredData = response.data.filter((item) => {
            const itemDate = new Date(item.timestamp);
            const start = startDate ? new Date(startDate) : null;
            const end = endDate ? new Date(endDate) : null;

            if (start && itemDate < start) return false;
            if (end && itemDate > end) return false;
            return true;
          });
        }

        setHistory(filteredData);
      }
      setLoading(false);
    } catch (error) {
      console.error('[WateringHistory] Fetch history error:', error.message);
      Alert.alert('Error', 'Failed to load watering history');
      setLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const result = await exportService.exportWateringHistory(
        selectedPlantId,
        startDate || undefined,
        endDate || undefined
      );

      if (result.success) {
        Alert.alert('Success', `CSV exported: ${result.fileName}`, [
          {
            text: 'Share',
            onPress: async () => {
              const shareResult = await exportService.shareExportedFile(
                result.filePath,
                result.fileName
              );
              if (!shareResult.success) {
                Alert.alert('Error', shareResult.error);
              }
            },
          },
          { text: 'OK', onPress: () => {} },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to export CSV');
      }
      setExporting(false);
    } catch (error) {
      console.error('[WateringHistory] Export error:', error.message);
      Alert.alert('Error', 'Failed to export CSV');
      setExporting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US');
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US');
  };

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
        <Text style={styles.title}>Watering History</Text>
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

      {/* Date Filter */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Filter by Date</Text>
        <View style={styles.dateInputRow}>
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateInputLabel}>Start Date</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>
          <View style={styles.dateInputContainer}>
            <Text style={styles.dateInputLabel}>End Date</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY-MM-DD"
              value={endDate}
              onChangeText={setEndDate}
            />
          </View>
        </View>
      </View>

      {/* Export Button */}
      <View style={styles.section}>
        <Pressable
          onPress={handleExportCSV}
          disabled={exporting}
          style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.exportButtonText}>📥 Export to CSV</Text>
          )}
        </Pressable>
      </View>

      {/* History List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          History ({history.length} events)
        </Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyBoxText}>No watering events found</Text>
          </View>
        ) : (
          <FlatList
            scrollEnabled={false}
            data={history}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>
                    {formatDate(item.timestamp)}
                  </Text>
                  <Text style={styles.historyTime}>
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
                <View style={styles.historyDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Duration:</Text>
                    <Text style={styles.detailValue}>
                      {item.duration ? `${item.duration}s` : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Volume:</Text>
                    <Text style={styles.detailValue}>
                      {item.volume ? `${item.volume}ml` : 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text
                      style={[
                        styles.detailValue,
                        item.status === 'success' && { color: '#2ecc71' },
                        item.status === 'failed' && { color: '#e74c3c' },
                      ]}
                    >
                      {item.status ? item.status.toUpperCase() : 'UNKNOWN'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>
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
  dateInputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateInputLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  dateInput: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  exportButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: spacing.radius.lg,
    alignItems: 'center',
  },
  exportButtonDisabled: {
    backgroundColor: colors.textMuted,
  },
  exportButtonText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.fontWeights.semibold,
  },
  loadingBox: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  emptyBox: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyBoxText: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  emptyText: {
    fontSize: typography.sizes.lg,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    paddingBottom: spacing.md,
  },
  historyDate: {
    fontSize: typography.sizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  historyTime: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  historyDetails: {
    marginTop: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  detailLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
});

export default WateringHistory;