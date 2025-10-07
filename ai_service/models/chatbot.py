import os
import json
import random
from datetime import datetime

class ChatbotModel:
    def __init__(self):
        self.knowledge_base = self._load_knowledge_base()
    
    def _load_knowledge_base(self):
        """Tải cơ sở kiến thức cho chatbot"""
        # Trong thực tế, bạn sẽ tải từ file hoặc database
        # Đây là cơ sở kiến thức đơn giản cho mục đích demo
        return {
            "greeting": [
                "Xin chào! Tôi là trợ lý AI của Plant Monitoring System. Tôi có thể giúp gì cho bạn?",
                "Chào bạn! Tôi có thể giúp bạn với các vấn đề về chăm sóc cây trồng. Bạn cần hỗ trợ gì?",
                "Xin chào! Tôi là chatbot hỗ trợ chăm sóc cây trồng. Bạn có câu hỏi gì không?"
            ],
            "farewell": [
                "Tạm biệt! Hãy liên hệ lại nếu bạn cần thêm hỗ trợ.",
                "Chúc bạn một ngày tốt lành! Hẹn gặp lại.",
                "Rất vui được giúp đỡ bạn. Tạm biệt!"
            ],
            "watering": [
                "Hầu hết các cây nên được tưới khi lớp đất trên cùng khô. Tránh tưới quá nhiều nước.",
                "Tưới cây vào buổi sáng sớm là tốt nhất để giảm sự bay hơi và bệnh nấm.",
                "Cây trồng trong nhà thường cần ít nước hơn cây trồng ngoài trời."
            ],
            "fertilizing": [
                "Hầu hết các cây nên được bón phân mỗi 2-4 tuần trong mùa sinh trưởng.",
                "Sử dụng phân bón cân bằng cho hầu hết các loại cây. Cây ra hoa có thể cần nhiều phốt pho hơn.",
                "Tránh bón phân quá nhiều, có thể gây hại cho cây."
            ],
            "pests": [
                "Kiểm tra cây thường xuyên để phát hiện sớm côn trùng gây hại.",
                "Xà phòng insecticidal và dầu neem là các biện pháp tự nhiên để kiểm soát nhiều loại côn trùng.",
                "Giữ lá cây khô và loại bỏ lá chết để giảm nguy cơ côn trùng."
            ],
            "diseases": [
                "Nhiều bệnh cây trồng liên quan đến độ ẩm quá cao. Đảm bảo thông gió tốt.",
                "Loại bỏ lá bị nhiễm bệnh ngay khi phát hiện để ngăn sự lây lan.",
                "Sử dụng đất sạch và dụng cụ đã khử trùng để ngăn ngừa bệnh."
            ],
            "yellow_leaves": [
                "Lá vàng có thể do tưới quá nhiều nước, thiếu ánh sáng, hoặc thiếu dinh dưỡng.",
                "Kiểm tra độ ẩm của đất - nếu quá ướt, giảm tưới nước và đảm bảo thoát nước tốt.",
                "Nếu đất khô và cây nhận đủ ánh sáng, có thể cần bổ sung phân bón."
            ],
            "brown_leaves": [
                "Lá nâu thường do không khí quá khô hoặc cháy nắng.",
                "Tăng độ ẩm xung quanh cây bằng cách phun sương hoặc sử dụng máy tạo độ ẩm.",
                "Di chuyển cây khỏi ánh nắng trực tiếp nếu lá bị cháy."
            ],
            "default": [
                "Tôi không chắc về vấn đề đó. Bạn có thể mô tả chi tiết hơn không?",
                "Tôi chưa có thông tin về vấn đề này. Bạn có thể hỏi về cách tưới nước, bón phân, hoặc xử lý sâu bệnh không?",
                "Tôi đang học hỏi thêm về chủ đề này. Bạn có thể hỏi tôi về các vấn đề phổ biến khác trong chăm sóc cây trồng không?"
            ]
        }
    
    def _identify_intent(self, message):
        """Xác định ý định từ tin nhắn của người dùng"""
        message = message.lower()
        
        if any(word in message for word in ["xin chào", "chào", "hi", "hello"]):
            return "greeting"
        
        if any(word in message for word in ["tạm biệt", "bye", "gặp lại sau"]):
            return "farewell"
        
        if any(word in message for word in ["tưới", "nước", "khô", "ướt"]):
            return "watering"
        
        if any(word in message for word in ["phân bón", "phân", "dinh dưỡng", "bón"]):
            return "fertilizing"
        
        if any(word in message for word in ["sâu", "côn trùng", "bọ", "rệp"]):
            return "pests"
        
        if any(word in message for word in ["bệnh", "nấm", "mốc", "thối"]):
            return "diseases"
        
        if any(word in message for word in ["lá vàng", "vàng lá"]):
            return "yellow_leaves"
        
        if any(word in message for word in ["lá nâu", "lá khô", "cháy lá"]):
            return "brown_leaves"
        
        return "default"
    
    def _get_plant_specific_advice(self, plant_context):
        """Cung cấp lời khuyên cụ thể dựa trên ngữ cảnh cây trồng"""
        if plant_context is None:
            return None
        
        plant_type = plant_context.get("plant_type", "").lower()
        current_conditions = plant_context.get("current_conditions", {})
        
        # Lời khuyên cụ thể cho từng loại cây
        if plant_type == "tomato":
            if current_conditions.get("soil_moisture", 100) < 40:
                return "Cây cà chua của bạn cần được tưới nước. Cà chua cần đất ẩm đều đặn để phát triển tốt và ngăn ngừa nứt quả."
            if current_conditions.get("temperature", 25) > 32:
                return "Nhiệt độ hiện tại khá cao cho cây cà chua. Cân nhắc che bóng một phần và tưới nước thường xuyên hơn."
        
        elif plant_type == "lettuce":
            if current_conditions.get("soil_moisture", 100) < 50:
                return "Xà lách cần nhiều nước để giữ lá tươi và ngăn vị đắng. Hãy tưới nước ngay."
            if current_conditions.get("temperature", 25) > 26:
                return "Nhiệt độ hiện tại cao cho xà lách. Xà lách thích điều kiện mát mẻ, cân nhắc che bóng hoặc di chuyển đến nơi mát hơn."
        
        elif plant_type == "cucumber":
            if current_conditions.get("soil_moisture", 100) < 45:
                return "Dưa chuột cần nhiều nước để phát triển quả mọng nước. Hãy tưới nước ngay."
        
        return None
    
    def generate_response(self, request):
        """Tạo phản hồi cho tin nhắn của người dùng"""
        message = request.message
        conversation_history = request.conversation_history or []
        plant_context = request.plant_context
        
        # Xác định ý định
        intent = self._identify_intent(message)
        
        # Lấy phản hồi từ cơ sở kiến thức
        responses = self.knowledge_base.get(intent, self.knowledge_base["default"])
        response = random.choice(responses)
        
        # Bổ sung lời khuyên cụ thể cho cây nếu có
        plant_specific_advice = self._get_plant_specific_advice(plant_context)
        if plant_specific_advice:
            response += f"\n\n{plant_specific_advice}"
        
        # Thêm phản hồi vào lịch sử hội thoại
        conversation_history.append({
            "role": "user",
            "message": message,
            "timestamp": datetime.now().isoformat()
        })
        
        conversation_history.append({
            "role": "assistant",
            "message": response,
            "timestamp": datetime.now().isoformat()
        })
        
        return {
            "text": response,
            "intent": intent,
            "conversation_history": conversation_history
        }