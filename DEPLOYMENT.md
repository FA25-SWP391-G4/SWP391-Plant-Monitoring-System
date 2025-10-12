# Hướng dẫn triển khai và kiểm thử local

## Yêu cầu hệ thống

- Node.js (phiên bản 14.x hoặc cao hơn)
- Python 3.8+ (cho AI service)
- MongoDB (cho lưu trữ dữ liệu)
- PostgreSQL (cho một số tính năng nâng cao)

## Cài đặt và chạy Backend

1. **Cài đặt dependencies**

```bash
npm install
```

2. **Cấu hình môi trường**

Tạo file `.env` tại thư mục gốc với nội dung sau:

```
PORT=3010
MONGODB_URI=mongodb://localhost:27017/plant_monitoring
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

3. **Khởi động server**

```bash
node ./bin/www
```

Sau khi khởi động thành công, server sẽ chạy tại địa chỉ: http://localhost:3010

## Cài đặt và chạy Frontend

1. **Di chuyển vào thư mục client**

```bash
cd client
```

2. **Cài đặt dependencies**

```bash
npm install
```

3. **Khởi động ứng dụng React**

```bash
npm start
```

Sau khi khởi động thành công, ứng dụng sẽ chạy tại địa chỉ: http://localhost:3000

## Cài đặt và chạy AI Service

1. **Tạo và kích hoạt môi trường ảo Python**

```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# Linux/Mac
python3 -m venv .venv
source .venv/bin/activate
```

2. **Cài đặt dependencies**

```bash
pip install fastapi uvicorn pandas numpy scikit-learn joblib
```

3. **Khởi động AI service**

```bash
cd ai_service
uvicorn main:app --reload --port 8000
```

Sau khi khởi động thành công, AI service sẽ chạy tại địa chỉ: http://localhost:8000

## Chạy toàn bộ hệ thống

Để chạy đồng thời cả backend và frontend, bạn có thể sử dụng lệnh sau tại thư mục gốc:

```bash
npm run start:dev
```

## Kiểm thử

### Kiểm thử Backend

```bash
npm test
```

### Kiểm thử Frontend

```bash
cd client
npm test
```

## Xử lý sự cố

### Lỗi kết nối MongoDB

Nếu gặp lỗi kết nối MongoDB, hãy đảm bảo:
- MongoDB đã được cài đặt và đang chạy
- URI kết nối trong file .env là chính xác

### Lỗi port đã được sử dụng

Nếu gặp lỗi "port already in use", hãy thay đổi cổng trong file .env hoặc dừng ứng dụng đang sử dụng cổng đó.

### Lỗi AI service

Nếu AI service không hoạt động:
- Kiểm tra xem Python và các thư viện cần thiết đã được cài đặt
- Đảm bảo các file model trong thư mục `ai_service/trained_models` tồn tại

## Tài liệu tham khảo

- [Tài liệu API](./docs/API_DOCUMENTATION.md)
- [Hướng dẫn tích hợp Frontend](./FRONTEND_INTEGRATION_GUIDE.md)
- [Tổng quan về xác thực NestJS](./NESTJS-AUTH-IMPLEMENTATION.md)
