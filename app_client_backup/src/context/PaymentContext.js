import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import * as paymentService from '../services/paymentService';

// Create context
const PaymentContext = createContext();

// Context provider component
export const PaymentProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    hasPremiumMonthly: false,
    hasPremiumYearly: false,
    hasPlantIdUnlimited: false,
  });
  const [purchaseInProgress, setPurchaseInProgress] = useState(false);

  // Initialize the payment module when the app starts
  useEffect(() => {
    const initialize = async () => {
      try {
        const success = await paymentService.initPayments();
        setIsInitialized(success);
        
        if (success) {
          // Load products
          const availableProducts = await paymentService.getProducts();
          setProducts(availableProducts);
          
          // Check subscription status
          await refreshSubscriptionStatus();
        }
      } catch (error) {
        console.error('Error initializing payment context:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, []);

  // Refresh subscription status
  const refreshSubscriptionStatus = async () => {
    try {
      const hasPremiumMonthly = await paymentService.hasPurchased(paymentService.PRODUCTS.PREMIUM_MONTHLY);
      const hasPremiumYearly = await paymentService.hasPurchased(paymentService.PRODUCTS.PREMIUM_YEARLY);
      const hasPlantIdUnlimited = await paymentService.hasPurchased(paymentService.PRODUCTS.PLANT_ID_UNLIMITED);
      
      setSubscriptionStatus({
        hasPremiumMonthly,
        hasPremiumYearly,
        hasPlantIdUnlimited,
      });
      
      return {
        hasPremiumMonthly,
        hasPremiumYearly,
        hasPlantIdUnlimited,
      };
    } catch (error) {
      console.error('Error refreshing subscription status:', error);
      return subscriptionStatus;
    }
  };

  // Check if user has premium
  const hasPremium = subscriptionStatus.hasPremiumMonthly || subscriptionStatus.hasPremiumYearly;

  // Check if a feature is available to the user
  const isFeatureAvailable = async (feature) => {
    try {
      return await paymentService.isFeatureAvailable(feature);
    } catch (error) {
      console.error(`Error checking if feature ${feature} is available:`, error);
      return false;
    }
  };

  // Purchase a product
  const purchaseProduct = async (productId) => {
    if (!isInitialized) {
      Alert.alert('Error', 'Payment system is not initialized.');
      return null;
    }
    
    if (purchaseInProgress) {
      return null;
    }
    
    try {
      setPurchaseInProgress(true);
      const purchase = await paymentService.purchaseProduct(productId);
      
      // Refresh subscription status after purchase
      await refreshSubscriptionStatus();
      
      return purchase;
    } catch (error) {
      console.error('Error purchasing product:', error);
      throw error;
    } finally {
      setPurchaseInProgress(false);
    }
  };

  // Restore purchases
  const restorePurchases = async () => {
    if (!isInitialized) {
      Alert.alert('Error', 'Payment system is not initialized.');
      return [];
    }
    
    try {
      setIsLoading(true);
      const restored = await paymentService.restorePurchases();
      
      // Refresh subscription status after restore
      await refreshSubscriptionStatus();
      
      return restored;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Context value
  const value = {
    isInitialized,
    isLoading,
    products,
    subscriptionStatus,
    hasPremium,
    purchaseInProgress,
    refreshSubscriptionStatus,
    isFeatureAvailable,
    purchaseProduct,
    restorePurchases,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

// Custom hook for using the payment context
export const usePayment = () => {
  const context = useContext(PaymentContext);
  
  if (!context) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  
  return context;
};

export default PaymentContext;