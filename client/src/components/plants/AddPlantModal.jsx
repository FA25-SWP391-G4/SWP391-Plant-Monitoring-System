import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function AddPlantModal({ onClose, onAdd, isPremium }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    species: '',
    location: '',
    notes: '',
    zone: isPremium ? 'Indoor' : ''
  });
  const [image, setImage] = useState(null);
  const [errors, setErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleImageChange = (e) => {
    // In a real app, this would handle file uploads
    // Here we just simulate it
    const file = e.target.files[0];
    if (file) {
      setImage({
        name: file.name,
        size: file.size,
        type: file.type
      });
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('validation.nameRequired', 'Plant name is required');
    if (!formData.location.trim()) newErrors.location = t('validation.locationRequired', 'Location is required');
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onAdd({
        ...formData,
        image: image ? URL.createObjectURL(e.target.image.files[0]) : null
      });
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
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
            
            {/* Plant Species */}
            <div className="mb-4">
              <label htmlFor="species" className="block text-sm font-medium text-gray-700 mb-1">
                {t('plants.species', 'Species/Scientific Name')}
              </label>
              <input
                type="text"
                id="species"
                name="species"
                value={formData.species}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder={t('plants.speciesPlaceholder', 'e.g., Monstera deliciosa')}
              />
            </div>
            
            {/* Location */}
            <div className="mb-4">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                {t('plants.location', 'Location')} *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  errors.location ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder={t('plants.locationPlaceholder', 'e.g., Living Room, Garden')}
              />
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>
            
            {/* Zone (Premium only) */}
            {isPremium && (
              <div className="mb-4">
                <label htmlFor="zone" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('plants.zone', 'Zone')}
                </label>
                <select
                  id="zone"
                  name="zone"
                  value={formData.zone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Indoor">{t('zones.indoor', 'Indoor')}</option>
                  <option value="Outdoor">{t('zones.outdoor', 'Outdoor')}</option>
                  <option value="Balcony">{t('zones.balcony', 'Balcony')}</option>
                  <option value="Garden">{t('zones.garden', 'Garden')}</option>
                  <option value="Herb Garden">{t('zones.herbGarden', 'Herb Garden')}</option>
                </select>
              </div>
            )}
            
            {/* Plant Image */}
            <div className="mb-4">
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                {t('plants.plantImage', 'Plant Image')}
              </label>
              <div className="flex items-center">
                <label className="cursor-pointer flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-emerald-500 transition-colors">
                  <input
                    type="file"
                    id="image"
                    name="image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="text-center">
                    {image ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm text-gray-500 mt-1 block">{image.name}</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm text-gray-500 mt-1 block">{t('plants.uploadImage', 'Upload Image')}</span>
                      </>
                    )}
                  </div>
                </label>
              </div>
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
            
            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                onClick={onClose}
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                {t('common.add', 'Add Plant')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}