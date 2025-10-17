# Plant Disease Recognition Model

This directory contains the TensorFlow.js model files for plant disease recognition.

## Model Files (to be added):
- `model.json` - Model architecture and metadata  
- `weights.bin` - Model weights
- `classes.json` - Disease class labels

## Model Architecture:
- Base: MobileNetV2 (optimized for mobile/edge deployment)
- Input: 224x224x3 RGB images
- Output: Disease classification with confidence scores
- Framework: TensorFlow.js for Node.js

## Supported Disease Classes:
1. Healthy
2. Early Blight
3. Late Blight
4. Leaf Spot
5. Powdery Mildew
6. Rust
7. Bacterial Spot
8. Mosaic Virus
9. Yellowing
10. Wilting
11. Other/Unknown

## Image Preprocessing:
- Resize to 224x224 pixels
- Normalize pixel values (0-1 range)
- RGB format conversion
- Sharp.js for efficient processing

The model will be trained on plant disease datasets and converted to TensorFlow.js format for local inference.