# 🚀 Quick Test Guide - AI Features

## ⚡ Truy cập nhanh

### 1. Mở browser và truy cập:
```
http://localhost:3000
```

### 2. Scroll xuống section "🤖 Test AI Features"
- Có thông tin login test
- Có buttons để test từng tính năng

### 3. Login để test:
- Click "Login to Test" 
- Hoặc truy cập trực tiếp: http://localhost:3000/login
- **Email**: test@example.com
- **Password**: password123

### 4. Sau khi login, test các trang AI:

#### 💬 AI Chatbot
- URL: http://localhost:3000/ai/chat
- Test: Gửi tin nhắn "Cây của tôi bị vàng lá"
- Expected: AI trả lời về chăm sóc cây

#### 📸 Disease Detection  
- URL: http://localhost:3000/ai/image-analysis
- Test: Upload ảnh cây (có sẵn test-plant-image.jpg)
- Expected: Hiển thị kết quả phân tích bệnh

#### 🔮 Watering Prediction
- URL: http://localhost:3000/ai/predictions
- Test: Nhập sensor data (moisture: 25, temp: 28, humidity: 60, light: 75)
- Expected: Hiển thị dự đoán "needs water"

## 🔧 Debug Steps

### Nếu không truy cập được trang AI:

1. **Kiểm tra authentication**:
   - Truy cập: http://localhost:3000/test-auth
   - Xem có user info và token không

2. **Kiểm tra browser console**:
   - F12 > Console tab
   - Xem có lỗi JavaScript không

3. **Kiểm tra cookies**:
   - F12 > Application > Cookies
   - Phải có `token` và `user` cookies

4. **Kiểm tra services**:
   ```bash
   # Backend
   curl http://localhost:3001/
   
   # AI Service  
   curl http://localhost:8000/health
   
   # Frontend
   curl http://localhost:3000/
   ```

## 🎯 Expected Results

### ✅ Thành công khi:
- Login được với test account
- Cookies được set đúng
- Truy cập được 3 trang AI
- AI features hoạt động (có response)

### ❌ Lỗi thường gặp:
- **Redirect về trang chủ**: Chưa login hoặc token hết hạn
- **404 Not Found**: Component không tồn tại
- **500 Server Error**: Backend/AI service không chạy
- **Blank page**: JavaScript error, check console

## 🔗 Quick Links

- **Home**: http://localhost:3000
- **Login**: http://localhost:3000/login  
- **Test Auth**: http://localhost:3000/test-auth
- **AI Chat**: http://localhost:3000/ai/chat
- **Image Analysis**: http://localhost:3000/ai/image-analysis
- **Predictions**: http://localhost:3000/ai/predictions

## 📱 Mobile Testing

Giao diện responsive, có thể test trên mobile:
- Chrome DevTools > Toggle device toolbar
- Hoặc truy cập từ điện thoại cùng mạng: http://[IP]:3000

---

**🎉 Nếu tất cả hoạt động = Hệ thống AI đã sẵn sàng demo!**