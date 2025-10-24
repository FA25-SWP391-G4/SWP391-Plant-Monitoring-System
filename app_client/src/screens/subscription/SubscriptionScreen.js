import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../context/LanguageContext';
import theme from '../../themes/theme';

// Import payment service
import {
  getProducts,
  purchaseProduct,
  restorePurchases,
  isFeatureAvailable,
  PRODUCTS,
  createServerPayment
} from '../../services/paymentService';

// Import payment components
import ServerPaymentExample from '../../components/payment/ServerPaymentExample';

const SubscriptionScreen = ({ navigation }) => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [premiumStatus, setPremiumStatus] = useState({
    monthly: false,
    yearly: false
  });

  // Fetch products when component mounts
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const availableProducts = await getProducts();
        setProducts(availableProducts);
        
        // Check current subscription status
        const hasMonthly = await isFeatureAvailable('premium');
        setPremiumStatus({
          monthly: hasMonthly,
          yearly: await isFeatureAvailable('premium')
        });
        
        // Pre-select yearly subscription
        setSelectedProduct(availableProducts.find(p => p.id === PRODUCTS.PREMIUM_YEARLY));
      } catch (error) {
        console.error('Error fetching products:', error);
        Alert.alert(
          t('errors.title'),
          t('subscription.errorFetchingProducts')
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [t]);

  // Handle in-app purchase (Google Play)
  const handleInAppPurchase = async () => {
    if (!selectedProduct) {
      Alert.alert(
        t('subscription.selectPlanTitle'),
        t('subscription.selectPlanMessage')
      );
      return;
    }

    setPurchasing(true);
    try {
      const purchase = await purchaseProduct(selectedProduct.id);
      
      // Check which product was purchased
      if (selectedProduct.id === PRODUCTS.PREMIUM_MONTHLY) {
        setPremiumStatus({ ...premiumStatus, monthly: true });
      } else if (selectedProduct.id === PRODUCTS.PREMIUM_YEARLY) {
        setPremiumStatus({ ...premiumStatus, yearly: true });
      }
      
      Alert.alert(
        t('subscription.thankYouTitle'),
        t('subscription.thankYouMessage'),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.navigate('Dashboard')
          }
        ]
      );
    } catch (error) {
      console.error('Purchase error:', error);
      Alert.alert(
        t('errors.title'),
        t('subscription.purchaseError')
      );
    } finally {
      setPurchasing(false);
    }
  };
  
  // Handle server payment (VNPay)
  const handleServerPayment = async () => {
    if (!selectedProduct) {
      Alert.alert(
        t('subscription.selectPlanTitle'),
        t('subscription.selectPlanMessage')
      );
      return;
    }

    setPurchasing(true);
    try {
      // Payment data
      const paymentData = {
        amount: selectedProduct.price,
        productId: selectedProduct.id
      };
      
      // Create payment with server
      const payment = await createServerPayment(paymentData, false);
      
      // Navigate to webview or open external browser
      navigation.navigate('PaymentWebView', { 
        paymentUrl: payment.paymentUrl,
        orderId: payment.orderId
      });
      
    } catch (error) {
      console.error('Server payment error:', error);
      Alert.alert(
        t('errors.title'),
        t('subscription.paymentServerError')
      );
    } finally {
      setPurchasing(false);
    }
  };

  // Restore previous purchases
  const handleRestore = async () => {
    setLoading(true);
    try {
      const restoredPurchases = await restorePurchases();
      
      if (restoredPurchases.length > 0) {
        const hasMonthly = restoredPurchases.some(p => p.productId === PRODUCTS.PREMIUM_MONTHLY);
        const hasYearly = restoredPurchases.some(p => p.productId === PRODUCTS.PREMIUM_YEARLY);
        
        setPremiumStatus({
          monthly: hasMonthly,
          yearly: hasYearly
        });
        
        Alert.alert(
          t('subscription.restoreSuccessTitle'),
          t('subscription.restoreSuccessMessage')
        );
      } else {
        Alert.alert(
          t('subscription.restoreTitle'),
          t('subscription.noSubscriptions')
        );
      }
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert(
        t('errors.title'),
        t('subscription.restoreError')
      );
    } finally {
      setLoading(false);
    }
  };

  // Check if user already has premium
  const hasPremium = premiumStatus.monthly || premiumStatus.yearly;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.COLORS.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>{t('subscription.title')}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.COLORS.primary.main} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <Image
              source={require('../../assets/images/premium-hero.png')}
              style={styles.heroImage}
              resizeMode="contain"
            />
            <Text style={styles.heroTitle}>{t('subscription.upgrade')}</Text>
            <Text style={styles.heroSubtitle}>
              {hasPremium
                ? t('subscription.alreadyPremium')
                : t('subscription.unlockFeatures')}
            </Text>
          </View>

          {/* Feature List */}
          <View style={styles.featuresList}>
            <Text style={styles.sectionTitle}>{t('subscription.featuresIncluded')}</Text>
            
            {[
              'smartWatering',
              'unlimitedPlants',
              'advancedAnalytics',
              'aiPlantId',
              'prioritySupport'
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={24} color={theme.COLORS.success.main} />
                <Text style={styles.featureText}>{t(`subscription.features.${feature}`)}</Text>
              </View>
            ))}
          </View>

          {/* Subscription Plans */}
          {!hasPremium && (
            <View style={styles.plansContainer}>
              <Text style={styles.sectionTitle}>{t('subscription.selectPlan')}</Text>
              
              {products
                .filter(product => product.type === 'subscription')
                .map((product, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.planCard,
                      selectedProduct?.id === product.id && styles.selectedPlan
                    ]}
                    onPress={() => setSelectedProduct(product)}
                  >
                    <View style={styles.planInfo}>
                      <Text style={styles.planTitle}>{product.title}</Text>
                      <Text style={styles.planDescription}>{product.description}</Text>
                      {product.id === PRODUCTS.PREMIUM_YEARLY && (
                        <View style={styles.savingsBadge}>
                          <Text style={styles.savingsBadgeText}>{t('subscription.save20')}</Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.priceContainer}>
                      <Text style={styles.planPrice}>${product.price}</Text>
                      <Text style={styles.planPeriod}>
                        {product.id === PRODUCTS.PREMIUM_MONTHLY
                          ? t('subscription.perMonth')
                          : t('subscription.perYear')}
                      </Text>
                      
                      {selectedProduct?.id === product.id && (
                        <Ionicons name="checkmark-circle" size={24} color={theme.COLORS.primary.main} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {!hasPremium ? (
              <>
                <TouchableOpacity
                  style={[styles.primaryButton, purchasing && styles.disabledButton]}
                  onPress={handleInAppPurchase}
                  disabled={purchasing || !selectedProduct}
                >
                  {purchasing ? (
                    <ActivityIndicator color={theme.COLORS.white} size="small" />
                  ) : (
                    <>
                      <Ionicons name="card" size={20} color={theme.COLORS.white} />
                      <Text style={styles.primaryButtonText}>{t('subscription.payWithGooglePlay')}</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.secondaryButton, purchasing && styles.disabledButton]}
                  onPress={handleServerPayment}
                  disabled={purchasing || !selectedProduct}
                >
                  {purchasing ? (
                    <ActivityIndicator color={theme.COLORS.text.primary} size="small" />
                  ) : (
                    <>
                      <Ionicons name="cash" size={20} color={theme.COLORS.text.primary} />
                      <Text style={styles.secondaryButtonText}>{t('subscription.payWithVnPay')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => navigation.navigate('Dashboard')}
              >
                <Ionicons name="home" size={20} color={theme.COLORS.white} />
                <Text style={styles.primaryButtonText}>{t('subscription.continueToDashboard')}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={styles.tertiaryButton}
              onPress={handleRestore}
              disabled={loading}
            >
              <Ionicons name="refresh" size={20} color={theme.COLORS.text.secondary} />
              <Text style={styles.tertiaryButtonText}>{t('subscription.restorePurchases')}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Server Payment Example - Add this for testing VNPay integration */}
          <View style={styles.serverPaymentContainer}>
            <Text style={styles.sectionTitle}>{t('subscription.directServerPayment')}</Text>
            <ServerPaymentExample />
          </View>

          {/* Additional Info */}
          <View style={styles.legalInfo}>
            <Text style={styles.legalText}>
              {t('subscription.legalInfo')}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('TermsAndConditions')}
            >
              <Text style={styles.linkText}>{t('subscription.termsAndConditions')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('PrivacyPolicy')}
            >
              <Text style={styles.linkText}>{t('subscription.privacyPolicy')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
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
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.COLORS.text.secondary,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  heroImage: {
    width: 200,
    height: 200,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    color: theme.COLORS.text.primary,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    color: theme.COLORS.text.secondary,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: theme.COLORS.text.primary,
  },
  featuresList: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
    color: theme.COLORS.text.primary,
  },
  plansContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  planCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.COLORS.neutral.grey300,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectedPlan: {
    borderColor: theme.COLORS.primary.main,
    backgroundColor: theme.COLORS.primary.light + '20', // 20% opacity
  },
  planInfo: {
    flex: 2,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.COLORS.text.primary,
  },
  planDescription: {
    fontSize: 14,
    color: theme.COLORS.text.secondary,
    marginTop: 4,
  },
  priceContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.COLORS.text.primary,
  },
  planPeriod: {
    fontSize: 12,
    color: theme.COLORS.text.secondary,
  },
  savingsBadge: {
    backgroundColor: theme.COLORS.success.light,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  savingsBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.COLORS.success.dark,
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.COLORS.primary.main,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: theme.COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.COLORS.neutral.grey200,
    borderRadius: 12,
    paddingVertical: 16,
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: theme.COLORS.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tertiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
  },
  tertiaryButtonText: {
    color: theme.COLORS.text.secondary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  serverPaymentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.neutral.grey200,
    marginTop: 16,
  },
  disabledButton: {
    opacity: 0.5,
  },
  legalInfo: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  legalText: {
    fontSize: 12,
    color: theme.COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  linkText: {
    fontSize: 12,
    color: theme.COLORS.primary.main,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default SubscriptionScreen;