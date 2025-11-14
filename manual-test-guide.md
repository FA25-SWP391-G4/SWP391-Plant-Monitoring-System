# Manual Testing Guide for AI Pages

## 🔍 Vấn đề hiện tại
Các trang AI không truy cập được do authentication middleware đang chặn.

## 🛠️ Cách test thủ công

### Bước 1: Mở browser và truy cập
```
http://localhost:3000
```

### Bước 2: Đăng nhập
1. Click vào nút "Login" hoặc truy cập: `http://localhost:3000/login`
2. Nhập thông tin:
   - **Email**: test@example.com
   - **Password**: password123
3. Click "Login"

### Bước 3: Kiểm tra authentication
Sau khi login thành công, truy cập trang test:
```
http://localhost:3000/test-auth
```

Trang này sẽ hiển thị:
- Thông tin user
- JWT token
- Buttons để test các trang AI

### Bước 4: Test các trang AI
Click vào các buttons hoặc truy cập trực tiếp:

1. **AI Chat**: `http://localhost:3000/ai/chat`
2. **Image Analysis**: `http://localhost:3000/ai/image-analysis`  
3. **Predictions**: `http://localhost:3000/ai/predictions`

## 🔧 Debug Steps

### Kiểm tra cookies trong browser:
1. Mở Developer Tools (F12)
2. Vào tab "Application" > "Cookies"
3. Kiểm tra có cookies `token` và `user` không

### Kiểm tra console errors:
1. Mở Developer Tools (F12)
2. Vào tab "Console"
3. Xem có lỗi JavaScript nào không

### Kiểm tra network requests:
1. Mở Developer Tools (F12)
2. Vào tab "Network"
3. Xem các API calls có thành công không

## 🚨 Troubleshooting

### Nếu không login được:
1. Kiểm tra backend server đang chạy (port 3001)
2. Kiểm tra database connection
3. Xem console logs của backend

### Nếu AI pages không load:
1. Kiểm tra AI service đang chạy (port 8000)
2. Kiểm tra authentication cookies
3. Xem có lỗi component nào không

### Nếu components không render:
1. Kiểm tra import paths
2. Kiểm tra dependencies
3. Restart frontend server

## 📋 Expected Results

### Sau khi login thành công:
- ✅ Redirect về dashboard hoặc trang chủ
- ✅ Cookies `token` và `user` được set
- ✅ Có thể truy cập `/test-auth`
- ✅ Có thể truy cập các trang AI

### Trang AI Chat:
- ✅ Hiển thị giao diện chat
- ✅ Có thể gửi tin nhắn
- ✅ AI trả lời tin nhắn

### Trang Image Analysis:
- ✅ Hiển thị form upload ảnh
- ✅ Có thể chọn và upload ảnh
- ✅ Hiển thị kết quả phân tích

### Trang Predictions:
- ✅ Hiển thị form nhập sensor data
- ✅ Có thể nhập dữ liệu và submit
- ✅ Hiển thị kết quả dự đoán

## 🔗 Quick Links

- **Frontend**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Test Auth**: http://localhost:3000/test-auth
- **AI Chat**: http://localhost:3000/ai/chat
- **Image Analysis**: http://localhost:3000/ai/image-analysis
- **Predictions**: http://localhost:3000/ai/predictions
- **Backend API**: http://localhost:3001
- **AI Service**: http://localhost:8000