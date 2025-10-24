import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import theme from '../../themes/theme';

const PaymentSuccessScreen = ({ route, navigation }) => {
  const { t } = useLanguage();
  const { orderId } = route.params || {};
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={theme.COLORS.success.main} />
        </View>
        
        <Text style={styles.title}>{t('payment.successTitle')}</Text>
        <Text style={styles.message}>{t('payment.successMessage')}</Text>
        
        {orderId && (
          <View style={styles.orderInfoContainer}>
            <Text style={styles.orderInfoTitle}>{t('payment.orderIdLabel')}:</Text>
            <Text style={styles.orderId}>{orderId}</Text>
          </View>
        )}
        
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.primaryButtonText}>{t('payment.continueToDashboard')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.secondaryButtonText}>{t('payment.goToSettings')}</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: theme.COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 36,
  },
  orderInfoContainer: {
    backgroundColor: theme.COLORS.neutral.grey100,
    padding: 16,
    borderRadius: 8,
    width: '100%',
    marginBottom: 36,
  },
  orderInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.COLORS.text.secondary,
    marginBottom: 4,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.COLORS.text.primary,
    letterSpacing: 0.5,
  },
  primaryButton: {
    backgroundColor: theme.COLORS.primary.main,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: theme.COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: theme.COLORS.text.secondary,
    fontSize: 16,
  },
});

export default PaymentSuccessScreen;