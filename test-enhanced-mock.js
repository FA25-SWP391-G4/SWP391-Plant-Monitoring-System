/**
 * Enhanced Mock Integration Test
 * 
 * This script tests the integration of the enhanced device mock
 * with the dashboard and health calculation.
 */

const http = require('http');

// Test endpoints - using direct mock endpoints which don't require authentication
const endpoints = [
  '/api/mock/dashboard/overview',
  '/api/mock/dashboard/sensors',
  '/api/mock/dashboard/realtime-data',
  '/api/mock/dashboard/plant-health',
];

// Function to make a GET request
function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3010, // Default port, change if needed
      path: endpoint,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = {
            endpoint,
            statusCode: res.statusCode,
            headers: res.headers,
            data: JSON.parse(data),
          };
          resolve(result);
        } catch (e) {
          reject({
            endpoint,
            error: `Failed to parse response: ${e.message}`,
            raw: data
          });
        }
      });
    });
    
    req.on('error', (e) => {
      reject({
        endpoint,
        error: `Request failed: ${e.message}`
      });
    });
    
    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('Starting Enhanced Mock Integration Test...');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing endpoint: ${endpoint}`);
      const result = await testEndpoint(endpoint);
      
      // Check response status
      if (result.statusCode === 200) {
        console.log(`✅ ${endpoint}: Success`);
        
        // Basic validation based on endpoint
        if (endpoint.includes('overview')) {
          console.log(`  - Plants found: ${result.data.data.plants.length}`);
          console.log(`  - Real-time data included: ${!!result.data.data.realtimeData}`);
          console.log(`  - Health history included: ${!!result.data.data.healthHistory}`);
        } 
        else if (endpoint.includes('plant-health')) {
          console.log(`  - Health records: ${result.data.data.length}`);
          if (result.data.data.length > 0) {
            const firstRecord = result.data.data[0];
            console.log(`  - Sample record: Plant ID ${firstRecord.plant_id}, Score: ${firstRecord.health_score}`);
          }
        }
        else if (endpoint.includes('realtime-data')) {
          console.log(`  - Device ID: ${result.data.data.deviceId}`);
          console.log(`  - Soil moisture: ${result.data.data.soil_moisture}`);
          console.log(`  - Temperature: ${result.data.data.temperature}`);
          console.log(`  - Message type: ${result.data.data.messageType}`);
        }
      } else {
        console.log(`❌ ${endpoint}: Failed with status ${result.statusCode}`);
        console.log(`  Error: ${JSON.stringify(result.data)}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: Error: ${error.error}`);
    }
    
    // Add a little delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\nTests completed.');
}

// Start the tests
runTests().catch(console.error);