/**
 * Language API Test Script
 * 
 * This script tests the language API endpoints to ensure they work correctly.
 * It requires a JWT token for authentication.
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const API_URL = 'http://localhost:3010'; // Adjust based on your app's port
const OUTPUT_FILE = 'language-api-test-results.md';

// JWT token for authentication (you need to replace this with a valid token)
// You can get a token by logging in through the application
const JWT_TOKEN = 'your-jwt-token'; // Replace with actual token

// Create an axios instance with authentication
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${JWT_TOKEN}`
  }
});

// Start the test report
let report = `# Language API Test Results\n\n`;
report += `_Generated on ${new Date().toLocaleString()}_\n\n`;

async function runTests() {
  console.log('Starting Language API Tests...');
  
  // Test 1: Get available languages (public endpoint)
  try {
    console.log('Test 1: Getting available languages...');
    report += `## Test 1: Get Available Languages\n\n`;
    
    const response = await axios.get(`${API_URL}/api/language/available`);
    
    report += `✅ Successfully retrieved available languages\n\n`;
    report += `Status: ${response.status}\n\n`;
    report += `Response:\n\`\`\`json\n${JSON.stringify(response.data, null, 2)}\n\`\`\`\n\n`;
  } catch (error) {
    report += `❌ Failed to get available languages\n\n`;
    report += `Error: ${error.message}\n\n`;
    
    if (error.response) {
      report += `Status: ${error.response.status}\n\n`;
      report += `Response:\n\`\`\`json\n${JSON.stringify(error.response.data, null, 2)}\n\`\`\`\n\n`;
    }
  }
  
  // Only run authenticated tests if a token is provided
  if (JWT_TOKEN !== 'your-jwt-token') {
    // Test 2: Get user language preferences (authenticated)
    try {
      console.log('Test 2: Getting user language preferences...');
      report += `## Test 2: Get User Language Preferences\n\n`;
      
      const response = await api.get(`/api/language/preferences`);
      
      report += `✅ Successfully retrieved user language preferences\n\n`;
      report += `Status: ${response.status}\n\n`;
      report += `Response:\n\`\`\`json\n${JSON.stringify(response.data, null, 2)}\n\`\`\`\n\n`;
    } catch (error) {
      report += `❌ Failed to get user language preferences\n\n`;
      report += `Error: ${error.message}\n\n`;
      
      if (error.response) {
        report += `Status: ${error.response.status}\n\n`;
        report += `Response:\n\`\`\`json\n${JSON.stringify(error.response.data, null, 2)}\n\`\`\`\n\n`;
      }
    }
    
    // Test 3: Update user language preferences (authenticated)
    try {
      console.log('Test 3: Updating user language preferences...');
      report += `## Test 3: Update User Language Preferences\n\n`;
      
      // Get current preference first
      const getResponse = await api.get(`/api/language/preferences`);
      const currentLanguage = getResponse.data.language;
      const newLanguage = currentLanguage === 'en' ? 'vi' : 'en';
      
      report += `Current language: ${currentLanguage}\n\n`;
      report += `Setting language to: ${newLanguage}\n\n`;
      
      // Update to new language
      const updateResponse = await api.put(`/api/language/preferences`, {
        language: newLanguage
      });
      
      report += `✅ Successfully updated language preference\n\n`;
      report += `Status: ${updateResponse.status}\n\n`;
      report += `Response:\n\`\`\`json\n${JSON.stringify(updateResponse.data, null, 2)}\n\`\`\`\n\n`;
      
      // Verify the change
      const verifyResponse = await api.get(`/api/language/preferences`);
      
      report += `Verification - Current language: ${verifyResponse.data.language}\n\n`;
      
      // Set back to original language
      await api.put(`/api/language/preferences`, {
        language: currentLanguage
      });
      
      report += `Reset language to original: ${currentLanguage}\n\n`;
    } catch (error) {
      report += `❌ Failed to update user language preferences\n\n`;
      report += `Error: ${error.message}\n\n`;
      
      if (error.response) {
        report += `Status: ${error.response.status}\n\n`;
        report += `Response:\n\`\`\`json\n${JSON.stringify(error.response.data, null, 2)}\n\`\`\`\n\n`;
      }
    }
  } else {
    report += `## Authenticated Tests Skipped\n\n`;
    report += `Skipping authenticated tests because no JWT token was provided.\n\n`;
    report += `To run authenticated tests:\n`;
    report += `1. Log in to the application to get a JWT token\n`;
    report += `2. Update the JWT_TOKEN variable in this script with your token\n`;
    report += `3. Run the script again\n\n`;
  }
  
  // Summary
  report += `## Summary\n\n`;
  
  const successes = (report.match(/✅/g) || []).length;
  const failures = (report.match(/❌/g) || []).length;
  
  report += `Tests completed with:\n`;
  report += `- ${successes} successful tests\n`;
  report += `- ${failures} failed tests\n\n`;
  
  if (failures > 0) {
    report += `Some tests failed. Review the details above to troubleshoot.\n`;
  } else if (successes > 0) {
    report += `All tests passed successfully. The language API is working correctly.\n`;
  } else {
    report += `No tests were completed. Check the script configuration and try again.\n`;
  }
  
  // Write report to file
  fs.writeFileSync(OUTPUT_FILE, report);
  console.log(`Testing completed. Results saved to ${OUTPUT_FILE}`);
}

runTests().catch(error => {
  report += `## Error Running Tests\n\n`;
  report += `An unexpected error occurred while running the tests:\n\n`;
  report += `\`\`\`\n${error.stack}\n\`\`\`\n\n`;
  
  // Write report to file even if an error occurs
  fs.writeFileSync(OUTPUT_FILE, report);
  console.error('Error running tests:', error);
  console.log(`Partial results saved to ${OUTPUT_FILE}`);
});