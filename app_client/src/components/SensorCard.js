import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { elevations } from '../theme/shadows';

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
          <ActivityIndicator size="small" color={colors.primary} />
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
    : { backgroundColor: colors.surface };

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
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...elevations.sm,
  },
  loadingCard: {
    backgroundColor: colors.backgroundLight,
  },
  errorCard: {
    backgroundColor: colors.errorBg,
    borderColor: colors.error,
  },
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.sizes.md,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  staleBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.radius.sm,
  },
  staleBadgeText: {
    fontSize: typography.sizes.xs,
    color: colors.white,
    fontWeight: typography.fontWeights.bold,
  },
  valueContainer: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.borderLight,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  value: {
    fontSize: 28,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  unit: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.fontWeights.medium,
    color: colors.textMuted,
  },
  trendArrow: {
    fontSize: 16,
    fontWeight: typography.fontWeights.bold,
    marginLeft: spacing.md,
  },
  trendUp: {
    color: colors.error,
  },
  trendDown: {
    color: colors.success,
  },
  footer: {
    marginTop: spacing.md,
  },
  lastUpdated: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: typography.sizes.md,
    color: colors.error,
    marginTop: spacing.sm,
  },
});

export default SensorCard;
