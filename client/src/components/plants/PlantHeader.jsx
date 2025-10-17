import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { FiArrowLeft, FiEdit2, FiTrash2 } from 'react-icons/fi';

/**
 * PlantHeader component shows the main plant information at the top of the plant detail page
 * with navigation and action buttons
 */
const PlantHeader = ({ plant, onEdit, onDelete }) => {
  const { t } = useTranslation();
  const router = useRouter();
  
  // Default plant data if none provided
  const plantData = plant || {
    name: t('common.loading', 'Loading...'),
    species: '',
    location: '',
    image: '/placeholder-plant.jpg'
  };
  
  const handleBack = () => {
    router.back();
  };

  return (
    <div className="mb-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={handleBack}
      >
        <FiArrowLeft className="mr-2" />
        {t('common.back', 'Back')}
      </Button>
      
      <div className="flex flex-col md:flex-row md:items-center">
        {/* Plant image */}
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 mb-4 md:mb-0 md:mr-6">
          {plantData.image ? (
            <img 
              src={plantData.image} 
              alt={plantData.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-emerald-50 text-emerald-300 text-4xl">
              🌿
            </div>
          )}
        </div>
        
        {/* Plant info */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{plantData.name}</h1>
          
          <div className="mt-2 text-gray-600">
            {plantData.species && (
              <p className="italic">{plantData.species}</p>
            )}
            {plantData.location && (
              <p className="flex items-center mt-1">
                <span className="inline-block w-4 h-4 text-gray-400 mr-1">📍</span> 
                {plantData.location}
              </p>
            )}
          </div>
          
          {/* Added date if available */}
          {plantData.addedAt && (
            <p className="text-sm text-gray-500 mt-1">
              {t('plants.addedOn', 'Added on')}: {new Date(plantData.addedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        
        {/* Action buttons */}
        <div className="flex mt-4 md:mt-0 space-x-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => onEdit && onEdit(plantData)}
          >
            <FiEdit2 className="mr-2" />
            {t('common.edit', 'Edit')}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="text-red-500 border-red-200 hover:bg-red-50"
            onClick={() => onDelete && onDelete(plantData)}
          >
            <FiTrash2 className="mr-2" />
            {t('common.delete', 'Delete')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PlantHeader;