'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';
import { useSettings } from '@/providers/SettingsProvider';

import PlantListItem from '@/components/plants/PlantListItem';
import AddPlantModal from '@/components/plants/AddPlantModal';
import FilterBar from '@/components/plants/FilterBar';
import plantApi from '@/api/plantApi';
import { toast } from 'react-toastify';

export default function PlantsPage() {
  const { user, loading} = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { settings } = useSettings();

  const animationsEnabled = settings?.widgets?.animationsEnabled ?? true;
  const compactMode = settings?.widgets?.compactMode ?? false;
  
  const [plants, setPlants] = useState([]);
  const [filteredPlants, setFilteredPlants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

    const isPremium = user?.role === 'Premium' || user?.role === 'Ultimate' || user?.role === 'Admin';


  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch plants data
  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          // Fetch from API
          const plantData = await plantApi.getAll();
          setPlants(plantData);
          setFilteredPlants(plantData);
        } catch (err) {
          console.error('Error fetching plants data:', err);
          setError(t('plants.loadError', 'Failed to load plants data. Please try again later.'));
          toast.error(t('plants.loadError', 'Failed to load plants data. Please try again later.'));
          
          // Use fallback data in development
          if (process.env.NODE_ENV === 'development') {
            console.log('Using fallback plant data');
            setPlants(FALLBACK_PLANTS);
            setFilteredPlants(FALLBACK_PLANTS);
          }
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [user, t]);

  // Handle search and filtering
  useEffect(() => {
    // Ensure plants is an array before processing
    const plantsArray = Array.isArray(plants) ? plants : [];
    
    if (plantsArray.length > 0) {
      let result = [...plantsArray];
      
      // Apply search term filter
      if (searchTerm) {
        result = result.filter(plant => 
          plant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plant?.species?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plant?.location?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply status filter
      if (activeFilter !== 'all') {
        result = result.filter(plant => plant?.status === activeFilter);
      }
      
      setFilteredPlants(result);
    } else {
      setFilteredPlants([]);
    }
  }, [searchTerm, activeFilter, plants]);

  const handleAddPlant = async (newPlant) => {
    try {
      // In a real implementation, we would send this to the API
      // For now, just add it to our local state since the endpoint is not implemented
      const plantWithId = {
        ...newPlant,
        plant_id: `local-${Date.now()}`,
        status: 'healthy',
        lastWatered: new Date().toISOString()
      };
      
      setPlants([...plants, plantWithId]);
      setFilteredPlants([...filteredPlants, plantWithId]);
      toast.success(t('plants.addSuccess', 'Plant added successfully!'));
    } catch (error) {
      console.error('Error adding plant:', error);
      toast.error(t('plants.addError', 'Failed to add plant. Please try again.'));
    } finally {
      setShowAddModal(false);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-emerald-200 dark:bg-emerald-800 mb-4"></div>
          <div className="h-4 w-24 bg-emerald-100 dark:bg-emerald-900 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center">
        <div className="text-red-500 dark:text-red-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">{t('plants.errorLoading', 'Error Loading Plants')}</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors"
        >
          {t('common.retry', 'Retry')}
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900 page-transition"
    >
      <main className={`container mx-auto px-4 py-8 ${animationsEnabled ? 'transition-all duration-200' : ''}`}>
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-700 dark:from-emerald-600 dark:to-emerald-800 rounded-xl shadow-lg mb-8 p-6 text-white flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold mb-2">
                {t('plants.myPlants', 'My Plants')}
              </h1>
              <p className="opacity-90">
                {t('plants.manage', 'Manage and monitor your plant collection')}
              </p>
            </div>
          </div>

          <div className="hidden md:block">
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 btn-transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>{t('plants.addNew', 'Add New Plant')}</span>
            </button>
          </div>
        </div>

        {/* Mobile Add Plant Button */}
        <div className="mb-6 md:hidden">
          <button 
            onClick={() => setShowAddModal(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 btn-transition"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>{t('plants.addNew', 'Add New Plant')}</span>
          </button>
        </div>
        
        {/* Filter and Search */}
        <FilterBar 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
        />
        
        {/* Plant List */}
        <div className="mt-6">
          {filteredPlants.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
              <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {searchTerm || activeFilter !== 'all' 
                  ? t('plants.noMatchingPlants', 'No plants match your filters') 
                  : t('plants.noPlants', 'No plants added yet')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm || activeFilter !== 'all' 
                  ? t('plants.tryDifferentFilter', 'Try a different filter or search term') 
                  : t('plants.startAdding', 'Start adding plants to your collection')}
              </p>
              {!(searchTerm || activeFilter !== 'all') && (
                <button 
                  onClick={() => setShowAddModal(true)} 
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                >
                  {t('plants.addFirstPlant', 'Add Your First Plant')}
                </button>
              )}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className={`${compactMode ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'}`}
            >
              {Array.isArray(filteredPlants) && filteredPlants.map((plant, index) => (
                <motion.div
                  key={plant.plant_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <PlantListItem 
                    plant={plant} 
                    isPremium={isPremium}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Add Plant Modal */}
        {showAddModal && (
          <AddPlantModal 
            onClose={() => setShowAddModal(false)} 
            onAdd={handleAddPlant}
            isPremium={isPremium}
          />
        )}
      </main>
    </motion.div>
  );
}