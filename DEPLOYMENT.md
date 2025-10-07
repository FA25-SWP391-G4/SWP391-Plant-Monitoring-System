# Hướng dẫn triển khai và kiểm thử local

## Cài đặt và chạy microservice AI

### Cài đặt thủ công

1. Di chuyển vào thư mục AI service:
```bash
cd ai_service
```

2. Cài đặt các thư viện Python cần thiết:
```bash
pip install -r requirements.txt
```

3. Chạy FastAPI server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Sử dụng Docker

1. Xây dựng và chạy container bằng Docker Compose:
```bash
docker-compose up --build
```

## Kiểm thử các tính năng AI

Sau khi triển khai, bạn có thể kiểm thử các tính năng AI thông qua:

### 1. Swagger UI của FastAPI

- Truy cập: http://localhost:8000/docs
- Thử nghiệm trực tiếp các API endpoints

### 2. Kiểm thử thông qua backend

- Đảm bảo backend đang chạy (mặc định ở cổng 3000)
- Gửi request đến các endpoints `/api/ai/*`

### 3. Kiểm thử thông qua frontend

- Truy cập các trang có tích hợp tính năng AI
- Thử nghiệm các chức năng như chatbot, phân tích hình ảnh, dự báo tưới cây, v.v.

## Các endpoints AI chính

1. **Dự báo nhu cầu tưới cây thông minh**
   - Endpoint: `/api/ai/watering-prediction`
   - Method: POST

2. **Phân tích và cảnh báo sớm tình trạng cây trồng**
   - Endpoint: `/api/ai/plant-analysis`
   - Method: POST

3. **Tối ưu lịch tưới tự động**
   - Endpoint: `/api/ai/watering-schedule`
   - Method: POST

4. **Phân tích dữ liệu lịch sử và đề xuất chăm sóc**
   - Endpoint: `/api/ai/historical-analysis`
   - Method: POST

5. **Nhận diện tình trạng cây qua ảnh**
   - Endpoint: `/api/ai/image-recognition`
   - Method: POST (multipart/form-data)

6. **Chatbot hỗ trợ người dùng**
   - Endpoint: `/api/ai/chatbot`
   - Method: POST

## Xử lý lỗi phổ biến

1. **Lỗi kết nối đến AI service**
   - Kiểm tra AI service đã chạy chưa
   - Kiểm tra biến môi trường `AI_SERVICE_URL` trong backend

2. **Lỗi thiếu thư viện Python**
   - Chạy lại `pip install -r requirements.txt`

3. **Lỗi CORS**
   - Kiểm tra cấu hình CORS trong FastAPI và backend

4. **Lỗi Docker**
   - Kiểm tra Docker và Docker Compose đã được cài đặt
   - Kiểm tra các cổng 8000 và 3000 không bị chiếm dụng