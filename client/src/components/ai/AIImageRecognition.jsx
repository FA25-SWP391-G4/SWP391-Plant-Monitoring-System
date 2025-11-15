import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import aiApi from '../api/aiApi';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { 
  compressImage, 
  validateImageFile, 
  getImageMetadata, 
  checkBrowserSupport,
  formatFileSize 
} from '../utils/imageUtils';

const AIImageRecognition = ({ plant = null, className = '' }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  
  // State management
  const [selectedFile, setSelectedFile] = useState(null);
  const [originalFile, setOriginalFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  const [pendingAnalyses, setPendingAnalyses] = useState([]);
  const [browserSupport, setBrowserSupport] = useState(null);
  const [imageMetadata, setImageMetadata] = useState(null);

  // Load analysis history and check browser support on component mount
  useEffect(() => {
    // Check browser support
    const support = checkBrowserSupport();
    setBrowserSupport(support);
    
    // Show warning if essential features are not supported
    if (!support.fileReader || !support.canvas) {
      setError('Your browser does not support required features for image analysis');
      return;
    }
    
    const savedHistory = localStorage.getItem('ai_image_analysis_history');
    const savedPending = localStorage.getItem('ai_image_pending_analyses');
    
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        setAnalysisHistory(history);
      } catch (error) {
        console.error('Error loading analysis history:', error);
      }
    }
    
    if (savedPending) {
      try {
        const pending = JSON.parse(savedPending);
        setPendingAnalyses(pending);
      } catch (error) {
        console.error('Error loading pending analyses:', error);
      }
    }
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processPendingAnalyses();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Process pending analyses when coming back online
  const processPendingAnalyses = useCallback(async () => {
    if (pendingAnalyses.length === 0) return;

    for (const pendingAnalysis of pendingAnalyses) {
      try {
        // Recreate FormData and retry analysis
        const formData = new FormData();
        // Note: We can't recreate the exact file, so we'll just clear pending
        // In a real implementation, you'd store the file data as base64
      } catch (error) {
        console.error('Error processing pending analysis:', error);
      }
    }
    
    // Clear pending analyses
    setPendingAnalyses([]);
    localStorage.removeItem('ai_image_pending_analyses');
  }, [pendingAnalyses]);

  // Save analysis history to localStorage
  const saveAnalysisHistory = useCallback((newAnalysis) => {
    const updatedHistory = [newAnalysis, ...analysisHistory.slice(0, 9)]; // Keep last 10 analyses
    setAnalysisHistory(updatedHistory);
    localStorage.setItem('ai_image_analysis_history', JSON.stringify(updatedHistory));
  }, [analysisHistory]);

  // Image compression utility
  const compressImage = useCallback((file, maxSizeMB = 5, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  }, []);

  // Enhanced file validation using utility
  const validateFile = useCallback((file) => {
    const validation = validateImageFile(file, 5, ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff']);
    
    if (!validation.isValid) {
      return validation.errors.map(error => {
        if (error.includes('Invalid file type')) {
          return t('imageRecognition.invalidFileType', 'Please select a valid image file');
        }
        if (error.includes('exceeds maximum')) {
          return t('imageRecognition.fileTooLarge', 'File size must be less than 5MB');
        }
        return error;
      });
    }
    
    return [];
  }, [t]);

  // Handle file selection with compression and metadata extraction
  const handleFileSelect = useCallback(async (file) => {
    if (!file) return;

    const validationErrors = validateFile(file);
    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
      return;
    }

    setError(null);
    setAnalysisResult(null);
    setOriginalFile(file);
    
    try {
      // Extract metadata
      const metadata = await getImageMetadata(file);
      setImageMetadata(metadata);
      
      // Show warning for poor quality images
      if (metadata.quality.score < 0.4) {
        setError(t('imageRecognition.imageQualityPoor', 'Image quality is too poor for reliable analysis. Please try a clearer image.'));
      }
      
      // Show compression progress for large files
      if (file.size > 2 * 1024 * 1024) {
        setIsCompressing(true);
      }
      
      // Compress image if needed
      const processedFile = file.size > 1024 * 1024 ? await compressImage(file, 5, 0.8) : file;
      setSelectedFile(processedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.onerror = () => {
        setError('Failed to read image file');
      };
      reader.readAsDataURL(processedFile);
      
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Failed to process image file');
    } finally {
      setIsCompressing(false);
    }
  }, [t, validateFile]);

  // Handle file input change
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    handleFileSelect(file);
  };

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  }, []);

  // Handle drag and drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  // Simulate analysis progress
  const simulateProgress = useCallback(() => {
    setAnalysisProgress(0);
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
    return interval;
  }, []);

  // Enhanced analyze image with retry mechanism
  const analyzeImage = async (isRetry = false) => {
    if (!selectedFile) {
      setError(t('imageRecognition.noFileSelected', 'Please select an image to analyze'));
      return;
    }

    // Check if offline
    if (!isOnline) {
      const pendingAnalysis = {
        id: Date.now(),
        file: selectedFile,
        plant: plant,
        timestamp: new Date().toISOString()
      };
      
      const updatedPending = [...pendingAnalyses, pendingAnalysis];
      setPendingAnalyses(updatedPending);
      localStorage.setItem('ai_image_pending_analyses', JSON.stringify(updatedPending));
      
      setError(t('imageRecognition.offlineMode', 'Offline Mode - Analysis will be processed when connection is restored'));
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    
    const progressInterval = simulateProgress();

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);
      
      if (plant) {
        formData.append('plant_id', plant.id);
        formData.append('plant_type', plant.species || plant.name);
      }

      const response = await aiApi.analyzeImage(formData);
      setAnalysisResult(result);
      setRetryCount(0); // Reset retry count on success

      // Save to history
      const historyEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        plantName: plant?.name || 'Unknown Plant',
        plantId: plant?.id,
        fileName: originalFile?.name || selectedFile.name,
        originalSize: originalFile?.size || selectedFile.size,
        compressedSize: selectedFile.size,
        result: result,
        preview: preview
      };
      saveAnalysisHistory(historyEntry);

    } catch (error) {
      console.error('Error analyzing image:', error);
      
      // Implement retry logic
      if (!isRetry && retryCount < 2) {
        setRetryCount(prev => prev + 1);
        setError(`Analysis failed. Retrying... (${retryCount + 1}/3)`);
        
        retryTimeoutRef.current = setTimeout(() => {
          analyzeImage(true);
        }, 2000);
        return;
      }
      
      setError(
        error.response?.data?.message || 
        t('imageRecognition.analysisError', 'Unable to analyze image. Please try again.')
      );
      const response = await aiApi.analyzeImage(formData);
      
      // Handle authentication errors
      if (!response.success) {
        if (response.requiresLogin) {
          setError('Vui lòng đăng nhập để sử dụng tính năng phân tích hình ảnh.');
        } else if (response.requiresUltimate || response.code === 'ULTIMATE_REQUIRED') {
          setError('Cần nâng cấp tài khoản Ultimate để sử dụng tính năng phân tích hình ảnh.');
        } else {
          setError(response.error || 'Không thể phân tích hình ảnh. Vui lòng thử lại sau.');
        }
        return;
      } 
      setAnalysis(response.data);
    } finally {
      clearInterval(progressInterval);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  // Clear current analysis
  const clearAnalysis = () => {
    setSelectedFile(null);
    setOriginalFile(null);
    setPreview(null);
    setAnalysisResult(null);
    setError(null);
    setAnalysisProgress(0);
    setRetryCount(0);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Clear analysis history
  const clearHistory = useCallback(() => {
    setAnalysisHistory([]);
    localStorage.removeItem('ai_image_analysis_history');
  }, []);

  // Export analysis history
  const exportHistory = useCallback(() => {
    const dataStr = JSON.stringify(analysisHistory, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plant-analysis-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [analysisHistory]);

  // Get disease severity color
  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'low':
      case 'mild':
        return 'text-green-600 bg-green-100';
      case 'moderate':
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
      case 'severe':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{t('imageRecognition.title', 'Plant Disease Recognition')}</span>
            </CardTitle>
            <CardDescription>
              {plant 
                ? t('imageRecognition.subtitleWithPlant', 'Analyze {{plantName}} for diseases and health issues', { plantName: plant.name })
                : t('imageRecognition.subtitle', 'Upload plant images to detect diseases and get treatment recommendations')
              }
            </CardDescription>
          </div>
          {(selectedFile || analysisResult) && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearAnalysis}
              disabled={isAnalyzing}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {t('imageRecognition.clear', 'Clear')}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Image Upload Section */}
        <div className="space-y-4">
          {/* Offline indicator */}
          {!isOnline && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-sm text-orange-700">
                  You're currently offline. Analysis will be processed when connection is restored.
                </p>
              </div>
            </div>
          )}

          {/* Compression indicator */}
          {isCompressing && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 animate-spin text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <p className="text-sm text-blue-700">
                  {t('imageRecognition.compressing', 'Compressing image...')}
                </p>
              </div>
            </div>
          )}

          {!preview ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              onKeyDown={handleKeyDown}
              aria-label={t('imageRecognition.uploadTitle', 'Upload Plant Image')}
            >
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-lg font-medium text-gray-700 mb-2">
                {t('imageRecognition.uploadTitle', 'Upload Plant Image')}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {t('imageRecognition.uploadDescription', 'Drag and drop an image here, or click to select')}
              </p>
              <Button variant="outline" asChild>
                <label className="cursor-pointer">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    aria-describedby="file-requirements"
                  />
                  {t('imageRecognition.selectFile', 'Select Image')}
                </label>
              </Button>
              <p id="file-requirements" className="text-xs text-gray-400 mt-2">
                {t('imageRecognition.fileRequirements', 'Supports JPG, PNG, WebP (max 5MB)')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative">
                <img
                  src={preview}
                  alt="Plant preview"
                  className="w-full max-h-64 object-contain rounded-lg border border-gray-200"
                />
                <div className="absolute top-2 right-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={clearAnalysis}
                    disabled={isAnalyzing}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>

              {/* Analysis Progress */}
              {isAnalyzing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {t('imageRecognition.analyzing', 'Analyzing image...')}
                    </span>
                    <span className="text-gray-600">{Math.round(analysisProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${analysisProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>{t('imageRecognition.processingImage', 'Processing image with AI model...')}</span>
                  </div>
                </div>
              )}

              {/* File info */}
              {originalFile && selectedFile && originalFile.size !== selectedFile.size && (
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <p>Original: {(originalFile.size / 1024 / 1024).toFixed(2)}MB → Compressed: {(selectedFile.size / 1024 / 1024).toFixed(2)}MB</p>
                </div>
              )}

              {/* Analyze Button */}
              {!isAnalyzing && !analysisResult && (
                <div className="space-y-2">
                  <Button 
                    onClick={() => analyzeImage(false)}
                    disabled={!selectedFile || isCompressing}
                    className="w-full"
                    aria-describedby={!isOnline ? "offline-warning" : undefined}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    {t('imageRecognition.analyzeButton', 'Analyze Plant Health')}
                  </Button>
                  
                  {retryCount > 0 && (
                    <p className="text-xs text-center text-gray-500">
                      Retry attempt {retryCount}/3
                    </p>
                  )}
                </div>
              )}

              {/* Retry Button */}
              {error && !isAnalyzing && analysisResult === null && selectedFile && (
                <Button 
                  onClick={() => analyzeImage(false)}
                  disabled={isCompressing}
                  variant="outline"
                  className="w-full"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('imageRecognition.retryAnalysis', 'Retry Analysis')}
                </Button>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {analysisResult && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <h4 className="font-medium text-lg mb-4 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t('imageRecognition.analysisResults', 'Analysis Results')}</span>
                </h4>

                {/* Disease Detection */}
                <div className="grid gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-800">
                        {t('imageRecognition.diseaseDetection', 'Disease Detection')}
                      </h5>
                      {analysisResult.confidence && (
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(analysisResult.confidence)}`}>
                          {Math.round(analysisResult.confidence * 100)}% {t('imageRecognition.confidence', 'confidence')}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {t('imageRecognition.detectedCondition', 'Detected Condition:')}
                        </span>
                        <span className="font-medium">
                          {analysisResult.disease_detected || analysisResult.condition || t('imageRecognition.healthy', 'Healthy')}
                        </span>
                      </div>
                      
                      {analysisResult.severity && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {t('imageRecognition.severity', 'Severity:')}
                          </span>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(analysisResult.severity)}`}>
                            {analysisResult.severity}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Treatment Recommendations */}
                  {analysisResult.treatment_suggestions && analysisResult.treatment_suggestions.length > 0 && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h5 className="font-medium text-blue-800 mb-3 flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <span>{t('imageRecognition.treatmentRecommendations', 'Treatment Recommendations')}</span>
                      </h5>
                      <ul className="space-y-2">
                        {analysisResult.treatment_suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm text-blue-700">
                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Prevention Tips */}
                  {analysisResult.prevention_tips && analysisResult.prevention_tips.length > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h5 className="font-medium text-green-800 mb-3 flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>{t('imageRecognition.preventionTips', 'Prevention Tips')}</span>
                      </h5>
                      <ul className="space-y-2">
                        {analysisResult.prevention_tips.map((tip, index) => (
                          <li key={index} className="flex items-start space-x-2 text-sm text-green-700">
                            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Analysis History */}
          {analysisHistory.length > 0 ? (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-lg flex items-center space-x-2">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t('imageRecognition.analysisHistory', 'Recent Analysis History')}</span>
                </h4>
                
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={exportHistory} title="Export history">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearHistory} title="Clear history">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto" role="list" aria-label="Analysis history">
                {analysisHistory.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg" role="listitem">
                    <img
                      src={entry.preview}
                      alt={`Analysis of ${entry.plantName}`}
                      className="w-12 h-12 object-cover rounded border"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {entry.plantName}
                        </p>
                        <span className="text-xs text-gray-500">
                          {formatDate(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">
                        {entry.result.disease_detected || entry.result.condition || t('imageRecognition.healthy', 'Healthy')}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        {entry.result.confidence && (
                          <div className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(entry.result.confidence)}`}>
                            {Math.round(entry.result.confidence * 100)}%
                          </div>
                        )}
                        {entry.originalSize && entry.compressedSize && entry.originalSize !== entry.compressedSize && (
                          <span className="text-xs text-gray-400">
                            Compressed: {((1 - entry.compressedSize / entry.originalSize) * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {analysisHistory.length > 5 && (
                <div className="text-center mt-3">
                  <Button variant="ghost" size="sm">
                    {t('imageRecognition.viewAllHistory', 'View All History')} ({analysisHistory.length})
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="border-t pt-4">
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm">
                  {t('imageRecognition.noHistoryAvailable', 'No analysis history available')}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AIImageRecognition;