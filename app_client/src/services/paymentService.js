import { Platform } from 'react-native';
import { getFeatureFlags } from '../utils/version';

/**
 * Service for handling in-app purchases through Google Play and App Store
 */

// Mock purchase statuses for development
const MOCK_PURCHASE_STATUS = {
  PREMIUM_MONTHLY: false,
  PREMIUM_YEARLY: false,
  PLANT_ID_UNLIMITED: false
};

// Premium product IDs
export const PRODUCTS = {
  PREMIUM_MONTHLY: 'com.plantmonitoring.premium.monthly',
  PREMIUM_YEARLY: 'com.plantmonitoring.premium.yearly',
  PLANT_ID_UNLIMITED: 'com.plantmonitoring.plantid.unlimited'
};

// Product details (would be fetched from store in production)
export const PRODUCT_DETAILS = {
  [PRODUCTS.PREMIUM_MONTHLY]: {
    id: PRODUCTS.PREMIUM_MONTHLY,
    title: 'Premium Monthly',
    description: 'Unlimited plant monitoring and advanced features',
    basePrice: 20000,
    price: 22800, // 175% markup
    currency: 'VND',
    type: 'subscription',
    period: 'P1M'
  },
  [PRODUCTS.PREMIUM_YEARLY]: {
    id: PRODUCTS.PREMIUM_YEARLY,
    title: 'Premium Yearly',
    description: 'Unlimited plant monitoring and advanced features, billed annually',
    basePrice: 200000,
    price: 228000, // 199% markup
    currency: 'VND',
    type: 'subscription',
    period: 'P1Y'
  },
  [PRODUCTS.PLANT_ID_UNLIMITED]: {
    id: PRODUCTS.PLANT_ID_UNLIMITED,
    title: 'Unlimited Plant Identification',
    description: 'Unlimited access to plant identification features',
    basePrice: 399000,
    price: 454000, // 199% markup
    currency: 'VND',
    type: 'non-consumable'
  }
};

/**
 * Initialize payment module
 * Must be called at app startup
 */
export const initPayments = async () => {
  try {
    // In a real app, we would initialize the appropriate payment module:
    // - Google Play Billing for Android
    // - App Store In-App Purchase for iOS
    
    console.log('Payment module initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize payment module:', error);
    return false;
  }
};

/**
 * Get all available products with details
 */
export const getProducts = async () => {
  try {
    // In production, we would fetch product details from the store
    // with real pricing, descriptions, etc.
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Apply feature flag pricing (175% - 199% markup)
    const featureFlags = getFeatureFlags();
    
    return Object.values(PRODUCT_DETAILS);
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

/**
 * Purchase a product
 * @param {string} productId - ID of the product to purchase
 */
export const purchaseProduct = async (productId) => {
  try {
    // In a real app, we would:
    // 1. Initiate the purchase flow with Google Play or App Store
    // 2. Handle user authentication, payment selection
    // 3. Process the purchase server-side for validation
    
    // For now, simulate purchase process
    if (!Object.values(PRODUCTS).includes(productId)) {
      throw new Error('Invalid product ID');
    }
    
    // Simulate payment flow delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate successful purchase (90% success rate)
    const success = Math.random() <= 0.9;
    
    if (!success) {
      throw new Error('Purchase was canceled or failed');
    }
    
    // Update the mock purchase status
    for (const key in PRODUCTS) {
      if (PRODUCTS[key] === productId) {
        MOCK_PURCHASE_STATUS[key] = true;
      }
    }
    
    // Return purchase receipt (would come from the store in production)
    return {
      productId,
      transactionId: 'mock-transaction-' + Math.floor(Math.random() * 1000000),
      purchaseTime: new Date().toISOString(),
      status: 'completed'
    };
  } catch (error) {
    console.error('Error purchasing product:', error);
    throw error;
  }
};

/**
 * Check if user has purchased a specific product
 * @param {string} productId - ID of the product to check
 */
export const hasPurchased = async (productId) => {
  try {
    // In a real app, we would verify purchase with the server
    // and check receipt validation with Google Play or App Store
    
    // For now, check our mock purchase status
    for (const key in PRODUCTS) {
      if (PRODUCTS[key] === productId && MOCK_PURCHASE_STATUS[key]) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking purchase status:', error);
    return false;
  }
};

/**
 * Restore previous purchases
 */
export const restorePurchases = async () => {
  try {
    // In a real app, we would:
    // 1. Call the Google Play or App Store API to retrieve purchase history
    // 2. Validate receipts with our server
    // 3. Update local purchase status
    
    // For demo purposes, we'll just return our current mock status
    return Object.keys(MOCK_PURCHASE_STATUS).filter(
      key => MOCK_PURCHASE_STATUS[key]
    ).map(key => ({
      productId: PRODUCTS[key],
      transactionId: 'mock-transaction-' + Math.floor(Math.random() * 1000000),
      purchaseTime: new Date().toISOString(),
      status: 'completed'
    }));
  } catch (error) {
    console.error('Error restoring purchases:', error);
    throw error;
  }
};

/**
 * Check if a feature is available based on purchases
 * @param {string} feature - Feature to check
 */
export const isFeatureAvailable = async (feature) => {
  try {
    const featureFlags = getFeatureFlags();
    
    // If feature is free, allow access
    if (!featureFlags.premium[feature]) {
      return true;
    }
    
    // Check if user has premium subscription
    const hasPremiumMonthly = await hasPurchased(PRODUCTS.PREMIUM_MONTHLY);
    const hasPremiumYearly = await hasPurchased(PRODUCTS.PREMIUM_YEARLY);
    
    if (hasPremiumMonthly || hasPremiumYearly) {
      return true;
    }
    
    // Check for individual feature purchases
    if (feature === 'plantIdentification') {
      const hasPlantIdUnlimited = await hasPurchased(PRODUCTS.PLANT_ID_UNLIMITED);
      return hasPlantIdUnlimited;
    }
    
    return false;
  } catch (error) {
    console.error('Error checking feature availability:', error);
    return false;
  }
};

/**
 * Cancel a subscription
 * @param {string} productId - ID of the subscription to cancel
 */
export const cancelSubscription = async (productId) => {
  try {
    // In a real app, we would:
    // 1. Send cancellation request to Google Play or App Store
    // 2. Update server-side subscription status
    // 3. Update local subscription status
    
    // For demo, update mock purchase status
    for (const key in PRODUCTS) {
      if (PRODUCTS[key] === productId) {
        MOCK_PURCHASE_STATUS[key] = false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};

/**
 * Create a payment URL with the server (VNPay integration)
 * @param {Object} paymentData - Payment information
 * @param {number} paymentData.amount - Payment amount in VND
 * @param {string} paymentData.productId - Product ID
 * @param {boolean} directRedirect - Whether to redirect directly or return URL
 */
export const createServerPayment = async (paymentData, directRedirect = false) => {
  try {
    const { amount, productId } = paymentData;
    
    // Get stored authentication token
    const authToken = await getAuthToken();
    
    // Check for required data
    if (!amount || !productId) {
      throw new Error('Missing required payment data');
    }
    
    // Get product details
    const product = Object.values(PRODUCT_DETAILS).find(p => p.id === productId);
    if (!product) {
      throw new Error('Invalid product ID');
    }
    
    // Prepare request data
    const requestData = {
      amount: product.price,
      orderInfo: `Purchase ${product.title}`,
      orderType: product.type === 'subscription' ? 'subscription' : 'oneTime',
      directRedirect
    };
    
    // Make API request
    const response = await fetch('http://localhost:3010/payment/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'x-direct-redirect': directRedirect ? 'true' : 'false'
      },
      body: JSON.stringify(requestData),
      // Set to 'same-origin' for same-origin requests, or omit for no-credentials
      credentials: 'same-origin'
    });
    
    // Handle non-successful responses
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Payment creation failed');
    }
    
    // Parse response data
    const responseData = await response.json();
    
    // Return payment URL and details
    return {
      paymentUrl: responseData.data.paymentUrl,
      orderId: responseData.data.orderId,
      amount: responseData.data.amount,
      expireTime: responseData.data.expireTime,
      paymentId: responseData.data.paymentId
    };
  } catch (error) {
    console.error('Server payment error:', error);
    throw error;
  }
};

// Helper function to get the auth token
const getAuthToken = async () => {
  // In a real app, you would retrieve the token from secure storage
  // For now, return a mock token or empty string
  return 'mock-auth-token';
};