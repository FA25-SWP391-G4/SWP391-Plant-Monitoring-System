import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

/**
 * SensorCard - Presentational component for displaying a single sensor reading
 *
 * Props:
 * - label: Sensor name (e.g., 'Moisture', 'Temperature')
 * - value: Current sensor reading (number)
 * - unit: Unit of measurement (e.g., '%', '°C')
 * - trend: Direction indicator ('up', 'down', null)
 * - lastUpdated: Timestamp or relative time string
 * - loading: Boolean indicating loading state
 * - error: Error message (string or null)
 * - isStale: Boolean indicating data is older than threshold (>10s)
 */
const SensorCard = ({
  label,
  value,
  unit,
  trend = null,
  lastUpdated = null,
  loading = false,
  error = null,
  isStale = false,
}) => {
  if (loading) {
    return (
      <View style={[styles.card, styles.loadingCard]}>
        <View style={styles.loadingContent}>
          <Text style={styles.label}>{label}</Text>
          <ActivityIndicator size="small" color="#3498db" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.card, styles.errorCard]}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  const cardBackgroundStyle = isStale
    ? { backgroundColor: '#fff9e6' }
    : { backgroundColor: '#fff' };

  return (
    <View style={[styles.card, cardBackgroundStyle]}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        {isStale && (
          <View style={styles.staleBadge}>
            <Text style={styles.staleBadgeText}>⚠ Stale</Text>
          </View>
        )}
      </View>

      <View style={styles.valueContainer}>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{value}</Text>
          <Text style={styles.unit}>{unit}</Text>
          {trend && (
            <Text style={[styles.trendArrow, trend === 'up' ? styles.trendUp : styles.trendDown]}>
              {trend === 'up' ? '↑' : '↓'}
            </Text>
          )}
        </View>
      </View>

      {lastUpdated && (
        <View style={styles.footer}>
          <Text style={styles.lastUpdated}>Updated: {lastUpdated}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ecf0f1',
  },
  loadingCard: {
    backgroundColor: '#f8f9fa',
  },
  errorCard: {
    backgroundColor: '#fadbd8',
    borderColor: '#e74c3c',
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  staleBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  staleBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  valueContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#ecf0f1',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  value: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  unit: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7f8c8d',
  },
  trendArrow: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  trendUp: {
    color: '#e74c3c',
  },
  trendDown: {
    color: '#2ecc71',
  },
  footer: {
    marginTop: 8,
  },
  lastUpdated: {
    fontSize: 11,
    color: '#95a5a6',
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 13,
    color: '#c0392b',
    marginTop: 4,
  },
});

export default SensorCard;