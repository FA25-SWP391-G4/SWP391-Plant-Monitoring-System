import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { createServerPayment } from '../../services/paymentService';
import theme from '../../themes/theme';

/**
 * PaymentMethodSelector component allows users to select a VNPay payment method
 * before initiating the payment process
 */
const PaymentMethodSelector = ({ navigation, route }) => {
  const { t } = useLanguage();
  const { productId, amount, productName } = route.params;
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

  // Define payment methods
  const paymentMethods = [
    {
      id: 'VNPAYQR',
      name: 'VNPay QR',
      description: t('payment.methods.qrDescription'),
      icon: require('../../../assets/images/payment/vnpay-qr.png')
    },
    {
      id: 'VNBANK',
      name: t('payment.methods.localBank'),
      description: t('payment.methods.localBankDescription'),
      icon: require('../../../assets/images/payment/vnbank.png')
    },
    {
      id: 'INTCARD',
      name: t('payment.methods.intlCard'),
      description: t('payment.methods.intlCardDescription'),
      icon: require('../../../assets/images/payment/intl-card.png')
    },
    {
      id: null,
      name: t('payment.methods.other'),
      description: t('payment.methods.otherDescription'),
      icon: require('../../../assets/images/payment/other-payment.png')
    }
  ];

  // Handle payment method selection
  const selectPaymentMethod = (methodId) => {
    setSelectedMethod(methodId);
  };

  // Process payment with selected method
  const processPayment = async () => {
    try {
      setLoading(true);

      const paymentData = {
        amount,
        productId,
        orderInfo: `Purchase ${productName}`,
        orderType: 'subscription',
        bankCode: selectedMethod // null means let user choose on VNPay page
      };

      const payment = await createServerPayment(paymentData, false);
      
      // Navigate to payment webview
      navigation.navigate('PaymentWebView', { 
        paymentUrl: payment.paymentUrl,
        orderId: payment.orderId
      });
    } catch (error) {
      Alert.alert(
        t('payment.errorTitle'),
        error.message || t('payment.errorGeneric')
      );
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('payment.selectMethod')}</Text>
      <Text style={styles.subtitle}>
        {t('payment.amount')}: {amount.toLocaleString()} VND
      </Text>

      {/* Payment method options */}
      <View style={styles.methodsContainer}>
        {paymentMethods.map(method => (
          <TouchableOpacity
            key={method.id || 'other'}
            style={[
              styles.methodCard,
              selectedMethod === method.id && styles.selectedMethodCard
            ]}
            onPress={() => selectPaymentMethod(method.id)}
          >
            <Image source={method.icon} style={styles.methodIcon} />
            <Text style={styles.methodName}>{method.name}</Text>
            <Text style={styles.methodDescription}>{method.description}</Text>
            
            {/* Selection indicator */}
            {selectedMethod === method.id && (
              <View style={styles.checkmarkContainer}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Proceed button */}
      <TouchableOpacity
        style={styles.proceedButton}
        onPress={processPayment}
        disabled={loading}
      >
        <Text style={styles.proceedButtonText}>
          {loading ? t('payment.processing') : t('payment.proceed')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.COLORS.background
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: theme.COLORS.text.secondary,
    marginBottom: 24
  },
  methodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  methodCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: theme.COLORS.white,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    position: 'relative'
  },
  selectedMethodCard: {
    borderColor: theme.COLORS.primary.main,
    borderWidth: 2
  },
  methodIcon: {
    width: 48,
    height: 48,
    marginBottom: 12,
    resizeMode: 'contain'
  },
  methodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
    marginBottom: 4
  },
  methodDescription: {
    fontSize: 12,
    color: theme.COLORS.text.secondary,
    textAlign: 'center'
  },
  checkmarkContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.COLORS.primary.main,
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkmark: {
    color: theme.COLORS.white,
    fontWeight: 'bold'
  },
  proceedButton: {
    backgroundColor: theme.COLORS.primary.main,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  proceedButtonText: {
    color: theme.COLORS.white,
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default PaymentMethodSelector;