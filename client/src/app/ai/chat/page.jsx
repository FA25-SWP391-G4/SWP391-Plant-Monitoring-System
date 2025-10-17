'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import AIChatbot from '@/components/AIChatbot';

export default function AIChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [selectedPlant, setSelectedPlant] = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Get plant ID from URL params if provided
  useEffect(() => {
    const plantId = searchParams.get('plant');
    if (plantId) {
      setSelectedPlant(parseInt(plantId));
    }
  }, [searchParams]);

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
            <div className="text-4xl mr-3">🤖</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('ai.chat.title', 'AI Plant Care Assistant')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('ai.chat.subtitle', 'Get expert advice and answers to your plant care questions')}
              </p>
            </div>
          </div>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">🌱</span>
                <h3 className="font-medium text-gray-900">
                  {t('ai.chat.feature1Title', 'Plant-Specific Advice')}
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                {t('ai.chat.feature1Desc', 'Get tailored recommendations based on your specific plants and their current conditions')}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">📊</span>
                <h3 className="font-medium text-gray-900">
                  {t('ai.chat.feature2Title', 'Data-Driven Insights')}
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                {t('ai.chat.feature2Desc', 'AI analyzes your sensor data and plant history to provide accurate guidance')}
              </p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">💬</span>
                <h3 className="font-medium text-gray-900">
                  {t('ai.chat.feature3Title', 'Natural Conversation')}
                </h3>
              </div>
              <p className="text-sm text-gray-600">
                {t('ai.chat.feature3Desc', 'Ask questions in plain language and get easy-to-understand answers')}
              </p>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <AIChatbot initialPlantId={selectedPlant} />
        </div>
      </div>
    </div>
  );
}