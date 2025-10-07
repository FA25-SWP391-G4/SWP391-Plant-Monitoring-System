from flask import Flask, request, jsonify
import os
import json
import requests
import numpy as np
from datetime import datetime, timedelta

app = Flask(__name__)

# Cấu hình OpenRouter API
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', 'sk-or-v1-...')  # Thay thế bằng API key thực
MISTRAL_MODEL = "mistralai/mistral-7b-instruct-v0.2"

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "plant-ai-microservice"})

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    if not data or 'message' not in data:
        return jsonify({"error": "Missing message parameter"}), 400
    
    user_message = data.get('message')
    context = data.get('context', [])
    
    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": MISTRAL_MODEL,
                "messages": [
                    {"role": "system", "content": "Bạn là một trợ lý AI chuyên về chăm sóc cây trồng. Hãy cung cấp thông tin chính xác, hữu ích và thân thiện về việc chăm sóc cây trồng, giải quyết vấn đề và đưa ra lời khuyên."},
                    *[{"role": msg["role"], "content": msg["content"]} for msg in context],
                    {"role": "user", "content": user_message}
                ]
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            ai_response = result["choices"][0]["message"]["content"]
            return jsonify({"response": ai_response})
        else:
            return jsonify({"error": f"OpenRouter API error: {response.text}"}), 500
    
    except Exception as e:
        return jsonify({"error": f"Error processing request: {str(e)}"}), 500

@app.route('/analyze-plant-health', methods=['POST'])
def analyze_plant_health():
    data = request.json
    if not data or 'sensor_data' not in data:
        return jsonify({"error": "Missing sensor data"}), 400
    
    sensor_data = data.get('sensor_data')
    plant_type = data.get('plant_type', 'unknown')
    
    try:
        # Phân tích sức khỏe cây trồng dựa trên dữ liệu cảm biến
        health_score, issues, recommendations = analyze_health(sensor_data, plant_type)
        
        return jsonify({
            "health_score": health_score,
            "status": get_health_status(health_score),
            "issues": issues,
            "recommendations": recommendations
        })
    
    except Exception as e:
        return jsonify({"error": f"Error analyzing plant health: {str(e)}"}), 500

@app.route('/predict-watering', methods=['POST'])
def predict_watering():
    data = request.json
    if not data or 'sensor_data' not in data:
        return jsonify({"error": "Missing sensor data"}), 400
    
    sensor_data = data.get('sensor_data')
    plant_type = data.get('plant_type', 'unknown')
    last_watering = data.get('last_watering')
    
    try:
        # Dự đoán nhu cầu tưới nước
        should_water, confidence, amount, hours = predict_watering_needs(
            sensor_data, plant_type, last_watering
        )
        
        next_watering = datetime.now() + timedelta(hours=hours)
        
        return jsonify({
            "should_water": should_water,
            "confidence": confidence,
            "recommended_amount_ml": amount,
            "hours_to_next_watering": hours,
            "next_watering_time": next_watering.isoformat()
        })
    
    except Exception as e:
        return jsonify({"error": f"Error predicting watering needs: {str(e)}"}), 500

@app.route('/optimize-schedule', methods=['POST'])
def optimize_schedule():
    data = request.json
    if not data or 'plants' not in data:
        return jsonify({"error": "Missing plants data"}), 400
    
    plants = data.get('plants')
    
    try:
        # Tối ưu hóa lịch tưới nước
        schedules = optimize_watering_schedule(plants)
        
        return jsonify({
            "schedules": schedules
        })
    
    except Exception as e:
        return jsonify({"error": f"Error optimizing watering schedule: {str(e)}"}), 500

# Hàm phân tích sức khỏe cây trồng
def analyze_health(sensor_data, plant_type):
    # Ngưỡng chuẩn cho các loại cây
    thresholds = {
        'herb': {
            'soil_moisture': {'min': 40, 'max': 70, 'weight': 0.3},
            'temperature': {'min': 18, 'max': 26, 'weight': 0.2},
            'humidity': {'min': 40, 'max': 70, 'weight': 0.2},
            'light': {'min': 300, 'max': 800, 'weight': 0.3}
        },
        'flower': {
            'soil_moisture': {'min': 50, 'max': 70, 'weight': 0.3},
            'temperature': {'min': 18, 'max': 28, 'weight': 0.2},
            'humidity': {'min': 50, 'max': 80, 'weight': 0.2},
            'light': {'min': 400, 'max': 900, 'weight': 0.3}
        },
        'default': {
            'soil_moisture': {'min': 40, 'max': 70, 'weight': 0.3},
            'temperature': {'min': 18, 'max': 28, 'weight': 0.2},
            'humidity': {'min': 40, 'max': 70, 'weight': 0.2},
            'light': {'min': 400, 'max': 800, 'weight': 0.3}
        }
    }
    
    # Lấy ngưỡng cho loại cây
    plant_threshold = thresholds.get(plant_type.lower(), thresholds['default'])
    
    # Tính điểm sức khỏe
    health_scores = {}
    issues = []
    recommendations = []
    
    for param, value in sensor_data.items():
        if param in plant_threshold:
            threshold = plant_threshold[param]
            
            if value < threshold['min']:
                score = max(0, value / threshold['min'])
                if param == 'soil_moisture' and score < 0.7:
                    issues.append('underwatering')
                    recommendations.append('Tăng tần suất tưới nước')
                elif param == 'light' and score < 0.7:
                    issues.append('light_deficiency')
                    recommendations.append('Di chuyển cây đến vị trí có nhiều ánh sáng hơn')
                elif param == 'humidity' and score < 0.7:
                    issues.append('low_humidity')
                    recommendations.append('Phun sương xung quanh cây')
                elif param == 'temperature' and score < 0.7:
                    issues.append('temperature_stress')
                    recommendations.append('Di chuyển cây đến vị trí có nhiệt độ phù hợp hơn')
            elif value > threshold['max']:
                score = max(0, 1 - (value - threshold['max']) / threshold['max'])
                if param == 'soil_moisture' and score < 0.7:
                    issues.append('overwatering')
                    recommendations.append('Giảm tần suất tưới nước')
                elif param == 'light' and score < 0.7:
                    issues.append('light_excess')
                    recommendations.append('Di chuyển cây đến vị trí có ít ánh sáng trực tiếp hơn')
                elif param == 'humidity' and score < 0.7:
                    issues.append('high_humidity')
                    recommendations.append('Tăng lưu thông không khí')
                elif param == 'temperature' and score < 0.7:
                    issues.append('temperature_stress')
                    recommendations.append('Di chuyển cây đến vị trí có nhiệt độ phù hợp hơn')
            else:
                score = 1.0
            
            health_scores[param] = score
    
    # Tính điểm sức khỏe tổng thể
    overall_score = 0
    total_weight = 0
    
    for param, score in health_scores.items():
        weight = plant_threshold[param]['weight']
        overall_score += score * weight
        total_weight += weight
    
    if total_weight > 0:
        overall_score /= total_weight
    
    return overall_score, issues, list(set(recommendations))

# Hàm xác định trạng thái sức khỏe
def get_health_status(health_score):
    if health_score >= 0.8:
        return "Rất tốt"
    elif health_score >= 0.6:
        return "Tốt"
    elif health_score >= 0.4:
        return "Trung bình"
    elif health_score >= 0.2:
        return "Kém"
    else:
        return "Rất kém"

# Hàm dự đoán nhu cầu tưới nước
def predict_watering_needs(sensor_data, plant_type, last_watering):
    # Ngưỡng chuẩn cho các loại cây
    thresholds = {
        'herb': {
            'soil_moisture': {'min': 40, 'optimal': 55, 'max': 70},
            'watering_interval': 24  # giờ
        },
        'flower': {
            'soil_moisture': {'min': 50, 'optimal': 60, 'max': 70},
            'watering_interval': 36  # giờ
        },
        'vegetable': {
            'soil_moisture': {'min': 60, 'optimal': 70, 'max': 80},
            'watering_interval': 24  # giờ
        },
        'default': {
            'soil_moisture': {'min': 40, 'optimal': 55, 'max': 70},
            'watering_interval': 36  # giờ
        }
    }
    
    # Lấy ngưỡng cho loại cây
    plant_threshold = thresholds.get(plant_type.lower(), thresholds['default'])
    
    # Tính thời gian từ lần tưới cuối
    if last_watering:
        last_watering_time = datetime.fromisoformat(last_watering)
        hours_since_last_watering = (datetime.now() - last_watering_time).total_seconds() / 3600
    else:
        hours_since_last_watering = plant_threshold['watering_interval'] * 2  # Giả sử đã lâu không tưới
    
    # Tính điểm độ ẩm đất
    soil_moisture = sensor_data.get('soil_moisture', 0)
    if soil_moisture < plant_threshold['soil_moisture']['min']:
        moisture_score = max(0, soil_moisture / plant_threshold['soil_moisture']['min'])
    elif soil_moisture > plant_threshold['soil_moisture']['max']:
        moisture_score = max(0, 1 - (soil_moisture - plant_threshold['soil_moisture']['max']) / plant_threshold['soil_moisture']['max'])
    else:
        if soil_moisture < plant_threshold['soil_moisture']['optimal']:
            moisture_score = 0.5 + 0.5 * ((soil_moisture - plant_threshold['soil_moisture']['min']) / 
                                         (plant_threshold['soil_moisture']['optimal'] - plant_threshold['soil_moisture']['min']))
        else:
            moisture_score = 1 - 0.5 * ((soil_moisture - plant_threshold['soil_moisture']['optimal']) / 
                                       (plant_threshold['soil_moisture']['max'] - plant_threshold['soil_moisture']['optimal']))
    
    # Tính điểm thời gian
    time_score = max(0, 1 - (hours_since_last_watering / plant_threshold['watering_interval']))
    
    # Tính điểm tổng hợp
    combined_score = (moisture_score * 0.7) + (time_score * 0.3)
    
    # Xác định nhu cầu tưới nước
    should_water = combined_score < 0.6
    confidence = should_water ? (1 - combined_score) : combined_score
    
    # Tính lượng nước đề xuất
    base_amount = {
        'herb': 150,
        'flower': 200,
        'vegetable': 250,
        'fruit': 300,
        'tree': 400,
        'succulent': 100,
        'default': 200
    }.get(plant_type.lower(), 200)
    
    # Điều chỉnh lượng nước dựa trên độ ẩm đất
    amount = int(base_amount * (1 + (1 - moisture_score) * 0.5))
    
    # Tính thời gian đến lần tưới tiếp theo
    hours_to_next = int(plant_threshold['watering_interval'] * combined_score)
    if hours_to_next < 1:
        hours_to_next = 1
    
    return should_water, confidence, amount, hours_to_next

# Hàm tối ưu hóa lịch tưới nước
def optimize_watering_schedule(plants):
    schedules = []
    
    # Sắp xếp cây theo mức độ ưu tiên tưới nước
    sorted_plants = sorted(plants, key=lambda p: p.get('watering_priority', 0), reverse=True)
    
    # Phân bổ thời gian tưới
    current_time = datetime.now()
    for i, plant in enumerate(sorted_plants):
        # Tính thời gian tưới
        watering_time = current_time + timedelta(minutes=i*15)  # Mỗi cây cách nhau 15 phút
        
        # Tính lượng nước và thời gian tưới
        plant_type = plant.get('type', 'default')
        base_amount = {
            'herb': 150,
            'flower': 200,
            'vegetable': 250,
            'fruit': 300,
            'tree': 400,
            'succulent': 100,
            'default': 200
        }.get(plant_type.lower(), 200)
        
        # Điều chỉnh theo kích thước cây
        size_multiplier = {
            'small': 0.7,
            'medium': 1.0,
            'large': 1.5,
            'extra_large': 2.0
        }.get(plant.get('size', 'medium').lower(), 1.0)
        
        amount = int(base_amount * size_multiplier)
        
        # Tính thời gian tưới (giây)
        duration = int(amount / 10)  # Giả sử tốc độ tưới 10ml/giây
        
        schedules.append({
            'plant_id': plant.get('id'),
            'plant_name': plant.get('name', f'Plant {i+1}'),
            'watering_time': watering_time.isoformat(),
            'duration_seconds': duration,
            'estimated_water_ml': amount
        })
    
    return schedules

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)