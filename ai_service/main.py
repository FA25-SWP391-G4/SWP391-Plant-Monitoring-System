from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import numpy as np
import os
import time
import json
import requests
from datetime import datetime, timedelta

# Create FastAPI app
app = FastAPI(title="Plant System AI Service")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model classes
class PlantHealthData(BaseModel):
    plant_id: int
    sensor_data: List[Dict[str, Any]]

class WateringPrediction(BaseModel):
    plant_id: int
    days: int = 7

class PlantImage(BaseModel):
    plant_id: int
    image_url: Optional[str] = None

class ChatRequest(BaseModel):
    user_id: int
    message: str
    context: Optional[List[Dict[str, str]]] = None

# Endpoint for plant health analysis
@app.post("/api/v1/plant-analysis")
async def analyze_plant_health(data: PlantHealthData):
    # Here we would normally use a trained model to analyze the data
    # For demonstration, we'll generate a simple analysis
    
    try:
        # Extract recent data points
        temperatures = [entry.get('temperature', 0) for entry in data.sensor_data]
        humidity = [entry.get('humidity', 0) for entry in data.sensor_data]
        soil_moisture = [entry.get('soil_moisture', 0) for entry in data.sensor_data]
        light = [entry.get('light', 0) for entry in data.sensor_data]
        
        # Calculate averages
        avg_temp = sum(temperatures) / len(temperatures) if temperatures else 0
        avg_humidity = sum(humidity) / len(humidity) if humidity else 0
        avg_soil = sum(soil_moisture) / len(soil_moisture) if soil_moisture else 0
        avg_light = sum(light) / len(light) if light else 0
        
        # Generate health score (0-100)
        soil_score = min(100, max(0, avg_soil * 100))
        temp_score = min(100, max(0, 100 - abs(avg_temp - 23) * 5))  # Optimal temp around 23°C
        humidity_score = min(100, max(0, avg_humidity * 100))
        light_score = min(100, max(0, avg_light * 100))
        
        overall_health = (soil_score * 0.4 + temp_score * 0.2 + humidity_score * 0.2 + light_score * 0.2)
        
        return {
            "plant_id": data.plant_id,
            "health_score": round(overall_health, 2),
            "analysis": {
                "soil_moisture": {
                    "score": round(soil_score, 2),
                    "status": "optimal" if soil_score > 70 else "concerning" if soil_score > 40 else "critical",
                    "recommendation": "Soil moisture is optimal" if soil_score > 70 else "Consider watering soon" if soil_score > 40 else "Water immediately"
                },
                "temperature": {
                    "score": round(temp_score, 2),
                    "status": "optimal" if temp_score > 70 else "concerning" if temp_score > 40 else "critical",
                    "recommendation": "Temperature is optimal" if temp_score > 70 else "Monitor temperature" if temp_score > 40 else "Adjust growing environment"
                },
                "humidity": {
                    "score": round(humidity_score, 2),
                    "status": "optimal" if humidity_score > 70 else "concerning" if humidity_score > 40 else "critical",
                    "recommendation": "Humidity is optimal" if humidity_score > 70 else "Consider increasing humidity" if humidity_score > 40 else "Increase humidity immediately"
                },
                "light": {
                    "score": round(light_score, 2),
                    "status": "optimal" if light_score > 70 else "concerning" if light_score > 40 else "critical",
                    "recommendation": "Light level is optimal" if light_score > 70 else "Consider increasing light exposure" if light_score > 40 else "Provide more light immediately"
                }
            },
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing plant health: {str(e)}")

# Endpoint for watering prediction
@app.post("/api/v1/watering-prediction")
async def predict_watering_needs(data: WateringPrediction):
    try:
        # Simulate a prediction model
        predictions = []
        base_date = datetime.now()
        
        for i in range(data.days):
            # Generate simulated prediction data
            date = base_date + timedelta(days=i)
            soil_decrease = np.random.uniform(0.05, 0.15)  # Random daily decrease
            watering_needed = soil_decrease > 0.1  # Threshold for needing water
            
            predictions.append({
                "date": date.strftime("%Y-%m-%d"),
                "soil_moisture_prediction": max(0, 1.0 - (i * soil_decrease)),
                "watering_recommended": watering_needed,
                "confidence": np.random.uniform(0.7, 0.95)
            })
        
        return {
            "plant_id": data.plant_id,
            "predictions": predictions,
            "next_watering": next((
                pred["date"] for pred in predictions if pred["watering_recommended"]
            ), None),
            "model_version": "1.0.0"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error predicting watering needs: {str(e)}")

# Endpoint for image recognition
@app.post("/api/v1/image-recognition")
async def recognize_plant_image(image: UploadFile = File(...), plant_id: int = Form(...)):
    try:
        # Save the uploaded image
        file_location = f"temp/{image.filename}"
        os.makedirs(os.path.dirname(file_location), exist_ok=True)
        
        with open(file_location, "wb+") as file_object:
            file_object.write(await image.read())
        
        # In a real system, we would process the image with a trained model
        # For demonstration, we'll return simulated results
        
        analysis_result = {
            "plant_id": plant_id,
            "image_path": file_location,
            "health_assessment": {
                "overall_health": np.random.uniform(60, 95),
                "leaf_health": np.random.uniform(70, 95),
                "stem_health": np.random.uniform(60, 90),
                "pest_detection": np.random.random() > 0.8,  # 20% chance of detecting pests
                "disease_detection": np.random.random() > 0.85  # 15% chance of detecting disease
            },
            "recommendations": [
                "Ensure adequate watering",
                "Maintain optimal light exposure",
                "Check for signs of nutrient deficiency"
            ],
            "timestamp": datetime.now().isoformat()
        }
        
        # Clean up the temporary file
        os.remove(file_location)
        
        return analysis_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing plant image: {str(e)}")

# Endpoint for AI chatbot
@app.post("/api/v1/chatbot")
async def chatbot_response(request: ChatRequest):
    try:
        # In a real system, we would call an LLM API like OpenAI
        # For demonstration, we'll return simulated responses
        
        plant_care_responses = [
            "Based on your plant's sensor data, I recommend watering twice a week.",
            "Your plant's soil moisture is low. Consider watering it today.",
            "The temperature in your growing environment is optimal for this type of plant.",
            "Your plant may need more light exposure for optimal growth.",
            "I notice the humidity levels are below optimal range. Consider using a humidifier.",
            "Your plant is showing excellent growth patterns based on recent measurements.",
            "For this type of plant, maintaining soil pH between 6.0 and 6.5 is recommended.",
            "Based on the season and your location, adjust watering frequency to once every 3 days."
        ]
        
        # Simulate thinking time
        time.sleep(0.5)
        
        return {
            "user_id": request.user_id,
            "response": np.random.choice(plant_care_responses),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating chatbot response: {str(e)}")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "plant-ai-service", "version": "1.0.0"}

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)