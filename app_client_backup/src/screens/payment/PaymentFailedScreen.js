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

const PaymentFailedScreen = ({ route, navigation }) => {
  const { t } = useLanguage();
  const { orderId, status, code } = route.params || {};
  
  // Map error codes to user-friendly messages
  const getErrorMessage = (code) => {
    const errorCodes = {
      '97': t('payment.errors.invalidSignature'),
      '99': t('payment.errors.unknown'),
      '24': t('payment.errors.cancelled'),
      '01': t('payment.errors.insufficientFunds'),
      '09': t('payment.errors.cardExpired')
    };
    
    return errorCodes[code] || t('payment.errors.generalError');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="close-circle" size={80} color={theme.COLORS.error.main} />
        </View>
        
        <Text style={styles.title}>{t('payment.failureTitle')}</Text>
        <Text style={styles.message}>
          {getErrorMessage(code)}
        </Text>
        
        {orderId && (
          <View style={styles.orderInfoContainer}>
            <Text style={styles.orderInfoTitle}>{t('payment.orderIdLabel')}:</Text>
            <Text style={styles.orderId}>{orderId}</Text>
            
            {status && (
              <Text style={styles.orderStatus}>
                {t('payment.statusLabel')}: {status}
              </Text>
            )}
            
            {code && (
              <Text style={styles.orderStatus}>
                {t('payment.codeLabel')}: {code}
              </Text>
            )}
          </View>
        )}
        
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Subscription')}
        >
          <Text style={styles.primaryButtonText}>{t('payment.tryAgain')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={styles.secondaryButtonText}>{t('payment.backToDashboard')}</Text>
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
    color: theme.COLORS.error.main,
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
    marginBottom: 8,
  },
  orderStatus: {
    fontSize: 14,
    color: theme.COLORS.text.secondary,
    marginTop: 4,
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

export default PaymentFailedScreen;