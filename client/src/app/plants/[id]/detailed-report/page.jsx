'use client'

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import AppLayout from '@/components/layout/AppLayout';
import plantApi from '@/api/plantApi';
import plantReportsApi from '@/api/plantReportsApi';
import ReportTabs from '@/components/reports/ReportTabs';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Calendar, Download, ArrowLeft } from 'lucide-react';

export default function PlantDetailedReportPage() {
  const { id } = useParams();
  const { user, isPremium } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [plant, setPlant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchPlants = async () => {
      try {
        setLoading(true);
        const response = await plantApi.getById(id);
        setPlant(response.data);
      } catch (err) {
        console.error('Error fetching plant data:', err);
        if (err.response?.status === 404) {
          setError(t('reports.plantNotFound', 'Plant not found'));
        } else if (err.response?.status === 401) {
          router.push('/login');
        } else if (err.response?.status === 403) {
          router.push('/upgrade');
        } else {
          setError(t('reports.errorFetchingPlant', 'Error fetching plant data. Please try again.'));
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPlants();
    }
  }, [id, router, t]);

  const handleExportPdf = async (reportType = 'full') => {
    if (!isPremium) {
      router.push('/upgrade');
      return;
    }
    
    try {
      setExporting(true);
      const response = await plantReportsApi.generatePdfReport(id, reportType);
      
      // Create a blob from the PDF stream
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `plant-report-${id}-${reportType}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting report:', err);
      alert(t('reports.exportError', 'Failed to export the report. Please try again.'));
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader size="lg" className="text-emerald-500" />
          <p className="mt-4 text-gray-600">
            {t('reports.loadingReport', 'Loading detailed plant report...')}
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
            {t('reports.reportError', 'Error Loading Report')}
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            {t('common.goBack', 'Go Back')}
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (!plant) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle size={48} className="text-amber-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {t('reports.plantNotFound', 'Plant Not Found')}
          </h2>
          <p className="text-gray-600 mb-4">
            {t('reports.plantNotFoundDesc', 'The plant you are looking for does not exist or has been removed.')}
          </p>
          <Button onClick={() => router.push('/plants')}>
            {t('plants.viewAllPlants', 'View All Plants')}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Back button and report actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2 mr-4"
            >
              <ArrowLeft size={16} />
              {t('common.back', 'Back')}
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {plant.name} {t('reports.report', 'Report')}
              </h1>
              <p className="text-sm text-gray-600 flex items-center">
                <Calendar size={14} className="mr-1" />
                {t('reports.lastUpdated', 'Last updated')}: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {isPremium ? (
              <Button
                onClick={() => handleExportPdf()}
                disabled={exporting}
                className="flex items-center gap-2"
              >
                <Download size={16} />
                {exporting
                  ? t('reports.exporting', 'Exporting...')
                  : t('reports.exportPdf', 'Export as PDF')}
              </Button>
            ) : (
              <Button
                onClick={() => router.push('/upgrade')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 mr-1"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                {t('common.upgradeToPremium', 'Upgrade to Premium')}
              </Button>
            )}
          </div>
        </div>

        {/* Plant summary card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Plant image */}
            <div className="md:w-1/4">
              <div className="aspect-square rounded-lg overflow-hidden bg-emerald-50 flex items-center justify-center">
                {plant.image_url ? (
                  <img
                    src={plant.image_url}
                    alt={plant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-1/2 h-1/2 text-emerald-300"
                  >
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                )}
              </div>
            </div>
            
            {/* Plant details */}
            <div className="md:w-3/4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('reports.plantDetails', 'Plant Details')}</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('plants.species', 'Species')}:</span>
                      <span className="font-medium">{plant.species || t('common.unknown', 'Unknown')}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('plants.age', 'Age')}:</span>
                      <span className="font-medium">
                        {plant.age_days 
                          ? t('plants.daysOld', '{{days}} days', { days: plant.age_days })
                          : t('common.unknown', 'Unknown')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('plants.location', 'Location')}:</span>
                      <span className="font-medium">{plant.location || t('common.notSpecified', 'Not specified')}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('plants.lastWatered', 'Last Watered')}:</span>
                      <span className="font-medium">
                        {plant.last_watered 
                          ? new Date(plant.last_watered).toLocaleDateString()
                          : t('plants.neverWatered', 'Never watered')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4">{t('reports.careRequirements', 'Care Requirements')}</h3>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('plants.waterNeeds', 'Water Needs')}:</span>
                      <span className="font-medium">
                        {plant.water_frequency 
                          ? t('plants.everyDays', 'Every {{days}} days', { days: plant.water_frequency })
                          : t('common.unknown', 'Unknown')}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('plants.sunlight', 'Sunlight')}:</span>
                      <span className="font-medium">{plant.sunlight || t('common.unknown', 'Unknown')}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('plants.soilType', 'Soil Type')}:</span>
                      <span className="font-medium">{plant.soil_type || t('common.unknown', 'Unknown')}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('plants.fertilizer', 'Fertilizer')}:</span>
                      <span className="font-medium">
                        {plant.fertilizer_frequency
                          ? t('plants.everyDays', 'Every {{days}} days', { days: plant.fertilizer_frequency })
                          : t('common.unknown', 'Unknown')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Report tabs */}
        <ReportTabs plant={plant} />
      </div>
    </AppLayout>
  );
}