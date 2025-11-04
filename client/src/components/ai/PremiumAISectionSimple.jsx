/**
 * Premium AI Section Component
 * Comprehensive AI features for premium users with Tailwind CSS styling
 */
'use client'

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../providers/AuthProvider';
import aiApi from '../api/aiApi';
import { Button } from '../ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import ThemedLoader from './ThemedLoader';
import {
  Bot,
  Camera,
  BarChart3,
  TrendingUp,
  Star,
  Upload,
  Loader2,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Droplets,
  Sun,
  Thermometer,
  Leaf
} from 'lucide-react';

const PremiumAISection = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [plantAnalysis, setPlantAnalysis] = useState(null);

  // Check if user has premium access
  const isPremium = user?.role === 'Premium' || user?.role === 'Admin';

  // Mock plant data for demonstration
  const samplePlantData = {
    plant_id: 1,
    sensor_data: [
      { temperature: 23.5, humidity: 0.65, soil_moisture: 0.45, light: 0.8, timestamp: new Date() },
      { temperature: 24.1, humidity: 0.62, soil_moisture: 0.42, light: 0.75, timestamp: new Date(Date.now() - 3600000) },
      { temperature: 22.8, humidity: 0.68, soil_moisture: 0.48, light: 0.82, timestamp: new Date(Date.now() - 7200000) }
    ]
  };

  // Handle file upload
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Plant health analysis
  const runPlantAnalysis = async () => {
    setLoading(true);
    try {
      const response = await aiApi.analyzePlant(samplePlantData);
      setPlantAnalysis(response.data);
    } catch (error) {
      console.error('Plant analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Image analysis
  const analyzeImage = async () => {
    if (!selectedFile) return;
    
    setLoading(true);
    try {
      const healthResponse = await aiApi.analyzeHealth(selectedFile);
      setAnalysisResults(healthResponse.data);
    } catch (error) {
      console.error('Image analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Health score color helper
  const getHealthScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Render premium upgrade prompt
  const renderPremiumPrompt = () => (
    <div className="text-center p-8">
      <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
        <Star className="h-8 w-8 text-white" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Premium Feature</h2>
      <p className="text-gray-600 mb-6">
        Unlock advanced AI plant care features with Premium
      </p>
      <Button className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 btn-transition">
        Upgrade to Premium
      </Button>
    </div>
  );

  if (!isPremium) {
    return (
      <Card className="max-w-md mx-auto">
        {renderPremiumPrompt()}
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
          <Bot className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">AI Plant Care Assistant</h1>
          <p className="text-gray-600">Advanced AI-powered plant care insights and recommendations</p>
        </div>
        <div className="ml-auto">
          <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
            Premium
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Plant Analysis
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Image Recognition
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Predictions
          </TabsTrigger>
        </TabsList>

        {/* Plant Analysis Tab */}
        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Overall Health Score */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-green-500" />
                  Overall Health
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={runPlantAnalysis}
                  disabled={loading}
                  className="btn-transition"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              
              {loading ? (
                <div className="py-8">
                  <ThemedLoader size="lg" showText={true} text={t('ai.analyzing', 'Analyzing plant...')} />
                </div>
              ) : plantAnalysis ? (
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getHealthScoreColor(plantAnalysis.health_score)}`}>
                    {Math.round(plantAnalysis.health_score)}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                    <div
                      className={`h-2 rounded-full ${
                        plantAnalysis.health_score >= 80 ? 'bg-green-500' :
                        plantAnalysis.health_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${plantAnalysis.health_score}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <Button onClick={runPlantAnalysis} className="w-full btn-transition">
                  Analyze Plant
                </Button>
              )}
            </Card>

            {/* Detailed Analysis */}
            {plantAnalysis && (
              <Card className="md:col-span-2 p-6">
                <h3 className="font-semibold mb-4">Detailed Analysis</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(plantAnalysis.analysis).map(([key, data]) => (
                    <div key={key} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {key === 'soil_moisture' && <Droplets className="h-5 w-5 text-blue-500" />}
                        {key === 'temperature' && <Thermometer className="h-5 w-5 text-red-500" />}
                        {key === 'humidity' && <Droplets className="h-5 w-5 text-cyan-500" />}
                        {key === 'light' && <Sun className="h-5 w-5 text-yellow-500" />}
                        <span className="font-medium capitalize">{key.replace('_', ' ')}</span>
                        {data.status === 'optimal' && <CheckCircle className="h-4 w-4 text-green-500" />}
                        {data.status === 'concerning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                        {data.status === 'critical' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      </div>
                      <div className={`text-2xl font-bold ${getHealthScoreColor(data.score)}`}>
                        {Math.round(data.score)}%
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{data.recommendation}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Image Recognition Tab */}
        <TabsContent value="image" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Upload Plant Image</h3>
              
              {previewUrl ? (
                <div className="space-y-4">
                  <img
                    src={previewUrl}
                    alt="Plant preview"
                    className="w-full max-h-64 object-cover rounded-lg"
                  />
                  <div className="flex gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload">
                      <Button variant="outline" asChild className="btn-transition">
                        <span>Change Image</span>
                      </Button>
                    </label>
                    <Button
                      onClick={analyzeImage}
                      disabled={loading}
                      className="flex-1 btn-transition"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analyze
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button asChild className="btn-transition">
                      <span>Select Plant Image</span>
                    </Button>
                  </label>
                </div>
              )}
            </Card>

            {analysisResults && (
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Analysis Results</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Health Assessment</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Overall Health:</span>
                      <span className={`font-bold ${getHealthScoreColor(analysisResults.health_assessment?.overall_health || 0)}`}>
                        {Math.round(analysisResults.health_assessment?.overall_health || 0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        className="h-2 bg-green-500 rounded-full"
                        style={{ width: `${analysisResults.health_assessment?.overall_health || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Disease Detection</h4>
                    {analysisResults.health_assessment?.disease_detection ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="font-medium">Disease Detected</span>
                        </div>
                        <p className="text-sm text-yellow-700 mt-1">
                          Potential disease detected. Please consult a plant specialist.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-800">
                          <CheckCircle className="h-4 w-4" />
                          <span className="font-medium">No Disease Detected</span>
                        </div>
                        <p className="text-sm text-green-700 mt-1">Your plant appears healthy!</p>
                      </div>
                    )}
                  </div>

                  {analysisResults.recommendations && (
                    <div>
                      <h4 className="font-medium mb-2">Recommendations</h4>
                      <ul className="space-y-1">
                        {analysisResults.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <Card className="p-6">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Predictions Coming Soon</h3>
              <p className="text-gray-600 mb-4">
                AI-powered growth predictions and watering schedules will be available soon.
              </p>
              <Button variant="outline" className="btn-transition">Generate Predictions</Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PremiumAISection;