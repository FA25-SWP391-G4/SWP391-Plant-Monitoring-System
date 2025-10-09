from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class WateringPredictionRequest(BaseModel):
    plant_id: int
    soil_moisture: float
    temperature: float
    humidity: float
    light_intensity: float
    plant_type: str
    last_watering_time: datetime
    
    class Config:
        schema_extra = {
            "example": {
                "plant_id": 1,
                "soil_moisture": 35.5,
                "temperature": 28.2,
                "humidity": 65.0,
                "light_intensity": 850.0,
                "plant_type": "tomato",
                "last_watering_time": "2023-05-01T08:30:00"
            }
        }

class PlantAnalysisRequest(BaseModel):
    plant_id: int
    soil_moisture: float
    temperature: float
    humidity: float
    light_intensity: float
    plant_type: str
    ph_level: Optional[float] = None
    nutrient_level: Optional[Dict[str, float]] = None
    historical_data: Optional[List[Dict[str, Any]]] = None
    
    class Config:
        schema_extra = {
            "example": {
                "plant_id": 1,
                "soil_moisture": 35.5,
                "temperature": 28.2,
                "humidity": 65.0,
                "light_intensity": 850.0,
                "plant_type": "tomato",
                "ph_level": 6.5,
                "nutrient_level": {
                    "nitrogen": 4.2,
                    "phosphorus": 3.1,
                    "potassium": 5.0
                },
                "historical_data": [
                    {
                        "timestamp": "2023-05-01T08:30:00",
                        "soil_moisture": 40.2,
                        "temperature": 27.5
                    }
                ]
            }
        }

class WateringScheduleRequest(BaseModel):
    plant_id: int
    plant_type: str
    current_soil_moisture: float
    target_soil_moisture: float
    temperature_forecast: List[float]
    humidity_forecast: List[float]
    light_forecast: List[float]
    watering_constraints: Optional[Dict[str, Any]] = None
    
    class Config:
        schema_extra = {
            "example": {
                "plant_id": 1,
                "plant_type": "tomato",
                "current_soil_moisture": 35.5,
                "target_soil_moisture": 60.0,
                "temperature_forecast": [28.2, 29.1, 30.5, 29.8, 28.5],
                "humidity_forecast": [65.0, 63.2, 60.5, 62.1, 64.5],
                "light_forecast": [850.0, 900.0, 950.0, 900.0, 850.0],
                "watering_constraints": {
                    "max_watering_duration": 300,
                    "preferred_time_ranges": [
                        {"start": "06:00:00", "end": "08:00:00"},
                        {"start": "18:00:00", "end": "20:00:00"}
                    ]
                }
            }
        }

class HistoricalAnalysisRequest(BaseModel):
    plant_id: int
    plant_type: str
    start_date: datetime
    end_date: datetime
    data_points: List[Dict[str, Any]]
    
    class Config:
        schema_extra = {
            "example": {
                "plant_id": 1,
                "plant_type": "tomato",
                "start_date": "2023-04-01T00:00:00",
                "end_date": "2023-05-01T00:00:00",
                "data_points": [
                    {
                        "timestamp": "2023-04-01T08:30:00",
                        "soil_moisture": 40.2,
                        "temperature": 27.5,
                        "humidity": 65.0,
                        "light_intensity": 850.0,
                        "watering_event": True,
                        "watering_duration": 120
                    }
                ]
            }
        }

class ChatbotRequest(BaseModel):
    user_id: int
    message: str
    conversation_history: Optional[List[Dict[str, Any]]] = None
    plant_context: Optional[Dict[str, Any]] = None
    
    class Config:
        schema_extra = {
            "example": {
                "user_id": 1,
                "message": "Cây cà chua của tôi có lá vàng, tôi nên làm gì?",
                "conversation_history": [
                    {
                        "role": "user",
                        "message": "Xin chào",
                        "timestamp": "2023-05-01T08:30:00"
                    },
                    {
                        "role": "assistant",
                        "message": "Xin chào! Tôi có thể giúp gì cho bạn về việc chăm sóc cây trồng?",
                        "timestamp": "2023-05-01T08:30:05"
                    }
                ],
                "plant_context": {
                    "plant_id": 1,
                    "plant_type": "tomato",
                    "current_conditions": {
                        "soil_moisture": 35.5,
                        "temperature": 28.2,
                        "humidity": 65.0
                    }
                }
            }
        }