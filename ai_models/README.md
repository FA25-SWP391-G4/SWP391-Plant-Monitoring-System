# 🌿 AI Models & Services - PlantSmart Monitoring System

Thư mục này chứa các phân hệ Trí tuệ Nhân tạo (AI) phục vụ cho hệ thống giám sát và chăm sóc cây cảnh thông minh **PlantSmart**:
1. **Disease Recognition Engine (Chẩn đoán bệnh & nhận diện loài cây qua ảnh chụp lá)**
2. **Watering Prediction Engine (Dự đoán nhu cầu tưới nước theo dữ liệu cảm biến)**

---

## 🗂️ Cấu trúc thư mục

```text
ai_models/
├── disease_recognition/                    # 🌿 Phân hệ AI chẩn đoán bệnh cây cảnh
│   ├── models/                             # ⚠️ Thư mục chứa trọng số mô hình ONNX
│   │   ├── .gitkeep                        # File giữ chỗ thư mục trên Git
│   │   ├── mobilenet_v3_large_14class_320x320.onnx   # [BẮT BUỘC] Model phân loại (~16.8 MB)
│   │   ├── u2netp.onnx                               # [BẮT BUỘC] Model tách phiến lá (~4.5 MB)
│   │   └── resnet18_14class_320x320.onnx             # [TÙY CHỌN] Model ResNet-18 (~44.7 MB)
│   ├── app.py                              # Server FastAPI phục vụ API chẩn đoán (Port 8000)
│   ├── pipeline.py                         # Master Engine kết hợp 2 giai đoạn (Tách lá + Phân loại)
│   ├── enhanced_leaf_extractor.py          # Lọc màu thực vật (HSV) & làm mịn viền lá
│   └── requirements.txt                    # Danh sách thư viện Python phụ thuộc
│
├── watering_prediction/                    # 💧 Phân hệ AI dự đoán chu kỳ tưới cây
│   ├── model.js                            # Logic mô hình tưới
│   ├── dataPreprocessor.js                 # Chuẩn hóa dữ liệu sensor
│   └── index.js
│
├── config.json                             # File cấu hình metadata tổng thể
└── README.md                               # Hướng dẫn setup & vận hành này
```

---

## 🚀 HƯỚNG DẪN SETUP & CHẠY SERVER AI CHẨN ĐOÁN BỆNH

> [!IMPORTANT]
> **LƯU Ý VỀ FILE MÔ HÌNH (MODELS):**  
> Để giữ kích thước Git repository gọn nhẹ, các file mô hình trọng số (`.onnx`) **không được commit trực tiếp lên Git**.  
> Bạn cần nhận các file mô hình từ người phụ trách và bỏ vào đúng thư mục trước khi chạy server.

---

### Bước 1: Bỏ các file mô hình vào thư mục `models/`

Hãy sao chép các file mô hình ONNX vào đường dẫn:
📁 **`ai_models/disease_recognition/models/`**

Danh sách file cần thiết:
1. **`u2netp.onnx`** (~4.5 MB): Mô hình bóc tách phiến lá cây ra khỏi hậu cảnh bàn, ghế, tường nhà...
2. **`mobilenet_v3_large_14class_320x320.onnx`** (~16.8 MB): Mô hình phân loại 14 lớp bệnh trên 5 loài cây cảnh (chạy chính thức, độ trễ cực thấp ~6ms trên CPU).
3. *(Tùy chọn)* **`resnet18_14class_320x320.onnx`** (~44.7 MB): Mô hình phân loại dự phòng.

Sau khi copy xong, kiểm tra đảm bảo cấu trúc như sau:
```text
ai_models/disease_recognition/models/
├── .gitkeep
├── mobilenet_v3_large_14class_320x320.onnx
├── u2netp.onnx
└── resnet18_14class_320x320.onnx
```

---

### Bước 2: Cài đặt thư viện Python phụ thuộc

Mở Terminal / PowerShell và chạy lệnh cài đặt:

```bash
cd ai_models/disease_recognition
pip install -r requirements.txt
```

> **Yêu cầu môi trường:** Python 3.8+ (đã kiểm thử ổn định trên Python 3.10 và 3.11). Chạy trực tiếp trên CPU thông thường, không yêu cầu card đồ họa rời (GPU).  
> **Thư viện chính:** `onnxruntime`, `rembg`, `fastapi`, `uvicorn`, `opencv-python`, `pillow`, `numpy`, `python-multipart`.

---

### Bước 3: Khởi động Server AI

Bạn có thể chạy bằng **1 trong 2 cách**:

#### 👉 Cách A: Chạy 1-Click từ thư mục gốc dự án (Tiện nhất)
Tại thư mục gốc `SWP391-Plant-Monitoring-System`, click đúp chuột vào file:
```text
start-ai-diagnostic.bat
```

#### 👉 Cách B: Chạy qua lệnh Terminal
```bash
cd ai_models/disease_recognition
python app.py
```

Khi server khởi động thành công, màn hình sẽ thông báo:
```text
Starting Plant Diagnostic Server...
Pipeline ready on CPU (u2netp + MobileNetV3-Large).
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

Server sẽ lắng nghe tại: **`http://localhost:8000`** (sẵn sàng tiếp nhận yêu cầu từ Web Client Next.js).

---

## 📡 API Reference (Dành cho Web Client)

* **Endpoint:** `POST http://localhost:8000/diagnose`
* **Content-Type:** `multipart/form-data`
* **Form Field:** `file` (File ảnh định dạng JPG, PNG, WEBP)
* **CORS:** Đã kích hoạt sẵn cho phép mọi client (`allow_origins=["*"]`).

### Dữ liệu JSON trả về:
* `status`: Trạng thái phán đoán (`DIAGNOSIS_HIGH_CONFIDENCE`, `DIAGNOSIS_MODERATE_CONFIDENCE`, `DIAGNOSIS_UNCERTAIN`).
* `verdict`: Mức độ tin cậy (`CONFIDENT`, `MODERATE`, `UNCERTAIN`).
* `predicted_species`: Loài cây nhận diện (Aloe, Cactus, Money Plant, Snake Plant, Spider Plant).
* `predicted_condition`: Tình trạng bệnh (Healthy, Anthracnose, Bacterial wilt, Manganese Toxicity,...).
* `confidence`: Độ tin cậy (từ 0.0 đến 1.0).
* `segmented_leaf_base64`: Chuỗi Base64 của ảnh lá cây đã được mô hình AI bóc tách sạch nền.
* `treatment_recommendation`: Phác đồ hướng dẫn chữa trị và chăm sóc chi tiết.

---

## 🌿 Danh sách 14 Lớp Bệnh & 5 Loài Cây Được Hỗ Trợ

| Loài cây (*Species*) | Tình trạng & Bệnh (*Conditions*) |
| :--- | :--- |
| **Aloe** *(Nha đam)* | `Aloe_Healthy` (Khỏe mạnh)<br>`Aloe_Fungal_Infection` (Nhiễm nấm)<br>`Aloe_Sunburn` (Cháy nắng) |
| **Cactus** *(Xương rồng)* | `Cactus_Healthy` (Khỏe mạnh)<br>`Cactus_Dactylopius_Opuntia` (Bị rệp sáp hại cây) |
| **Money Plant** *(Trầu bà)* | `Money_Plant_Healthy` (Khỏe mạnh)<br>`Money_Plant_Bacterial_wilt_disease` (Héo rũ vi khuẩn)<br>`Money_Plant_Manganese_Toxicity` (Ngộ độc mangan do đất chua) |
| **Snake Plant** *(Lưỡi hổ)* | `Snake_Plant_Healthy` (Khỏe mạnh)<br>`Snake_Plant_Anthracnose` (Bệnh thán thư)<br>`Snake_Plant_Leaf_Withering` (Khô héo lá mất nước) |
| **Spider Plant** *(Cỏ lan chi / Dây nhện)* | `Spider_Plant_Healthy` (Khỏe mạnh)<br>`Spider_Plant_Fungal_leaf_spot` (Đốm lá nấm)<br>`Spider_Plant_Leaf_Tip_Necrosis` (Hoại tử/cháy đầu lá) |

---

## 🛠️ Khắc phục sự cố thường gặp (Troubleshooting)

1. **Lỗi `FileNotFoundError: ... models/u2netp.onnx` hoặc `mobilenet_v3...onnx`:**
   - Đảm bảo bạn đã hoàn thành **Bước 1**: copy đầy đủ các file model vào thư mục `ai_models/disease_recognition/models/`.
2. **Lỗi `ModuleNotFoundError: No module named 'rembg'`:**
   - Chạy: `pip install rembg`
3. **Lỗi `Address already in use` hoặc Port 8000 bị chiếm:**
   - Kiểm tra tiến trình đang chạy port 8000: `netstat -ano | findstr :8000` và kill tiến trình cũ, hoặc đổi port trong file `app.py`.
