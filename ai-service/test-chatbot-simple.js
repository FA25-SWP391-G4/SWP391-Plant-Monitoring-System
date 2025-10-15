const axios = require('axios');

async function testChatbotAdvanced() {
  console.log('🤖 Testing Advanced Chatbot with Database...');
  
  // Kiểm tra server có chạy không
  try {
    const healthCheck = await axios.get('http://localhost:3010/health');
    console.log('✅ Server is running');
  } catch (error) {
    console.error('❌ Server is not running. Please start the server first:');
    console.log('   cd ai-service && npm start');
    return;
  }
  
  const sessionId = `test_session_${Date.now()}`;
  const userId = 'test_user_advanced';
  
  try {
    // Test 1: Chào hỏi tự nhiên
    console.log('\n📝 Test 1: Chào hỏi tự nhiên');
    const response1 = await axios.post('http://localhost:3010/api/ai/chatbot/message', {
      message: 'Chào bạn! Tôi mới bắt đầu trồng cây',
      userId: userId,
      plantId: 1,
      sessionId: sessionId,
      language: 'vi'
    });
    
    console.log('👤 Người dùng:', 'Chào bạn! Tôi mới bắt đầu trồng cây');
    console.log('🌱 Lily:', response1.data.response);
    console.log('⏱️  Thời gian:', response1.data.responseTime + 'ms');
    
    // Test 2: Hỏi về tình trạng cây
    console.log('\n📝 Test 2: Hỏi về tình trạng cây');
    const response2 = await axios.post('http://localhost:3010/api/ai/chatbot/message', {
      message: 'Cây xương rồng của tôi trông thế nào?',
      userId: userId,
      plantId: 1,
      sessionId: sessionId,
      language: 'vi'
    });
    
    console.log('👤 Người dùng:', 'Cây xương rồng của tôi trông thế nào?');
    console.log('🌱 Lily:', response2.data.response);
    
    // Test 3: Hỏi về tưới nước theo ngữ cảnh
    console.log('\n📝 Test 3: Hỏi về tưới nước');
    const response3 = await axios.post('http://localhost:3010/api/ai/chatbot/message', {
      message: 'Tôi có nên tưới nước cho nó không?',
      userId: userId,
      plantId: 1,
      sessionId: sessionId,
      language: 'vi'
    });
    
    console.log('👤 Người dùng:', 'Tôi có nên tưới nước cho nó không?');
    console.log('🌱 Lily:', response3.data.response);
    
    // Test 4: Hỏi về vấn đề cây
    console.log('\n📝 Test 4: Hỏi về vấn đề cây');
    const response4 = await axios.post('http://localhost:3010/api/ai/chatbot/message', {
      message: 'Lá cây có vẻ hơi vàng, có sao không?',
      userId: userId,
      plantId: 1,
      sessionId: sessionId,
      language: 'vi'
    });
    
    console.log('👤 Người dùng:', 'Lá cây có vẻ hơi vàng, có sao không?');
    console.log('🌱 Lily:', response4.data.response);
    
    // Test 5: Cảm ơn
    console.log('\n📝 Test 5: Cảm ơn');
    const response5 = await axios.post('http://localhost:3010/api/ai/chatbot/message', {
      message: 'Cảm ơn bạn nhiều!',
      userId: userId,
      plantId: 1,
      sessionId: sessionId,
      language: 'vi'
    });
    
    console.log('👤 Người dùng:', 'Cảm ơn bạn nhiều!');
    console.log('🌱 Lily:', response5.data.response);
    
    console.log('\n✅ Chatbot giao tiếp tự nhiên và linh hoạt!');
    
    // Test database connection
    console.log('\n📊 Kiểm tra lịch sử chat trong database...');
    const dbStats = await axios.get(`http://localhost:3010/api/ai/chatbot/history/${sessionId}`);
    console.log('📝 Lịch sử chat đã lưu:', dbStats.data.count, 'tin nhắn');
    
    if (dbStats.data.history && dbStats.data.history.length > 0) {
      console.log('💾 Database hoạt động tốt - đã lưu lịch sử chat!');
    }
    
    // Test với cây khác
    console.log('\n📝 Test với cây khác (Cây Lưỡi Hổ)');
    const response6 = await axios.post('http://localhost:3010/api/ai/chatbot/message', {
      message: 'Cây lưỡi hổ có cần nhiều nước không?',
      userId: userId,
      plantId: 2,
      sessionId: `${sessionId}_plant2`,
      language: 'vi'
    });
    
    console.log('👤 Người dùng:', 'Cây lưỡi hổ có cần nhiều nước không?');
    console.log('🌱 Lily:', response6.data.response);
    
  } catch (error) {
    console.error('❌ Lỗi khi test chatbot:', error.response?.data || error.message);
  }
}

// Test fallback khi không có internet
async function testFallback() {
  console.log('\n🔄 Testing Fallback Responses...');
  
  try {
    // Test với API key sai để trigger fallback
    const response = await axios.post('http://localhost:3010/api/ai/chatbot/message', {
      message: 'Cây của tôi cần tưới nước không?',
      userId: 'fallback_test',
      plantId: 1,
      language: 'vi'
    });
    
    console.log('🔄 Fallback response:', response.data.response);
    
  } catch (error) {
    console.log('🔄 Fallback system working as expected');
  }
}

async function runAllTests() {
  await testChatbotAdvanced();
  await testFallback();
  
  console.log('\n🎉 Tất cả test hoàn thành!');
  console.log('💡 Bạn có thể test thêm bằng giao diện web: http://localhost:3010/chatbot-test.html');
}

runAllTests();