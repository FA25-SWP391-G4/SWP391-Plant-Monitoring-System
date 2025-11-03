'use client'

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Upload, X, AlertCircle, CheckCircle, ArrowLeft, Loader, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../../providers/AuthProvider';
import aiApi from '../../../api/aiApi';

const PlantHealthAnalysisPage = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const router = useRouter();

  const hasAIAccess = () => {
    if (!user) return false;
    return user.isPremium || user.role === 'admin' || user.role === 'Admin' || user.role === 'Premium';
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedImage(file);
    setError(null);
    setAnalysisResult(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Please select an image first');
      return;
    }

    if (!hasAIAccess()) {
      setError('Premium subscription or admin access required for AI features');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await aiApi.analyzeImage(formData);
      
      if (response.success) {
        setAnalysisResult(response.data);
      } else {
        setError(response.error || 'Analysis failed. Please try again.');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      setError('An error occurred during analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthScoreBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access AI plant health analysis</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  if (!hasAIAccess()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Premium Feature</h2>
          <p className="text-gray-600 mb-4">Upgrade to Premium or contact admin for AI-powered plant health analysis</p>
          <button
            onClick={() => router.push('/premium')}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg"
          >
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Plant Health Analysis</h1>
            <p className="text-gray-600">Upload a photo of your plant to analyze its health and detect diseases</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Camera size={24} className="text-blue-600" />
              Upload Plant Image
            </h2>

            {!imagePreview ? (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop your plant image here
                </p>
                <p className="text-gray-600 mb-4">
                  or click to browse files
                </p>
                <div className="flex justify-center">
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2">
                    <Upload size={20} />
                    Choose File
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-4">
                  Supported formats: JPG, JPEG, PNG, GIF (Max: 10MB)
                </p>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Plant preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <button
                  onClick={clearImage}
                  className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg flex items-center gap-2">
                <AlertCircle size={20} className="text-red-600" />
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {selectedImage && !error && (
              <div className="mt-6">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Camera size={20} />
                      Analyze Plant Health
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Analysis Results</h2>

            {!analysisResult && !isAnalyzing && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-600">Upload and analyze an image to see results here</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="text-center py-12">
                <Loader size={48} className="mx-auto text-blue-600 animate-spin mb-4" />
                <p className="text-gray-600">Analyzing your plant image...</p>
                <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
              </div>
            )}

            {analysisResult && (
              <div className="space-y-6">
                {/* Health Score */}
                {analysisResult.analysis?.health_score && (
                  <div className={`p-4 rounded-lg ${getHealthScoreBgColor(analysisResult.analysis.health_score)}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">Health Score</h3>
                      <span className={`text-2xl font-bold ${getHealthScoreColor(analysisResult.analysis.health_score)}`}>
                        {analysisResult.analysis.health_score}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          analysisResult.analysis.health_score >= 80
                            ? 'bg-green-600'
                            : analysisResult.analysis.health_score >= 60
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${analysisResult.analysis.health_score}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Plant Condition */}
                {analysisResult.analysis?.condition && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Plant Condition</h3>
                    <p className="text-gray-700">{analysisResult.analysis.condition}</p>
                  </div>
                )}

                {/* Disease Detection */}
                {analysisResult.analysis?.diseases && analysisResult.analysis.diseases.length > 0 && (
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                      <AlertCircle size={20} />
                      Detected Issues
                    </h3>
                    <ul className="space-y-1">
                      {analysisResult.analysis.diseases.map((disease, index) => (
                        <li key={index} className="text-red-700">• {disease}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {analysisResult.analysis?.recommendations && analysisResult.analysis.recommendations.length > 0 && (
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                      <CheckCircle size={20} />
                      Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {analysisResult.analysis.recommendations.map((rec, index) => (
                        <li key={index} className="text-green-700 flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* General Response */}
                {analysisResult.response && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Analysis Summary</h3>
                    <p className="text-gray-700">{analysisResult.response}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlantHealthAnalysisPage;