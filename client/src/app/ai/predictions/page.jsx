'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import AIWateringPrediction from '@/components/AIWateringPrediction';

export default function AIPredictionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Mock plants data - would come from API
  useEffect(() => {
    if (user) {
      const mockPlants = [
        { plant_id: 1, name: 'Snake Plant', species: 'Sansevieria trifasciata' },
        { plant_id: 2, name: 'Monstera', species: 'Monstera deliciosa' },
        { plant_id: 3, name: 'Peace Lily', species: 'Spathiphyllum' }
      ];
      setPlants(mockPlants);
      setSelectedPlant(mockPlants[0]);
    }
  }, [user]);

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
            <div className="text-4xl mr-3">🔮</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('ai.predictions.title', 'AI Watering Predictions')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('ai.predictions.subtitle', 'Smart watering recommendations based on AI analysis of your plant data')}
              </p>
            </div>
          </div>
        </div>

        {/* Plant Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('ai.predictions.selectPlant', 'Select Plant')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plants.map(plant => (
              <button
                key={plant.plant_id}
                onClick={() => setSelectedPlant(plant)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPlant?.plant_id === plant.plant_id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <div className="text-2xl mr-3">🌱</div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">{plant.name}</h3>
                    <p className="text-sm text-gray-600">{plant.species}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Predictions */}
        {selectedPlant && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('ai.predictions.predictionsFor', 'Predictions for {{plantName}}', { plantName: selectedPlant.name })}
              </h2>
            </div>
            <div className="p-6">
              <AIWateringPrediction plantId={selectedPlant.plant_id} />
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">🧠</span>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('ai.predictions.howItWorks', 'How AI Predictions Work')}
              </h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                {t('ai.predictions.step1', 'Analyzes current sensor data (moisture, temperature, humidity, light)')}
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                {t('ai.predictions.step2', 'Reviews historical watering patterns and plant responses')}
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                {t('ai.predictions.step3', 'Considers plant species-specific requirements')}
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                {t('ai.predictions.step4', 'Generates precise timing and amount recommendations')}
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">📈</span>
              <h3 className="text-lg font-semibold text-gray-900">
                {t('ai.predictions.benefits', 'Benefits')}
              </h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                {t('ai.predictions.benefit1', 'Prevent over-watering and under-watering')}
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                {t('ai.predictions.benefit2', 'Optimize plant health and growth')}
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                {t('ai.predictions.benefit3', 'Save water with precise recommendations')}
              </li>
              <li className="flex items-start">
                <span className="text-emerald-500 mr-2">•</span>
                {t('ai.predictions.benefit4', 'Learn your plants\' unique patterns over time')}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}