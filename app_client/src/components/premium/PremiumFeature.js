import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../../context/LanguageContext';
import theme from '../../themes/theme';

// Import payment service
import { isFeatureAvailable } from '../../services/paymentService';

/**
 * PremiumFeature component
 * 
 * This component wraps premium features and shows a lock overlay with an upsell
 * prompt if the user hasn't purchased access to the feature.
 * 
 * Usage:
 * <PremiumFeature feature="plantIdentification">
 *   <YourFeatureComponent />
 * </PremiumFeature>
 */
const PremiumFeature = ({ children, feature, message, showLock = true }) => {
  const { t } = useLanguage();
  const navigation = useNavigation();
  const [isAvailable, setIsAvailable] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if feature is available
  useEffect(() => {
    const checkFeatureAvailability = async () => {
      try {
        const available = await isFeatureAvailable(feature);
        setIsAvailable(available);
      } catch (error) {
        console.error('Error checking feature availability:', error);
        setIsAvailable(false);
      } finally {
        setLoading(false);
      }
    };

    checkFeatureAvailability();
  }, [feature]);

  // Handle upgrade button press
  const handleUpgrade = () => {
    setShowModal(false);
    navigation.navigate('Subscription');
  };

  // Custom message based on feature
  const getFeatureMessage = () => {
    if (message) {
      return message;
    }
    
    switch (feature) {
      case 'plantIdentification':
        return t('premium.plantIdDescription');
      case 'smartWatering':
        return t('premium.smartWateringDescription');
      case 'deviceConnections':
        return t('premium.deviceConnectionsDescription');
      case 'dataExport':
        return t('premium.dataExportDescription');
      default:
        return t('premium.genericDescription');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        {/* Placeholder for loading state */}
        <View style={styles.loadingPlaceholder} />
      </View>
    );
  }

  if (isAvailable) {
    // Feature is available, render children normally
    return children;
  }

  // Feature is locked, render with overlay
  return (
    <View style={styles.container}>
      {/* Render children with reduced opacity */}
      <View style={styles.contentLocked}>
        {children}
      </View>
      
      {/* Lock overlay */}
      {showLock && (
        <TouchableOpacity
          style={styles.lockOverlay}
          onPress={() => setShowModal(true)}
        >
          <View style={styles.lockIconContainer}>
            <Ionicons name="lock-closed" size={28} color={theme.COLORS.white} />
          </View>
          <Text style={styles.lockText}>{t('premium.premiumFeature')}</Text>
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.upgradeButtonText}>{t('premium.unlock')}</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* Premium upsell modal */}
      <Modal
        visible={showModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.COLORS.text.secondary} />
            </TouchableOpacity>
            
            <Image
              source={require('../../assets/images/premium-icon.png')}
              style={styles.modalImage}
              resizeMode="contain"
            />
            
            <Text style={styles.modalTitle}>{t('premium.premiumRequired')}</Text>
            <Text style={styles.modalDescription}>{getFeatureMessage()}</Text>
            
            <View style={styles.featuresList}>
              {['smartWatering', 'unlimitedPlants', 'aiPlantId'].map((feat, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.COLORS.success.main} />
                  <Text style={styles.featureText}>{t(`premium.features.${feat}`)}</Text>
                </View>
              ))}
            </View>
            
            <TouchableOpacity
              style={styles.modalPrimaryButton}
              onPress={handleUpgrade}
            >
              <Ionicons name="star" size={20} color={theme.COLORS.white} />
              <Text style={styles.modalPrimaryButtonText}>{t('premium.upgradeNow')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.modalSecondaryButton}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.modalSecondaryButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  contentLocked: {
    opacity: 0.5,
  },
  loadingContainer: {
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingPlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: theme.COLORS.neutral.grey200,
    borderRadius: 8,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  lockIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.COLORS.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lockText: {
    color: theme.COLORS.white,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  upgradeButton: {
    backgroundColor: theme.COLORS.primary.main,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  upgradeButtonText: {
    color: theme.COLORS.white,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  modalImage: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: theme.COLORS.text.secondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  featuresList: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 8,
    color: theme.COLORS.text.primary,
  },
  modalPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.COLORS.primary.main,
    borderRadius: 8,
    paddingVertical: 14,
    width: '100%',
    marginBottom: 12,
  },
  modalPrimaryButtonText: {
    color: theme.COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  modalSecondaryButton: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalSecondaryButtonText: {
    color: theme.COLORS.text.secondary,
    fontSize: 16,
  },
});

export default PremiumFeature;