/**
 * Test script to verify profile API response structure
 * Run this to check if the API endpoints are working correctly
 */

const axiosClient = require('./client/src/api/axiosClient');

// Test data
const testProfileData = {
  given_name: "Test",
  family_name: "User", 
  email: "test@example.com",
  phone_number: "+84123456789"
};

async function testProfileUpdate() {
  console.log('=== TESTING PROFILE UPDATE API ===');
  
  try {
    // Note: This will fail without proper authentication, but we can see the request structure
    console.log('Sending test request with data:', testProfileData);
    
    const response = await axiosClient.put('/users/profile', testProfileData);
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    console.log('Response structure check:');
    console.log('- Has success field:', 'success' in response.data);
    console.log('- Has data field:', 'data' in response.data);
    console.log('- Has message field:', 'message' in response.data);
    
  } catch (error) {
    console.log('Expected error (no auth token):', error.response?.status);
    console.log('Error response structure:', error.response?.data);
    
    // Check if error response has proper structure
    if (error.response?.data) {
      console.log('Error response structure check:');
      console.log('- Has success field:', 'success' in error.response.data);
      console.log('- Has error field:', 'error' in error.response.data);
    }
  }
}

// Run the test
testProfileUpdate().catch(console.error);