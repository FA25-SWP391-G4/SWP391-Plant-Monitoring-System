import * as Network from 'expo-network';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

/**
 * Service for interacting with plant monitoring devices (sensors, pumps, etc.)
 */

// Mock devices for development (would connect to real devices in production)
const MOCK_DEVICES = [
  {
    id: 'device-001',
    name: 'Plant Sensor 1',
    type: 'wifi',
    model: 'PlantSmart-W1',
    rssi: -65,
    status: 'available',
    batteryLevel: null,
  },
  {
    id: 'device-002',
    name: 'Moisture Sensor',
    type: 'bluetooth',
    model: 'PlantSmart-B1',
    rssi: -42,
    status: 'available',
    batteryLevel: 87,
  },
  {
    id: 'device-003',
    name: 'Smart Watering System',
    type: 'wifi',
    model: 'PlantSmart-W2',
    rssi: -78,
    status: 'available',
    batteryLevel: null,
  },
  {
    id: 'device-004',
    name: 'Light Sensor',
    type: 'bluetooth',
    model: 'PlantSmart-B2',
    rssi: -56,
    status: 'available',
    batteryLevel: 62,
  },
];

// Mock connected devices (persistent storage would be used in production)
let MOCK_CONNECTED_DEVICES = [
  {
    id: 'device-005',
    name: 'Living Room Plant Monitor',
    type: 'wifi',
    model: 'PlantSmart-W1',
    status: 'connected',
    batteryLevel: null,
    lastSeen: new Date().toISOString(),
    data: {
      moisture: 65,
      light: 78,
      temperature: 22.5,
      humidity: 55,
    },
  },
  {
    id: 'device-006',
    name: 'Bedroom Herb Sensor',
    type: 'bluetooth',
    model: 'PlantSmart-B1',
    status: 'connected',
    batteryLevel: 42,
    lastSeen: new Date().toISOString(),
    data: {
      moisture: 38,
      light: 25,
      temperature: 21.0,
      humidity: 48,
    },
  },
];

/**
 * Scan for available devices nearby
 */
export const scanForDevices = async ({ wifi = true, bluetooth = true }) => {
  try {
    // In a real app, we would:
    // 1. For WiFi devices, scan the local network using mdns/ssdp/upnp
    // 2. For Bluetooth devices, use react-native-ble-plx or similar
    
    // For now, simulate a network scan with a delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Filter devices based on options
    const devices = MOCK_DEVICES.filter(device => {
      if (device.type === 'wifi' && wifi) return true;
      if (device.type === 'bluetooth' && bluetooth) return true;
      return false;
    });
    
    // Add some randomness to RSSI values to simulate real-world conditions
    return devices.map(device => ({
      ...device,
      rssi: device.rssi + Math.floor(Math.random() * 10) - 5,
    }));
  } catch (error) {
    console.error('Error scanning for devices:', error);
    throw error;
  }
};

/**
 * Connect to a selected device
 */
export const connectToDevice = async (device) => {
  try {
    // In a real app, we would:
    // 1. Establish connection via WiFi or Bluetooth
    // 2. Exchange credentials/pairing
    // 3. Store connection info for future use
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Update the connected device list with the newly connected device
    const connectedDevice = {
      ...device,
      status: 'connected',
      lastSeen: new Date().toISOString(),
      data: {
        moisture: Math.floor(Math.random() * 60) + 20,
        light: Math.floor(Math.random() * 70) + 20,
        temperature: parseFloat((Math.random() * 10 + 18).toFixed(1)),
        humidity: Math.floor(Math.random() * 40) + 40,
      },
    };
    
    MOCK_CONNECTED_DEVICES.push(connectedDevice);
    
    return connectedDevice;
  } catch (error) {
    console.error('Error connecting to device:', error);
    throw error;
  }
};

/**
 * Get list of currently connected devices
 */
export const getConnectedDevices = async () => {
  try {
    // In a real app, this would retrieve from persistent storage
    // and check if devices are still reachable
    
    // Update lastSeen and randomize some sensor data to simulate real device
    return MOCK_CONNECTED_DEVICES.map(device => ({
      ...device,
      lastSeen: new Date().toISOString(),
      data: {
        ...device.data,
        moisture: Math.max(0, Math.min(100, device.data.moisture + Math.floor(Math.random() * 7) - 3)),
        light: Math.max(0, Math.min(100, device.data.light + Math.floor(Math.random() * 5) - 2)),
        temperature: parseFloat((device.data.temperature + (Math.random() * 0.6 - 0.3)).toFixed(1)),
        humidity: Math.max(0, Math.min(100, device.data.humidity + Math.floor(Math.random() * 5) - 2)),
      },
    }));
  } catch (error) {
    console.error('Error getting connected devices:', error);
    throw error;
  }
};

/**
 * Get details about a specific connected device
 */
export const getDeviceDetails = async (deviceId) => {
  try {
    // Find the device in our list
    const device = MOCK_CONNECTED_DEVICES.find(d => d.id === deviceId);
    
    if (!device) {
      throw new Error('Device not found');
    }
    
    // In a real app, we would fetch the latest data from the device
    return {
      ...device,
      lastSeen: new Date().toISOString(),
      data: {
        ...device.data,
        moisture: Math.max(0, Math.min(100, device.data.moisture + Math.floor(Math.random() * 7) - 3)),
        light: Math.max(0, Math.min(100, device.data.light + Math.floor(Math.random() * 5) - 2)),
        temperature: parseFloat((device.data.temperature + (Math.random() * 0.6 - 0.3)).toFixed(1)),
        humidity: Math.max(0, Math.min(100, device.data.humidity + Math.floor(Math.random() * 5) - 2)),
      },
      history: generateMockHistory(device.id),
    };
  } catch (error) {
    console.error('Error getting device details:', error);
    throw error;
  }
};

/**
 * Disconnect from a device
 */
export const disconnectDevice = async (deviceId) => {
  try {
    // In a real app, we would send disconnect command and clean up resources
    
    // Remove from our connected devices list
    MOCK_CONNECTED_DEVICES = MOCK_CONNECTED_DEVICES.filter(
      device => device.id !== deviceId
    );
    
    return true;
  } catch (error) {
    console.error('Error disconnecting device:', error);
    throw error;
  }
};

/**
 * Configure a device with new settings
 */
export const configureDevice = async (deviceId, settings) => {
  try {
    // In a real app, we would send settings to the physical device
    
    // Update our mocked device settings
    MOCK_CONNECTED_DEVICES = MOCK_CONNECTED_DEVICES.map(device => {
      if (device.id === deviceId) {
        return {
          ...device,
          settings: {
            ...device.settings,
            ...settings,
          },
        };
      }
      return device;
    });
    
    return true;
  } catch (error) {
    console.error('Error configuring device:', error);
    throw error;
  }
};

/**
 * Get the WiFi networks available for device setup
 */
export const getAvailableWifiNetworks = async () => {
  try {
    // In a real app, we would scan for networks
    // We can't actually do this in React Native without native modules
    
    // Return mock networks
    return [
      { ssid: 'Home-WiFi', strength: -45, secure: true },
      { ssid: 'Neighbor-Net', strength: -72, secure: true },
      { ssid: 'Xfinity-Hotspot', strength: -68, secure: true },
      { ssid: 'Guest-Network', strength: -58, secure: false },
      { ssid: 'IoT-Devices', strength: -52, secure: true },
    ];
  } catch (error) {
    console.error('Error getting WiFi networks:', error);
    throw error;
  }
};

/**
 * Helper function to generate mock historical data for a device
 */
const generateMockHistory = (deviceId) => {
  const now = new Date();
  const history = [];
  
  // Generate data for the past 24 hours at hourly intervals
  for (let i = 24; i >= 0; i--) {
    const timestamp = new Date(now);
    timestamp.setHours(now.getHours() - i);
    
    history.push({
      timestamp: timestamp.toISOString(),
      moisture: Math.floor(Math.random() * 60) + 20,
      light: i < 12 ? Math.floor(Math.random() * 70) + 20 : Math.floor(Math.random() * 20),
      temperature: parseFloat((Math.random() * 5 + 20).toFixed(1)),
      humidity: Math.floor(Math.random() * 40) + 40,
    });
  }
  
  return history;
};