'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import AppLayout from '@/components/layout/AppLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import PlantListItem from '@/components/plants/PlantListItem';
import AddPlantModal from '@/components/plants/AddPlantModal';
import FilterBar from '@/components/plants/FilterBar';
import plantApi from '@/api/plantApi';
import { toast } from 'react-toastify';

// Fallback data in case API fails
const FALLBACK_PLANTS = [
  {
    plant_id: 1,
    name: 'Snake Plant',
    species: 'Sansevieria trifasciata',
    image: '/images/plants/snake-plant.jpg',
    location: 'Living Room',
    status: 'healthy',
    lastWatered: '2023-11-15T10:30:00Z',
    zone: 'Indoor',
    notes: 'Low maintenance plant, perfect for beginners.'
  },
  {
    plant_id: 2,
    name: 'Monstera',
    species: 'Monstera deliciosa',
    image: '/images/plants/monstera.jpg',
    location: 'Office',
    status: 'needs_attention',
    lastWatered: '2023-11-10T08:15:00Z',
    zone: 'Indoor',
    notes: 'Needs more indirect light.'
  },
  {
    plant_id: 3,
    name: 'Peace Lily',
    species: 'Spathiphyllum',
    image: '/images/plants/peace-lily.jpg',
    location: 'Bedroom',
    status: 'needs_water',
    lastWatered: '2023-11-08T14:45:00Z',
    zone: 'Indoor',
    notes: 'Drooping leaves indicate it needs water.'
  },
  {
    plant_id: 4,
    name: 'Aloe Vera',
    species: 'Aloe barbadensis miller',
    image: '/images/plants/aloe-vera.jpg',
    location: 'Kitchen',
    status: 'healthy',
    lastWatered: '2023-11-14T09:20:00Z',
    zone: 'Indoor',
    notes: 'Medicinal plant with healing properties.'
  },
  {
    plant_id: 5,
    name: 'Basil',
    species: 'Ocimum basilicum',
    image: '/images/plants/basil.jpg',
    location: 'Kitchen Garden',
    status: 'needs_water',
    lastWatered: '2023-11-07T16:30:00Z',
    zone: 'Herb Garden',
    notes: 'Harvest regularly to encourage growth.'
  },
  {
    plant_id: 6,
    name: 'Rose Bush',
    species: 'Rosa',
    image: '/images/plants/rose.jpg',
    location: 'Garden',
    status: 'healthy',
    lastWatered: '2023-11-13T08:00:00Z',
    zone: 'Outdoor',
    notes: 'Prune in early spring.'
  }
];

export default function PlantsPage() {
  const { user, loading, isPremium } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  
  const [plants, setPlants] = useState([]);
  const [filteredPlants, setFilteredPlants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

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
    if (plants.length > 0) {
      let result = [...plants];
      
      // Apply search term filter
      if (searchTerm) {
        result = result.filter(plant => 
          plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plant.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plant.location.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Apply status filter
      if (activeFilter !== 'all') {
        result = result.filter(plant => plant.status === activeFilter);
      }
      
      setFilteredPlants(result);
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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-emerald-200 mb-4"></div>
          <div className="h-4 w-24 bg-emerald-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">{t('plants.errorLoading', 'Error Loading Plants')}</h2>
        <p className="text-gray-600">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          {t('common.retry', 'Retry')}
        </button>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col flex-1 p-4 lg:p-8">
        {/* Header and Add Plant Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {t('plants.myPlants', 'My Plants')}
            </h1>
            <p className="text-gray-500">
              {t('plants.manage', 'Manage and monitor your plant collection')}
            </p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t('plants.addNew', 'Add New Plant')}
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="flex justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">
                {searchTerm || activeFilter !== 'all' 
                  ? t('plants.noMatchingPlants', 'No plants match your filters') 
                  : t('plants.noPlants', 'No plants added yet')}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || activeFilter !== 'all' 
                  ? t('plants.tryDifferentFilter', 'Try a different filter or search term') 
                  : t('plants.startAdding', 'Start adding plants to your collection')}
              </p>
              {!(searchTerm || activeFilter !== 'all') && (
                <button 
                  onClick={() => setShowAddModal(true)} 
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  {t('plants.addFirstPlant', 'Add Your First Plant')}
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlants.map(plant => (
                <PlantListItem 
                  key={plant.plant_id} 
                  plant={plant} 
                  isPremium={isPremium}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Add Plant Modal */}
      {showAddModal && (
        <AddPlantModal 
          onClose={() => setShowAddModal(false)} 
          onAdd={handleAddPlant}
          isPremium={isPremium}
        />
      )}
    </AppLayout>
  );
}