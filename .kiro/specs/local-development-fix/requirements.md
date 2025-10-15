# Requirements Document - Local Development Fix

## Introduction

Dự án hiện tại gặp vấn đề khi chạy local development do có nhiều mâu thuẫn trong cấu hình database, environment variables và dependencies. Cần một giải pháp toàn diện để đảm bảo toàn bộ dự án (main server, AI service, frontend) và đặc biệt là 3 tính năng AI chính (Chatbot, Dự báo tưới cây, Nhận diện bệnh cây) có thể chạy được local một cách ổn định và dễ dàng.

## Requirements

### Requirement 1: Database Configuration Consistency

**User Story:** Là một developer, tôi muốn database configuration nhất quán giữa tất cả các file, để tôi có thể kết nối database thành công.

#### Acceptance Criteria

1. WHEN tôi kiểm tra các file .env THEN tất cả database URLs phải sử dụng cùng một format và thông tin kết nối
2. WHEN tôi chạy docker-compose THEN database được tạo với đúng tên và credentials như trong .env files
3. WHEN các service kết nối database THEN không có lỗi authentication hoặc database not found

### Requirement 2: Environment Variables Standardization

**User Story:** Là một developer, tôi muốn environment variables được chuẩn hóa và đầy đủ, để tôi không gặp lỗi missing configuration.

#### Acceptance Criteria

1. WHEN tôi kiểm tra .env files THEN tất cả required variables phải có giá trị hợp lệ
2. WHEN tôi start services THEN không có warning về missing environment variables
3. WHEN tôi chạy development mode THEN tất cả services có thể đọc được config từ .env files

### Requirement 3: Dependencies Installation Fix

**User Story:** Là một developer, tôi muốn tất cả dependencies được cài đặt đúng cách, để tôi không gặp module not found errors.

#### Acceptance Criteria

1. WHEN tôi chạy npm install THEN tất cả packages được cài đặt thành công
2. WHEN tôi start services THEN không có lỗi về missing modules
3. WHEN tôi chạy tests THEN tất cả test dependencies có sẵn

### Requirement 4: Complete Project Startup Automation

**User Story:** Là một developer, tôi muốn có một script đơn giản để start toàn bộ dự án (main server, AI service, frontend), để tôi không phải chạy nhiều commands riêng lẻ.

#### Acceptance Criteria

1. WHEN tôi chạy một command duy nhất THEN tất cả infrastructure services (PostgreSQL, Redis, MQTT) được start
2. WHEN infrastructure services đã ready THEN main server, AI service và frontend được start tự động
3. WHEN tất cả services đã start THEN tôi có thể access được main app, AI endpoints và frontend
4. WHEN tôi access frontend THEN tôi có thể sử dụng được tất cả tính năng của dự án

### Requirement 5: Health Check and Validation

**User Story:** Là một developer, tôi muốn có cách kiểm tra nhanh xem tất cả services có hoạt động đúng không, để tôi biết setup đã thành công.

#### Acceptance Criteria

1. WHEN tôi chạy health check script THEN tôi nhận được status của tất cả services
2. WHEN có service nào down THEN tôi nhận được thông báo cụ thể về service đó
3. WHEN tất cả services healthy THEN tôi có thể test các API endpoints

### Requirement 6: Error Handling and Troubleshooting

**User Story:** Là một developer, tôi muốn có hướng dẫn rõ ràng khi gặp lỗi, để tôi có thể tự giải quyết các vấn đề thường gặp.

#### Acceptance Criteria

1. WHEN tôi gặp lỗi port conflict THEN tôi có script để kill processes và restart
2. WHEN tôi gặp lỗi database connection THEN tôi có hướng dẫn để reset database
3. WHEN tôi gặp lỗi missing dependencies THEN tôi có script để reinstall tất cả packages

### Requirement 7: AI Features Local Functionality

**User Story:** Là một developer, tôi muốn 3 tính năng AI chính (Chatbot, Dự báo tưới cây, Nhận diện bệnh cây) chạy được hoàn toàn trên local environment, để tôi có thể develop và test mà không cần external services.

#### Acceptance Criteria

1. WHEN tôi start AI service local THEN chatbot feature hoạt động và trả về response từ OpenRouter API
2. WHEN tôi start AI service local THEN irrigation prediction feature hoạt động với sensor data input
3. WHEN tôi start AI service local THEN disease detection feature hoạt động với image upload
4. WHEN tôi access frontend local THEN tôi có thể sử dụng được cả 3 tính năng AI qua web interface
5. WHEN tôi test các API endpoints THEN tất cả 3 tính năng trả về kết quả chính xác

### Requirement 8: Development Workflow Optimization

**User Story:** Là một developer, tôi muốn có workflow development hiệu quả, để tôi có thể code và test nhanh chóng.

#### Acceptance Criteria

1. WHEN tôi thay đổi code THEN services tự động restart với nodemon
2. WHEN tôi cần test API THEN tôi có sẵn test scripts và sample requests cho cả 3 tính năng AI
3. WHEN tôi cần debug THEN tôi có access đến logs và monitoring tools
4. WHEN tôi muốn test frontend THEN tôi có thể access các trang AI features qua browser