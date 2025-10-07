# AI Microservice cho Plant Monitoring System

Microservice AI này cung cấp các tính năng trí tuệ nhân tạo cho hệ thống Plant Monitoring System, bao gồm:

1. Dự báo nhu cầu tưới cây thông minh
2. Phân tích và cảnh báo sớm tình trạng cây trồng
3. Tối ưu lịch tưới tự động
4. Phân tích dữ liệu lịch sử và đề xuất chăm sóc
5. Nhận diện tình trạng cây qua ảnh
6. Tự học và cải tiến theo dữ liệu thực tế
7. Tự động hóa quá trình tưới cây
8. Chatbot hỗ trợ người dùng

## Cài đặt và Chạy

### Yêu cầu
- Python 3.8+
- Docker và Docker Compose

### Cài đặt
```bash
# Clone repository
git clone <repository-url>

# Di chuyển vào thư mục ai_service
cd ai_service

# Cài đặt dependencies
pip install -r requirements.txt
```

### Chạy với Docker
```bash
# Build và chạy container
docker-compose up -d
```

### Chạy trực tiếp
```bash
# Chạy FastAPI server
uvicorn main:app --reload
```

## API Endpoints

- `/api/v1/watering-prediction`: Dự báo nhu cầu tưới cây
- `/api/v1/plant-analysis`: Phân tích tình trạng cây trồng
- `/api/v1/watering-schedule`: Tối ưu lịch tưới
- `/api/v1/historical-analysis`: Phân tích dữ liệu lịch sử
- `/api/v1/image-recognition`: Nhận diện tình trạng cây qua ảnh
- `/api/v1/chatbot`: Chatbot hỗ trợ người dùng

## Kiến trúc

Microservice này được xây dựng với FastAPI và sử dụng các mô hình AI để cung cấp các tính năng thông minh cho hệ thống Plant Monitoring System.