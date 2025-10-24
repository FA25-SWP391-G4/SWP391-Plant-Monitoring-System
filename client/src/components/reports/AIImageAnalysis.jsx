'use client'

import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import aiApi from '@/api/aiApi';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Camera, Upload, RefreshCcw, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AIImageAnalysis({ plant }) {
  const { t } = useTranslation();
  const { isPremium } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t('reports.error', 'Error'),
        description: t('reports.imageTooLarge', 'Image must be less than 5MB'),
        variant: "destructive"
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: t('reports.error', 'Error'),
        description: t('reports.invalidFileType', 'Please select an image file'),
        variant: "destructive"
      });
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResults(null);
    setError(null);
  };

  const handleAnalyzeClick = async () => {
    if (!isPremium) {
      router.push('/upgrade');
      return;
    }

    if (!selectedImage) {
      toast({
        title: t('reports.error', 'Error'),
        description: t('reports.selectImage', 'Please select an image to analyze'),
        variant: "destructive"
      });
      return;
    }

    setAnalyzing(true);
    setError(null);

    try {
      const response = await aiApi.analyzeHealth(selectedImage);
      setResults(response.data);
      toast({
        title: t('reports.success', 'Success'),
        description: t('reports.analysisComplete', 'Analysis complete!'),
      });
    } catch (err) {
      console.error('AI analysis error:', err);
      setError(
        err.response?.status === 403
          ? t('reports.premiumRequired', 'This feature requires a premium subscription')
          : t('reports.analysisError', 'Failed to analyze the image. Please try again.')
      );
      toast({
        title: t('reports.error', 'Error'),
        description: t('reports.analysisError', 'Analysis failed. Please try again.'),
        variant: "destructive"
      });
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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">{t('reports.aiImageAnalysis', 'AI Plant Image Analysis')}</h2>
        <p className="text-gray-600">
          {t('reports.aiAnalysisDesc', 'Upload a photo of your plant to get an AI-powered health analysis, disease detection, and care recommendations.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image upload section */}
        <div>
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">{t('reports.uploadImage', 'Upload a clear image of your plant')}</p>
            
            <div className="flex space-x-3 mb-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Upload size={16} />
                {t('reports.uploadImage', 'Upload Image')}
              </Button>
              
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
              
              <Button
                onClick={() => resetAnalysis()}
                variant="ghost"
                className="flex items-center gap-2"
                disabled={analyzing || !selectedImage}
              >
                <RefreshCcw size={16} />
                {t('reports.reset', 'Reset')}
              </Button>
            </div>
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
                <Camera size={48} className="text-gray-400 mb-3" />
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
              t('reports.analyzeImage', 'Analyze Plant Image')
            )}
          </Button>
        </div>

        {/* Analysis results section */}
        <div>
          {error ? (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-center">
              <AlertCircle size={32} className="text-red-500 mx-auto mb-2" />
              <p className="text-red-600">{error}</p>
              {error.includes('premium') && (
                <Button
                  onClick={() => router.push('/upgrade')}
                  variant="outline"
                  className="mt-4"
                >
                  {t('common.upgradeToPremium', 'Upgrade to Premium')}
                </Button>
              )}
            </div>
          ) : results ? (
            <div>
              <div className="mb-6">
                <h3 className="font-semibold mb-3">{t('reports.overallHealth', 'Overall Health')}</h3>
                {renderHealthIndicator(t('reports.plantHealth', 'Plant Health'), results.health_score)}
              </div>

              <div className="mb-6">
                <h3 className="font-semibold mb-3">{t('reports.healthDetails', 'Health Details')}</h3>
                <div className="space-y-2">
                  {results.health_details?.map((detail, index) => (
                    <div key={index} className="bg-white border border-gray-100 rounded-lg p-3 flex justify-between">
                      <span>{detail.aspect}</span>
                      <span className={detail.status === 'good' ? 'text-green-600' : 'text-amber-600'}>
                        {detail.status === 'good' ? t('reports.good', 'Good') : t('reports.needsAttention', 'Needs Attention')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {results.detected_issues?.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">{t('reports.detectedIssues', 'Detected Issues')}</h3>
                  <div className="space-y-3">
                    {results.detected_issues.map((issue, index) => (
                      <div key={index} className="bg-white border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <AlertCircle size={18} className="text-yellow-600 mr-2" />
                          <h4 className="font-medium text-yellow-800">{issue.name}</h4>
                        </div>
                        <p className="text-sm text-gray-600">{issue.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-3">{t('reports.recommendations', 'Recommendations')}</h3>
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                  <ul className="space-y-3">
                    {results.recommendations?.map((rec, index) => (
                      <li key={index} className="flex">
                        <CheckCircle size={18} className="text-emerald-600 mr-2 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-800">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center max-w-md mx-auto">
                <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Camera size={24} className="text-emerald-600" />
                </div>
                <h3 className="font-medium text-gray-900 mb-1">
                  {t('reports.getAiAnalysis', 'Get AI-Powered Plant Analysis')}
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  {t('reports.uploadImagePrompt', 'Upload a clear photo of your plant to get instant analysis of its health, detect any issues, and receive care recommendations.')}
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 mx-auto"
                >
                  <Upload size={16} />
                  {t('reports.selectImage', 'Select Image')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Historical analysis comparison - premium only */}
      {isPremium && results && (
        <div className="mt-12 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {t('reports.analysisHistory', 'Analysis History')}
            </h3>
            <Button variant="ghost" size="sm">
              {t('reports.viewAll', 'View All')}
            </Button>
          </div>
          
          <p className="text-gray-600 mb-4">
            {t('reports.noHistory', 'No previous analyses available for this plant. Future analyses will appear here for comparison.')}
          </p>
        </div>
      )}
    </div>
  );
}