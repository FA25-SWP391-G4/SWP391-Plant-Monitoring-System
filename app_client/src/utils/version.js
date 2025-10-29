/**
 * Application version and feature flags configuration
 */

// App version details
export const APP_VERSION = '1.0.0';
export const APP_BUILD = 1;
export const ANDROID_TARGET_SDK = 34; // Android 14
export const ANDROID_MIN_SDK = 24;

// Feature flags - enable/disable features based on build type or environment
export const FEATURES = {
  // AI Image Analysis
  AI_PLANT_IDENTIFICATION: true,
  AI_DISEASE_DETECTION: true,
  
  // Device Integration
  DEVICE_DISCOVERY: true,
  WIFI_SENSOR_INTEGRATION: true,
  BLUETOOTH_SENSOR_INTEGRATION: true,
  
  // Payment Features
  IN_APP_PURCHASES: true,
  SUBSCRIPTION_FEATURES: true,
  
  // Premium Features
  PREMIUM_DATA_ANALYSIS: true,
  PREMIUM_UNLIMITED_PLANTS: true,
  PREMIUM_ADVANCED_REPORTS: true,
  COMMUNITY_SHARING: true,
};

// Premium plan pricing
export const PRICING = {
  // Base prices
  BASE_MONTHLY: 2.99,
  BASE_YEARLY: 24.99,
  
  // Premium tier 1 (175% markup)
  PREMIUM_TIER_1_MONTHLY: 2.99 * 1.75,
  PREMIUM_TIER_1_YEARLY: 24.99 * 1.75,
  
  // Premium tier 2 (199% markup)
  PREMIUM_TIER_2_MONTHLY: 2.99 * 1.99,
  PREMIUM_TIER_2_YEARLY: 24.99 * 1.99,
};

// Google Play product IDs
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'com.plantsmart.app.premium_monthly',
  PREMIUM_YEARLY: 'com.plantsmart.app.premium_yearly',
  PREMIUM_TIER_1_MONTHLY: 'com.plantsmart.app.premium_tier1_monthly',
  PREMIUM_TIER_1_YEARLY: 'com.plantsmart.app.premium_tier1_yearly',
  PREMIUM_TIER_2_MONTHLY: 'com.plantsmart.app.premium_tier2_monthly',
  PREMIUM_TIER_2_YEARLY: 'com.plantsmart.app.premium_tier2_yearly',
};