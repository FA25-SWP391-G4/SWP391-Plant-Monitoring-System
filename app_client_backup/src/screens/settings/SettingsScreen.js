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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      {/* Notifications Section */}
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

      {/* Polling Configuration */}
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

      {/* Debug Mode */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Developer</Text>
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Debug Mode</Text>
            <Switch
              value={debugMode}
              onValueChange={setDebugMode}
              trackColor={{ false: '#ccc', true: '#81c784' }}
              thumbColor={debugMode ? '#2ecc71' : '#999'}
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

      {/* App Info */}
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

      {/* Logout */}
      <View style={styles.section}>
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Plant Monitoring System</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingTop: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  settingsCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
  },
  settingValue: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  button: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#2ecc71',
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  intervalButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    flexWrap: 'wrap',
  },
  intervalButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#ecf0f1',
  },
  intervalButtonActive: {
    backgroundColor: '#3498db',
  },
  intervalButtonText: {
    color: '#2c3e50',
    fontSize: 12,
    fontWeight: '500',
  },
  intervalButtonTextActive: {
    color: '#fff',
  },
  debugInfo: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
  },
  debugLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 11,
    color: '#7f8c8d',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2c3e50',
  },
  infoValue: {
    fontSize: 13,
    color: '#7f8c8d',
  },
  infoBox: {
    backgroundColor: '#fef5e7',
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  infoText: {
    fontSize: 14,
    color: '#e67e22',
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#95a5a6',
  },
});

export default Settings;