import numpy as np
from sklearn.ensemble import RandomForestClassifier
import joblib
import os

class PlantAnalysisModel:
    def __init__(self):
        self.model = None
        self.model_path = os.path.join(os.path.dirname(__file__), "../trained_models/plant_analysis_model.joblib")
        self._load_or_create_model()
        
    def _load_or_create_model(self):
        """Tải mô hình đã được huấn luyện hoặc tạo mô hình mới nếu chưa có"""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
            else:
                # Tạo mô hình mới nếu chưa có
                self.model = RandomForestClassifier(n_estimators=100, random_state=42)
                # Lưu mô hình trống để sử dụng sau này
                os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
                joblib.dump(self.model, self.model_path)
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = RandomForestClassifier(n_estimators=100, random_state=42)
    
    def analyze(self, request_data):
        """Phân tích tình trạng cây trồng dựa trên dữ liệu đầu vào"""
        # Phân tích dựa trên các ngưỡng và quy tắc
        analysis_results = {}
        warnings = []
        recommendations = []
        
        # Phân tích độ ẩm đất
        if request_data.soil_moisture < 20:
            status = "critical"
            warnings.append("Độ ẩm đất quá thấp, cây có nguy cơ khô héo")
            recommendations.append("Tưới nước ngay lập tức và tăng tần suất tưới")
        elif request_data.soil_moisture < 40:
            status = "warning"
            warnings.append("Độ ẩm đất thấp")
            recommendations.append("Cần tưới nước trong thời gian sớm")
        elif request_data.soil_moisture > 80:
            status = "warning"
            warnings.append("Độ ẩm đất quá cao, có nguy cơ úng")
            recommendations.append("Giảm lượng nước tưới và kiểm tra hệ thống thoát nước")
        else:
            status = "normal"
        
        analysis_results["soil_moisture"] = {
            "value": request_data.soil_moisture,
            "status": status
        }
        
        # Phân tích nhiệt độ
        if request_data.temperature < 15:
            status = "warning"
            warnings.append("Nhiệt độ quá thấp cho hầu hết các loại cây")
            recommendations.append("Cân nhắc sử dụng hệ thống sưởi hoặc che chắn")
        elif request_data.temperature > 35:
            status = "warning"
            warnings.append("Nhiệt độ quá cao, cây có thể bị stress nhiệt")
            recommendations.append("Tăng độ ẩm, che nắng và tưới nước thường xuyên hơn")
        else:
            status = "normal"
        
        analysis_results["temperature"] = {
            "value": request_data.temperature,
            "status": status
        }
        
        # Phân tích độ ẩm không khí
        if request_data.humidity < 30:
            status = "warning"
            warnings.append("Độ ẩm không khí thấp, cây có thể mất nước nhanh")
            recommendations.append("Phun sương hoặc tăng độ ẩm xung quanh cây")
        elif request_data.humidity > 90:
            status = "warning"
            warnings.append("Độ ẩm không khí quá cao, nguy cơ phát triển nấm bệnh")
            recommendations.append("Tăng thông gió và giảm phun nước lên lá")
        else:
            status = "normal"
        
        analysis_results["humidity"] = {
            "value": request_data.humidity,
            "status": status
        }
        
        # Phân tích cường độ ánh sáng
        if request_data.light_intensity < 200:
            status = "warning"
            warnings.append("Cường độ ánh sáng quá thấp cho sự phát triển tốt")
            recommendations.append("Di chuyển cây đến vị trí có nhiều ánh sáng hơn hoặc bổ sung đèn trồng cây")
        elif request_data.light_intensity > 1500:
            status = "warning"
            warnings.append("Cường độ ánh sáng quá cao, có thể gây cháy lá")
            recommendations.append("Cung cấp bóng râm một phần hoặc lọc ánh sáng")
        else:
            status = "normal"
        
        analysis_results["light_intensity"] = {
            "value": request_data.light_intensity,
            "status": status
        }
        
        # Phân tích pH nếu có
        if request_data.ph_level is not None:
            if request_data.ph_level < 5.5:
                status = "warning"
                warnings.append("Đất quá chua")
                recommendations.append("Bổ sung vôi để tăng pH đất")
            elif request_data.ph_level > 7.5:
                status = "warning"
                warnings.append("Đất quá kiềm")
                recommendations.append("Bổ sung chất hữu cơ hoặc lưu huỳnh để giảm pH")
            else:
                status = "normal"
            
            analysis_results["ph_level"] = {
                "value": request_data.ph_level,
                "status": status
            }
        
        # Phân tích dinh dưỡng nếu có
        if request_data.nutrient_level is not None:
            nutrient_analysis = {}
            
            # Phân tích nitrogen
            if "nitrogen" in request_data.nutrient_level:
                nitrogen = request_data.nutrient_level["nitrogen"]
                if nitrogen < 3.0:
                    status = "warning"
                    warnings.append("Thiếu đạm (N)")
                    recommendations.append("Bổ sung phân đạm")
                elif nitrogen > 6.0:
                    status = "warning"
                    warnings.append("Thừa đạm (N), có thể gây phát triển lá quá mức")
                    recommendations.append("Giảm bón phân đạm")
                else:
                    status = "normal"
                
                nutrient_analysis["nitrogen"] = {
                    "value": nitrogen,
                    "status": status
                }
            
            # Phân tích phosphorus
            if "phosphorus" in request_data.nutrient_level:
                phosphorus = request_data.nutrient_level["phosphorus"]
                if phosphorus < 2.0:
                    status = "warning"
                    warnings.append("Thiếu lân (P)")
                    recommendations.append("Bổ sung phân lân")
                elif phosphorus > 5.0:
                    status = "warning"
                    warnings.append("Thừa lân (P)")
                    recommendations.append("Giảm bón phân lân")
                else:
                    status = "normal"
                
                nutrient_analysis["phosphorus"] = {
                    "value": phosphorus,
                    "status": status
                }
            
            # Phân tích potassium
            if "potassium" in request_data.nutrient_level:
                potassium = request_data.nutrient_level["potassium"]
                if potassium < 3.0:
                    status = "warning"
                    warnings.append("Thiếu kali (K)")
                    recommendations.append("Bổ sung phân kali")
                elif potassium > 6.0:
                    status = "warning"
                    warnings.append("Thừa kali (K)")
                    recommendations.append("Giảm bón phân kali")
                else:
                    status = "normal"
                
                nutrient_analysis["potassium"] = {
                    "value": potassium,
                    "status": status
                }
            
            analysis_results["nutrient_levels"] = nutrient_analysis
        
        # Xác định tình trạng tổng thể
        if any(param["status"] == "critical" for param in analysis_results.values() if isinstance(param, dict) and "status" in param):
            overall_status = "critical"
        elif any(param["status"] == "warning" for param in analysis_results.values() if isinstance(param, dict) and "status" in param):
            overall_status = "warning"
        else:
            overall_status = "normal"
        
        return {
            "plant_id": request_data.plant_id,
            "plant_type": request_data.plant_type,
            "analysis_time": "2023-05-01T12:00:00",  # Thời gian phân tích (thực tế sẽ là thời gian hiện tại)
            "overall_status": overall_status,
            "parameters": analysis_results,
            "warnings": warnings,
            "recommendations": recommendations
        }