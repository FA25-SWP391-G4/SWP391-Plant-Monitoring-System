# 🌿 AI Models & Services - PlantSmart Monitoring System

Thư mục này chứa toàn bộ các mô hình Trí tuệ Nhân tạo (AI) phục vụ cho hệ thống giám sát và chăm sóc cây cảnh thông minh **PlantSmart**, bao gồm:
1. **Disease Recognition Engine (Chẩn đoán bệnh & nhận diện loài cây qua ảnh chụp lá)**
2. **Watering Prediction Engine (Dự đoán nhu cầu tưới nước theo cảm biến môi trường)**

---

## 🗂️ Cấu trúc thư mục

```text
ai_models/
├── disease_recognition/                    # 🌿 Phân hệ AI chẩn đoán bệnh qua hình ảnh
│   ├── models/                             # Trọng số mô hình ONNX tối ưu trên CPU
│   │   ├── mobilenet_v3_large_14class_320x320.onnx  # Phân loại 14 lớp bệnh (~16 MB, ~6ms)
│   │   ├── resnet18_14class_320x320.onnx            # Mô hình phân loại dự phòng (~44 MB)
│   │   └── u2netp.onnx                              # Tách nền & bóc tách lá (~4.5 MB, ~140ms)
│   ├── sample_images/                      # Bộ ảnh mẫu để kiểm thử chẩn đoán
│   ├── app.py                              # Server FastAPI phục vụ API chẩn đoán (Port 8000)
│   ├── pipeline.py                         # Master Engine kết hợp 2 giai đoạn (Tách lá + Phân loại)
│   ├── enhanced_leaf_extractor.py          # Lọc màu thực vật (HSV) & làm mịn viền lá
│   ├── demo.py                             # Script kiểm tra chẩn đoán qua dòng lệnh CLI
│   └── requirements.txt                    # Thư viện Python cần thiết
│
├── watering_prediction/                    # 💧 Phân hệ AI dự đoán chu kỳ tưới cây
│   ├── model.js                            # Logic mô hình tưới
│   ├── dataPreprocessor.js                 # Chuẩn hóa dữ liệu sensor
│   └── index.js
│
├── config.json                             # File cấu hình metadata tổng thể cho cả 2 hệ thống AI
├── tensorflow-config.js                    # Cấu hình TensorFlow runtime (nếu dùng)
└── README.md                               # Tài liệu hướng dẫn này
```

---

## 🚀 Hướng dẫn Cài đặt & Khởi động Disease Recognition Server

### 1. Yêu cầu môi trường
* **Python 3.8+** (Khuyên dùng Python 3.10 hoặc 3.11).
* Chạy hoàn toàn trên **CPU** (Không yêu cầu GPU/Card đồ họa rời).

### 2. Cài đặt thư viện Python phụ thuộc
Mở Terminal / PowerShell và chạy lệnh:

```bash
cd D:\FPTU_SEM\sem_8\EXE201\SWP391-Plant-Monitoring-System\ai_models\disease_recognition
pip install -r requirements.txt
```

> **Các gói chính được cài đặt:** `onnxruntime`, `rembg`, `fastapi`, `uvicorn`, `opencv-python`, `pillow`, `numpy`, `python-multipart`.

---

### 3. Cách khởi động Server AI

Bạn có thể chạy bằng **1 trong 2 cách**:

#### 👉 Cách 1: Chạy 1-Click từ thư mục gốc dự án (Tiện lợi nhất)
Tại thư mục gốc `SWP391-Plant-Monitoring-System`, click đúp chuột vào file:
```text
start-ai-diagnostic.bat
```

#### 👉 Cách 2: Chạy bằng dòng lệnh Terminal
```bash
cd D:\FPTU_SEM\sem_8\EXE201\SWP391-Plant-Monitoring-System\ai_models\disease_recognition
python app.py
```

* Khi server khởi động thành công, bạn sẽ thấy log:
  ```text
  Starting Plant Diagnostic Server...
  Pipeline ready on CPU (u2netp + MobileNetV3-Large).
  INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
  ```
* Truy cập `http://localhost:8000` trên trình duyệt để dùng thử Web Studio kéo thả ảnh demo có sẵn của server AI.

---

### 4. Kiểm tra thử mô hình bằng CLI (Không cần bật Web)

Để kiểm tra nhanh mô hình có phân tích chính xác trên ảnh mẫu hay không:

```bash
cd D:\FPTU_SEM\sem_8\EXE201\SWP391-Plant-Monitoring-System\ai_models\disease_recognition

# Test 1 ảnh cụ thể:
python demo.py sample_images/money_plant_manganese_toxicity.jpg

# Hoặc test toàn bộ ảnh trong thư mục:
python demo.py sample_images
```

---

## 📡 API Reference (Dành cho Web Client)

Frontend Next.js kết nối trực tiếp với server AI thông qua REST API:

* **Endpoint:** `POST http://localhost:8000/diagnose`
* **Content-Type:** `multipart/form-data`
* **Form Field:** `file` (File ảnh định dạng JPG, PNG, WEBP)
* **CORS:** Đã kích hoạt sẵn cho phép mọi client (`allow_origins=["*"]`).

### Cấu trúc dữ liệu JSON trả về:
```json
{
  "status": "DIAGNOSIS_HIGH_CONFIDENCE",
  "verdict": "CONFIDENT",
  "predicted_species": "Money Plant",
  "predicted_condition": "Manganese Toxicity",
  "confidence": 0.815,
  "confidence_margin": 0.669,
  "user_guidance": "✅ Confident diagnosis: Money Plant with Manganese Toxicity (81.5% confidence).",
  "condition_details": "Brown necrotic speckles, chlorotic leaf margins, and stunted growth...",
  "treatment_recommendation": "Flush potting soil with clean water. Check and adjust soil pH toward neutral (6.2 - 6.8). Reduce high-manganese fertilizers.",
  "timing_breakdown_ms": {
    "segmentation": 243.4,
    "isolation_smoothing": 21.5,
    "classification": 27.5,
    "total_latency": 325.2
  },
  "segmented_leaf_base64": "<chuỗi_base64_ảnh_lá_đã_bóc_tách_nền_đen>",
  "top3_predictions": [
    {"class": "Money_Plant_Manganese_Toxicity", "species": "Money Plant", "condition": "Manganese Toxicity", "confidence": 0.815},
    {"class": "Money_Plant_Healthy", "species": "Money Plant", "condition": "Healthy", "confidence": 0.146},
    {"class": "Money_Plant_Bacterial_wilt_disease", "species": "Money Plant", "condition": "Bacterial wilt disease", "confidence": 0.024}
  ]
}
```

---

## 🌿 Danh sách 14 Lớp Bệnh & 5 Loài Cây Được Hỗ Trợ

| Loài cây (*Species*) | Các tình trạng & bệnh được hỗ trợ (*Conditions*) |
| :--- | :--- |
| **Aloe** *(Nha đam)* | `Aloe_Healthy` (Khỏe mạnh)<br>`Aloe_Fungal_Infection` (Nhiễm nấm)<br>`Aloe_Sunburn` (Cháy nắng) |
| **Cactus** *(Xương rồng)* | `Cactus_Healthy` (Khỏe mạnh)<br>`Cactus_Dactylopius_Opuntia` (Bị rệp sáp hại cây) |
| **Money Plant** *(Trầu bà)* | `Money_Plant_Healthy` (Khỏe mạnh)<br>`Money_Plant_Bacterial_wilt_disease` (Héo rũ vi khuẩn)<br>`Money_Plant_Manganese_Toxicity` (Ngộ độc mangan do đất chua) |
| **Snake Plant** *(Lưỡi hổ)* | `Snake_Plant_Healthy` (Khỏe mạnh)<br>`Snake_Plant_Anthracnose` (Bệnh thán thư)<br>`Snake_Plant_Leaf_Withering` (Khô héo lá mất nước) |
| **Spider Plant** *(Cỏ lan chi / Dây nhện)* | `Spider_Plant_Healthy` (Khỏe mạnh)<br>`Spider_Plant_Fungal_leaf_spot` (Đốm lá nấm)<br>`Spider_Plant_Leaf_Tip_Necrosis` (Hoại tử/cháy đầu lá) |

---

## 🛠️ Khắc phục sự cố thường gặp (Troubleshooting)

1. **Lỗi `ModuleNotFoundError: No module named 'rembg'`:**
   - Chạy: `pip install rembg`
2. **Lỗi `Address already in use` hoặc Port 8000 bị chiếm:**
   - Kiểm tra tiến trình đang chạy port 8000: `netstat -ano | findstr :8000`
   - Hoặc đổi port khác khi chạy trong `app.py` (dòng cuối: `port=8000`).
3. **Web không mở được Camera khi bấm nút Analyze Image:**
   - Trình duyệt yêu cầu kết nối an toàn (hoặc `http://localhost`) để cấp quyền Webcam. Hãy chắc chắn bạn đã bấm **Allow** quyền truy cập Camera khi trình duyệt hỏi.
   - Nếu máy tính bàn không có Webcam, bạn chỉ cần chuyển sang tab **Upload Photo** để chọn file ảnh từ máy.
