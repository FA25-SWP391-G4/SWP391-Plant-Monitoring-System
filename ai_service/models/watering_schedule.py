import numpy as np
from datetime import datetime, timedelta
import os
import joblib

class WateringScheduleModel:
    def __init__(self):
        self.model_path = os.path.join(os.path.dirname(__file__), "../trained_models/watering_schedule_model.joblib")
        self._load_or_create_model()
    
    def _load_or_create_model(self):
        """Tải mô hình đã được huấn luyện hoặc tạo mô hình mới nếu chưa có"""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
            else:
                # Tạo thư mục nếu chưa tồn tại
                os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
        except Exception as e:
            print(f"Error loading model: {e}")
    
    def optimize(self, request_data):
        """Tối ưu lịch tưới tự động dựa trên dữ liệu đầu vào"""
        # Lấy dữ liệu từ request
        plant_id = request_data.plant_id
        plant_type = request_data.plant_type
        current_soil_moisture = request_data.current_soil_moisture
        target_soil_moisture = request_data.target_soil_moisture
        temperature_forecast = request_data.temperature_forecast
        humidity_forecast = request_data.humidity_forecast
        light_forecast = request_data.light_forecast
        watering_constraints = request_data.watering_constraints or {}
        
        # Lấy các ràng buộc tưới nước
        max_watering_duration = watering_constraints.get("max_watering_duration", 300)  # Mặc định 5 phút
        preferred_time_ranges = watering_constraints.get("preferred_time_ranges", [])
        
        # Tính toán lịch tưới dựa trên các yếu tố đầu vào
        watering_schedule = self._calculate_watering_schedule(
            plant_type,
            current_soil_moisture,
            target_soil_moisture,
            temperature_forecast,
            humidity_forecast,
            light_forecast,
            max_watering_duration,
            preferred_time_ranges
        )
        
        return {
            "plant_id": plant_id,
            "plant_type": plant_type,
            "current_soil_moisture": current_soil_moisture,
            "target_soil_moisture": target_soil_moisture,
            "watering_schedule": watering_schedule
        }
    
    def _calculate_watering_schedule(self, plant_type, current_soil_moisture, target_soil_moisture, 
                                    temperature_forecast, humidity_forecast, light_forecast,
                                    max_watering_duration, preferred_time_ranges):
        """Tính toán lịch tưới tối ưu"""
        # Tính toán tốc độ mất nước dựa trên dự báo thời tiết
        evaporation_rates = self._calculate_evaporation_rates(
            plant_type, 
            temperature_forecast, 
            humidity_forecast, 
            light_forecast
        )
        
        # Tính toán lượng nước cần bổ sung
        moisture_deficit = target_soil_moisture - current_soil_moisture
        
        # Nếu không cần tưới
        if moisture_deficit <= 0:
            return []
        
        # Tính toán thời gian tưới cần thiết (giây)
        watering_duration = min(self._calculate_watering_duration(moisture_deficit, plant_type), max_watering_duration)
        
        # Tính toán thời điểm tưới tối ưu
        optimal_watering_times = self._find_optimal_watering_times(
            evaporation_rates, 
            preferred_time_ranges,
            watering_duration
        )
        
        # Tạo lịch tưới
        watering_schedule = []
        now = datetime.now()
        
        for i, watering_time in enumerate(optimal_watering_times):
            # Tính thời gian tưới
            watering_datetime = now + timedelta(hours=watering_time)
            
            # Tính lượng nước cần tưới (ml) - giả định
            water_amount = self._calculate_water_amount(moisture_deficit, plant_type)
            
            # Thêm vào lịch tưới
            watering_schedule.append({
                "id": i + 1,
                "scheduled_time": watering_datetime.isoformat(),
                "duration": watering_duration,  # Thời gian tưới (giây)
                "water_amount": water_amount,  # Lượng nước (ml)
                "expected_soil_moisture_after": min(current_soil_moisture + (moisture_deficit * 0.8), target_soil_moisture)
            })
        
        return watering_schedule
    
    def _calculate_evaporation_rates(self, plant_type, temperature_forecast, humidity_forecast, light_forecast):
        """Tính toán tốc độ mất nước dựa trên dự báo thời tiết"""
        evaporation_rates = []
        
        for i in range(len(temperature_forecast)):
            temp = temperature_forecast[i]
            humidity = humidity_forecast[i]
            light = light_forecast[i]
            
            # Công thức đơn giản để tính tốc độ mất nước
            # Nhiệt độ cao, độ ẩm thấp và ánh sáng mạnh làm tăng tốc độ mất nước
            evaporation_rate = (0.05 * temp) + (0.02 * light / 100) - (0.03 * humidity / 100)
            
            # Điều chỉnh theo loại cây
            if plant_type == "tomato":
                evaporation_rate *= 1.2
            elif plant_type == "lettuce":
                evaporation_rate *= 1.5
            elif plant_type == "cucumber":
                evaporation_rate *= 1.3
            
            evaporation_rates.append(max(0, evaporation_rate))
        
        return evaporation_rates
    
    def _calculate_watering_duration(self, moisture_deficit, plant_type):
        """Tính toán thời gian tưới cần thiết dựa trên lượng nước thiếu hụt"""
        # Giả định: 1% độ ẩm đất cần 10 giây tưới
        base_duration = moisture_deficit * 10
        
        # Điều chỉnh theo loại cây
        if plant_type == "tomato":
            return base_duration * 1.2
        elif plant_type == "lettuce":
            return base_duration * 0.8
        elif plant_type == "cucumber":
            return base_duration * 1.1
        else:
            return base_duration
    
    def _calculate_water_amount(self, moisture_deficit, plant_type):
        """Tính toán lượng nước cần tưới (ml)"""
        # Giả định: 1% độ ẩm đất cần 50ml nước
        base_amount = moisture_deficit * 50
        
        # Điều chỉnh theo loại cây
        if plant_type == "tomato":
            return base_amount * 1.2
        elif plant_type == "lettuce":
            return base_amount * 0.8
        elif plant_type == "cucumber":
            return base_amount * 1.1
        else:
            return base_amount
    
    def _find_optimal_watering_times(self, evaporation_rates, preferred_time_ranges, watering_duration):
        """Tìm thời điểm tưới tối ưu"""
        # Nếu có thời gian ưu tiên, sử dụng thời gian đó
        if preferred_time_ranges:
            # Chuyển đổi thời gian ưu tiên thành giờ trong ngày
            preferred_hours = []
            for time_range in preferred_time_ranges:
                start_time = time_range.get("start", "06:00:00").split(":")
                end_time = time_range.get("end", "08:00:00").split(":")
                
                start_hour = int(start_time[0]) + int(start_time[1]) / 60
                end_hour = int(end_time[0]) + int(end_time[1]) / 60
                
                # Thêm tất cả các giờ trong khoảng thời gian ưu tiên
                current_hour = start_hour
                while current_hour < end_hour:
                    preferred_hours.append(current_hour)
                    current_hour += 0.5  # Thêm mỗi nửa giờ
            
            # Nếu có thời gian ưu tiên, trả về thời gian ưu tiên đầu tiên
            if preferred_hours:
                # Tính giờ hiện tại
                now = datetime.now()
                current_hour = now.hour + now.minute / 60
                
                # Tìm thời gian ưu tiên tiếp theo
                for hour in preferred_hours:
                    if hour > current_hour:
                        return [hour - current_hour]
                
                # Nếu tất cả thời gian ưu tiên đã qua, sử dụng thời gian ưu tiên đầu tiên của ngày mai
                return [24 - current_hour + preferred_hours[0]]
        
        # Nếu không có thời gian ưu tiên, tìm thời điểm có tốc độ mất nước thấp nhất
        min_evaporation_index = np.argmin(evaporation_rates)
        
        # Tính giờ hiện tại
        now = datetime.now()
        current_hour = now.hour + now.minute / 60
        
        # Thời gian tưới là sau min_evaporation_index giờ
        watering_time = min_evaporation_index
        
        # Nếu thời gian tưới đã qua trong ngày, đặt lịch cho ngày mai
        if current_hour + watering_time >= 24:
            watering_time = 24 - current_hour + watering_time
        
        return [watering_time]