// API URL
export const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://plant-monitoring-api.example.com' // Replace with actual production URL
  : 'http://localhost:3000'; // Local development API URL

// Image URL base for plant images
export const IMAGE_BASE_URL = `${API_URL}/uploads/plants`;

// Default plant image placeholder (color) instead of requiring image file
// Will be replaced with actual image later
export const DEFAULT_PLANT_COLOR = '#4CAF50'; // Green color representing plants

// App-wide constants
export const APP_CONSTANTS = {
  // Minimum password length
  MIN_PASSWORD_LENGTH: 8,
  
  // Password validation regex (at least 1 uppercase, 1 lowercase, 1 number)
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  
  // Email validation regex
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Maximum plant name length
  MAX_PLANT_NAME_LENGTH: 50,
  
  // Maximum description length
  MAX_DESCRIPTION_LENGTH: 500,
  
  // Image upload limits
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
};

// Sensor type constants
export const SENSOR_TYPES = {
  MOISTURE: 'moisture',
  TEMPERATURE: 'temperature',
  LIGHT: 'light',
  HUMIDITY: 'humidity',
};

// Plant health status
export const PLANT_HEALTH_STATUS = {
  GOOD: 'good',
  NEEDS_WATER: 'needs_water',
  NEEDS_LIGHT: 'needs_light',
  OVERWATERED: 'overwatered',
  ATTENTION: 'attention',
};

// Notification types
export const NOTIFICATION_TYPES = {
  WATER: 'water',
  FERTILIZE: 'fertilize',
  REPOT: 'repot',
  PRUNE: 'prune',
  ALERT: 'alert',
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  AUTHENTICATION_ERROR: 'Authentication error. Please log in again.',
  VALIDATION_ERROR: 'Please check the information you provided and try again.',
  PERMISSION_DENIED: 'Permission denied. You don\'t have access to this resource.',
};