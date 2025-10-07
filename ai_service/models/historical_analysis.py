import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import os

class HistoricalAnalysisModel:
    def __init__(self):
        pass
    
    def analyze(self, request_data):
        """Phân tích dữ liệu lịch sử và đề xuất chăm sóc"""
        # Lấy dữ liệu từ request
        plant_id = request_data.plant_id
        plant_type = request_data.plant_type
        start_date = request_data.start_date
        end_date = request_data.end_date
        data_points = request_data.data_points
        
        # Chuyển đổi dữ liệu thành DataFrame để dễ phân tích
        df = pd.DataFrame(data_points)
        
        # Chuyển đổi cột timestamp thành datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        # Sắp xếp dữ liệu theo thời gian
        df = df.sort_values('timestamp')
        
        # Phân tích dữ liệu
        analysis_results = {
            "plant_id": plant_id,
            "plant_type": plant_type,
            "analysis_period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "duration_days": (end_date - start_date).days
            },
            "summary_statistics": self._calculate_summary_statistics(df),
            "trends": self._analyze_trends(df),
            "watering_patterns": self._analyze_watering_patterns(df),
            "correlations": self._analyze_correlations(df),
            "recommendations": self._generate_recommendations(df, plant_type)
        }
        
        return analysis_results
    
    def _calculate_summary_statistics(self, df):
        """Tính toán các thống kê tóm tắt từ dữ liệu"""
        summary_stats = {}
        
        # Tính toán thống kê cho các thông số cảm biến
        for column in ['soil_moisture', 'temperature', 'humidity', 'light_intensity']:
            if column in df.columns:
                summary_stats[column] = {
                    "mean": float(df[column].mean()),
                    "min": float(df[column].min()),
                    "max": float(df[column].max()),
                    "std": float(df[column].std())
                }
        
        # Tính toán thống kê về sự kiện tưới nước
        if 'watering_event' in df.columns:
            watering_events = df[df['watering_event'] == True]
            summary_stats["watering_events"] = {
                "count": len(watering_events),
                "avg_duration": float(watering_events['watering_duration'].mean()) if 'watering_duration' in watering_events.columns else None,
                "total_duration": float(watering_events['watering_duration'].sum()) if 'watering_duration' in watering_events.columns else None
            }
        
        return summary_stats
    
    def _analyze_trends(self, df):
        """Phân tích xu hướng trong dữ liệu"""
        trends = {}
        
        # Phân tích xu hướng độ ẩm đất
        if 'soil_moisture' in df.columns and len(df) > 1:
            # Tính toán xu hướng đơn giản bằng cách so sánh giá trị đầu và cuối
            start_moisture = df['soil_moisture'].iloc[0]
            end_moisture = df['soil_moisture'].iloc[-1]
            moisture_change = end_moisture - start_moisture
            
            if moisture_change > 5:
                moisture_trend = "increasing"
            elif moisture_change < -5:
                moisture_trend = "decreasing"
            else:
                moisture_trend = "stable"
            
            trends["soil_moisture"] = {
                "trend": moisture_trend,
                "change": float(moisture_change),
                "change_percent": float(moisture_change / start_moisture * 100) if start_moisture != 0 else 0
            }
        
        # Phân tích xu hướng nhiệt độ
        if 'temperature' in df.columns and len(df) > 1:
            start_temp = df['temperature'].iloc[0]
            end_temp = df['temperature'].iloc[-1]
            temp_change = end_temp - start_temp
            
            if temp_change > 2:
                temp_trend = "increasing"
            elif temp_change < -2:
                temp_trend = "decreasing"
            else:
                temp_trend = "stable"
            
            trends["temperature"] = {
                "trend": temp_trend,
                "change": float(temp_change),
                "change_percent": float(temp_change / start_temp * 100) if start_temp != 0 else 0
            }
        
        return trends
    
    def _analyze_watering_patterns(self, df):
        """Phân tích mẫu tưới nước"""
        watering_patterns = {}
        
        if 'watering_event' in df.columns and 'timestamp' in df.columns:
            watering_events = df[df['watering_event'] == True]
            
            if len(watering_events) > 1:
                # Tính khoảng thời gian giữa các lần tưới
                watering_events = watering_events.sort_values('timestamp')
                watering_events['next_timestamp'] = watering_events['timestamp'].shift(-1)
                watering_events['interval'] = (watering_events['next_timestamp'] - watering_events['timestamp']).dt.total_seconds() / 3600  # Giờ
                
                # Loại bỏ hàng cuối cùng vì không có next_timestamp
                watering_events = watering_events.dropna(subset=['interval'])
                
                if len(watering_events) > 0:
                    avg_interval = watering_events['interval'].mean()
                    min_interval = watering_events['interval'].min()
                    max_interval = watering_events['interval'].max()
                    
                    watering_patterns["intervals"] = {
                        "average_hours": float(avg_interval),
                        "min_hours": float(min_interval),
                        "max_hours": float(max_interval)
                    }
                    
                    # Phân tích thời gian tưới trong ngày
                    watering_events['hour_of_day'] = watering_events['timestamp'].dt.hour
                    hour_counts = watering_events['hour_of_day'].value_counts().sort_index()
                    
                    morning_count = hour_counts[(hour_counts.index >= 6) & (hour_counts.index < 12)].sum()
                    afternoon_count = hour_counts[(hour_counts.index >= 12) & (hour_counts.index < 18)].sum()
                    evening_count = hour_counts[(hour_counts.index >= 18) & (hour_counts.index < 22)].sum()
                    night_count = hour_counts[(hour_counts.index >= 22) | (hour_counts.index < 6)].sum()
                    
                    watering_patterns["time_of_day"] = {
                        "morning": int(morning_count),
                        "afternoon": int(afternoon_count),
                        "evening": int(evening_count),
                        "night": int(night_count)
                    }
                    
                    # Xác định thời gian tưới phổ biến nhất
                    most_common_time = "morning"
                    max_count = morning_count
                    
                    if afternoon_count > max_count:
                        most_common_time = "afternoon"
                        max_count = afternoon_count
                    
                    if evening_count > max_count:
                        most_common_time = "evening"
                        max_count = evening_count
                    
                    if night_count > max_count:
                        most_common_time = "night"
                    
                    watering_patterns["most_common_time"] = most_common_time
        
        return watering_patterns
    
    def _analyze_correlations(self, df):
        """Phân tích mối tương quan giữa các thông số"""
        correlations = {}
        
        # Kiểm tra các cột cần thiết
        required_columns = ['soil_moisture', 'temperature', 'humidity', 'light_intensity']
        available_columns = [col for col in required_columns if col in df.columns]
        
        if len(available_columns) > 1:
            # Tính ma trận tương quan
            corr_matrix = df[available_columns].corr()
            
            # Chuyển đổi ma trận tương quan thành dict
            for col1 in available_columns:
                for col2 in available_columns:
                    if col1 != col2:
                        key = f"{col1}_vs_{col2}"
                        correlations[key] = float(corr_matrix.loc[col1, col2])
        
        return correlations
    
    def _generate_recommendations(self, df, plant_type):
        """Tạo đề xuất dựa trên phân tích dữ liệu"""
        recommendations = []
        
        # Kiểm tra độ ẩm đất
        if 'soil_moisture' in df.columns:
            avg_moisture = df['soil_moisture'].mean()
            
            if plant_type == "tomato":
                if avg_moisture < 40:
                    recommendations.append("Tăng tần suất tưới nước cho cây cà chua. Cà chua cần độ ẩm đất ổn định để phát triển tốt.")
                elif avg_moisture > 70:
                    recommendations.append("Giảm tần suất tưới nước cho cây cà chua. Độ ẩm đất quá cao có thể gây thối rễ.")
            
            elif plant_type == "lettuce":
                if avg_moisture < 50:
                    recommendations.append("Tăng tần suất tưới nước cho xà lách. Xà lách cần nhiều nước để phát triển lá tươi.")
                elif avg_moisture > 80:
                    recommendations.append("Giảm tần suất tưới nước cho xà lách. Độ ẩm đất quá cao có thể gây bệnh nấm.")
            
            elif plant_type == "cucumber":
                if avg_moisture < 45:
                    recommendations.append("Tăng tần suất tưới nước cho dưa chuột. Dưa chuột cần nhiều nước để phát triển quả mọng nước.")
                elif avg_moisture > 75:
                    recommendations.append("Giảm tần suất tưới nước cho dưa chuột. Độ ẩm đất quá cao có thể gây thối rễ.")
        
        # Kiểm tra nhiệt độ
        if 'temperature' in df.columns:
            avg_temp = df['temperature'].mean()
            max_temp = df['temperature'].max()
            
            if plant_type == "tomato":
                if avg_temp < 18:
                    recommendations.append("Nhiệt độ trung bình thấp cho cây cà chua. Cân nhắc tăng nhiệt độ hoặc di chuyển cây đến nơi ấm hơn.")
                elif max_temp > 35:
                    recommendations.append("Đã có thời điểm nhiệt độ quá cao cho cây cà chua. Cung cấp bóng râm trong những ngày nắng nóng.")
            
            elif plant_type == "lettuce":
                if avg_temp > 24:
                    recommendations.append("Nhiệt độ trung bình cao cho xà lách. Xà lách thích điều kiện mát mẻ, cân nhắc cung cấp bóng râm.")
            
            elif plant_type == "cucumber":
                if avg_temp < 20:
                    recommendations.append("Nhiệt độ trung bình thấp cho dưa chuột. Dưa chuột thích điều kiện ấm áp, cân nhắc tăng nhiệt độ.")
        
        # Kiểm tra mẫu tưới nước
        if 'watering_event' in df.columns and 'timestamp' in df.columns:
            watering_events = df[df['watering_event'] == True]
            
            if len(watering_events) > 1:
                # Tính khoảng thời gian giữa các lần tưới
                watering_events = watering_events.sort_values('timestamp')
                watering_events['next_timestamp'] = watering_events['timestamp'].shift(-1)
                watering_events['interval'] = (watering_events['next_timestamp'] - watering_events['timestamp']).dt.total_seconds() / 3600  # Giờ
                
                # Loại bỏ hàng cuối cùng vì không có next_timestamp
                watering_events = watering_events.dropna(subset=['interval'])
                
                if len(watering_events) > 0:
                    avg_interval = watering_events['interval'].mean()
                    
                    if plant_type == "tomato":
                        if avg_interval < 24:
                            recommendations.append("Bạn đang tưới cây cà chua quá thường xuyên. Cà chua thích đất khô nhẹ giữa các lần tưới.")
                        elif avg_interval > 72:
                            recommendations.append("Khoảng thời gian giữa các lần tưới cây cà chua quá dài. Tăng tần suất tưới để duy trì độ ẩm đất ổn định.")
                    
                    elif plant_type == "lettuce":
                        if avg_interval > 48:
                            recommendations.append("Khoảng thời gian giữa các lần tưới xà lách quá dài. Xà lách cần được tưới thường xuyên để duy trì độ ẩm đất.")
                    
                    elif plant_type == "cucumber":
                        if avg_interval > 48:
                            recommendations.append("Khoảng thời gian giữa các lần tưới dưa chuột quá dài. Dưa chuột cần được tưới thường xuyên để phát triển tốt.")
        
        # Thêm đề xuất chung
        recommendations.append("Theo dõi độ ẩm đất thường xuyên và điều chỉnh lịch tưới nước phù hợp với điều kiện thời tiết.")
        
        return recommendations