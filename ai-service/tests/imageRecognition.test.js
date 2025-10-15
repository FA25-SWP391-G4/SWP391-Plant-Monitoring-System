const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const API_URL = 'http://localhost:3001/api/image-recognition';
const TEST_IMAGE_PATH = path.join(__dirname, '../uploads/test-plant.jpg');

// Kiểm tra xem có file test không, nếu không thì tạo một file test
beforeAll(() => {
  if (!fs.existsSync(TEST_IMAGE_PATH)) {
    console.log('Không tìm thấy file test, đang tạo file test...');
    // Tạo một file ảnh đơn giản để test
    const sampleImageBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    fs.mkdirSync(path.dirname(TEST_IMAGE_PATH), { recursive: true });
    fs.writeFileSync(TEST_IMAGE_PATH, sampleImageBuffer);
    console.log('Đã tạo file test thành công!');
  }
});

describe('Kiểm thử tính năng nhận dạng hình ảnh', () => {
  test('Phân tích hình ảnh cây trồng', async () => {
    console.log('Bắt đầu kiểm thử tính năng nhận diện hình ảnh...');
    
    // Tạo form data với file ảnh
    const formData = new FormData();
    formData.append('image', fs.createReadStream(TEST_IMAGE_PATH));
    formData.append('userId', '123');
    
    // Gửi request đến API
    console.log('Đang gửi request đến API...');
    try {
      const response = await axios.post(`${API_URL}/analyze`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
      });
      
      // Kiểm tra kết quả
      console.log('Kết quả phân tích:', response.data);
      
      expect(response.data).toBeDefined();
      expect(response.data.condition).toBeDefined();
      console.log('✅ Kiểm thử thành công! API trả về kết quả phân tích.');
    } catch (error) {
      console.error('❌ Kiểm thử thất bại!', error.message);
      if (error.response) {
        console.error('Chi tiết lỗi:', error.response.data);
      }
      throw error; // Để Jest biết test đã thất bại
    }
  });

  test('Lấy lịch sử phân tích hình ảnh', async () => {
    console.log('\nĐang kiểm tra API lấy lịch sử phân tích...');
    
    try {
      const historyResponse = await axios.get(`${API_URL}/history/123`);
      
      expect(Array.isArray(historyResponse.data)).toBe(true);
      console.log('✅ Kiểm thử thành công! API trả về lịch sử phân tích.');
      console.log('Số lượng bản ghi:', historyResponse.data.length);
    } catch (error) {
      console.error('❌ Kiểm thử thất bại!', error.message);
      if (error.response) {
        console.error('Chi tiết lỗi:', error.response.data);
      }
      throw error; // Để Jest biết test đã thất bại
    }
  });
});