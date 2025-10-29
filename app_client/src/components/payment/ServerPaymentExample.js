import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking
} from 'react-native';
import { usePayment } from '../../context/PaymentContext';
import { createServerPayment, PRODUCTS, PRODUCT_DETAILS } from '../../services/paymentService';
import theme from '../../themes/theme';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Example component demonstrating VNPay integration for server-side payments
 * This demonstrates both mobile redirect flow and web URL return flow
 */
const ServerPaymentExample = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const { hasPremium } = usePayment();
  
  // Handle payment via VNPay (server redirect flow)
  const handleVNPayPayment = async (productId, useDirectRedirect = false) => {
    try {
      setLoading(true);
      
      // Get product details
      const product = PRODUCT_DETAILS[productId];
      
      if (!product) {
        Alert.alert('Error', 'Invalid product selected');
        return;
      }
      
      // Payment data
      const paymentData = {
        amount: product.price,
        productId: product.id
      };
      
      // Create payment URL with server
      const payment = await createServerPayment(paymentData, useDirectRedirect);
      
      if (useDirectRedirect) {
        // This won't happen as the server will redirect directly
        console.log('Server should handle redirect');
      } else {
        // Open payment URL in browser
        await Linking.openURL(payment.paymentUrl);
        
        // You can also add logic to check payment status periodically
        // using the orderId returned from the payment creation
      }
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Payment Error', error.message || 'Something went wrong with the payment process');
    } finally {
      setLoading(false);
    }
  };

  // If user already has premium, show a message
  if (hasPremium) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{t('payment.alreadyPremium')}</Text>
        <Text style={styles.description}>{t('payment.enjoyPremium')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('payment.serverPayment')}</Text>
      <Text style={styles.description}>{t('payment.chooseMethod')}</Text>
      
      {/* Payment buttons */}
      <TouchableOpacity
        style={[styles.paymentButton, loading && styles.disabledButton]}
        onPress={() => handleVNPayPayment(PRODUCTS.PREMIUM_MONTHLY, false)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.COLORS.white} size="small" />
        ) : (
          <Text style={styles.buttonText}>{t('payment.payMonthly')}</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.paymentButton, loading && styles.disabledButton]}
        onPress={() => handleVNPayPayment(PRODUCTS.PREMIUM_YEARLY, false)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.COLORS.white} size="small" />
        ) : (
          <Text style={styles.buttonText}>{t('payment.payYearly')}</Text>
        )}
      </TouchableOpacity>
      
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>
      
      <TouchableOpacity
        style={[styles.directRedirectButton, loading && styles.disabledButton]}
        onPress={() => handleVNPayPayment(PRODUCTS.PREMIUM_YEARLY, true)}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.COLORS.primary.main} size="small" />
        ) : (
          <Text style={styles.directRedirectText}>{t('payment.useDirectRedirect')}</Text>
        )}
      </TouchableOpacity>
      
      <Text style={styles.noteText}>
        {t('payment.paymentNote')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: theme.COLORS.background,
    borderRadius: 8,
    marginVertical: 10,
    shadowColor: theme.COLORS.neutral.grey800,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.COLORS.text.primary,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: theme.COLORS.text.secondary,
    marginBottom: 24,
  },
  paymentButton: {
    backgroundColor: theme.COLORS.primary.main,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: theme.COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.COLORS.neutral.grey300,
  },
  dividerText: {
    paddingHorizontal: 10,
    color: theme.COLORS.text.secondary,
  },
  directRedirectButton: {
    backgroundColor: theme.COLORS.background,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.COLORS.primary.main,
  },
  directRedirectText: {
    color: theme.COLORS.primary.main,
    fontSize: 16,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 12,
    color: theme.COLORS.text.secondary,
    marginTop: 20,
    fontStyle: 'italic',
  },
});

export default ServerPaymentExample;