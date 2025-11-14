import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  Alert
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import theme from '../../themes/theme';

const PaymentWebView = ({ route, navigation }) => {
  const { t } = useLanguage();
  const { paymentUrl, orderId } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        t('payment.cancelTitle'),
        t('payment.cancelConfirm'),
        [
          { 
            text: t('common.cancel'),
            onPress: () => {},
            style: 'cancel' 
          },
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack()
          }
        ]
      );
      return true;
    });
    
    return () => backHandler.remove();
  }, [navigation, t]);

  // Navigate back on payment completion or redirect
  const handleNavigationStateChange = (navState) => {
    // Check if we're redirected back to our app or a result page
    const { url } = navState;
    
    // Look for payment result indicators in the URL
    if (url.includes('payment/result') || url.includes('payment-result') || url.includes('vnpay-return')) {
      // Extract status from URL if possible
      const status = url.includes('status=') 
        ? url.split('status=')[1].split('&')[0]
        : null;
        
      // Extract result code from URL if possible
      const code = url.includes('code=')
        ? url.split('code=')[1].split('&')[0]
        : null;
      
      // Check if payment was successful
      if (status === 'completed' || code === '00') {
        // Payment successful
        setTimeout(() => {
          navigation.replace('PaymentSuccess', { orderId });
        }, 1000);
      } else {
        // Payment failed or canceled
        setTimeout(() => {
          navigation.replace('PaymentFailed', { orderId, status, code });
        }, 1000);
      }
    }
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.COLORS.error.main} />
          <Text style={styles.errorTitle}>{t('payment.errorTitle')}</Text>
          <Text style={styles.errorMessage}>{error.message || t('payment.errorGeneric')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
          <Text style={styles.loadingText}>{t('payment.loading')}</Text>
        </View>
      )}
      
      <WebView
        source={{ uri: paymentUrl }}
        style={styles.webview}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(e) => {
          console.error('WebView error:', e);
          setError(e);
          setLoading(false);
        }}
        onNavigationStateChange={handleNavigationStateChange}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        incognito={false} // Allow cookies to be shared
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.background,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.COLORS.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.COLORS.error.main,
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: theme.COLORS.text.secondary,
    textAlign: 'center',
  },
});

export default PaymentWebView;