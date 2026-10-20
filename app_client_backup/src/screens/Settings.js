import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Switch,
  Alert,
} from 'react-native';
import { useNotificationPermission } from '../hooks/useNotificationPermission';
import { colors, spacing, typography } from '../theme';

const Settings = () => {
  const [pollingInterval, setPollingInterval] = useState(5);
  const [debugMode, setDebugMode] = useState(false);

  const {
    permission,
    status,
    requestPermission,
    supported: notificationsSupported,
  } = useNotificationPermission();

  const handleRequestNotificationPermission = async () => {
    console.log('[Settings] Requesting notification permission');
    const result = await requestPermission();

    if (result.success) {
      Alert.alert('Success', 'Notification permission granted');
    } else if (result.status === 'denied') {
      Alert.alert(
        'Permission Denied',
        'You can enable notifications in app settings'
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to request permission');
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Logout',
        onPress: () => {
          console.log('[Settings] User logged out');
          Alert.alert('Info', 'Logout logic to be implemented');
        },
      },
    ]);
  };

  const getPermissionStatusLabel = () => {
    switch (status) {
      case 'granted':
        return '✓ Granted';
      case 'denied':
        return '✗ Denied';
      case 'not-determined':
        return 'Not Determined';
      case 'undetermined':
        return 'Undetermined';
      case 'not-supported':
        return 'Not Supported';
      default:
        return 'Unknown';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        {!notificationsSupported ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Notifications not supported on this device
            </Text>
          </View>
        ) : (
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View>
                <Text style={styles.settingLabel}>Permission Status</Text>
                <Text style={styles.settingValue}>{getPermissionStatusLabel()}</Text>
              </View>
            </View>

            {status !== 'granted' && (
              <Pressable
                onPress={handleRequestNotificationPermission}
                style={styles.button}
              >
                <Text style={styles.buttonText}>Request Permission</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Polling Configuration</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Default Polling Interval</Text>
            <Text style={styles.settingValue}>{pollingInterval}s</Text>
          </View>

          <View style={styles.intervalButtons}>
            {[1, 5, 10, 30].map((interval) => (
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
                  {interval}s
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Developer</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Debug Mode</Text>
            <Switch
              value={debugMode}
              onValueChange={setDebugMode}
              trackColor={{ false: colors.borderLight, true: colors.success }}
              thumbColor={debugMode ? colors.primary : colors.textMuted}
            />
          </View>

          {debugMode && (
            <View style={styles.debugInfo}>
              <Text style={styles.debugLabel}>Debug Information</Text>
              <Text style={styles.debugText}>
                Polling Interval: {pollingInterval}s
              </Text>
              <Text style={styles.debugText}>
                Notifications: {notificationsSupported ? 'Supported' : 'Not Supported'}
              </Text>
              <Text style={styles.debugText}>
                Permission Status: {status}
              </Text>
              <Text style={styles.debugText}>
                Build: v1.0.0 (Research Grade)
              </Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <View style={styles.settingsCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>App Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Build</Text>
            <Text style={styles.infoValue}>Research Grade</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Platform</Text>
            <Text style={styles.infoValue}>React Native + Expo</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Plant Monitoring System</Text>
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
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing.radius.lg,
    padding: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingLabel: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
  },
  settingValue: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  button: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.success,
    borderRadius: spacing.radius.md,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.sizes.md,
    fontWeight: typography.fontWeights.semibold,
  },
  intervalButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    flexWrap: 'wrap',
  },
  intervalButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.radius.sm,
    backgroundColor: colors.borderLight,
  },
  intervalButtonActive: {
    backgroundColor: colors.primary,
  },
  intervalButtonText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.fontWeights.medium,
  },
  intervalButtonTextActive: {
    color: colors.white,
  },
  debugInfo: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  debugLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  debugText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontFamily: 'monospace',
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  infoLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.fontWeights.medium,
    color: colors.textPrimary,
  },
  infoValue: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
  infoBox: {
    backgroundColor: colors.warningBg,
    borderRadius: spacing.radius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  infoText: {
    fontSize: typography.sizes.md,
    color: colors.warning,
  },
  logoutButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.error,
    borderRadius: spacing.radius.lg,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: colors.white,
    fontSize: typography.sizes.lg,
    fontWeight: typography.fontWeights.semibold,
  },
  footer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
});

export default Settings;
