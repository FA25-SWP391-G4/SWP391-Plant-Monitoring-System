import numpy as np
from sklearn.ensemble import RandomForestRegressor
from datetime import datetime, timedelta
import joblib
import os

class WateringPredictionModel:
    def __init__(self):
        self.model = None
        self.model_path = os.path.join(os.path.dirname(__file__), "../trained_models/watering_prediction_model.joblib")
        self._load_or_create_model()
        
    def _load_or_create_model(self):
        """Tải mô hình đã được huấn luyện hoặc tạo mô hình mới nếu chưa có"""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
            else:
                # Tạo mô hình mới nếu chưa có
                self.model = RandomForestRegressor(n_estimators=100, random_state=42)
                # Lưu mô hình trống để sử dụng sau này
                os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
                joblib.dump(self.model, self.model_path)
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = RandomForestRegressor(n_estimators=100, random_state=42)
    
    def _preprocess_data(self, request_data):
        """Tiền xử lý dữ liệu đầu vào"""
        # Tính thời gian từ lần tưới cuối cùng (giờ)
        last_watering = datetime.fromisoformat(request_data.last_watering_time.replace('Z', '+00:00'))
        current_time = datetime.now()
        hours_since_last_watering = (current_time - last_watering).total_seconds() / 3600
        
        # Tạo vector đặc trưng
        features = np.array([
            request_data.soil_moisture,
            request_data.temperature,
            request_data.humidity,
            request_data.light_intensity,
            hours_since_last_watering,
            # One-hot encoding cho loại cây (đơn giản hóa)
            1 if request_data.plant_type == "tomato" else 0,
            1 if request_data.plant_type == "lettuce" else 0,
            1 if request_data.plant_type == "cucumber" else 0,
            1 if request_data.plant_type == "pepper" else 0,
            1 if request_data.plant_type == "other" else 0,
        ]).reshape(1, -1)
        
        return features
    
    def predict(self, request_data):
        """Dự đoán nhu cầu tưới cây dựa trên dữ liệu đầu vào"""
        features = self._preprocess_data(request_data)
        
        # Nếu mô hình chưa được huấn luyện, sử dụng logic đơn giản
        if not hasattr(self.model, 'feature_importances_'):
            # Logic đơn giản: Nếu độ ẩm đất < 30%, cần tưới ngay
            if request_data.soil_moisture < 30:
                hours_until_watering = 0
                watering_recommendation = "Cần tưới ngay lập tức"
                watering_duration = 300  # 5 phút
            # Nếu độ ẩm đất 30-50%, cần tưới trong vòng 12 giờ
            elif request_data.soil_moisture < 50:
                hours_until_watering = 12
                watering_recommendation = "Cần tưới trong vòng 12 giờ tới"
                watering_duration = 240  # 4 phút
            # Nếu độ ẩm đất > 50%, chưa cần tưới
            else:
                hours_until_watering = 24
                watering_recommendation = "Chưa cần tưới trong 24 giờ tới"
                watering_duration = 180  # 3 phút
        else:
            # Sử dụng mô hình đã huấn luyện để dự đoán
            hours_until_watering = self.model.predict(features)[0]
            
            if hours_until_watering <= 0:
                watering_recommendation = "Cần tưới ngay lập tức"
                watering_duration = 300  # 5 phút
            elif hours_until_watering <= 12:
                watering_recommendation = f"Cần tưới trong vòng {int(hours_until_watering)} giờ tới"
                watering_duration = 240  # 4 phút
            else:
                watering_recommendation = f"Chưa cần tưới trong {int(hours_until_watering)} giờ tới"
                watering_duration = 180  # 3 phút
        
        # Tính thời gian tưới tiếp theo
        next_watering_time = datetime.now() + timedelta(hours=hours_until_watering)
        
        return {
            "hours_until_watering": float(hours_until_watering),
            "next_watering_time": next_watering_time.isoformat(),
            "watering_recommendation": watering_recommendation,
            "recommended_watering_duration": watering_duration,  # Thời gian tưới đề xuất (giây)
            "confidence_score": 0.85  # Giả lập điểm tin cậy
        }
    
    def train(self, training_data):
        """Huấn luyện mô hình với dữ liệu mới"""
        # Trong thực tế, bạn sẽ cần triển khai logic huấn luyện mô hình ở đây
        # Đây chỉ là phương thức giả để minh họa
        X = []  # Đặc trưng
        y = []  # Nhãn (giờ cho đến khi cần tưới)
        
        for data_point in training_data:
            features = self._preprocess_data(data_point)
            X.append(features[0])
            y.append(data_point.hours_until_watering)
        
        if X and y:
            self.model.fit(np.array(X), np.array(y))
            # Lưu mô hình đã huấn luyện
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            joblib.dump(self.model, self.model_path)
            return {"success": True, "message": "Model trained successfully"}
        else:
            return {"success": False, "message": "No training data provided"}