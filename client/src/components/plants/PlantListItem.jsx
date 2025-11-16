import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useSettings } from '@/providers/SettingsProvider';
import plantApi from '@/api/plantApi';
import axiosClient from '@/api/axiosClient';
import { formatDate } from '@/utils/dateFormat';

export default function PlantListItem({ plant, isPremium, onUpdate, onDelete }) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [lastWatered, setLastWatered] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const showTitles = settings?.widgets?.showWidgetTitles ?? true;
  const showIcons = settings?.widgets?.showWidgetIcons ?? true;
  const compactMode = settings?.widgets?.compactMode ?? false;
  const animationsEnabled = settings?.widgets?.animationsEnabled ?? true;
  
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
            <path d="M9 11l3 3L22 4"></path>
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

  const loadLastWatered = async () => {
    try {
      const lastWateredData = await plantApi.getLastWatered(plant.plant_id);
      setLastWatered(lastWateredData);
    } catch (error) {
      console.error('Error loading last watered info:', error);
    }
  };

  const statusInfo = getStatusInfo();

  const getLastWateredDisplay = () => {
    if (lastWatered?.data?.last_watered) {
      const lastWateredDate = new Date(lastWatered.data.last_watered.timestamp);
      return {
        date: formatDate(lastWateredDate.toLocaleDateString(), settings.language.dateFormat),
        timeAgo: lastWatered.data.last_watered.time_ago,
        triggerType: lastWatered.data.last_watered.trigger_type
      };
    }
    if (plant.lastWatered) {
      return {
        date: new Date(plant.lastWatered).toLocaleDateString(),
        timeAgo: null,
        triggerType: null
      };
    }
    return {
      date: t('plants.neverWatered', 'Never watered'),
      timeAgo: null,
      triggerType: null
    };
  };

  const lastWateredInfo = getLastWateredDisplay();

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: "easeOut" } },
    hover: { y: -4, transition: { duration: 0.2 } }
  };

  useEffect(() => {
    // Load last watered info on component mount
    loadLastWatered();
  }, [plant.plant_id]);

  // Handle edit action
  const handleEdit = () => {
    setShowEditModal(true);
  };

  // Handle delete action
  const handleDelete = async () => {
    setShowDeleteConfirm(true);
  };

  // Confirm delete action
  const handleConfirmDelete = async () => {
    try {
      await plantApi.delete(plant.plant_id);
      if (onDelete) onDelete(plant.plant_id);
    } catch (error) {
      console.error('Error deleting plant:', error);
      alert(t('errors.deleteFailed', 'Failed to delete plant'));
    }
  };

  // Handle save from edit modal
  const handleSave = async (updatedData) => {
    try {
      const response = await plantApi.update(plant.plant_id, updatedData);
      if (response.success && onUpdate) {
        onUpdate(plant.plant_id, response.data);
      }
      setShowEditModal(false);
      //Show success toast or message if needed
      setToast.success(t('plants.updateSuccess', 'Plant updated successfully'));
      //Reload Plant data
      loadLastWatered();
    } catch (error) {
      console.error('Error updating plant:', error);
      throw error; // Let modal handle the error display
    }
  };
  
  return (
    <motion.div 
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={animationsEnabled ? "hover" : undefined}
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow ${animationsEnabled ? 'duration-200 ease-in-out fade-in' : ''}`}
    >
      {/* Plant Image */}
      <div className={`relative ${compactMode ? 'h-28' : 'h-48'} bg-gray-100 dark:bg-gray-700`}>
        {plant.image ? (
          <img 
            src={plant.image} 
            alt={plant.name} 
            className="w-full h-full object-cover" 
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 dark:text-gray-600">
              <path d="M12 10a6 6 0 0 0-6-6H4v12h2a6 6 0 0 0 6-6Z"></path>
              <path d="M12 10a6 6 0 0 1 6-6h2v12h-2a6 6 0 0 1-6-6Z"></path>
              <path d="M12 22v-8.3"></path>
            </svg>
          </div>
        )}
        
        {/* Status badge */}
        <div className={`${statusInfo.bgColor} ${statusInfo.color} px-2 py-1 rounded-full flex items-center text-xs font-medium absolute top-3 right-3`}>
          {showIcons && statusInfo.icon}
          {statusInfo.text}
        </div>
      </div>
      
      {/* Plant Info */}
      <div className="p-4">
        <h3 className={`${showTitles ? 'text-lg font-semibold' : 'hidden'} text-gray-900 dark:text-gray-100 mb-1`}>{plant.name}</h3>
        <p className={`${showTitles ? 'text-sm' : 'hidden'} text-gray-500 dark:text-gray-400 mb-3`}>{plant.species}</p>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          {/* Location */}
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 dark:text-gray-500 mr-1.5">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            {plant.location}
          </div>
          
          {/* Last Watered */}
          <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 dark:text-gray-500 mr-1.5">
              <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 15 5 15a7 7 0 0 0 7 7z"></path>
            </svg>
            {lastWateredInfo.date}
          </div>
        </div>
        
        {/* Zone tag (Premium Feature) */}
        {plant.zone && isPremium && (
          <div className="mb-4">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300">
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
          <div className="flex gap-2">
            <Link 
              href={`/plants/${plant.plant_id}`} 
              className="px-3 py-1.5 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700 transition-colors btn-transition"
            >
              {t('common.viewDetails', 'View Details')}
            </Link>
            <button
              onClick={handleEdit}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors btn-transition"
            >
              {t('common.edit', 'Edit')}
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors btn-transition"
            >
              {t('common.delete', 'Delete')}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditPlantModal
          plant={plant}
          onClose={() => setShowEditModal(false)}
          onSave={handleSave}
          isPremium={isPremium}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
      <ConfirmDialog
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={t('plants.confirmDeleteTitle', 'Delete Plant')}
        message={t('plants.confirmDelete', 'Are you sure you want to delete this plant? This action cannot be undone.')}
        confirmText={t('common.delete', 'Delete')}
        variant="danger"
      />
      )}
    </motion.div>
  );
}

// EditPlantModal component for editing plant information
function EditPlantModal({ plant, onClose, onSave, isPremium }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    custom_name: plant.name || '',
    notes: plant.notes || '',
    zone_id: plant.zone_id || '',
    moisture_threshold: plant.moisture_threshold || 50,
    species_name: plant.species || '',
    location: plant.location || ''
  });
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(plant.image || null);
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    if (isPremium) {
      fetchZones();
    }
  }, [isPremium]);

  const fetchZones = async () => {
    try {
      // Note: You might need to adjust this API call based on your actual zones API
      const response = await fetch('/api/zones', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setZones(data.data);
      }
    } catch (err) {
      console.error('Error fetching zones:', err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError(t('validation.invalidImageType', 'Please select a valid image file'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError(t('validation.imageTooLarge', 'Image size should be less than 5MB'));
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageError('');
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

      if (response.data?.success && response.data.data?.url) {
        return response.data.data.url;
      }

      throw new Error('Upload failed');
    } catch (err) {
      console.error('Image upload failed:', err);
      throw new Error(t('errors.imageUploadFailed', 'Failed to upload image'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.custom_name.trim()) {
      setError(t('plants.nameRequired', 'Plant name is required'));
      return;
    }

    if (formData.moisture_threshold < 0 || formData.moisture_threshold > 100) {
      setError(t('plants.invalidMoisture', 'Moisture threshold must be between 0 and 100'));
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      let imageUrl = plant.image || null;

      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const payload = {
        ...formData,
        image: imageUrl,
      };

      await onSave(payload);
    } catch (err) {
      setError(t('errors.updateFailed', 'Failed to update plant'));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Modal isOpen={true} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t('plants.editPlant', 'Edit Plant')}
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

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Plant Name */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('plants.name', 'Plant Name')} *
            </label>
            <input
              type="text"
              name="custom_name"
              value={formData.custom_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder={t('plants.namePlaceholder', 'Enter plant name')}
              required
            />
          </div>

          {/* Species */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('plants.species', 'Species')}
            </label>
            <input
              type="text"
              name="species_name"
              value={formData.species_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder={t('plants.speciesPlaceholder', 'Enter species name')}
            />
          </div>

          {/* Location */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('plants.location', 'Location')}
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder={t('plants.locationPlaceholder', 'Enter location')}
            />
          </div>

          {/* Zone (Premium only) */}
          {isPremium && zones.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('plants.zone', 'Zone')}
              </label>
              <select
                name="zone_id"
                value={formData.zone_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-gray-100"
              >
                <option value="">{t('plants.noZone', 'No Zone')}</option>
                {zones.map((zone) => (
                  <option key={zone.zone_id} value={zone.zone_id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Moisture Threshold */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('plants.moistureThreshold', 'Moisture Threshold')} (%)
            </label>
            <input
              type="number"
              name="moisture_threshold"
              value={formData.moisture_threshold}
              onChange={handleChange}
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-gray-100"
            />
          </div>

          {/* Plant Image */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('plants.plantImage', 'Plant Image')}
            </label>

            {imagePreview ? (
              <div className="relative">
                <div className="w-full h-48 border-2 border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                  <img
                    src={imagePreview}
                    alt="Plant preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    setImageError('');
                    const input = document.getElementById('edit-plant-image-input');
                    if (input) input.value = '';
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-emerald-500 transition-colors">
                <input
                  type="file"
                  id="edit-plant-image-input"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-500 dark:text-gray-300 block">{t('plants.uploadImage', 'Click to upload plant image')}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 block mt-1">
                    {t('plants.imageRequirements', 'PNG, JPG up to 5MB')}
                  </span>
                </div>
              </label>
            )}

            {imageError && (
              <p className="mt-1 text-sm text-red-600">{imageError}</p>
            )}
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('plants.notes', 'Notes')}
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 dark:bg-gray-700 dark:text-gray-100"
              placeholder={t('plants.notesPlaceholder', 'Enter notes about your plant')}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {loading ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}