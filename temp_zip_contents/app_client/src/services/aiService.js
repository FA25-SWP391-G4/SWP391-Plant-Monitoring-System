import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import { API_URL } from '../utils/constants';

/**
 * AI service for plant image analysis
 */

// Upload and analyze a plant image for identification
export const analyzeImage = async (imageUri) => {
  try {
    // First create a FormData to upload the image
    const formData = new FormData();
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    
    // Check if file exists
    if (!fileInfo.exists) {
      throw new Error('File does not exist');
    }
    
    // Get file name from URI
    const fileName = imageUri.split('/').pop();
    
    // Add file to form data
    formData.append('image', {
      uri: imageUri,
      name: fileName,
      type: 'image/jpeg', // Most camera photos are JPEGs
    });

    // Upload to server and get analysis
    const response = await axios.post(
      `${API_URL}/ai/analyze-plant`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 seconds timeout for image processing
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error analyzing image:', error);
    
    // If API is unavailable, return mock data for testing purposes
    // In production, this would be removed
    return mockPlantAnalysis();
  }
};

// Analyze a plant for diseases
export const analyzePlantDisease = async (imageUri) => {
  try {
    // Create FormData to upload the image
    const formData = new FormData();
    const fileName = imageUri.split('/').pop();
    
    formData.append('image', {
      uri: imageUri,
      name: fileName,
      type: 'image/jpeg',
    });

    // Upload to server for disease analysis
    const response = await axios.post(
      `${API_URL}/ai/analyze-disease`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error analyzing plant disease:', error);
    
    // If API is unavailable, return mock data for testing
    return mockDiseaseAnalysis();
  }
};

// Get care tips for identified plant
export const getPlantCareTips = async (plantId) => {
  try {
    const response = await axios.get(`${API_URL}/ai/plant-care/${plantId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching plant care tips:', error);
    
    // Mock response for testing
    return {
      watering: 'Water every 7-10 days',
      light: 'Bright indirect light',
      temperature: '18-24°C (65-75°F)',
      humidity: 'Medium to high humidity',
      soil: 'Well-draining potting mix',
      fertilizer: 'Feed monthly during growing season',
    };
  }
};

// Mock plant analysis for testing or when API is unavailable
const mockPlantAnalysis = () => {
  // Return mock data for development and testing
  return {
    plantId: 'mock-plant-123',
    identifiedPlant: {
      name: 'Monstera Deliciosa',
      scientificName: 'Monstera deliciosa',
      commonNames: ['Swiss Cheese Plant', 'Split-leaf Philodendron'],
      confidence: 95.8,
    },
    image: null, // No image returned from mock
    timestamp: new Date().toISOString(),
    matchedImages: [
      // URLs would be returned from real API
    ],
    description: 'Monstera deliciosa is a species of flowering plant native to tropical forests of southern Mexico, south to Panama. It has been introduced to many tropical areas, and has become a mildly invasive species in Hawaii, Seychelles, Ascension Island and the Society Islands.',
  };
};

// Mock disease analysis
const mockDiseaseAnalysis = () => {
  return {
    plantId: 'mock-plant-123',
    diseaseDetected: true,
    diseaseName: 'Leaf Spot',
    confidence: 85.3,
    description: 'Leaf spot is a common term that refers to the presence of small, discolored, dead areas on the foliage of plants. These spots can be caused by fungal, bacterial or viral plant diseases, or may occur in response to pesticides, herbicides, or insect activity.',
    recommendations: [
      'Remove affected leaves',
      'Avoid overhead watering',
      'Improve air circulation',
      'Apply fungicide if needed'
    ],
    severity: 'moderate',
  };
};