# Kiến trúc Microservice và Khả năng Mở rộng

## Tổng quan kiến trúc

Hệ thống Smart Plant Irrigation AI được thiết kế theo kiến trúc microservice, cho phép phát triển, triển khai và mở rộng độc lập các thành phần khác nhau. Kiến trúc này giúp tăng tính linh hoạt, khả năng chịu lỗi và khả năng mở rộng của hệ thống.

### Các dịch vụ chính

1. **AI Service** - Dịch vụ AI chính (hiện tại)
   - Phân tích hình ảnh cây trồng
   - Dự đoán nhu cầu tưới cây
   - Tối ưu hóa lịch tưới tự động
   - Phân tích dữ liệu lịch sử
   - Chatbot hỗ trợ

2. **API Gateway** - Cổng API trung tâm
   - Xác thực và ủy quyền
   - Định tuyến yêu cầu
   - Cân bằng tải
   - Bộ nhớ đệm

3. **Plant Service** - Quản lý thông tin cây trồng
   - CRUD cây trồng
   - Thông tin loài cây
   - Yêu cầu chăm sóc

4. **Sensor Service** - Quản lý dữ liệu cảm biến
   - Thu thập dữ liệu cảm biến
   - Xử lý dữ liệu thời gian thực
   - Lưu trữ lịch sử

5. **User Service** - Quản lý người dùng
   - Xác thực
   - Quản lý hồ sơ
   - Phân quyền

## Giao tiếp giữa các dịch vụ

### API Gateway

API Gateway đóng vai trò là điểm vào duy nhất cho tất cả các yêu cầu từ client. Nó định tuyến yêu cầu đến các dịch vụ thích hợp và xử lý xác thực.

```
Client -> API Gateway -> Dịch vụ cụ thể
```

### Giao tiếp đồng bộ

Giao tiếp REST API được sử dụng cho các tương tác đồng bộ giữa các dịch vụ:

```
AI Service -> API Gateway -> Plant Service
AI Service -> API Gateway -> Sensor Service
```

### Giao tiếp bất đồng bộ

Giao tiếp dựa trên sự kiện được sử dụng cho các tương tác bất đồng bộ:

```
Sensor Service -> Message Queue -> AI Service
AI Service -> Message Queue -> Irrigation Controller
```

## Khả năng mở rộng

### Mở rộng theo chiều ngang

Mỗi dịch vụ có thể được mở rộng độc lập bằng cách thêm nhiều phiên bản:

```
AI Service (Instance 1)
AI Service (Instance 2)
...
AI Service (Instance N)
```

Cân bằng tải được xử lý bởi API Gateway hoặc cân bằng tải riêng cho mỗi dịch vụ.

### Mở rộng theo chiều dọc

Các dịch vụ có thể được tối ưu hóa và nâng cấp độc lập:

- Nâng cấp phần cứng
- Tối ưu hóa mã
- Cải thiện thuật toán

### Phân vùng dữ liệu

Dữ liệu có thể được phân vùng theo:

- Người dùng
- Khu vực địa lý
- Loại cây trồng

## Khả năng chịu lỗi

### Nguyên tắc Circuit Breaker

Ngăn chặn lỗi lan truyền giữa các dịch vụ:

```javascript
// Ví dụ: Circuit Breaker trong AI Service
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeout: 30000
});

async function callPlantService(plantId) {
  return circuitBreaker.fire(() => axios.get(`${API_GATEWAY_URL}/plants/${plantId}`));
}
```

### Retry và Fallback

Xử lý lỗi tạm thời và cung cấp phương án dự phòng:

```javascript
// Ví dụ: Retry và Fallback trong Chatbot
async function callMistralAPI(messages) {
  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      return await axios.post(MISTRAL_API_URL, { messages });
    } catch (error) {
      retries++;
      if (retries >= MAX_RETRIES) {
        // Fallback to simpler model
        return callFallbackModel(messages);
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
}
```

## Triển khai và Quản lý

### Containerization

Mỗi dịch vụ được đóng gói trong container Docker:

```dockerfile
# Ví dụ: Dockerfile cho AI Service
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["node", "app.js"]
```

### Orchestration

Kubernetes được sử dụng để quản lý các container:

```yaml
# Ví dụ: Kubernetes Deployment cho AI Service
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-service
  template:
    metadata:
      labels:
        app: ai-service
    spec:
      containers:
      - name: ai-service
        image: smartgarden/ai-service:latest
        ports:
        - containerPort: 3001
        resources:
          limits:
            cpu: "1"
            memory: "1Gi"
```

## Giám sát và Logging

### Giám sát

Prometheus và Grafana được sử dụng để giám sát hiệu suất:

```javascript
// Ví dụ: Metrics trong AI Service
const requestDuration = new prometheus.Histogram({
  name: 'ai_service_request_duration_seconds',
  help: 'Duration of AI Service requests in seconds',
  labelNames: ['endpoint', 'status']
});

// Đo thời gian xử lý yêu cầu
app.use((req, res, next) => {
  const end = requestDuration.startTimer();
  res.on('finish', () => {
    end({ endpoint: req.path, status: res.statusCode });
  });
  next();
});
```

### Logging

Centralized logging với ELK Stack:

```javascript
// Ví dụ: Logging trong AI Service
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'ai-service' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Trong môi trường production, gửi logs đến Elasticsearch
if (process.env.NODE_ENV === 'production') {
  logger.add(new ElasticsearchTransport({
    level: 'info',
    clientOpts: { node: 'http://elasticsearch:9200' }
  }));
}
```

## Kết luận

Kiến trúc microservice của Smart Plant Irrigation AI System cung cấp nền tảng linh hoạt, có khả năng mở rộng và chịu lỗi cao. Bằng cách tách biệt các chức năng thành các dịch vụ độc lập, hệ thống có thể phát triển và thích ứng với các yêu cầu mới mà không ảnh hưởng đến toàn bộ ứng dụng.