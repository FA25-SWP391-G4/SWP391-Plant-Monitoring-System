/**
 * Language API client
 * Functions to interact with the language settings API
 */
import axiosClient from './axiosClient';

const languageApi = {
  /**
   * Get available languages
   * @returns {Promise} Promise object with available languages
   */
  getAvailableLanguages: () => axiosClient.get('/api/language/available'),
  
  /**
   * Get user's language preference
   * @returns {Promise} Promise object with user's language preference
   */
  getPreferences: () => axiosClient.get('/api/language/preferences'),
  
  /**
   * Update user's language preference
   * @param {string} language - Language code (e.g., 'en', 'vi')
   * @returns {Promise} Promise object with updated language preference
   */
  updatePreferences: (language) => axiosClient.put('/api/language/preferences', { language }),
};

export default languageApi;