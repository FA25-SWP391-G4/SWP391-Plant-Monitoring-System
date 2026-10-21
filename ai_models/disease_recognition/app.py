import io
import os
import base64
import threading
import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from pipeline import ProductionPlantPipeline

app = FastAPI(
    title="Indoor Plant Disease Diagnostic Engine",
    description="Two-stage Edge CPU Computer Vision Engine: u2netp (SOD) + MobileNetV3-Large 14-Class Diagnosis",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global pipeline state
pipeline: ProductionPlantPipeline = None
pipeline_loading: bool = False
pipeline_error: str = None

def init_pipeline():
    global pipeline, pipeline_loading, pipeline_error
    try:
        print("Starting background load of Plant Diagnostic Pipeline...")
        pipeline = ProductionPlantPipeline(model_variant="mobilenetv3")
        print("Pipeline ready on CPU (u2netp + MobileNetV3-Large).")
    except Exception as e:
        pipeline_error = str(e)
        print(f"Error initializing pipeline: {e}")
    finally:
        pipeline_loading = False

@app.on_event("startup")
def startup_event():
    global pipeline_loading
    pipeline_loading = True
    # Start loading models in background thread so HTTP port binds in <1s for Render/cloud port scanners
    threading.Thread(target=init_pipeline, daemon=True).start()

HTML_DASHBOARD = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🌿 AI Plant Disease Diagnostic Studio</title>
    <style>
        :root {
            --primary: #2e7d32;
            --primary-light: #e8f5e9;
            --accent: #ff9800;
            --dark: #1b1b1b;
            --card-bg: #ffffff;
            --bg: #f5f7f6;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        body { background: var(--bg); color: var(--dark); padding: 2rem; line-height: 1.6; }
        .container { max-width: 960px; margin: 0 auto; }
        header { text-align: center; margin-bottom: 2rem; }
        header h1 { font-size: 2.2rem; color: var(--primary); margin-bottom: 0.5rem; }
        header p { color: #666; font-size: 1.1rem; }
        .card { background: var(--card-bg); border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); padding: 2rem; margin-bottom: 2rem; }
        .dropzone { border: 2px dashed #b0bec5; border-radius: 12px; padding: 3rem 2rem; text-align: center; cursor: pointer; transition: all 0.3s ease; background: #fafafa; }
        .dropzone:hover { border-color: var(--primary); background: var(--primary-light); }
        .dropzone p { font-size: 1.1rem; color: #555; }
        input[type="file"] { display: none; }
        button.btn { background: var(--primary); color: white; border: none; padding: 0.8rem 1.8rem; font-size: 1rem; border-radius: 8px; cursor: pointer; transition: 0.2s; font-weight: 600; margin-top: 1rem; }
        button.btn:hover { background: #1b5e20; }
        .preview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; }
        .preview-box { text-align: center; background: #000; border-radius: 8px; overflow: hidden; padding: 0.5rem; }
        .preview-box img { max-width: 100%; max-height: 280px; object-fit: contain; }
        .preview-box h4 { color: #fff; margin-bottom: 0.5rem; font-size: 0.9rem; }
        .badge { display: inline-block; padding: 0.3rem 0.8rem; border-radius: 20px; font-weight: bold; font-size: 0.85rem; text-transform: uppercase; }
        .badge-confident { background: #c8e6c9; color: #2e7d32; }
        .badge-moderate { background: #fff3e0; color: #e65100; }
        .badge-uncertain { background: #ffebee; color: #c62828; }
        .result-box { display: none; margin-top: 2rem; border-top: 2px solid #eee; padding-top: 2rem; }
        .metric-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin: 1.5rem 0; }
        .metric-card { background: #f9fbf9; padding: 1rem; border-radius: 8px; border-left: 4px solid var(--primary); }
        .metric-card h5 { color: #777; font-size: 0.8rem; text-transform: uppercase; margin-bottom: 0.2rem; }
        .metric-card p { font-size: 1.3rem; font-weight: bold; color: #222; }
        .treatment-box { background: var(--primary-light); padding: 1.5rem; border-radius: 8px; margin-top: 1.5rem; border: 1px solid #c8e6c9; }
        .treatment-box h3 { color: var(--primary); margin-bottom: 0.5rem; }
        .loading { display: none; text-align: center; margin: 2rem 0; }
        .spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🌿 AI Indoor Plant Disease Diagnostic Studio</h1>
            <p>Edge CPU Architecture: <strong>u2netp (SOD)</strong> + <strong>MobileNetV3-Large</strong> (~200 ms)</p>
        </header>

        <div class="card">
            <div class="dropzone" id="dropzone" onclick="document.getElementById('fileInput').click()">
                <p>📸 <strong>Click to select</strong> or <strong>drag & drop</strong> a plant leaf photo</p>
                <input type="file" id="fileInput" accept="image/*" onchange="handleFileSelect(event)">
                <div id="fileInfo" style="margin-top: 0.5rem; font-weight: bold; color: var(--primary);"></div>
            </div>

            <div style="text-align: center;">
                <button class="btn" id="diagnoseBtn" onclick="submitDiagnosis()" style="display: none;">Run AI Diagnosis</button>
            </div>

            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>Segmenting leaf with u2netp & analyzing symptoms on MobileNetV3 CPU...</p>
            </div>

            <div class="result-box" id="resultBox">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h2>Diagnosis Result</h2>
                    <span id="verdictBadge" class="badge">CONFIDENT</span>
                </div>

                <div class="preview-grid">
                    <div class="preview-box">
                        <h4>Original Leaf Image</h4>
                        <img id="origImg" src="" alt="Original">
                    </div>
                    <div class="preview-box">
                        <h4>AI Isolated Leaf (Anti-Aliased Feathering)</h4>
                        <img id="segmentedImg" src="" alt="Segmented">
                    </div>
                </div>

                <div class="metric-grid">
                    <div class="metric-card">
                        <h5>Plant Species</h5>
                        <p id="resSpecies">-</p>
                    </div>
                    <div class="metric-card">
                        <h5>Diagnosed Condition</h5>
                        <p id="resCondition">-</p>
                    </div>
                    <div class="metric-card">
                        <h5>AI Confidence</h5>
                        <p id="resConfidence">-</p>
                    </div>
                    <div class="metric-card">
                        <h5>Total CPU Latency</h5>
                        <p id="resLatency">-</p>
                    </div>
                </div>

                <p id="resGuidance" style="font-size: 1.1rem; margin-bottom: 1rem;"></p>

                <div class="treatment-box">
                    <h3>🩺 Actionable Plant Care & Treatment</h3>
                    <p id="resTreatment"></p>
                </div>
            </div>
        </div>
    </div>

    <script>
        let selectedFile = null;

        function handleFileSelect(e) {
            const file = e.target.files[0];
            if (file) {
                selectedFile = file;
                document.getElementById('fileInfo').innerText = "Selected: " + file.name;
                document.getElementById('diagnoseBtn').style.display = "inline-block";
                
                const reader = new FileReader();
                reader.onload = function(evt) {
                    document.getElementById('origImg').src = evt.target.result;
                }
                reader.readAsDataURL(file);
            }
        }

        async function submitDiagnosis() {
            if (!selectedFile) return;
            document.getElementById('loading').style.display = "block";
            document.getElementById('resultBox').style.display = "none";
            document.getElementById('diagnoseBtn').disabled = true;

            const formData = new FormData();
            formData.append("file", selectedFile);

            try {
                const res = await fetch("/diagnose", { method: "POST", body: formData });
                const data = await res.json();
                
                document.getElementById('loading').style.display = "none";
                document.getElementById('diagnoseBtn').disabled = false;
                document.getElementById('resultBox').style.display = "block";

                document.getElementById('resSpecies').innerText = data.predicted_species;
                document.getElementById('resCondition').innerText = data.predicted_condition;
                document.getElementById('resConfidence').innerText = (data.confidence * 100).toFixed(1) + "%";
                document.getElementById('resLatency').innerText = data.timing_breakdown_ms.total_latency + " ms";
                document.getElementById('resGuidance').innerText = data.user_guidance;
                document.getElementById('resTreatment').innerText = data.treatment_recommendation || "Maintain healthy care environment.";

                if (data.segmented_leaf_base64) {
                    document.getElementById('segmentedImg').src = "data:image/jpeg;base64," + data.segmented_leaf_base64;
                }

                const badge = document.getElementById('verdictBadge');
                badge.innerText = data.verdict;
                badge.className = "badge badge-" + data.verdict.toLowerCase();

            } catch (err) {
                alert("Error during diagnosis: " + err.message);
                document.getElementById('loading').style.display = "none";
                document.getElementById('diagnoseBtn').disabled = false;
            }
        }
    </script>
</body>
</html>
"""

@app.get("/", response_class=HTMLResponse)
def dashboard():
    return HTMLResponse(content=HTML_DASHBOARD)

@app.get("/health")
def health():
    return {
        "status": "online" if pipeline else ("loading" if pipeline_loading else "initializing"),
        "model_ready": pipeline is not None,
        "model": "MobileNetV3-Large FP32 ONNX (320x320)",
        "segmenter": "u2netp FP32 ONNX",
        "classes_count": len(pipeline.class_names) if pipeline else 14,
        "error": pipeline_error
    }

@app.post("/diagnose")
async def diagnose(file: UploadFile = File(...)):
    global pipeline, pipeline_error, pipeline_loading
    if pipeline is None:
        if pipeline_error:
            raise HTTPException(status_code=500, detail=f"AI Engine failed to initialize: {pipeline_error}")
        raise HTTPException(status_code=503, detail="AI Model is still initializing weights. Please retry in 10-15 seconds.")

    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
        
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img_bgr is None:
            raise HTTPException(status_code=400, detail="Invalid image content.")
            
        result = pipeline.predict(img_bgr, use_tta=True)
        
        # Encode segmented leaf into base64 for frontend display
        leaf_bgr = result.pop('processed_leaf_bgr', None)
        result.pop('segmentation_mask', None)
        
        if leaf_bgr is not None and leaf_bgr.size > 0:
            _, buffer = cv2.imencode('.jpg', leaf_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 90])
            result['segmented_leaf_base64'] = base64.b64encode(buffer).decode('utf-8')
        else:
            result['segmented_leaf_base64'] = None
            
        return JSONResponse(content=result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting Plant Diagnostic Server on 0.0.0.0:{port}...")
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)
