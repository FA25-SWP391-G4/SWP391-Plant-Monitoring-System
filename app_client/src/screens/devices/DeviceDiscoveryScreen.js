import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
  FlatList,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Network from 'expo-network';
import { useLanguage } from '../../context/LanguageContext';
import theme from '../../themes/theme';

// Import services
import { 
  scanForDevices, 
  connectToDevice,
  getConnectedDevices
} from '../../services/deviceService';

// Import feature flags
import { FEATURES } from '../../utils/version';

const DeviceDiscoveryScreen = ({ navigation }) => {
  const { t } = useLanguage();
  
  // State variables
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [locationPermission, setLocationPermission] = useState(null);
  const [wifiEnabled, setWifiEnabled] = useState(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [currentWifi, setCurrentWifi] = useState(null);
  
  // Request permissions and check device status on mount
  useEffect(() => {
    const setupDeviceDiscovery = async () => {
      try {
        // Check location permission (needed for WiFi scanning)
        const { status } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(status === 'granted');
        
        // Get current WiFi connection info
        const networkState = await Network.getNetworkStateAsync();
        setWifiEnabled(networkState.type === Network.NetworkStateType.WIFI);
        
        if (networkState.type === Network.NetworkStateType.WIFI) {
          setCurrentWifi({
            ssid: networkState.isConnected ? 'Connected WiFi' : 'None',
            // For privacy/security reasons, actual SSID may not be accessible
          });
        }
        
        // Check bluetooth status
        setBluetoothEnabled(true); // Placeholder, would use a real method to detect this
        
        // Load connected devices
        const connected = await getConnectedDevices();
        setConnectedDevices(connected);
      } catch (error) {
        console.error('Error setting up device discovery:', error);
        Alert.alert(
          t('errors.setupError'),
          t('errors.permissionsMessage'),
          [{ text: t('common.ok') }]
        );
      }
    };
    
    setupDeviceDiscovery();
  }, []);
  
  // Start scanning for nearby devices
  const startScan = async () => {
    if (!FEATURES.DEVICE_DISCOVERY) {
      Alert.alert(
        t('premium.featureUnavailable'),
        t('premium.upgradeMessage'),
        [
          { text: t('common.notNow') },
          { text: t('premium.upgrade'), onPress: () => navigation.navigate('Upgrade') }
        ]
      );
      return;
    }
    
    if (!locationPermission) {
      Alert.alert(
        t('permissions.locationNeeded'),
        t('permissions.deviceDiscovery'),
        [{ text: t('common.ok') }]
      );
      return;
    }
    
    setScanning(true);
    setDevices([]);
    
    try {
      const discoveredDevices = await scanForDevices({
        wifi: wifiEnabled,
        bluetooth: bluetoothEnabled,
      });
      
      setDevices(discoveredDevices);
    } catch (error) {
      console.error('Error scanning for devices:', error);
      Alert.alert(
        t('errors.scanningError'),
        t('errors.tryAgain'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setScanning(false);
    }
  };
  
  // Connect to a device
  const handleConnectDevice = async (device) => {
    try {
      setScanning(true);
      await connectToDevice(device);
      
      // Update connected devices list
      const connected = await getConnectedDevices();
      setConnectedDevices(connected);
      
      Alert.alert(
        t('deviceDiscovery.connected'),
        t('deviceDiscovery.deviceConnected', { name: device.name }),
        [{ text: t('common.ok') }]
      );
      
      // Navigate to device setup
      navigation.navigate('DeviceSetup', { device });
    } catch (error) {
      console.error('Error connecting to device:', error);
      Alert.alert(
        t('errors.connectionError'),
        t('errors.tryAgain'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setScanning(false);
    }
  };

  // Render a device item in the list
  const renderDeviceItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.deviceItem}
      onPress={() => handleConnectDevice(item)}
    >
      <View style={styles.deviceIconContainer}>
        <Ionicons 
          name={item.type === 'wifi' ? 'wifi' : 'bluetooth'}
          size={24} 
          color={item.type === 'wifi' ? theme.COLORS.info.main : theme.COLORS.primary.main} 
        />
      </View>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceType}>
          {item.type === 'wifi' ? t('deviceDiscovery.wifiDevice') : t('deviceDiscovery.bluetoothDevice')}
          {item.rssi && ` • ${t('deviceDiscovery.signalStrength')}: ${item.rssi} dBm`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={theme.COLORS.neutral.grey400} />
    </TouchableOpacity>
  );
  
  // Render a connected device item
  const renderConnectedDeviceItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.deviceItem}
      onPress={() => navigation.navigate('DeviceDetails', { deviceId: item.id })}
    >
      <View style={[styles.deviceIconContainer, styles.connectedIconContainer]}>
        <Ionicons 
          name={item.type === 'wifi' ? 'wifi' : 'bluetooth'}
          size={24} 
          color={theme.COLORS.white} 
        />
      </View>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceType}>
          {t('deviceDiscovery.connected')}
          {item.batteryLevel && ` • ${t('deviceDiscovery.battery')}: ${item.batteryLevel}%`}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={theme.COLORS.neutral.grey400} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('deviceDiscovery.title')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Connection Status */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>{t('deviceDiscovery.connectionStatus')}</Text>
          
          <View style={styles.statusItem}>
            <View style={styles.statusIconContainer}>
              <Ionicons 
                name="wifi" 
                size={24} 
                color={wifiEnabled ? theme.COLORS.success.main : theme.COLORS.neutral.grey400} 
              />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {wifiEnabled ? t('deviceDiscovery.wifiEnabled') : t('deviceDiscovery.wifiDisabled')}
              </Text>
              <Text style={styles.statusSubtitle}>
                {wifiEnabled && currentWifi?.ssid
                  ? t('deviceDiscovery.connectedTo', { network: currentWifi.ssid })
                  : t('deviceDiscovery.notConnected')
                }
              </Text>
            </View>
            <Switch
              trackColor={{ 
                false: theme.COLORS.neutral.grey300, 
                true: theme.COLORS.primary.light 
              }}
              thumbColor={wifiEnabled ? theme.COLORS.primary.main : theme.COLORS.neutral.grey400}
              onValueChange={() => {
                Alert.alert(
                  t('deviceDiscovery.wifiSettings'),
                  t('deviceDiscovery.openSettings'),
                  [{ text: t('common.ok') }]
                );
              }}
              value={wifiEnabled}
            />
          </View>
          
          <View style={styles.statusItem}>
            <View style={styles.statusIconContainer}>
              <Ionicons 
                name="bluetooth" 
                size={24} 
                color={bluetoothEnabled ? theme.COLORS.primary.main : theme.COLORS.neutral.grey400} 
              />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {bluetoothEnabled ? t('deviceDiscovery.bluetoothEnabled') : t('deviceDiscovery.bluetoothDisabled')}
              </Text>
              <Text style={styles.statusSubtitle}>
                {bluetoothEnabled 
                  ? t('deviceDiscovery.readyToConnect')
                  : t('deviceDiscovery.enableBluetooth')
                }
              </Text>
            </View>
            <Switch
              trackColor={{ 
                false: theme.COLORS.neutral.grey300, 
                true: theme.COLORS.primary.light 
              }}
              thumbColor={bluetoothEnabled ? theme.COLORS.primary.main : theme.COLORS.neutral.grey400}
              onValueChange={() => {
                Alert.alert(
                  t('deviceDiscovery.bluetoothSettings'),
                  t('deviceDiscovery.openSettings'),
                  [{ text: t('common.ok') }]
                );
              }}
              value={bluetoothEnabled}
            />
          </View>
          
          <View style={styles.statusItem}>
            <View style={styles.statusIconContainer}>
              <Ionicons 
                name="location" 
                size={24} 
                color={locationPermission ? theme.COLORS.success.main : theme.COLORS.error.main} 
              />
            </View>
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>
                {locationPermission 
                  ? t('permissions.locationGranted') 
                  : t('permissions.locationDenied')
                }
              </Text>
              <Text style={styles.statusSubtitle}>
                {locationPermission 
                  ? t('deviceDiscovery.readyToScan')
                  : t('permissions.locationNeededForDevices')
                }
              </Text>
            </View>
            {!locationPermission && (
              <TouchableOpacity
                style={styles.requestPermissionButton}
                onPress={async () => {
                  const { status } = await Location.requestForegroundPermissionsAsync();
                  setLocationPermission(status === 'granted');
                }}
              >
                <Text style={styles.requestPermissionText}>{t('permissions.request')}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Connected Devices */}
        {connectedDevices.length > 0 && (
          <View style={styles.devicesSection}>
            <Text style={styles.sectionTitle}>{t('deviceDiscovery.connectedDevices')}</Text>
            <FlatList
              data={connectedDevices}
              renderItem={renderConnectedDeviceItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}
        
        {/* Scan Button */}
        <TouchableOpacity
          style={[
            styles.scanButton,
            (scanning || !locationPermission) && styles.scanButtonDisabled
          ]}
          onPress={startScan}
          disabled={scanning || !locationPermission}
        >
          {scanning ? (
            <ActivityIndicator color={theme.COLORS.white} size="small" />
          ) : (
            <Ionicons name="search" size={24} color={theme.COLORS.white} />
          )}
          <Text style={styles.scanButtonText}>
            {scanning 
              ? t('deviceDiscovery.scanning') 
              : t('deviceDiscovery.scanForDevices')
            }
          </Text>
        </TouchableOpacity>
        
        {/* Discovered Devices */}
        {devices.length > 0 && (
          <View style={styles.devicesSection}>
            <Text style={styles.sectionTitle}>{t('deviceDiscovery.discoveredDevices')}</Text>
            <FlatList
              data={devices}
              renderItem={renderDeviceItem}
              keyExtractor={(item, index) => `${item.id}-${index}`}
              scrollEnabled={false}
            />
          </View>
        )}
        
        {/* No Devices Found */}
        {!scanning && devices.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={64} color={theme.COLORS.neutral.grey300} />
            <Text style={styles.emptyStateTitle}>{t('deviceDiscovery.noDevicesFound')}</Text>
            <Text style={styles.emptyStateDescription}>{t('deviceDiscovery.scanToDiscover')}</Text>
          </View>
        )}
        
        {/* Add Device Manually */}
        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => navigation.navigate('AddDeviceManually')}
        >
          <Text style={styles.manualButtonText}>{t('deviceDiscovery.addManually')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
    color: theme.COLORS.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  statusSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: theme.COLORS.text.primary,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.neutral.grey200,
  },
  statusIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.COLORS.neutral.grey100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
    marginLeft: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.COLORS.text.primary,
  },
  statusSubtitle: {
    fontSize: 14,
    color: theme.COLORS.text.secondary,
    marginTop: 2,
  },
  requestPermissionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: theme.COLORS.primary.main,
    borderRadius: 8,
  },
  requestPermissionText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.COLORS.white,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.COLORS.primary.main,
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 24,
  },
  scanButtonDisabled: {
    backgroundColor: theme.COLORS.neutral.grey300,
  },
  scanButtonText: {
    color: theme.COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  devicesSection: {
    marginBottom: 24,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.neutral.grey200,
  },
  deviceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.COLORS.neutral.grey100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectedIconContainer: {
    backgroundColor: theme.COLORS.success.main,
  },
  deviceInfo: {
    flex: 1,
    marginLeft: 16,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.COLORS.text.primary,
  },
  deviceType: {
    fontSize: 14,
    color: theme.COLORS.text.secondary,
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.COLORS.text.primary,
    marginTop: 16,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: theme.COLORS.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  manualButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  manualButtonText: {
    color: theme.COLORS.primary.main,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DeviceDiscoveryScreen;