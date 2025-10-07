from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
import uvicorn
import os
from dotenv import load_dotenv

# Import các module AI
from models.watering_prediction import WateringPredictionModel
from models.plant_analysis import PlantAnalysisModel
from models.watering_schedule import WateringScheduleModel
from models.historical_analysis import HistoricalAnalysisModel
from models.image_recognition import ImageRecognitionModel
from models.chatbot import ChatbotModel

# Import các schemas
from schemas.request_schemas import (
    WateringPredictionRequest,
    PlantAnalysisRequest,
    WateringScheduleRequest,
    HistoricalAnalysisRequest,
    ChatbotRequest
)

# Load environment variables
load_dotenv()

# Khởi tạo FastAPI app
app = FastAPI(
    title="Plant Monitoring System AI Service",
    description="AI Microservice cho Plant Monitoring System",
    version="1.0.0"
)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Trong môi trường production, hãy chỉ định cụ thể origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Khởi tạo các model AI
watering_prediction_model = WateringPredictionModel()
plant_analysis_model = PlantAnalysisModel()
watering_schedule_model = WateringScheduleModel()
historical_analysis_model = HistoricalAnalysisModel()
image_recognition_model = ImageRecognitionModel()
chatbot_model = ChatbotModel()

@app.get("/")
async def root():
    return {"message": "Welcome to Plant Monitoring System AI Service"}

@app.post("/api/v1/watering-prediction")
async def predict_watering(request: WateringPredictionRequest):
    """
    Dự báo nhu cầu tưới cây thông minh dựa trên dữ liệu cảm biến và điều kiện môi trường
    """
    try:
        prediction = watering_prediction_model.predict(request)
        return {"success": True, "prediction": prediction}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/plant-analysis")
async def analyze_plant(request: PlantAnalysisRequest):
    """
    Phân tích và cảnh báo sớm tình trạng cây trồng
    """
    try:
        analysis = plant_analysis_model.analyze(request)
        return {"success": True, "analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/watering-schedule")
async def optimize_watering_schedule(request: WateringScheduleRequest):
    """
    Tối ưu lịch tưới tự động dựa trên dữ liệu cây trồng và điều kiện môi trường
    """
    try:
        schedule = watering_schedule_model.optimize(request)
        return {"success": True, "schedule": schedule}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/historical-analysis")
async def analyze_historical_data(request: HistoricalAnalysisRequest):
    """
    Phân tích dữ liệu lịch sử và đề xuất chăm sóc
    """
    try:
        analysis = historical_analysis_model.analyze(request)
        return {"success": True, "analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/image-recognition")
async def recognize_plant_image(file: UploadFile = File(...)):
    """
    Nhận diện tình trạng cây qua ảnh
    """
    try:
        # Kiểm tra định dạng file
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File phải là ảnh")
        
        # Đọc nội dung file
        contents = await file.read()
        
        # Phân tích ảnh
        analysis = image_recognition_model.analyze(contents)
        
        return {"success": True, "analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/chatbot")
async def chatbot_response(request: ChatbotRequest):
    """
    Chatbot hỗ trợ người dùng
    """
    try:
        response = chatbot_model.generate_response(request)
        return {"success": True, "response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)