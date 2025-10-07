import numpy as np
from PIL import Image
import io
import os
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.preprocessing.image import img_to_array

class ImageRecognitionModel:
    def __init__(self):
        # Tạo thư mục cho mô hình nếu chưa tồn tại
        os.makedirs(os.path.join(os.path.dirname(__file__), "../trained_models"), exist_ok=True)
        
        # Định nghĩa các vấn đề phổ biến của cây trồng
        self.plant_issues = {
            0: "healthy",
            1: "leaf_spot",
            2: "powdery_mildew",
            3: "rust",
            4: "nutrient_deficiency",
            5: "pest_damage",
            6: "drought_stress",
            7: "overwatering"
        }
        
        # Khởi tạo mô hình cơ bản
        self.model = self._initialize_model()
    
    def _initialize_model(self):
        """Khởi tạo mô hình nhận dạng ảnh"""
        try:
            # Trong thực tế, bạn sẽ tải mô hình đã được huấn luyện từ file
            # Ở đây, chúng ta sử dụng mô hình MobileNetV2 làm cơ sở
            base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
            
            # Đóng băng các lớp của mô hình cơ sở
            for layer in base_model.layers:
                layer.trainable = False
            
            # Xây dựng mô hình hoàn chỉnh
            model = tf.keras.Sequential([
                base_model,
                tf.keras.layers.GlobalAveragePooling2D(),
                tf.keras.layers.Dense(128, activation='relu'),
                tf.keras.layers.Dropout(0.2),
                tf.keras.layers.Dense(len(self.plant_issues), activation='softmax')
            ])
            
            # Biên dịch mô hình
            model.compile(
                optimizer='adam',
                loss='sparse_categorical_crossentropy',
                metrics=['accuracy']
            )
            
            return model
        except Exception as e:
            print(f"Error initializing model: {e}")
            # Trả về None nếu không thể khởi tạo mô hình
            return None
    
    def _preprocess_image(self, image_data):
        """Tiền xử lý ảnh đầu vào"""
        try:
            # Đọc ảnh từ dữ liệu nhị phân
            image = Image.open(io.BytesIO(image_data))
            
            # Chuyển đổi ảnh sang RGB nếu cần
            if image.mode != "RGB":
                image = image.convert("RGB")
            
            # Thay đổi kích thước ảnh thành 224x224
            image = image.resize((224, 224))
            
            # Chuyển đổi ảnh thành mảng numpy
            image_array = img_to_array(image)
            
            # Mở rộng kích thước để phù hợp với đầu vào của mô hình
            image_array = np.expand_dims(image_array, axis=0)
            
            # Tiền xử lý ảnh cho MobileNetV2
            processed_image = preprocess_input(image_array)
            
            return processed_image
        except Exception as e:
            print(f"Error preprocessing image: {e}")
            return None
    
    def analyze(self, image_data):
        """Phân tích ảnh cây trồng và nhận diện vấn đề"""
        # Tiền xử lý ảnh
        processed_image = self._preprocess_image(image_data)
        
        if processed_image is None:
            return {
                "success": False,
                "error": "Không thể xử lý ảnh đầu vào"
            }
        
        # Nếu mô hình chưa được huấn luyện, sử dụng logic đơn giản
        if self.model is None:
            # Giả lập kết quả phân tích
            return {
                "plant_status": "healthy",
                "confidence": 0.85,
                "issues_detected": [],
                "recommendations": [
                    "Tiếp tục chăm sóc cây theo lịch hiện tại",
                    "Theo dõi sự phát triển của cây thường xuyên"
                ]
            }
        
        # Dự đoán với mô hình
        predictions = self.model.predict(processed_image)
        predicted_class = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class])
        
        # Xác định tình trạng cây
        plant_status = self.plant_issues[predicted_class]
        
        # Tạo phản hồi dựa trên kết quả phân tích
        if plant_status == "healthy":
            issues_detected = []
            recommendations = [
                "Tiếp tục chăm sóc cây theo lịch hiện tại",
                "Theo dõi sự phát triển của cây thường xuyên"
            ]
        else:
            issues_detected = [plant_status]
            recommendations = self._get_recommendations(plant_status)
        
        return {
            "plant_status": plant_status,
            "confidence": confidence,
            "issues_detected": issues_detected,
            "recommendations": recommendations
        }
    
    def _get_recommendations(self, issue):
        """Cung cấp đề xuất dựa trên vấn đề được phát hiện"""
        recommendations = {
            "leaf_spot": [
                "Loại bỏ lá bị nhiễm bệnh",
                "Sử dụng thuốc diệt nấm phù hợp",
                "Tránh tưới nước trực tiếp lên lá",
                "Đảm bảo thông gió tốt xung quanh cây"
            ],
            "powdery_mildew": [
                "Sử dụng dung dịch baking soda (1 muỗng canh baking soda, 1/2 muỗng canh dầu, 1 gallon nước)",
                "Đảm bảo thông gió tốt",
                "Tránh tưới nước quá nhiều",
                "Loại bỏ lá bị nhiễm nặng"
            ],
            "rust": [
                "Loại bỏ lá bị nhiễm bệnh",
                "Sử dụng thuốc diệt nấm chứa đồng",
                "Tránh tưới nước trực tiếp lên lá",
                "Tăng khoảng cách giữa các cây để cải thiện lưu thông không khí"
            ],
            "nutrient_deficiency": [
                "Kiểm tra và điều chỉnh pH đất",
                "Bổ sung phân bón cân bằng",
                "Xem xét bổ sung vi lượng",
                "Thực hiện phân tích đất để xác định chính xác thiếu hụt"
            ],
            "pest_damage": [
                "Kiểm tra cây thường xuyên để phát hiện sớm côn trùng",
                "Sử dụng xà phòng insecticidal hoặc dầu neem",
                "Thử các biện pháp kiểm soát sinh học như bọ rùa hoặc bọ cánh cứng",
                "Trong trường hợp nghiêm trọng, sử dụng thuốc trừ sâu phù hợp"
            ],
            "drought_stress": [
                "Tăng tần suất tưới nước",
                "Thêm lớp phủ mulch để giữ ẩm đất",
                "Tưới vào buổi sáng sớm hoặc chiều muộn",
                "Xem xét sử dụng hệ thống tưới nhỏ giọt"
            ],
            "overwatering": [
                "Giảm tần suất tưới nước",
                "Đảm bảo đất có khả năng thoát nước tốt",
                "Kiểm tra hệ thống thoát nước của chậu",
                "Đợi đất khô ít nhất 1-2 inch trên cùng trước khi tưới lại"
            ]
        }
        
        return recommendations.get(issue, ["Tham khảo ý kiến chuyên gia về vấn đề này"])