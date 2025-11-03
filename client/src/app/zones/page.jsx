'use client'

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import axiosClient from '@/api/axiosClient';
import MainLayout from '@/components/MainLayout';

export default function ZonesPage() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [zones, setZones] = useState([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newZone, setNewZone] = useState({ zone_name: '', description: '' });
  const [errors, setErrors] = useState({});

  // Check if user has premium/ultimate access
  const hasAccess = user?.role === 'Premium' || user?.role === 'Ultimate' || user?.role === 'Admin';

  useEffect(() => {
    // Let MainLayout handle basic authentication
    if (loading) return;
    
    if (user && !hasAccess) {
      // Use window.location for navigation to avoid router context issues
      if (typeof window !== 'undefined') {
        window.location.href = '/premium';
      }
      return;
    }

    if (user && hasAccess) {
      fetchZones();
    }
  }, [user, loading, hasAccess]);

  const fetchZones = async () => {
    try {
      setLoadingZones(true);
      const response = await axiosClient.get('/api/zones');
      if (response.data.success) {
        setZones(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch zones:', error);
    } finally {
      setLoadingZones(false);
    }
  };

  const handleCreateZone = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!newZone.zone_name.trim()) {
      setErrors({ zone_name: 'Zone name is required' });
      return;
    }

    try {
      const response = await axiosClient.post('/api/zones', {
        zone_name: newZone.zone_name.trim(),
        description: newZone.description.trim() || null
      });

      if (response.data.success) {
        setZones([response.data.data, ...zones]);
        setNewZone({ zone_name: '', description: '' });
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Failed to create zone:', error);
      setErrors({ general: error.response?.data?.error || 'Failed to create zone' });
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (!user || !hasAccess) {
    return null; // Will redirect in useEffect
  }

  return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {t('zones.title', 'Plant Zones')}
            </h1>
            <p className="mt-2 text-gray-600">
              {t('zones.description', 'Organize your plants by location or category')}
            </p>
          </div>

          {/* Premium Feature Badge */}
          <div className="mb-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
            <div className="flex items-center">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-amber-400 to-amber-500 text-white mr-3">
                {user.role === 'Ultimate' ? '✨ ULTIMATE' : '⭐ PREMIUM'}
              </span>
              <span className="text-amber-800">
                {t('zones.premiumFeature', 'Zone management is a premium feature for organizing your plants')}
              </span>
            </div>
          </div>

          {/* Create Zone Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('zones.createZone', 'Create New Zone')}
            </button>
          </div>

          {/* Create Zone Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h2 className="text-xl font-semibold mb-4">
                  {t('zones.createNewZone', 'Create New Zone')}
                </h2>
                
                <form onSubmit={handleCreateZone}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('zones.zoneName', 'Zone Name')} *
                    </label>
                    <input
                      type="text"
                      value={newZone.zone_name}
                      onChange={(e) => setNewZone({ ...newZone, zone_name: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                        errors.zone_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder={t('zones.zoneNamePlaceholder', 'e.g., Living Room, Garden')}
                    />
                    {errors.zone_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.zone_name}</p>
                    )}
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('zones.description', 'Description')}
                    </label>
                    <textarea
                      value={newZone.description}
                      onChange={(e) => setNewZone({ ...newZone, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={3}
                      placeholder={t('zones.descriptionPlaceholder', 'Optional description')}
                    />
                  </div>

                  {errors.general && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{errors.general}</p>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {t('common.cancel', 'Cancel')}
                    </button>
                    <button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {t('zones.createZone', 'Create Zone')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Coming Soon Message */}
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('zones.comingSoon', 'Zone Management Coming Soon')}
            </h3>
            <p className="text-gray-500 mb-4">
              {t('zones.comingSoonDesc', 'Full zone management functionality will be available soon. Create zones to organize your plants by location.')}
            </p>
          </div>
        </div>
      </div>
  );
}