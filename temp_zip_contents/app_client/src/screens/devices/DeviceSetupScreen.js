import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import theme from '../../themes/theme';

// Import services
import { 
  configureDevice, 
  getAvailableWifiNetworks 
} from '../../services/deviceService';

const DeviceSetupScreen = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { device } = route.params;
  
  const [currentStep, setCurrentStep] = useState(1);
  const [deviceName, setDeviceName] = useState(device.name);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [wifiNetworks, setWifiNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [wifiPassword, setWifiPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const totalSteps = device.type === 'wifi' ? 4 : 3;
  
  // Step 1: Name your device
  const renderDeviceNameStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('deviceSetup.nameYourDevice')}</Text>
      <Text style={styles.stepDescription}>
        {t('deviceSetup.nameDescription')}
      </Text>
      
      <TextInput
        style={styles.input}
        value={deviceName}
        onChangeText={setDeviceName}
        placeholder={t('deviceSetup.enterName')}
        placeholderTextColor={theme.COLORS.neutral.grey400}
      />
      
      <View style={styles.deviceInfoBox}>
        <View style={styles.deviceInfoItem}>
          <Text style={styles.deviceInfoLabel}>{t('deviceSetup.deviceType')}:</Text>
          <Text style={styles.deviceInfoValue}>
            {device.type === 'wifi' ? t('deviceSetup.wifiDevice') : t('deviceSetup.bluetoothDevice')}
          </Text>
        </View>
        
        <View style={styles.deviceInfoItem}>
          <Text style={styles.deviceInfoLabel}>{t('deviceSetup.model')}:</Text>
          <Text style={styles.deviceInfoValue}>{device.model}</Text>
        </View>
        
        <View style={styles.deviceInfoItem}>
          <Text style={styles.deviceInfoLabel}>{t('deviceSetup.id')}:</Text>
          <Text style={styles.deviceInfoValue}>{device.id}</Text>
        </View>
      </View>
    </View>
  );
  
  // Step 2: Select a plant for the device
  const renderSelectPlantStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('deviceSetup.selectPlant')}</Text>
      <Text style={styles.stepDescription}>
        {t('deviceSetup.plantDescription')}
      </Text>
      
      <ScrollView style={styles.selectionList}>
        {['Monstera', 'Snake Plant', 'Fiddle Leaf Fig', 'Peace Lily', 'Pothos'].map((plant, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.selectionItem,
              selectedPlant === plant && styles.selectedItem
            ]}
            onPress={() => setSelectedPlant(plant)}
          >
            <Text style={[
              styles.selectionItemText,
              selectedPlant === plant && styles.selectedItemText
            ]}>
              {plant}
            </Text>
            {selectedPlant === plant && (
              <Ionicons name="checkmark-circle" size={24} color={theme.COLORS.primary.main} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <TouchableOpacity
        style={styles.addNewButton}
        onPress={() => {
          navigation.navigate('AddPlant', {
            onSelectPlant: (plant) => {
              setSelectedPlant(plant);
              navigation.navigate('DeviceSetup', { device });
            }
          });
        }}
      >
        <Ionicons name="add-circle-outline" size={20} color={theme.COLORS.primary.main} />
        <Text style={styles.addNewButtonText}>{t('deviceSetup.addNewPlant')}</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Step 3: Select a room for the device
  const renderSelectRoomStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('deviceSetup.selectRoom')}</Text>
      <Text style={styles.stepDescription}>
        {t('deviceSetup.roomDescription')}
      </Text>
      
      <ScrollView style={styles.selectionList}>
        {['Living Room', 'Bedroom', 'Kitchen', 'Office', 'Balcony'].map((room, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.selectionItem,
              selectedRoom === room && styles.selectedItem
            ]}
            onPress={() => setSelectedRoom(room)}
          >
            <Text style={[
              styles.selectionItemText,
              selectedRoom === room && styles.selectedItemText
            ]}>
              {room}
            </Text>
            {selectedRoom === room && (
              <Ionicons name="checkmark-circle" size={24} color={theme.COLORS.primary.main} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <TouchableOpacity
        style={styles.addNewButton}
        onPress={() => {
          // Show dialog to add new room
          Alert.prompt(
            t('deviceSetup.addNewRoom'),
            t('deviceSetup.enterRoomName'),
            (roomName) => {
              if (roomName && roomName.trim()) {
                setSelectedRoom(roomName.trim());
              }
            }
          );
        }}
      >
        <Ionicons name="add-circle-outline" size={20} color={theme.COLORS.primary.main} />
        <Text style={styles.addNewButtonText}>{t('deviceSetup.addNewRoom')}</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Step 4: Connect to WiFi (for WiFi devices only)
  const renderWifiSetupStep = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>{t('deviceSetup.connectWifi')}</Text>
      <Text style={styles.stepDescription}>
        {t('deviceSetup.wifiDescription')}
      </Text>
      
      {wifiNetworks.length === 0 ? (
        <TouchableOpacity
          style={styles.scanWifiButton}
          onPress={async () => {
            setLoading(true);
            try {
              const networks = await getAvailableWifiNetworks();
              setWifiNetworks(networks);
            } catch (error) {
              console.error('Error scanning WiFi networks:', error);
              Alert.alert(
                t('errors.scanningError'),
                t('errors.tryAgain'),
                [{ text: t('common.ok') }]
              );
            } finally {
              setLoading(false);
            }
          }}
        >
          {loading ? (
            <ActivityIndicator color={theme.COLORS.white} size="small" />
          ) : (
            <Ionicons name="wifi" size={20} color={theme.COLORS.white} />
          )}
          <Text style={styles.scanWifiButtonText}>{t('deviceSetup.scanNetworks')}</Text>
        </TouchableOpacity>
      ) : (
        <>
          <ScrollView style={styles.selectionList}>
            {wifiNetworks.map((network, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.selectionItem,
                  selectedNetwork === network.ssid && styles.selectedItem
                ]}
                onPress={() => setSelectedNetwork(network.ssid)}
              >
                <View style={styles.networkItem}>
                  <Ionicons 
                    name="wifi" 
                    size={18} 
                    color={
                      network.strength > -60 
                        ? theme.COLORS.success.main 
                        : network.strength > -80 
                          ? theme.COLORS.warning.main 
                          : theme.COLORS.error.main
                    } 
                  />
                  <Text style={[
                    styles.selectionItemText,
                    selectedNetwork === network.ssid && styles.selectedItemText
                  ]}>
                    {network.ssid}
                  </Text>
                  {network.secure && (
                    <Ionicons name="lock-closed" size={16} color={theme.COLORS.neutral.grey500} />
                  )}
                </View>
                {selectedNetwork === network.ssid && (
                  <Ionicons name="checkmark-circle" size={24} color={theme.COLORS.primary.main} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {selectedNetwork && (
            <View style={styles.passwordContainer}>
              <Text style={styles.passwordLabel}>{t('deviceSetup.enterPassword')}</Text>
              <TextInput
                style={styles.input}
                value={wifiPassword}
                onChangeText={setWifiPassword}
                placeholder={t('deviceSetup.password')}
                placeholderTextColor={theme.COLORS.neutral.grey400}
                secureTextEntry
              />
            </View>
          )}
        </>
      )}
    </View>
  );
  
  // Complete device setup
  const completeSetup = async () => {
    if (!deviceName.trim()) {
      Alert.alert(t('errors.emptyField'), t('deviceSetup.nameRequired'));
      return;
    }
    
    if (!selectedPlant) {
      Alert.alert(t('errors.emptyField'), t('deviceSetup.plantRequired'));
      return;
    }
    
    if (!selectedRoom) {
      Alert.alert(t('errors.emptyField'), t('deviceSetup.roomRequired'));
      return;
    }
    
    if (device.type === 'wifi' && (!selectedNetwork || !wifiPassword.trim())) {
      Alert.alert(t('errors.emptyField'), t('deviceSetup.wifiRequired'));
      return;
    }
    
    setLoading(true);
    
    try {
      // Configure the device with our settings
      await configureDevice(device.id, {
        name: deviceName,
        plant: selectedPlant,
        room: selectedRoom,
        wifi: device.type === 'wifi' ? {
          ssid: selectedNetwork,
          password: wifiPassword,
        } : undefined,
      });
      
      Alert.alert(
        t('deviceSetup.setupComplete'),
        t('deviceSetup.deviceConfigured', { name: deviceName }),
        [
          { 
            text: t('common.ok'), 
            onPress: () => navigation.navigate('Devices')
          }
        ]
      );
    } catch (error) {
      console.error('Error setting up device:', error);
      Alert.alert(
        t('errors.setupError'),
        t('errors.tryAgain'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderDeviceNameStep();
      case 2:
        return renderSelectPlantStep();
      case 3:
        return renderSelectRoomStep();
      case 4:
        return renderWifiSetupStep();
      default:
        return null;
    }
  };
  
  // Next step handler
  const handleNextStep = () => {
    if (currentStep === totalSteps) {
      completeSetup();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };
  
  // Previous step handler
  const handlePreviousStep = () => {
    if (currentStep === 1) {
      navigation.goBack();
    } else {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handlePreviousStep}
        >
          <Ionicons name="arrow-back" size={24} color={theme.COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('deviceSetup.title')}</Text>
      </View>
      
      {/* Step Indicator */}
      <View style={styles.stepIndicator}>
        {Array(totalSteps).fill(0).map((_, index) => (
          <View 
            key={index}
            style={[
              styles.stepDot,
              currentStep === index + 1 ? styles.activeStepDot : 
              currentStep > index + 1 ? styles.completedStepDot : {}
            ]}
          >
            {currentStep > index + 1 && (
              <Ionicons name="checkmark" size={12} color={theme.COLORS.white} />
            )}
          </View>
        ))}
      </View>

      {/* Step Content */}
      <ScrollView style={styles.content}>
        {renderStepContent()}
      </ScrollView>
      
      {/* Navigation Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.footerButton,
            styles.secondaryButton,
            loading && styles.disabledButton
          ]}
          onPress={handlePreviousStep}
          disabled={loading}
        >
          <Text style={styles.secondaryButtonText}>
            {currentStep === 1 ? t('common.cancel') : t('common.back')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.footerButton,
            styles.primaryButton,
            loading && styles.disabledButton,
            (currentStep === 2 && !selectedPlant) && styles.disabledButton,
            (currentStep === 3 && !selectedRoom) && styles.disabledButton,
            (currentStep === 4 && (!selectedNetwork || !wifiPassword)) && styles.disabledButton
          ]}
          onPress={handleNextStep}
          disabled={
            loading || 
            (currentStep === 2 && !selectedPlant) ||
            (currentStep === 3 && !selectedRoom) ||
            (currentStep === 4 && (!selectedNetwork || !wifiPassword))
          }
        >
          {loading ? (
            <ActivityIndicator color={theme.COLORS.white} size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>
              {currentStep === totalSteps 
                ? t('deviceSetup.finish') 
                : t('common.next')
              }
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.COLORS.neutral.grey300,
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStepDot: {
    backgroundColor: theme.COLORS.primary.main,
  },
  completedStepDot: {
    backgroundColor: theme.COLORS.success.main,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    paddingBottom: 40,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: theme.COLORS.text.primary,
  },
  stepDescription: {
    fontSize: 14,
    color: theme.COLORS.text.secondary,
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.COLORS.neutral.grey300,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: theme.COLORS.text.primary,
    backgroundColor: theme.COLORS.background,
  },
  deviceInfoBox: {
    marginTop: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: theme.COLORS.neutral.grey100,
  },
  deviceInfoItem: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  deviceInfoLabel: {
    flex: 1,
    fontSize: 14,
    color: theme.COLORS.text.secondary,
  },
  deviceInfoValue: {
    flex: 2,
    fontSize: 14,
    color: theme.COLORS.text.primary,
    fontWeight: '500',
  },
  selectionList: {
    maxHeight: 300,
  },
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.neutral.grey200,
  },
  selectedItem: {
    backgroundColor: theme.COLORS.primary.light + '20', // 20% opacity
  },
  selectionItemText: {
    fontSize: 16,
    color: theme.COLORS.text.primary,
  },
  selectedItemText: {
    fontWeight: '600',
    color: theme.COLORS.primary.main,
  },
  networkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  addNewButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: theme.COLORS.primary.main,
    fontWeight: '500',
  },
  scanWifiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.COLORS.primary.main,
    borderRadius: 8,
    paddingVertical: 14,
  },
  scanWifiButtonText: {
    color: theme.COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  passwordContainer: {
    marginTop: 24,
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: theme.COLORS.text.primary,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.neutral.grey200,
  },
  footerButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: theme.COLORS.primary.main,
    marginLeft: 8,
  },
  secondaryButton: {
    backgroundColor: theme.COLORS.neutral.grey200,
    marginRight: 8,
  },
  primaryButtonText: {
    color: theme.COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: theme.COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default DeviceSetupScreen;