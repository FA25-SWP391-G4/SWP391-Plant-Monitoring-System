import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function FilterBar({ searchTerm, setSearchTerm, activeFilter, setActiveFilter }) {
  const { t } = useTranslation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const filters = [
    { id: 'all', name: t('filters.allPlants', 'All Plants') },
    { id: 'healthy', name: t('filters.healthy', 'Healthy') },
    { id: 'needs_water', name: t('filters.needsWater', 'Needs Watering') },
    { id: 'needs_attention', name: t('filters.needsAttention', 'Needs Attention') }
  ];
  
  const getActiveFilterName = () => {
    return filters.find(filter => filter.id === activeFilter)?.name || filters[0].name;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={t('plants.searchPlants', 'Search plants...')}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Filter dropdown */}
        <div className="relative">
          <button 
            type="button" 
            className="inline-flex justify-between items-center w-full sm:w-48 px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              {getActiveFilterName()}
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isDropdownOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div className="py-1" role="menu" aria-orientation="vertical">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    className={`w-full text-left block px-4 py-2 text-sm ${
                      filter.id === activeFilter 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    role="menuitem"
                    onClick={() => {
                      setActiveFilter(filter.id);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {filter.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}