/**
 * Environment Variables Validation Script
 * 
 * This script validates that all required environment variables are defined.
 * Add it to the startup process to ensure the application has all needed configuration.
 */

// Required environment variables by category
const requiredVariables = {
  database: [
    'DATABASE_URL',
  ],
  server: [
    'PORT',
    'NODE_ENV',
    'FRONTEND_URL',
  ],
  authentication: [
    'JWT_SECRET',
    'JWT_EXPIRES_IN',
    'REFRESH_TOKEN_SECRET',
    'REFRESH_TOKEN_EXPIRES_IN',
  ],
  email: [
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USER',
    'EMAIL_PASSWORD',
    'EMAIL_FROM',
  ],
  payment: [
    'VNPAY_TMN_CODE',
    'VNPAY_HASH_SECRET',
    'VNPAY_URL',
    'VNPAY_RETURN_URL',
    'VNPAY_IPN_URL',
  ],
  ai: [
    'AI_SERVICE_URL',
  ],
  frontend: [
    'NEXT_PUBLIC_API_URL',
  ]
};

// Optional environment variables that should be logged if missing but not block startup
const optionalVariables = [
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
  'MQTT_BROKER_URL',
  'MQTT_USERNAME',
  'MQTT_PASSWORD',
  'MQTT_CLIENT_ID',
  'AI_MODEL_VERSION',
  'DEBUG',
  'LOG_LEVEL',
];

/**
 * Validates required environment variables
 * @returns {Array} - Missing required variables
 */
function validateRequiredVariables() {
  const missing = [];
  
  // Check each category of required variables
  Object.entries(requiredVariables).forEach(([category, variables]) => {
    variables.forEach(variable => {
      if (!process.env[variable]) {
        missing.push({ category, variable });
      }
    });
  });
  
  return missing;
}

/**
 * Checks optional environment variables
 * @returns {Array} - Missing optional variables
 */
function checkOptionalVariables() {
  return optionalVariables.filter(variable => !process.env[variable]);
}

/**
 * Validates environment variables and logs results
 * @param {boolean} exitOnMissing - Exit process if required variables are missing
 * @returns {boolean} - Whether all required variables are present
 */
function validateEnvVariables(exitOnMissing = true) {
  const missingRequired = validateRequiredVariables();
  const missingOptional = checkOptionalVariables();
  
  // Handle missing required variables
  if (missingRequired.length > 0) {
    console.error('❌ ERROR: Missing required environment variables:');
    
    // Group by category for better readability
    const byCategory = missingRequired.reduce((acc, { category, variable }) => {
      if (!acc[category]) acc[category] = [];
      acc[category].push(variable);
      return acc;
    }, {});
    
    Object.entries(byCategory).forEach(([category, variables]) => {
      console.error(`   ${category.toUpperCase()}: ${variables.join(', ')}`);
    });
    
    console.error('\nPlease set these environment variables in your .env file or environment.');
    console.error('See docs/ENVIRONMENT_VARIABLES.md for details on each variable.');
    
    if (exitOnMissing) {
      process.exit(1);
    }
    
    return false;
  }
  
  // Log missing optional variables as warnings
  if (missingOptional.length > 0) {
    console.warn('⚠️ WARNING: Missing optional environment variables:');
    console.warn(`   ${missingOptional.join(', ')}`);
    console.warn('\nThese variables are not required but may limit functionality.');
    console.warn('See docs/ENVIRONMENT_VARIABLES.md for details on each variable.');
  }
  
  console.log('✅ Environment variables validation successful');
  return true;
}

// Export the validation function
module.exports = validateEnvVariables;

// If this script is run directly, validate and exit
if (require.main === module) {
  validateEnvVariables();
}