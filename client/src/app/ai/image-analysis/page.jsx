'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import AIImageRecognition from '@/components/AIImageRecognition';

export default function AIImageAnalysisPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-emerald-200 mb-4"></div>
          <div className="h-4 w-24 bg-emerald-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="text-4xl mr-3">📸</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('ai.imageAnalysis.title', 'AI Plant Disease Detection')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('ai.imageAnalysis.subtitle', 'Upload photos of your plants to detect diseases and get treatment recommendations')}
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">🔍</span>
                <h3 className="font-medium text-gray-900">
                  {t('ai.imageAnalysis.feature1Title', 'Disease Detection')}
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                {t('ai.imageAnalysis.feature1Desc', 'Advanced AI identifies common plant diseases with high accuracy')}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">💊</span>
                <h3 className="font-medium text-gray-900">
                  {t('ai.imageAnalysis.feature2Title', 'Treatment Recommendations')}
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                {t('ai.imageAnalysis.feature2Desc', 'Get specific treatment suggestions and prevention tips')}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">📊</span>
                <h3 className="font-medium text-gray-900">
                  {t('ai.imageAnalysis.feature3Title', 'Analysis History')}
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                {t('ai.imageAnalysis.feature3Desc', 'Track your plant health over time with detailed analysis records')}
              </p>
            </div>
          </div>
        </div>

        {/* Image Analysis Component */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <AIImageRecognition />
        </div>

        {/* Tips Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">📷</span>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('ai.imageAnalysis.photoTips', 'Photo Tips for Best Results')}
              </h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                {t('ai.imageAnalysis.tip1', 'Use good lighting - natural light works best')}
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                {t('ai.imageAnalysis.tip2', 'Focus on affected areas - get close to problem spots')}
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                {t('ai.imageAnalysis.tip3', 'Include leaves and stems in the frame')}
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                {t('ai.imageAnalysis.tip4', 'Avoid blurry images - hold camera steady')}
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                {t('ai.imageAnalysis.tip5', 'Take multiple angles if unsure')}
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">🌿</span>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('ai.imageAnalysis.detectable', 'Detectable Conditions')}
              </h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                {t('ai.imageAnalysis.condition1', 'Leaf spot diseases')}
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                {t('ai.imageAnalysis.condition2', 'Powdery mildew')}
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                {t('ai.imageAnalysis.condition3', 'Rust diseases')}
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                {t('ai.imageAnalysis.condition4', 'Bacterial infections')}
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                {t('ai.imageAnalysis.condition5', 'Nutrient deficiencies')}
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                {t('ai.imageAnalysis.condition6', 'Pest damage signs')}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}