const axios = require('axios');

async function analyzeChatbotLimitations() {
  console.log('🔍 Analyzing Chatbot Limitations and Issues...\n');
  
  const AI_SERVICE = 'http://localhost:8000';
  const BACKEND = 'http://localhost:3001';
  
  // Get auth token
  const loginResponse = await axios.post(`${BACKEND}/auth/login`, {
    email: 'test@example.com',
    password: 'password123'
  });
  const token = loginResponse.data.data.token;
  
  console.log('📋 TESTING VARIOUS EDGE CASES AND LIMITATIONS:\n');
  
  const testCases = [
    {
      category: '🌍 Language Detection Issues',
      tests: [
        'plant care', // English but simple
        'cây xanh', // Vietnamese but simple
        'My cây is dying', // Mixed language
        'How to chăm sóc plants?', // Mixed language
        'Tôi có một plant bị vàng leaves', // Heavy mixing
      ]
    },
    {
      category: '🤖 AI Response Quality',
      tests: [
        'Cây lan cần gì?', // Very short question
        'Tôi có một cây rất đặc biệt, nó có lá màu tím, thân màu đỏ, cao 2 mét, trồng trong chậu nhỏ, để trong phòng tối, tưới nước mỗi ngày 5 lít, bón phân hóa học mạnh, và bây giờ nó bị héo. Bạn có thể giúp tôi không?', // Very long question
        'Cây của tôi bị bệnh lạ, lá có đốm trắng hình tam giác, rễ có mùi thối, thân cây có chất nhờn màu vàng. Đây là bệnh gì?', // Complex diagnosis
        'Tôi muốn trồng 1000 cây trong phòng 10m2, có được không?', // Unrealistic scenario
      ]
    },
    {
      category: '⚡ Performance & Rate Limiting',
      tests: [
        'Test message 1',
        'Test message 2', 
        'Test message 3',
        'Test message 4',
        'Test message 5', // Rapid fire to test rate limiting
      ]
    },
    {
      category: '🔒 Security & Input Validation',
      tests: [
        '<script>alert("xss")</script>Cây của tôi bị vàng lá', // XSS attempt
        'DROP TABLE users; -- Cây cần nước', // SQL injection attempt
        'A'.repeat(10000) + ' cây', // Very long input
        '', // Empty input
        '   ', // Whitespace only
        '🌱🌿🍃🌳🌲🎋🎍🌴🌵🌾🌻🌺🌸🌼🌷', // Only emojis
      ]
    },
    {
      category: '🎯 Context & Memory',
      tests: [
        'Tôi có một cây hoa hồng',
        'Nó bị vàng lá',
        'Tôi đã tưới nước hôm qua',
        'Vậy nguyên nhân là gì?', // Requires context from previous messages
        'Cây đó cần bao nhiêu ánh sáng?', // Reference to previous plant
      ]
    },
    {
      category: '❌ Error Handling',
      tests: [
        'Cây của tôi bị vàng lá', // Normal case for comparison
      ]
    }
  ];
  
  const results = {
    passed: 0,
    failed: 0,
    issues: []
  };
  
  for (const category of testCases) {
    console.log(`\n${category.category}:`);
    console.log('='.repeat(60));
    
    for (let i = 0; i < category.tests.length; i++) {
      const message = category.tests[i];
      const displayMessage = message.length > 100 ? message.substring(0, 100) + '...' : message;
      
      try {
        console.log(`\n${i + 1}. Testing: "${displayMessage}"`);
        
        const startTime = Date.now();
        const response = await axios.post(`${AI_SERVICE}/api/chatbot/query`, {
          message: message,
          conversation_id: `analysis_${Date.now()}_${i}`
        }, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });
        
        const responseTime = Date.now() - startTime;
        const data = response.data.data;
        
        console.log(`   ✅ Response time: ${responseTime}ms`);
        console.log(`   📊 Source: ${data.source}, Language: ${data.language || 'auto'}`);
        console.log(`   🎯 Plant-related: ${data.isPlantRelated}, Confidence: ${(data.confidence * 100).toFixed(1)}%`);
        console.log(`   📝 Response length: ${data.response.length} chars`);
        
        // Check for potential issues
        if (responseTime > 5000) {
          results.issues.push(`Slow response (${responseTime}ms) for: "${displayMessage}"`);
        }
        
        if (data.response.length < 10) {
          results.issues.push(`Very short response for: "${displayMessage}"`);
        }
        
        if (data.confidence < 0.3) {
          results.issues.push(`Low confidence (${(data.confidence * 100).toFixed(1)}%) for: "${displayMessage}"`);
        }
        
        // Check for XSS in response
        if (data.response.includes('<script>') || data.response.includes('alert(')) {
          results.issues.push(`Potential XSS vulnerability in response for: "${displayMessage}"`);
        }
        
        results.passed++;
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
        results.failed++;
        results.issues.push(`Request failed for: "${displayMessage}" - ${error.message}`);
      }
      
      // Add delay to avoid overwhelming the service
      if (category.category.includes('Performance')) {
        await new Promise(resolve => setTimeout(resolve, 100));
      } else {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  // Test API key dependency
  console.log('\n🔑 Testing API Key Dependency:');
  console.log('='.repeat(60));
  
  try {
    const statusResponse = await axios.get(`${AI_SERVICE}/api/chatbot/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const status = statusResponse.data.data;
    console.log(`API Key configured: ${status.configured}`);
    console.log(`Model: ${status.model}`);
    console.log(`Queue length: ${status.queueLength}`);
    
    if (!status.configured) {
      results.issues.push('OpenRouter API key not configured - limited to fallback responses');
    }
    
  } catch (error) {
    results.issues.push(`Cannot get service status: ${error.message}`);
  }
  
  // Summary
  console.log('\n📊 ANALYSIS SUMMARY:');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Issues found: ${results.issues.length}`);
  
  if (results.issues.length > 0) {
    console.log('\n🚨 IDENTIFIED ISSUES:');
    results.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }
  
  console.log('\n🔧 RECOMMENDATIONS:');
  console.log('1. Add input sanitization for XSS protection');
  console.log('2. Implement conversation context memory');
  console.log('3. Add response caching for common questions');
  console.log('4. Improve mixed-language detection');
  console.log('5. Add response quality validation');
  console.log('6. Implement graceful degradation for API failures');
  console.log('7. Add rate limiting per user');
  console.log('8. Improve error messages for users');
}

analyzeChatbotLimitations().catch(console.error);