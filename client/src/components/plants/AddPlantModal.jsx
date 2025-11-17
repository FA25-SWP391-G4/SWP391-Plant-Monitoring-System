import React, { useState, useEffect } from 'react';
import deviceApi from '@/api/deviceApi';
import { useTranslation } from 'react-i18next';
import Modal from '@/components/ui/Modal';
import axiosClient from '@/api/axiosClient';

export default function AddPlantModal({ onClose, onAdd, isPremium }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    profileId: '',
    notes: '',
    zoneId: isPremium ? '' : '',
    moistureThreshold: 60 // Default moisture threshold
  });
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [plantProfiles, setPlantProfiles] = useState([]);
  const [recommendedProfiles, setRecommendedProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [dropdownRef, setDropdownRef] = useState(null);
  const [zones, setZones] = useState([]);
  const [devices, setDevices] = useState([]);

  // Fetch recommended profiles, zones, and devices on component mount
  useEffect(() => {
    fetchRecommendedProfiles();
    if (isPremium) {
      fetchZones();
    }
    fetchDevices();
  }, [isPremium]);

  const fetchDevices = async () => {
    try {
      let response;
      if (deviceApi?.getAll) {
        response = await deviceApi.getAll();
        if (response.success) setDevices(response.data);
      } else {
        const res = await axiosClient.get('/api/devices');
        if (res.data?.success) setDevices(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
    }
  };

  // Handle search with debouncing
  useEffect(() => {
    const searchTimer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        searchPlantProfiles(searchTerm);
      } else if (searchTerm.length === 0) {
        setFilteredProfiles([]);
        setPlantProfiles([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(searchTimer);
  }, [searchTerm]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef && !dropdownRef.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);

  const fetchRecommendedProfiles = async () => {
    try {
      setLoadingRecommended(true);
      // Get popular/recommended species (sorted by name, limit to top 15)
      const response = await axiosClient.get('/api/plant-profiles?limit=15&sort=species_name&order=ASC');
      if (response.data.success) {
        setRecommendedProfiles(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch recommended profiles:', error);
      // Set some default recommendations as fallback
      setRecommendedProfiles([
        { profile_id: null, species_name: 'Monstera deliciosa', ideal_moisture: 65, description: 'Popular houseplant with large, fenestrated leaves.' },
        { profile_id: null, species_name: 'Pothos aureus', ideal_moisture: 55, description: 'Easy-care trailing vine with variegated leaves.' },
        { profile_id: null, species_name: 'Sansevieria trifasciata', ideal_moisture: 30, description: 'Low-maintenance snake plant, excellent air purifier.' }
      ]);
    } finally {
      setLoadingRecommended(false);
    }
  };

  const searchPlantProfiles = async (query) => {
    try {
      setLoadingProfiles(true);
      const response = await axiosClient.get(`/api/plant-profiles/search/suggest?q=${encodeURIComponent(query)}`);
      if (response.data.success) {
        setPlantProfiles(response.data.data);
        setFilteredProfiles(response.data.data);
      }
    } catch (error) {
      console.error('Failed to search plant profiles:', error);
      setFilteredProfiles([]);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const fetchZones = async () => {
    try {
      setLoadingRecommended(true);
      // Get available zones (sorted by name, limit to top 15)
      const response = await axiosClient.get('/api/zones?limit=15&sort=zone_name&order=ASC');
      if (response.data.success) {
        // Transform zone data to be compatible with the dropdown if needed
        // Zones should have structure: { id, zone_name, description, etc. }
        setZones(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch zones:', error);
      // Set some default zones as fallback
      setZones([
        { id: 1, zone_name: 'Indoor', description: 'Indoor growing area' },
        { id: 2, zone_name: 'Outdoor', description: 'Outdoor growing area' },
        { id: 3, zone_name: 'Greenhouse', description: 'Controlled greenhouse environment' }
      ]);
    } finally {
      setLoadingRecommended(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, image: t('validation.invalidImageType', 'Please select a valid image file') });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, image: t('validation.imageTooLarge', 'Image size should be less than 5MB') });
        return;
      }

      setImageFile(file);
      setImage({
        name: file.name,
        size: file.size,
        type: file.type,
        preview: URL.createObjectURL(file)
      });
      
      // Clear any previous image errors
      const newErrors = { ...errors };
      delete newErrors.image;
      setErrors(newErrors);
    }
  };

  const handleSpeciesInputClick = () => {
    if (!showDropdown) {
      setShowDropdown(true);
      // If no search term, show recommended profiles
      if (searchTerm.length === 0) {
        setFilteredProfiles(recommendedProfiles);
      }
    }
  };

  const handleSpeciesSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowDropdown(true);
    
    // Clear selection if user types something different
    if (selectedProfile && !selectedProfile.species_name.toLowerCase().includes(value.toLowerCase())) {
      setSelectedProfile(null);
      setFormData({ ...formData, profileId: '' });
    }
  };

  const handleSpeciesFocus = () => {
    setShowDropdown(true);
    if (searchTerm.length === 0) {
      setFilteredProfiles(recommendedProfiles);
    }
  };

  const selectProfile = (profile) => {
    setSelectedProfile(profile);
    setSearchTerm(profile.species_name);
    setShowDropdown(false);
    setFormData({ 
      ...formData, 
      profileId: profile.profile_id || '',
      moistureThreshold: profile.ideal_moisture || 60
    });
  };

  const clearSelection = () => {
    setSelectedProfile(null);
    setSearchTerm('');
    setFormData({ ...formData, profileId: '', moistureThreshold: 60 });
    setShowDropdown(false);
  };
  
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('validation.nameRequired', 'Plant name is required');
    // Location validation removed - will be replaced with zones in future update
    
    // Validate moisture threshold
    const threshold = parseInt(formData.moistureThreshold);
    if (isNaN(threshold) || threshold < 10 || threshold > 90) {
      newErrors.moistureThreshold = t('validation.invalidMoistureThreshold', 'Moisture threshold must be between 10% and 90%');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImage = async (file) => {
    if (!file) return null;
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'plant');
    
    try {
      const response = await axiosClient.post('/api/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        return response.data.data.url;
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      throw new Error(t('errors.imageUploadFailed', 'Failed to upload image'));
    }
    
    return null;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    
    try {
      // Upload image if provided
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }
      
      // Prepare plant data for submission
      const plantData = {
        custom_name: formData.name.trim(),
        profile_id: formData.profileId || null,
        notes: formData.notes.trim() || null,
        zone_id: isPremium && formData.zoneId ? parseInt(formData.zoneId) : null,
        moisture_threshold: parseInt(formData.moistureThreshold),
        image: imageUrl,
        species_name: selectedProfile ? selectedProfile.species_name : 'Unknown Species'
      };
      
      // Debug logging
      console.log('Form Data:', formData);
      console.log('Is Premium:', isPremium);
      console.log('Zone ID from form:', formData.zoneId);
      console.log('Plant Data being sent:', plantData);
      
      // Call the API to create the plant
      const response = await axiosClient.post('/api/plants', plantData);
      
      if (response.data.success) {
        // Call the parent callback with the created plant data
        onAdd(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to create plant');
      }
      
    } catch (error) {
      console.error('Failed to add plant:', error);
      setErrors({ 
        ...errors, 
        submit: error.message || t('errors.addPlantFailed', 'Failed to add plant. Please try again.') 
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('plants.addNewPlant', 'Add New Plant')}
          </h2>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
          
          <form onSubmit={handleSubmit}>
            {/* Plant Name */}
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                {t('plants.plantName', 'Plant Name')} *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder={t('plants.plantNamePlaceholder', 'e.g., Monstera, Snake Plant')}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            
            {/* Plant Species Dropdown */}
            <div className="mb-4 relative" ref={setDropdownRef}>
              <label htmlFor="species" className="block text-sm font-medium text-gray-700 mb-1">
                {t('plants.species', 'Species/Scientific Name')}
              </label>
              <div className="relative">
                <div className="relative">
                  <input
                    type="text"
                    id="species"
                    value={searchTerm}
                    onChange={handleSpeciesSearch}
                    onFocus={handleSpeciesFocus}
                    onClick={handleSpeciesInputClick}
                    className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder={selectedProfile ? selectedProfile.species_name : t('plants.speciesPlaceholder', 'Click to browse species or type to search...')}
                    disabled={loadingProfiles || loadingRecommended}
                  />
                  
                  {/* Icons and loading state */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    {(loadingProfiles || loadingRecommended) && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                    )}
                    {selectedProfile && (
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* Dropdown */}
                {showDropdown && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-hidden">
                    {/* Header section for recommendations or search results */}
                    {searchTerm.length === 0 && recommendedProfiles.length > 0 && (
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                          {t('plants.recommendedSpecies', 'Popular Species')}
                        </div>
                      </div>
                    )}
                    {searchTerm.length >= 2 && filteredProfiles.length > 0 && (
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                          {t('plants.searchResults', 'Search Results')} ({filteredProfiles.length})
                        </div>
                      </div>
                    )}
                    
                    {/* Results */}
                    <div className="max-h-64 overflow-y-auto">
                      {filteredProfiles.length > 0 && filteredProfiles.map((profile, index) => (
                        <div
                          key={profile.profile_id || `profile-${index}`}
                          className="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                          onClick={() => selectProfile(profile)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-sm truncate">
                                {profile.species_name}
                              </div>
                              {profile.ideal_moisture && (
                                <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 2L6 6v4c0 4.42 5.6 8 10 8 4.4 0 10-3.58 10-8V6l-4-4z" />
                                  </svg>
                                  {t('plants.idealMoisture', 'Ideal moisture')}: {profile.ideal_moisture}%
                                </div>
                              )}
                              {profile.description && (
                                <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {profile.description.length > 120 
                                    ? `${profile.description.substring(0, 120)}...`
                                    : profile.description
                                  }
                                </div>
                              )}
                            </div>
                            <div className="ml-2 flex-shrink-0">
                              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* No results message */}
                      {showDropdown && searchTerm.length >= 2 && filteredProfiles.length === 0 && !loadingProfiles && (
                        <div className="px-4 py-6 text-center text-gray-500">
                          <svg className="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {t('plants.noSpeciesFound', 'No species found')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {t('plants.noSpeciesFoundDescription', 'Try searching with different keywords or proceed without selecting a species.')}
                          </div>
                        </div>
                      )}
                      
                      {/* Loading state */}
                      {(loadingProfiles || loadingRecommended) && filteredProfiles.length === 0 && (
                        <div className="px-4 py-6 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                          <div className="text-sm text-gray-500">
                            {t('plants.loadingSpecies', 'Loading species...')}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Footer with custom option */}
                    <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProfile(null);
                          setSearchTerm('');
                          setFormData({ ...formData, profileId: '' });
                          setShowDropdown(false);
                        }}
                        className="text-xs text-gray-600 hover:text-emerald-600 transition-colors duration-150"
                      >
                        {t('plants.proceedWithoutSpecies', '→ Proceed without selecting a species')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Selected species info */}
              {selectedProfile && (
                <div className="mt-3 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-emerald-800 mb-1">
                        {selectedProfile.species_name}
                      </div>
                      {selectedProfile.ideal_moisture && (
                        <div className="text-xs text-emerald-600 mb-2 flex items-center gap-1">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 2L6 6v4c0 4.42 5.6 8 10 8 4.4 0 10-3.58 10-8V6l-4-4z" />
                          </svg>
                          {t('plants.recommendedMoisture', 'Recommended moisture')}: {selectedProfile.ideal_moisture}%
                        </div>
                      )}
                      {selectedProfile.description && (
                        <div className="text-xs text-emerald-700 leading-relaxed">
                          {selectedProfile.description.length > 250 
                            ? `${selectedProfile.description.substring(0, 250)}...`
                            : selectedProfile.description
                          }
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={clearSelection}
                      className="ml-3 text-emerald-400 hover:text-emerald-600 transition-colors duration-150"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
            

            {/* Moisture Threshold */}
            <div className="mb-4">
              <label htmlFor="moistureThreshold" className="block text-sm font-medium text-gray-700 mb-1">
                {t('plants.moistureThreshold', 'Watering Threshold')} (%)
              </label>
              <input
                type="number"
                id="moistureThreshold"
                name="moistureThreshold"
                min="10"
                max="90"
                value={formData.moistureThreshold}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.moistureThreshold ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="60"
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('plants.moistureThresholdHelp', 'Your plant will be watered when soil moisture drops below this level')}
              </p>
              {errors.moistureThreshold && (
                <p className="mt-1 text-sm text-red-600">{errors.moistureThreshold}</p>
              )}
            </div>
            
            {/* Device dropdown with plant device as default */}
            <div className="mb-4">
              <label htmlFor="device_id" className="block text-sm font-medium text-gray-700 mb-1">
                {t('plants.device', 'Device')}
              </label>
              <select
                id="device_id"
                name="device_id"
                value={formData.device_id || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {devices.map(device => (
                  <option key={device.id} value={device.id}>
                    {device.device_name}
                    {device.description ? ` - ${device.description}` : ''}
                  </option>
                ))}
              </select>
              {formData.device_id && (
                <button
                  type="button"
                  className="mt-2 text-xs text-red-600 underline"
                  onClick={() => setFormData(prev => ({ ...prev, device_id: '' }))}
                >
                  {t('plants.unbindDevice', 'Unbind device')}
                </button>
              )}
            </div>

            {/* Zone (Premium only) */}
            {isPremium && (
              <div className="mb-4">
                <label htmlFor="zone" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('plants.zone', 'Zone')}
                </label>
                <select
                  id="zoneId"
                  name="zoneId"
                  value={formData.zoneId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">{t('zones.select', 'Select a zone')}</option>
                  {zones.map(zone => (
                    <option key={zone.id} value={zone.id}>
                      {zone.zone_name}
                      {zone.description && ` - ${zone.description}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Plant Image */}
            <div className="mb-4">
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                {t('plants.plantImage', 'Plant Image')}
              </label>
              
              {image && image.preview ? (
                <div className="relative">
                  <div className="w-full h-48 border-2 border-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={image.preview}
                      alt="Plant preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null);
                      setImageFile(null);
                      const fileInput = document.getElementById('image');
                      if (fileInput) fileInput.value = '';
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="mt-2 text-center">
                    <p className="text-sm text-gray-600">{image.name}</p>
                    <p className="text-xs text-gray-500">
                      {(image.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 transition-colors">
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-gray-500 block">{t('plants.uploadImage', 'Click to upload plant image')}</span>
                    <span className="text-xs text-gray-400 block mt-1">
                      {t('plants.imageRequirements', 'PNG, JPG up to 5MB')}
                    </span>
                  </div>
                </label>
              )}
              
              {errors.image && (
                <p className="mt-1 text-sm text-red-600">{errors.image}</p>
              )}
            </div>
            
            {/* Notes */}
            <div className="mb-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                {t('plants.notes', 'Notes')}
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={t('plants.notesPlaceholder', 'Add any notes about your plant here...')}
              ></textarea>
            </div>
            
            {/* Error Message */}
            {errors.submit && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                onClick={onClose}
                disabled={submitting}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={submitting}
              >
                {submitting && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {submitting ? t('common.adding', 'Adding...') : t('common.add', 'Add Plant')}
              </button>
            </div>
          </form>
        </div>
    </Modal>
  );
}