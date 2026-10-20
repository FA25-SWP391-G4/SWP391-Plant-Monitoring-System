@echo off
title AI Plant Disease Diagnostic Server (MobileNetV3 + u2netp)
echo ===========================================================================
echo  Starting AI Plant Disease Diagnostic Server on port 8000...
echo  Architecture: Two-Stage CPU (u2netp Salient Object Detection + MobileNetV3)
echo ===========================================================================
cd ai_models\disease_recognition
python app.py
pause
