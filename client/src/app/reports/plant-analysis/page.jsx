'use client'

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/loader';
import { AlertCircle, ChevronRight, Leaf, PieChart, Camera } from 'lucide-react';
import plantApi from '@/api/plantApi';
import plantReportsApi from '@/api/plantReportsApi';
import PlantDistributionReport from '@/components/reports/PlantDistributionReport';
import WaterConsumptionReport from '@/components/reports/WaterConsumptionReport';

export default function PlantAnalysisPage() {
  const { t } = useTranslation();
  const { user, loading: authLoading, isPremium } = useAuth();
  const router = useRouter();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const fetchPlantData = async () => {
      try {
        setLoading(true);
        const response = await plantApi.getAll();
        setPlants(response.data);
      } catch (err) {
        console.error('Error fetching plant data:', err);
        if (err.response?.status === 401) {
          router.push('/login');
        } else {
          setError(t('reports.errorLoadingPlants', 'Error loading plants. Please try again.'));
        }
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPlantData();
    }
  }, [user, router, t]);

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader size="lg" className="text-emerald-500" />
          <p className="mt-4 text-gray-600">
            {t('reports.loadingAnalysis', 'Loading plant analysis...')}
          </p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle size={48} className="text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {t('reports.errorTitle', 'Error Loading Data')}
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
          >
            {t('common.retry', 'Retry')}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">{t('reports.plantAnalysis', 'Plant Analysis')}</h1>
          <p className="text-gray-600">
            {t('reports.analysisDesc', 'Comprehensive analytics and insights about your plants')}
          </p>
        </div>

        {/* No plants message */}
        {plants.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center mb-8">
            <div className="flex justify-center mb-4">
              <Leaf size={48} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {t('reports.noPlants', 'No Plants to Analyze')}
            </h3>
            <p className="text-gray-500 mb-4">
              {t('reports.noPlantsDesc', 'Add plants to your collection to see analysis and reports.')}
            </p>
            <Button onClick={() => router.push('/plants/add')}>
              {t('plants.addPlant', 'Add Your First Plant')}
            </Button>
          </div>
        )}

        {plants.length > 0 && (
          <>
            {/* Image analysis section */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-lg shadow-md text-white p-6 mb-8">
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-4 md:mb-0">
                  <h2 className="text-xl font-bold mb-2">
                    {t('reports.aiAnalysis', 'AI Image Analysis')}
                  </h2>
                  <p className="opacity-90 max-w-md">
                    {t('reports.aiAnalysisDesc', 'Upload a photo of your plant and our AI will analyze its health, identify issues, and provide care recommendations.')}
                  </p>
                </div>
                <Button 
                  onClick={() => router.push('/reports/image-analysis')}
                  variant="secondary"
                  className="whitespace-nowrap flex items-center gap-2"
                >
                  <Camera size={18} />
                  {t('reports.analyzeImage', 'Analyze Plant Image')}
                </Button>
              </div>
            </div>

            {/* Plants with detailed reports */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {t('reports.detailedReports', 'Plant Detailed Reports')}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plants.map(plant => (
                  <Link 
                    key={plant.plant_id} 
                    href={`/plants/${plant.plant_id}/detailed-report`}
                    className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex items-center hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-emerald-100 flex-shrink-0 mr-4">
                      {plant.image_url ? (
                        <img src={plant.image_url} alt={plant.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Leaf size={20} className="text-emerald-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-medium text-gray-900">{plant.name}</h3>
                      <p className="text-sm text-gray-600">{plant.species || t('common.unknownSpecies', 'Unknown species')}</p>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>

            {/* Aggregate reports */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {t('reports.plantDistribution', 'Plant Distribution')}
                  </h2>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <PlantDistributionReport />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">
                    {t('reports.waterConsumption', 'Water Consumption')}
                  </h2>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                  <WaterConsumptionReport />
                </div>
              </div>
            </div>
            
            {/* Premium feature promotion */}
            {!isPremium && (
              <div className="mt-12 bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-6">
                <div className="flex flex-col md:flex-row items-center">
                  <div className="mb-4 md:mb-0 md:mr-6">
                    <PieChart size={48} className="text-amber-500 mx-auto md:mx-0" />
                  </div>
                  <div className="flex-grow text-center md:text-left">
                    <h3 className="text-lg font-semibold text-amber-800 mb-2">
                      {t('reports.unlockAdvancedReports', 'Unlock Advanced Reports & Analytics')}
                    </h3>
                    <p className="text-amber-700 mb-4">
                      {t('reports.premiumReportsDesc', 'Get access to advanced analytics, trend predictions, exportable reports, and detailed health insights with a premium subscription.')}
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0 md:ml-6">
                    <Button
                      onClick={() => router.push('/upgrade')}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      {t('common.upgradeToPremium', 'Upgrade to Premium')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}