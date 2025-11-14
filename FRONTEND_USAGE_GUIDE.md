# Hướng dẫn sử dụng giao diện Plant Monitoring System

## 🚀 Khởi động hệ thống

### 1. Chạy Backend Services
```bash
# Terminal 1: Main Server
npm start

# Terminal 2: AI Service
cd ai_service && npm start
```

### 2. Chạy Frontend
```bash
# Terminal 3: Frontend
cd client && npm run dev
```

## 🌐 Truy cập ứng dụng

### URLs chính:
- **Trang chủ**: http://localhost:3000
- **Đăng nhập**: http://localhost:3000/login
- **Dashboard**: http://localhost:3000/dashboard
- **AI Chat**: http://localhost:3000/ai/chat
- **Phân tích ảnh**: http://localhost:3000/ai/image-analysis
- **Dự đoán tưới nước**: http://localhost:3000/ai/predictions

## 👤 Tài khoản test

### Thông tin đăng nhập:
- **Email**: test@example.com
- **Password**: password123
- **Role**: Regular User

### Tài khoản khác có sẵn:
- **Admin**: admin@plantsys.com
- **Premium User**: jane.smith@example.com
- **Regular User**: john.doe@example.com

## 🤖 Tính năng AI

### 1. AI Chatbot
**Đường dẫn**: `/ai/chat`

**Tính năng**:
- Chat với AI về chăm sóc cây trồng
- Hỏi đáp về bệnh cây, tưới nước, ánh sáng
- Lưu lịch sử hội thoại
- Gợi ý dựa trên dữ liệu cây cụ thể

**Cách sử dụng**:
1. Truy cập http://localhost:3000/ai/chat
2. Nhập câu hỏi về cây trồng
3. AI sẽ trả lời dựa trên kiến thức chăm sóc cây
4. Có thể hỏi về cây cụ thể nếu có plant_id

**Ví dụ câu hỏi**:
- "Cây của tôi bị vàng lá, phải làm sao?"
- "Bao lâu tưới cà chua một lần?"
- "Cây cần bao nhiêu ánh sáng?"

### 2. Disease Recognition (Nhận diện bệnh)
**Đường dẫn**: `/ai/image-analysis`

**Tính năng**:
- Upload ảnh cây để phân tích bệnh
- Nhận diện tình trạng sức khỏe cây
- Đưa ra lời khuyên điều trị
- Hiển thị độ tin cậy kết quả

**Cách sử dụng**:
1. Truy cập http://localhost:3000/ai/image-analysis
2. Chọn ảnh cây cần phân tích
3. Upload ảnh
4. Xem kết quả phân tích và lời khuyên

### 3. Watering Prediction (Dự đoán tưới nước)
**Đường dẫn**: `/ai/predictions`

**Tính năng**:
- Dự đoán nhu cầu tưới nước
- Phân tích dữ liệu sensor
- Đưa ra khuyến nghị thời gian tưới
- Hiển thị độ tin cậy dự đoán

**Cách sử dụng**:
1. Truy cập http://localhost:3000/ai/predictions
2. Nhập dữ liệu sensor (độ ẩm, nhiệt độ, ánh sáng)
3. Xem dự đoán và khuyến nghị

## 📱 Giao diện chính

### 1. Dashboard
- Tổng quan hệ thống
- Thống kê cây trồng
- Dữ liệu sensor real-time
- Thông báo quan trọng

### 2. Plant Management
- Danh sách cây trồng
- Thêm/sửa/xóa cây
- Xem chi tiết từng cây
- Lịch sử chăm sóc

### 3. Settings
- Cài đặt tài khoản
- Thay đổi mật khẩu
- Cấu hình thông báo
- Chọn ngôn ngữ

## 🔧 Tính năng kỹ thuật

### Authentication
- JWT token authentication
- Session management
- Auto-logout khi token hết hạn
- Remember login state

### Real-time Updates
- WebSocket connections (nếu có)
- Auto-refresh data
- Live sensor readings
- Instant notifications

### Responsive Design
- Mobile-friendly interface
- Tablet optimization
- Desktop full features
- Touch-friendly controls

## 🎨 UI Components

### Sử dụng Radix UI + Tailwind CSS:
- Modern, accessible components
- Dark/Light theme support
- Consistent design system
- Smooth animations

### Key Components:
- **Cards**: Hiển thị thông tin cây
- **Dialogs**: Modals cho actions
- **Forms**: Input validation
- **Charts**: Biểu đồ dữ liệu sensor
- **Notifications**: Toast messages

## 🌍 Đa ngôn ngữ (i18n)

### Ngôn ngữ hỗ trợ:
- Tiếng Việt (vi)
- English (en)
- Auto-detect browser language

### Chuyển đổi ngôn ngữ:
- Language switcher trong header
- Lưu preference trong localStorage
- Apply ngay lập tức

## 🔍 Testing & Debug

### Browser DevTools:
- Console logs cho API calls
- Network tab để xem requests
- Application tab cho localStorage

### Test Features:
1. **Login/Logout**: Kiểm tra authentication flow
2. **AI Chat**: Test chatbot responses
3. **Image Upload**: Test disease recognition
4. **Sensor Data**: Test watering predictions
5. **Navigation**: Test all page routes

## 🚨 Troubleshooting

### Lỗi thường gặp:

#### 1. "Cannot connect to server"
- Kiểm tra backend services đang chạy
- Verify URLs trong .env file
- Check CORS configuration

#### 2. "Authentication failed"
- Clear browser cookies/localStorage
- Re-login với credentials mới
- Check JWT token expiration

#### 3. "AI features not working"
- Verify AI service đang chạy (port 8000)
- Check API endpoints
- Look at console errors

#### 4. "Images not uploading"
- Check file size limits (10MB)
- Verify file types (jpg, png, gif)
- Ensure uploads directory exists

## 📞 Support

### Development Mode:
- Hot reload enabled
- Detailed error messages
- Console debugging
- Source maps available

### Production Considerations:
- Build optimization
- Error boundaries
- Performance monitoring
- Security headers

---

## 🎉 Kết luận

Giao diện Plant Monitoring System đã sẵn sàng để sử dụng với đầy đủ tính năng AI:

✅ **Authentication** - Đăng nhập/đăng ký  
✅ **AI Chatbot** - Tư vấn chăm sóc cây  
✅ **Disease Recognition** - Nhận diện bệnh từ ảnh  
✅ **Watering Prediction** - Dự đoán nhu cầu tưới nước  
✅ **Dashboard** - Quản lý tổng quan  
✅ **Plant Management** - Quản lý cây trồng  
✅ **Responsive Design** - Tương thích mobile  
✅ **Multi-language** - Đa ngôn ngữ  

**Truy cập ngay**: http://localhost:3000