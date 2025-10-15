const axios = require('axios');
const assert = require('assert');

const API_URL = 'http://localhost:3003/api/chatbot';

// Unit Testing - Kiểm tra các hàm xử lý
async function unitTestChatbot() {
  console.log('\n===== UNIT TESTING =====');
  try {
    // Test 1: Kiểm tra API trả về phản hồi đúng định dạng
    console.log('Test 1: Kiểm tra định dạng phản hồi...');
    const messageData = {
      userId: 'test_user_123',
      message: 'Cây của tôi cần tưới nước không?',
      plantId: '1'
    };
    
    const response = await axios.post(`${API_URL}/message`, messageData);
    
    assert(response.data.success === true, 'Phản hồi phải có trường success là true');
    assert(typeof response.data.response === 'string', 'Phản hồi phải có trường response là chuỗi');
    assert(response.data.responseTime > 0, 'Phản hồi phải có trường responseTime > 0');
    console.log('✅ Test 1 thành công: Định dạng phản hồi đúng');
    console.log(`Thời gian phản hồi: ${response.data.responseTime}ms`);
    
    // Test 2: Kiểm tra xử lý tin nhắn trống
    console.log('\nTest 2: Kiểm tra xử lý tin nhắn trống...');
    const emptyMessageData = {
      userId: 'test_user_123',
      message: '',
      plantId: '1'
    };
    
    const emptyResponse = await axios.post(`${API_URL}/message`, emptyMessageData);
    assert(emptyResponse.data.success === false, 'Tin nhắn trống phải trả về success là false');
    assert(emptyResponse.data.message.includes('không được để trống'), 'Phải có thông báo lỗi về tin nhắn trống');
    console.log('✅ Test 2 thành công: Xử lý tin nhắn trống đúng');
    
    // Test 3: Kiểm tra API simulate-data
    console.log('\nTest 3: Kiểm tra API simulate-data...');
    const simulateResponse = await axios.get(`${API_URL}/simulate-data?plantId=1`);
    
    assert(simulateResponse.data.plantInfo, 'Phải có thông tin cây trồng');
    assert(simulateResponse.data.sensorData, 'Phải có dữ liệu cảm biến');
    assert(simulateResponse.data.wateringHistory, 'Phải có lịch sử tưới nước');
    console.log('✅ Test 3 thành công: API simulate-data hoạt động đúng');
    
    console.log('\n✅ Unit Testing hoàn tất thành công!');
    return true;
  } catch (error) {
    console.error('❌ Unit Testing thất bại!', error.message);
    if (error.response) {
      console.error('Chi tiết lỗi:', error.response.data);
    } else {
      console.error(error);
    }
    return false;
  }
}

// Integration Testing - Kiểm tra tích hợp giữa chatbot và dữ liệu cảm biến
async function integrationTestChatbot() {
  console.log('\n===== INTEGRATION TESTING =====');
  try {
    // Test 1: Kiểm tra chatbot sử dụng dữ liệu cảm biến trong câu trả lời
    console.log('Test 1: Kiểm tra tích hợp dữ liệu cảm biến...');
    
    // Lấy dữ liệu cảm biến hiện tại
    const sensorData = await axios.get(`${API_URL}/simulate-data?plantId=1`);
    const moisture = sensorData.data.sensorData.moisture;
    
    // Gửi câu hỏi liên quan đến độ ẩm đất
    const messageData = {
      userId: 'test_user_456',
      message: 'Độ ẩm đất của cây tôi hiện tại là bao nhiêu?',
      plantId: '1'
    };
    
    const response = await axios.post(`${API_URL}/message`, messageData);
    
    // Kiểm tra xem câu trả lời có chứa thông tin về độ ẩm đất không
    const containsMoistureInfo = response.data.response.includes(moisture.toString()) || 
                               response.data.response.toLowerCase().includes('độ ẩm');
    
    assert(containsMoistureInfo, 'Câu trả lời phải chứa thông tin về độ ẩm đất');
    console.log('✅ Test 1 thành công: Chatbot sử dụng dữ liệu cảm biến trong câu trả lời');
    
    // Test 2: Kiểm tra các kịch bản khác nhau
    console.log('\nTest 2: Kiểm tra các kịch bản khác nhau...');
    
    // Kịch bản thiếu nước
    const scenario1 = await axios.get(`${API_URL}/simulate-data?plantId=1&scenario=Thiếu nước`);
    assert(scenario1.data.sensorData.moisture < 30, 'Kịch bản thiếu nước phải có độ ẩm đất thấp');
    
    // Kịch bản quá nóng
    const scenario2 = await axios.get(`${API_URL}/simulate-data?plantId=1&scenario=Quá nóng`);
    assert(scenario2.data.sensorData.temperature > 30, 'Kịch bản quá nóng phải có nhiệt độ cao');
    
    console.log('✅ Test 2 thành công: Các kịch bản hoạt động đúng');
    
    console.log('\n✅ Integration Testing hoàn tất thành công!');
    return true;
  } catch (error) {
    console.error('❌ Integration Testing thất bại!', error.message);
    if (error.response) {
      console.error('Chi tiết lỗi:', error.response.data);
    } else {
      console.error(error);
    }
    return false;
  }
}

// End-to-End Testing - Kiểm tra luồng hoạt động hoàn chỉnh
async function e2eTestChatbot() {
  console.log('\n===== END-TO-END TESTING =====');
  try {
    // Mô phỏng một cuộc hội thoại hoàn chỉnh
    console.log('Mô phỏng cuộc hội thoại hoàn chỉnh...');
    
    const userId = 'test_user_789';
    const plantId = '2'; // Cây lưỡi hổ
    
    // Lấy thông tin cây trồng
    const plantInfo = await axios.get(`${API_URL}/simulate-data?plantId=${plantId}`);
    console.log(`Đang kiểm tra với cây: ${plantInfo.data.plantInfo.name}`);
    
    // Câu hỏi 1: Thông tin chung về cây
    console.log('\nCâu hỏi 1: Thông tin chung về cây');
    const response1 = await axios.post(`${API_URL}/message`, {
      userId,
      message: `Cho tôi biết thông tin về ${plantInfo.data.plantInfo.name}?`,
      plantId
    });
    console.log(`Chatbot: ${response1.data.response}`);
    
    // Câu hỏi 2: Về điều kiện chăm sóc
    console.log('\nCâu hỏi 2: Về điều kiện chăm sóc');
    const response2 = await axios.post(`${API_URL}/message`, {
      userId,
      message: 'Cây của tôi cần điều kiện ánh sáng như thế nào?',
      plantId
    });
    console.log(`Chatbot: ${response2.data.response}`);
    
    // Câu hỏi 3: Về tình trạng hiện tại
    console.log('\nCâu hỏi 3: Về tình trạng hiện tại');
    const response3 = await axios.post(`${API_URL}/message`, {
      userId,
      message: 'Cây của tôi có vấn đề gì không?',
      plantId
    });
    console.log(`Chatbot: ${response3.data.response}`);
    
    // Câu hỏi 4: Câu hỏi không liên quan
    console.log('\nCâu hỏi 4: Câu hỏi không liên quan');
    const response4 = await axios.post(`${API_URL}/message`, {
      userId,
      message: 'Thời tiết hôm nay thế nào?',
      plantId
    });
    console.log(`Chatbot: ${response4.data.response}`);
    
    // Câu hỏi 5: Câu hỏi về cây không có trong dữ liệu
    console.log('\nCâu hỏi 5: Câu hỏi về cây không có trong dữ liệu');
    const response5 = await axios.post(`${API_URL}/message`, {
      userId,
      message: 'Làm thế nào để chăm sóc cây bonsai?',
      plantId
    });
    console.log(`Chatbot: ${response5.data.response}`);
    
    console.log('\n✅ End-to-End Testing hoàn tất thành công!');
    return true;
  } catch (error) {
    console.error('❌ End-to-End Testing thất bại!', error.message);
    if (error.response) {
      console.error('Chi tiết lỗi:', error.response.data);
    } else {
      console.error(error);
    }
    return false;
  }
}

// Stress Testing - Kiểm tra hiệu suất dưới tải cao
async function stressTestChatbot() {
  console.log('\n===== STRESS TESTING =====');
  try {
    const NUM_REQUESTS = 10;
    const CONCURRENT_REQUESTS = 5;
    
    console.log(`Gửi ${NUM_REQUESTS} yêu cầu, ${CONCURRENT_REQUESTS} yêu cầu đồng thời...`);
    
    const messageData = {
      userId: 'stress_test_user',
      message: 'Cây của tôi cần tưới nước không?',
      plantId: '1'
    };
    
    let responseTimes = [];
    let successCount = 0;
    let failCount = 0;
    
    // Tạo các nhóm yêu cầu
    for (let batch = 0; batch < NUM_REQUESTS / CONCURRENT_REQUESTS; batch++) {
      console.log(`\nĐang xử lý nhóm ${batch + 1}...`);
      
      const requests = [];
      for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
        const startTime = Date.now();
        requests.push(
          axios.post(`${API_URL}/message`, messageData)
            .then(response => {
              const endTime = Date.now();
              const responseTime = endTime - startTime;
              responseTimes.push(responseTime);
              successCount++;
              return { success: true, responseTime };
            })
            .catch(error => {
              failCount++;
              return { success: false, error };
            })
        );
      }
      
      await Promise.all(requests);
    }
    
    // Tính toán thống kê
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    const minResponseTime = Math.min(...responseTimes);
    
    console.log('\nKết quả Stress Testing:');
    console.log(`- Tổng số yêu cầu: ${NUM_REQUESTS}`);
    console.log(`- Thành công: ${successCount}`);
    console.log(`- Thất bại: ${failCount}`);
    console.log(`- Tỷ lệ thành công: ${(successCount / NUM_REQUESTS * 100).toFixed(2)}%`);
    console.log(`- Thời gian phản hồi trung bình: ${avgResponseTime.toFixed(2)}ms`);
    console.log(`- Thời gian phản hồi nhanh nhất: ${minResponseTime}ms`);
    console.log(`- Thời gian phản hồi chậm nhất: ${maxResponseTime}ms`);
    
    const success = failCount === 0;
    if (success) {
      console.log('\n✅ Stress Testing hoàn tất thành công!');
    } else {
      console.log('\n⚠️ Stress Testing hoàn tất với một số lỗi!');
    }
    
    return success;
  } catch (error) {
    console.error('❌ Stress Testing thất bại!', error.message);
    return false;
  }
}

// User Acceptance Testing - Kiểm tra trải nghiệm người dùng
async function uatTestChatbot() {
  console.log('\n===== USER ACCEPTANCE TESTING =====');
  try {
    // Kiểm tra các tình huống người dùng thực tế
    console.log('Kiểm tra các tình huống người dùng thực tế...');
    
    // Tình huống 1: Người dùng hỏi về cách chăm sóc cây
    console.log('\nTình huống 1: Người dùng hỏi về cách chăm sóc cây');
    const response1 = await axios.post(`${API_URL}/message`, {
      userId: 'uat_user_1',
      message: 'Làm thế nào để chăm sóc cây xương rồng?',
      plantId: '1'
    });
    console.log(`Chatbot: ${response1.data.response}`);
    
    // Tình huống 2: Người dùng hỏi về vấn đề cụ thể
    console.log('\nTình huống 2: Người dùng hỏi về vấn đề cụ thể');
    const response2 = await axios.post(`${API_URL}/message`, {
      userId: 'uat_user_2',
      message: 'Tại sao lá cây của tôi bị vàng?',
      plantId: '3' // Cây trầu bà
    });
    console.log(`Chatbot: ${response2.data.response}`);
    
    // Tình huống 3: Người dùng nhập tin nhắn không rõ ràng
    console.log('\nTình huống 3: Người dùng nhập tin nhắn không rõ ràng');
    const response3 = await axios.post(`${API_URL}/message`, {
      userId: 'uat_user_3',
      message: 'cây?',
      plantId: '2'
    });
    console.log(`Chatbot: ${response3.data.response}`);
    
    // Tình huống 4: Người dùng hỏi về cây không có trong dữ liệu
    console.log('\nTình huống 4: Người dùng hỏi về cây không có trong dữ liệu');
    const response4 = await axios.post(`${API_URL}/message`, {
      userId: 'uat_user_4',
      message: 'Làm thế nào để chăm sóc cây phong lan?',
      plantId: '999'
    });
    console.log(`Chatbot: ${response4.data.response}`);
    
    console.log('\n✅ User Acceptance Testing hoàn tất thành công!');
    return true;
  } catch (error) {
    console.error('❌ User Acceptance Testing thất bại!', error.message);
    if (error.response) {
      console.error('Chi tiết lỗi:', error.response.data);
    } else {
      console.error(error);
    }
    return false;
  }
}

// Chạy tất cả các bài kiểm thử
async function runAllTests() {
  console.log('===== BẮT ĐẦU KIỂM THỬ CHATBOT =====');
  
  const results = {
    unit: await unitTestChatbot(),
    integration: await integrationTestChatbot(),
    e2e: await e2eTestChatbot(),
    stress: await stressTestChatbot(),
    uat: await uatTestChatbot()
  };
  
  console.log('\n===== KẾT QUẢ KIỂM THỬ =====');
  console.log(`Unit Testing: ${results.unit ? '✅ Thành công' : '❌ Thất bại'}`);
  console.log(`Integration Testing: ${results.integration ? '✅ Thành công' : '❌ Thất bại'}`);
  console.log(`End-to-End Testing: ${results.e2e ? '✅ Thành công' : '❌ Thất bại'}`);
  console.log(`Stress Testing: ${results.stress ? '✅ Thành công' : '❌ Thất bại'}`);
  console.log(`User Acceptance Testing: ${results.uat ? '✅ Thành công' : '❌ Thất bại'}`);
  
  const overallSuccess = Object.values(results).every(result => result === true);
  console.log(`\nKết quả tổng thể: ${overallSuccess ? '✅ TẤT CẢ CÁC BÀI KIỂM THỬ ĐỀU THÀNH CÔNG' : '❌ MỘT SỐ BÀI KIỂM THỬ THẤT BẠI'}`);
}

// Chạy kiểm thử
runAllTests();