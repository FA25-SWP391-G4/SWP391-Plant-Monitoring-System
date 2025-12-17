'use client'

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/loader';
import { AlertCircle, Camera, Upload, Image as ImageIcon, FileCheck, History, Leaf } from 'lucide-react';
import Image from 'next/image';
import aiApi from '@/api/aiApi';

export default function ImageAnalysisPage() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading, isPremium } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  
  // Redirect if not logged in
  if (typeof window !== 'undefined' && !authLoading && !user) {
    router.push('/login');
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError(t('reports.imageTooLarge', 'Image must be less than 5MB'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError(t('reports.invalidFileType', 'Please select an image file'));
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResults(null);
    setError(null);
  };

  const handleAnalyzeClick = async () => {
    if (!isPremium || user.role !== 'Ultimate') {
      router.push('/upgrade');
      return;
    }

    if (!selectedImage) {
      setError(t('reports.selectImage', 'Please select an image to analyze'));
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const response = await aiApi.analyzeHealth(selectedImage);
      setResults(response.data);
      
      // Add to history (in a real app, this would be stored in a database)
      const newHistory = [
        {
          id: Date.now(),
          date: new Date().toISOString(),
          imageUrl: previewUrl,
          results: response.data
        },
        ...analysisHistory
      ].slice(0, 5); // Keep only the latest 5 analyses
      
      setAnalysisHistory(newHistory);
    } catch (err) {
      console.error('AI analysis error:', err);
      setError(
        err.response?.status === 403
          ? t('reports.premiumRequired', 'This feature requires a premium subscription')
          : t('reports.analysisError', 'Failed to analyze the image. Please try again.')
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderHealthIndicator = (health, score) => {
    const scoreNum = parseFloat(score);
    let color = 'text-gray-500';
    let bgColor = 'bg-gray-100';
    
    if (scoreNum >= 0.8) {
      color = 'text-green-700';
      bgColor = 'bg-green-100';
    } else if (scoreNum >= 0.6) {
      color = 'text-emerald-600';
      bgColor = 'bg-emerald-50';
    } else if (scoreNum >= 0.4) {
      color = 'text-yellow-600';
      bgColor = 'bg-yellow-50';
    } else if (scoreNum >= 0) {
      color = 'text-red-600';
      bgColor = 'bg-red-50';
    }
    
    return (
      <div className={`flex items-center justify-between p-3 rounded-lg ${bgColor}`}>
        <span className="font-medium">{health}</span>
        <span className={`font-semibold ${color}`}>{Math.round(scoreNum * 100)}%</span>
      </div>
    );
  };

  // Mock data - in a real application, this would come from the API
  const mockResults = {
    health_score: 0.85,
    health_details: [
      { aspect: "Leaf Health", status: "good" },
      { aspect: "Hydration", status: "good" },
      { aspect: "Stem Structure", status: "good" },
      { aspect: "Color", status: "good" }
    ],
    detected_issues: [
      { name: "Slight Yellowing", description: "Minor yellowing detected on some leaf edges, possibly due to over-watering or nutrient imbalance." }
    ],
    recommendations: [
      "Reduce watering frequency by 20% for the next 2 weeks",
      "Ensure the plant is receiving adequate but indirect sunlight",
      "Consider adding iron-rich fertilizer to address potential deficiency"
    ],
    plant_identification: {
      name: "Monstera Deliciosa",
      confidence: 0.92
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">
          {t('reports.loading', 'Loading...')}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-800 rounded-xl shadow-lg mb-8 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
              <Camera className="h-8 w-8" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {t('reports.aiImageAnalysis', 'AI Plant Image Analysis')}
              </h1>
              <p className="opacity-90">
                {t('reports.aiImageDesc', 'Upload a photo of your plant to get AI-powered health analysis and care recommendations')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload section */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h2 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">{t('reports.uploadImage', 'Upload Plant Image')}</h2>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('reports.uploadGuidelines', 'For best results, ensure the image is well-lit and clearly shows the entire plant or the specific area of concern.')}</p>
                
                <div className="flex flex-col space-y-3">
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2"
                  >
                    <Upload size={16} />
                    {t('reports.chooseFile', 'Choose File')}
                  </Button>
                  
                  <Button
                    onClick={resetAnalysis}
                    variant="outline"
                    className="flex items-center justify-center gap-2"
                    disabled={analyzing || !selectedImage}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t('common.reset', 'Reset')}
                  </Button>
                </div>
                
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              
              {/* Image preview */}
              <div className="mb-6">
                {previewUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-gray-200 aspect-square">
                    <Image
                      src={previewUrl}
                      alt={t('reports.plantImage', 'Plant image')}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-8 text-center aspect-square flex flex-col items-center justify-center">
                    <ImageIcon size={48} className="text-gray-400 mb-3" />
                    <p className="text-gray-500">
                      {t('reports.noImageSelected', 'No image selected')}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {t('reports.imageSizeLimit', 'Max file size: 5MB')}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Analyze button */}
              <Button
                onClick={handleAnalyzeClick}
                disabled={analyzing || !selectedImage || error}
                className="w-full"
              >
                {analyzing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('reports.analyzingImage', 'Analyzing Image...')}
                  </>
                ) : (
                  <>
                    <Leaf size={16} className="mr-2" />
                    {t('reports.analyzeImage', 'Analyze Plant Image')}
                  </>
                )}
              </Button>
              
              {/* Error message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100 text-red-700 text-sm">
                  <div className="flex items-start">
                    <AlertCircle size={16} className="mr-1 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
              
              {/* Premium upgrade prompt */}
              {!isPremium && (
                <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <h3 className="font-medium text-amber-800 mb-1">
                    {t('reports.premiumFeature', 'Premium Feature')}
                  </h3>
                  <p className="text-sm text-amber-700 mb-3">
                    {t('reports.upgradeForAnalysis', 'Upgrade to Premium to unlock AI plant analysis, disease detection, and personalized care recommendations.')}
                  </p>
                  <Button
                    onClick={() => router.push('/upgrade')}
                    variant="outline"
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white hover:text-white"
                  >
                    {t('common.upgradeToPremium', 'Upgrade to Premium')}
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Results section */}
          <div className="lg:col-span-2">
            {results || analyzing ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                {analyzing ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="relative w-20 h-20">
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-emerald-100 dark:border-emerald-900/30 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-emerald-500 dark:border-emerald-400 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                      {t('reports.analyzingYourPlant', 'Analyzing your plant...')}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                      {t('reports.analyzingTakes', 'This may take a few moments')}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                          {t('reports.analysisResults', 'Analysis Results')}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                        </p>
                      </div>
                      <Button
                        onClick={() => setResults(null)}
                        variant="ghost"
                        size="sm"
                      >
                        {t('reports.newAnalysis', 'New Analysis')}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Plant identification */}
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <h3 className="font-medium mb-3 flex items-center text-gray-900 dark:text-gray-100">
                          <Leaf size={18} className="mr-2 text-emerald-600 dark:text-emerald-400" />
                          {t('reports.plantIdentification', 'Plant Identification')}
                        </h3>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{mockResults.plant_identification.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t('reports.confidenceLevel', 'Confidence Level')}: {Math.round(mockResults.plant_identification.confidence * 100)}%
                        </p>
                      </div>
                      
                      {/* Overall health */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-medium mb-3">{t('reports.overallHealth', 'Overall Health')}</h3>
                        {renderHealthIndicator(
                          mockResults.health_score >= 0.8 ? t('reports.excellent', 'Excellent') :
                          mockResults.health_score >= 0.6 ? t('reports.good', 'Good') :
                          mockResults.health_score >= 0.4 ? t('reports.fair', 'Fair') : 
                          t('reports.poor', 'Poor'),
                          mockResults.health_score
                        )}
                      </div>
                    </div>
                    
                    {/* Health details */}
                    <div className="mt-6">
                      <h3 className="font-medium mb-3">{t('reports.healthDetails', 'Health Details')}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {mockResults.health_details.map((detail, index) => (
                          <div key={index} className="bg-white dark:bg-gray-600 border border-gray-100 dark:border-gray-500 rounded-lg p-3 flex justify-between items-center">
                            <span className="text-gray-900 dark:text-gray-100">{detail.aspect}</span>
                            <span className={detail.status === 'good' ? 'text-green-600 dark:text-green-400 flex items-center' : 'text-amber-600 dark:text-amber-400 flex items-center'}>
                              {detail.status === 'good' 
                                ? <><FileCheck size={16} className="mr-1" /> {t('reports.good', 'Good')}</> 
                                : <><AlertCircle size={16} className="mr-1" /> {t('reports.needsAttention', 'Needs Attention')}</>
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Issues */}
                    {mockResults.detected_issues.length > 0 && (
                      <div className="mt-6">
                        <h3 className="font-medium mb-3 text-gray-900 dark:text-gray-100">{t('reports.detectedIssues', 'Detected Issues')}</h3>
                        <div className="space-y-3">
                          {mockResults.detected_issues.map((issue, index) => (
                            <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                              <div className="flex items-center mb-2">
                                <AlertCircle size={18} className="text-yellow-600 dark:text-yellow-400 mr-2" />
                                <h4 className="font-medium text-yellow-800 dark:text-yellow-300">{issue.name}</h4>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{issue.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Recommendations */}
                    <div className="mt-6">
                      <h3 className="font-medium mb-3">{t('reports.recommendations', 'Recommendations')}</h3>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                        <ul className="space-y-3">
                          {mockResults.recommendations.map((rec, index) => (
                            <li key={index} className="flex">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span className="text-gray-800">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    {/* Save button */}
                    <div className="mt-8">
                      <Button className="w-full">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        {t('reports.saveToPlant', 'Save Analysis to Plant Profile')}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center justify-center min-h-[400px]">
                <div className="text-center max-w-md">
                  <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Camera size={24} className="text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    {t('reports.getAiAnalysis', 'Get AI-Powered Plant Analysis')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {t('reports.uploadImagePrompt', 'Upload a clear photo of your plant to get instant analysis of its health, detect any issues, and receive care recommendations.')}
                  </p>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Upload size={16} />
                    {t('reports.selectImage', 'Select Image')}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Analysis history */}
            {isPremium && analysisHistory.length > 0 && (
              <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center text-gray-900 dark:text-gray-100">
                    <History size={18} className="mr-2" />
                    {t('reports.analysisHistory', 'Analysis History')}
                  </h3>
                  <Button variant="ghost" size="sm">
                    {t('reports.viewAll', 'View All')}
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {analysisHistory.map((item) => (
                    <div key={item.id} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="w-12 h-12 rounded-md overflow-hidden mr-4">
                        <Image
                          src={item.imageUrl}
                          alt={t('reports.plantAnalysis', 'Plant analysis')}
                          width={48}
                          height={48}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="flex-grow">
                        <div className="text-sm font-medium">
                          {new Date(item.date).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t('reports.healthScore', 'Health Score')}: {Math.round(item.results.health_score * 100)}%
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        {t('reports.view', 'View')}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}