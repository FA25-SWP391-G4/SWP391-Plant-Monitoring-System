import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axiosClient';

export default function PlantsList({ isPremium }) {
  const { t } = useTranslation();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  
  useEffect(() => {
    fetchPlants();
  }, []);
  
  const fetchPlants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/plants');
      setPlants(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching plants:', err);
      setError(t('errors.fetchFailed', 'Failed to fetch plants'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddPlant = async (plantData) => {
    try {
      setLoading(true);
      const response = await api.post('/api/plants', plantData);
      
      if (response.data.success) {
        setPlants([...plants, response.data.data]);
        setShowAddModal(false);
      }
    } catch (err) {
      console.error('Error adding plant:', err);
      setError(t('errors.addFailed', 'Failed to add plant'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeletePlant = async (plantId) => {
    if (window.confirm(t('plants.confirmDelete', 'Are you sure you want to delete this plant?'))) {
      try {
        setLoading(true);
        await api.delete(`/api/plants/${plantId}`);
        setPlants(plants.filter(plant => plant.plant_id !== plantId));
      } catch (err) {
        console.error('Error deleting plant:', err);
        setError(t('errors.deleteFailed', 'Failed to delete plant'));
      } finally {
        setLoading(false);
      }
    }
  };
  
  const filteredPlants = plants.filter(plant => {
    const matchesSearch = plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (plant.species && plant.species.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (plant.location && plant.location.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filter === 'all') return matchesSearch;
    return matchesSearch && plant.zone === filter;
  });
  
  if (loading && plants.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4">
      <div className="flex flex-col md:flex-row items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">
          {t('plants.myPlants', 'My Plants')}
        </h1>
        
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder={t('plants.search', 'Search plants...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {isPremium && (
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">{t('plants.allZones', 'All Zones')}</option>
              <option value="Indoor">{t('zones.indoor', 'Indoor')}</option>
              <option value="Outdoor">{t('zones.outdoor', 'Outdoor')}</option>
              <option value="Balcony">{t('zones.balcony', 'Balcony')}</option>
              <option value="Garden">{t('zones.garden', 'Garden')}</option>
              <option value="Herb Garden">{t('zones.herbGarden', 'Herb Garden')}</option>
            </select>
          )}
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t('plants.addPlant', 'Add Plant')}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {filteredPlants.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <h2 className="text-xl font-semibold mb-2">{t('plants.noPlants', 'No plants found')}</h2>
          <p className="text-gray-600 mb-4">{t('plants.addYourFirst', 'Add your first plant to get started!')}</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            {t('plants.addPlant', 'Add Plant')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlants.map((plant) => (
            <PlantCard 
              key={plant.plant_id} 
              plant={plant} 
              onDelete={() => handleDeletePlant(plant.plant_id)} 
              isPremium={isPremium} 
            />
          ))}
        </div>
      )}
      
      {/* Add Plant Modal */}
      {showAddModal && (
        <AddPlantModal 
          onClose={() => setShowAddModal(false)} 
          onAdd={handleAddPlant} 
          isPremium={isPremium}
        />
      )}
    </div>
  );
}

function PlantCard({ plant, onDelete, isPremium }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  
  // Health status calculation based on sensor data
  const getHealthStatus = () => {
    // Placeholder logic - this would use actual sensor data
    const statuses = ['healthy', 'warning', 'critical'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };
  
  const healthStatus = getHealthStatus();
  const healthClasses = {
    healthy: 'bg-green-100 text-green-800',
    warning: 'bg-amber-100 text-amber-800',
    critical: 'bg-red-100 text-red-800'
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
      {plant.image && (
        <div className="w-full h-48 overflow-hidden">
          <img src={plant.image} alt={plant.name} className="w-full h-full object-cover" />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900">{plant.name}</h3>
          
          <div className="flex items-center">
            {isPremium && plant.zone && (
              <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded mr-2">
                {t(`zones.${plant.zone.toLowerCase()}`, plant.zone)}
              </span>
            )}
            <span className={`inline-block text-xs px-2 py-1 rounded ${healthClasses[healthStatus]}`}>
              {t(`plants.health.${healthStatus}`, healthStatus.charAt(0).toUpperCase() + healthStatus.slice(1))}
            </span>
          </div>
        </div>
        
        {plant.species && (
          <p className="text-sm text-gray-500 italic mb-2">{plant.species}</p>
        )}
        
        <p className="text-sm text-gray-600 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {plant.location}
        </p>
        
        {expanded && plant.notes && (
          <p className="text-sm text-gray-600 mb-4 border-t border-gray-100 pt-3">
            {plant.notes}
          </p>
        )}
        
        <div className="flex justify-between items-center border-t border-gray-100 pt-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-emerald-600 hover:text-emerald-700"
          >
            {expanded ? t('common.showLess', 'Show less') : t('common.showMore', 'Show more')}
          </button>
          
          <div className="flex gap-2">
            <button
              className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full"
              aria-label={t('plants.view', 'View details')}
              title={t('plants.view', 'View details')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              className="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-full"
              aria-label={t('plants.edit', 'Edit plant')}
              title={t('plants.edit', 'Edit plant')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full"
              aria-label={t('plants.delete', 'Delete plant')}
              title={t('plants.delete', 'Delete plant')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Placeholder for the AddPlantModal component
// In a real implementation, we would import the actual component from its file
function AddPlantModal({ onClose, onAdd, isPremium }) {
  const { t } = useTranslation();
  
  // This would be replaced by importing the actual component
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('plants.addNewPlant', 'Add New Plant')}
            </h2>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500"
              onClick={onClose}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p className="text-center text-gray-500 my-8">
            {t('common.placeholderComponent', 'Form would be rendered here')}
          </p>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              onClick={onClose}
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="button"
              className="px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg"
              onClick={() => onAdd({ name: 'Example Plant' })}
            >
              {t('common.add', 'Add')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}