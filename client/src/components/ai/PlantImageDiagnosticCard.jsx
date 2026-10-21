'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';

const AI_API_URL = process.env.NEXT_PUBLIC_AI_DIAGNOSTIC_URL || 'http://localhost:8000';

export default function PlantImageDiagnosticCard({ plant = null, onFinish = null }) {
  const [mode, setMode] = useState('camera'); // 'camera' or 'upload'
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null); // base64 / object URL
  const [imageFile, setImageFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState(null);
  const [error, setError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Safely stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Safely start camera stream
  const startCamera = useCallback(async (facing = facingMode) => {
    stopCamera();
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported or blocked by browser/insecure connection.');
      }
      const constraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera access failed, fallback to upload:', err);
      setError('Cannot access camera (' + (err.message || 'Permission denied') + '). You can upload an image instead.');
      setCameraActive(false);
      setMode('upload');
    }
  }, [facingMode, stopCamera]);

  useEffect(() => {
    if (mode === 'camera' && !capturedImage) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, capturedImage, startCamera, stopCamera]);

  // Flip camera between front/back
  const toggleFacingMode = () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextFacing);
    startCamera(nextFacing);
  };

  // Capture current frame from camera
  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `leaf_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setImageFile(file);
        setCapturedImage(canvas.toDataURL('image/jpeg', 0.92));
        stopCamera();
      }
    }, 'image/jpeg', 0.92);
  };

  // Handle uploaded file from disk
  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    setError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setCapturedImage(evt.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Reset to retake photo
  const handleRetake = () => {
    setCapturedImage(null);
    setImageFile(null);
    setDiagnosisResult(null);
    setError(null);
    if (mode === 'camera') {
      startCamera();
    }
  };

  // Call AI Diagnostic Server
  const handleAnalyze = async () => {
    if (!imageFile) {
      setError('Please capture or select an image first.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      const endpoint = `${AI_API_URL}/diagnose`;
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI Engine error (${response.status}): ${errText || response.statusText}`);
      }

      const data = await response.json();
      setDiagnosisResult(data);
      if (onFinish) {
        onFinish(data);
      }
    } catch (err) {
      console.error('Diagnosis error:', err);
      setError(
        `Cannot reach AI Diagnostic Server at ${AI_API_URL}. ` +
        `Make sure the Python engine is running: (cd Plant_image_diagonstic && python app.py). ` +
        `Details: ${err.message}`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header bar */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-900/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌿</span>
          <h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">
            Plant Leaf Health Analyzer
          </h3>
          {plant?.name && (
            <span className="ml-2 text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
              Target: {plant.name}
            </span>
          )}
        </div>

        {/* Mode Selector Tabs (only shown before taking/selecting photo) */}
        {!capturedImage && !diagnosisResult && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setMode('camera');
                startCamera();
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                mode === 'camera'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-200/70 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Camera
            </button>
            <button
              onClick={() => {
                stopCamera();
                setMode('upload');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                mode === 'upload'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-200/70 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload
            </button>
          </div>
        )}
      </div>

      <div className="p-6 space-y-4">
        {/* Error message */}
        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm flex items-start gap-2">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="flex-1 leading-relaxed">{error}</span>
          </div>
        )}

        {/* 1. Camera View */}
        {mode === 'camera' && !capturedImage && (
          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video sm:aspect-[16/10] flex items-center justify-center shadow-inner group">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />

            {/* Viewfinder Target Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 sm:w-64 sm:h-64 border-2 border-dashed border-emerald-400/70 rounded-2xl flex items-center justify-center">
                <div className="text-emerald-300 text-xs px-2 py-1 rounded bg-black/40 backdrop-blur-sm">
                  Frame leaf inside box
                </div>
              </div>
            </div>

            {/* Camera Controls */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={toggleFacingMode}
                className="p-3 rounded-full bg-gray-900/70 text-white hover:bg-gray-900 transition shadow-lg"
                title="Switch Camera"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              <button
                type="button"
                onClick={captureFrame}
                className="px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-2 shadow-xl ring-4 ring-emerald-500/30 transition active:scale-95"
              >
                <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                Snap Photo
              </button>
            </div>
          </div>
        )}

        {/* 2. File Upload View */}
        {mode === 'upload' && !capturedImage && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-emerald-500 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition bg-gray-50/50 dark:bg-gray-800/40 hover:bg-emerald-50/20"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">
              Select or Drop Leaf Photo
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              JPEG, PNG, WEBP supported
            </p>
          </div>
        )}

        {/* 3. Image Preview & Action */}
        {capturedImage && !diagnosisResult && (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden bg-black max-h-[380px] flex items-center justify-center shadow-md">
              <img
                src={capturedImage}
                alt="Selected Leaf"
                className="max-h-[380px] w-auto object-contain"
              />
              <button
                onClick={handleRetake}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium backdrop-blur-sm transition flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Choose Another
              </button>
            </div>

            <button
              type="button"
              disabled={isAnalyzing}
              onClick={handleAnalyze}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>AI is isolating leaf & diagnosing condition...</span>
                </>
              ) : (
                <>
                  <span className="text-base">✨</span>
                  <span>Diagnose Leaf Disease with AI</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 4. Diagnosis Result View */}
        {diagnosisResult && (
          <div className="space-y-4 pt-1">
            {/* Header Verdict Card */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              diagnosisResult.verdict === 'CONFIDENT'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                : diagnosisResult.verdict === 'MODERATE'
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'
            }`}>
              <div>
                <div className="text-xs uppercase tracking-wider font-bold mb-0.5 text-gray-500">
                  DIAGNOSIS VERDICT
                </div>
                <div className="text-xl font-extrabold text-gray-900 dark:text-white">
                  {diagnosisResult.predicted_species} — {diagnosisResult.predicted_condition}
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  diagnosisResult.verdict === 'CONFIDENT'
                    ? 'bg-emerald-600 text-white'
                    : diagnosisResult.verdict === 'MODERATE'
                    ? 'bg-amber-500 text-white'
                    : 'bg-red-500 text-white'
                }`}>
                  {diagnosisResult.verdict} ({Math.round(diagnosisResult.confidence * 100)}%)
                </span>
                <div className="text-[11px] text-gray-500 mt-1">
                  Latency: {diagnosisResult.timing_breakdown_ms?.total_latency || '~200'} ms
                </div>
              </div>
            </div>

            {/* Side-by-side Images: Original vs AI Isolated Leaf */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl overflow-hidden bg-gray-900 text-center p-1.5 border border-gray-200 dark:border-gray-700">
                <div className="text-[11px] text-gray-400 mb-1 font-medium">Input Photo</div>
                <img
                  src={capturedImage}
                  alt="Original Photo"
                  className="h-36 w-full object-contain mx-auto rounded"
                />
              </div>
              <div className="rounded-xl overflow-hidden bg-black text-center p-1.5 border border-gray-200 dark:border-gray-700">
                <div className="text-[11px] text-emerald-400 mb-1 font-medium">AI Isolated Leaf (u2netp)</div>
                {diagnosisResult.segmented_leaf_base64 ? (
                  <img
                    src={`data:image/jpeg;base64,${diagnosisResult.segmented_leaf_base64}`}
                    alt="Segmented Leaf"
                    className="h-36 w-full object-contain mx-auto rounded"
                  />
                ) : (
                  <div className="h-36 flex items-center justify-center text-xs text-gray-500">
                    No mask available
                  </div>
                )}
              </div>
            </div>

            {/* Details & Guidance */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 space-y-2 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-xs uppercase tracking-wide text-gray-500">
                  Observation
                </h4>
                <p className="text-gray-700 dark:text-gray-300 mt-0.5">
                  {diagnosisResult.user_guidance}
                </p>
              </div>
              {diagnosisResult.condition_details && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-xs uppercase tracking-wide text-gray-500">
                    Disease Details
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mt-0.5 text-xs">
                    {diagnosisResult.condition_details}
                  </p>
                </div>
              )}
            </div>

            {/* Treatment Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-lg">💊</span>
                <h3 className="font-bold text-emerald-900 dark:text-emerald-300 text-sm">
                  Recommended Treatment & Care Action
                </h3>
              </div>
              <p className="text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm leading-relaxed">
                {diagnosisResult.treatment_recommendation || 'Maintain normal watering and regular indirect sunlight.'}
              </p>
            </div>

            {/* Retake Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleRetake}
                className="w-full py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Analyze Another Leaf
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
