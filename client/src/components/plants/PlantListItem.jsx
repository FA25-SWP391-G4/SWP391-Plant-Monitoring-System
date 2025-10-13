import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function PlantListItem({ plant, isPremium }) {
  const { t } = useTranslation();
  
  // Calculate health status
  const getStatusInfo = () => {
    if (plant.status === 'healthy') {
      return { 
        color: 'text-emerald-600', 
        bgColor: 'bg-emerald-100', 
        text: t('status.healthy', 'Healthy'),
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <path d="m9 11 3 3L22 4"></path>
          </svg>
        )
      };
    }
    
    if (plant.status === 'needs_water') {
      return {
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        text: t('status.needsWater', 'Needs Water'),
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 15 5 15a7 7 0 0 0 7 7z"></path>
          </svg>
        )
      };
    }
    
    return {
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      text: t('status.needsAttention', 'Needs Attention'),
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
      )
    };
  };

  const statusInfo = getStatusInfo();
  const lastWateredDate = new Date(plant.lastWatered).toLocaleDateString();
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Plant Image */}
      <div className="relative h-48 bg-gray-100">
        {plant.image ? (
          <img 
            src={plant.image} 
            alt={plant.name} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
              <path d="M12 10a6 6 0 0 0-6-6H4v12h2a6 6 0 0 0 6-6Z"></path>
              <path d="M12 10a6 6 0 0 1 6-6h2v12h-2a6 6 0 0 1-6-6Z"></path>
              <path d="M12 22v-8.3"></path>
            </svg>
          </div>
        )}
        
        {/* Status badge */}
        <div className={`${statusInfo.bgColor} ${statusInfo.color} px-2 py-1 rounded-full flex items-center text-xs font-medium absolute top-3 right-3`}>
          {statusInfo.icon}
          {statusInfo.text}
        </div>
      </div>
      
      {/* Plant Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{plant.name}</h3>
        <p className="text-sm text-gray-500 mb-3">{plant.species}</p>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          {/* Location */}
          <div className="flex items-center text-sm text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mr-1.5">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            {plant.location}
          </div>
          
          {/* Last Watered */}
          <div className="flex items-center text-sm text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mr-1.5">
              <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 15 5 15a7 7 0 0 0 7 7z"></path>
            </svg>
            {lastWateredDate}
          </div>
        </div>
        
        {/* Zone tag (Premium Feature) */}
        {plant.zone && isPremium && (
          <div className="mb-4">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                <path d="M9 9h.01"></path>
                <path d="M9 15h.01"></path>
                <path d="M15 9h.01"></path>
                <path d="M15 15h.01"></path>
              </svg>
              {plant.zone}
            </span>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex justify-between items-center">
          <Link href={`/plants/${plant.plant_id}`} className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition-colors">
            {t('plants.viewDetails', 'View Details')}
          </Link>
          <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}