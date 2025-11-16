'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import zonesApi from '@/api/zonesApi';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  hover: { y: -3, transition: { duration: 0.15 } },
};

/**
 * ZoneListItem – Rich zone tile used inside the Zones page grid.
 * Mirrors PlantListItem UX with actions + modal editing hooks.
 */
export default function ZoneListItem({
  zone,
  onView,
  onUpdate,
  onDelete,
  showActions = true,
}) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const plantCount = zone?.plant_count ?? zone?.plants?.length ?? 0;
  const createdAtLabel = zone?.created_at
    ? new Date(zone.created_at).toLocaleDateString()
    : t('zones.notAvailable', 'N/A');
  const updatedAtLabel = zone?.updated_at
    ? new Date(zone.updated_at).toLocaleDateString()
    : null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await zonesApi.remove(zone.zone_id);
      if (onDelete) {
        onDelete(zone.zone_id);
      }
    } catch (error) {
      console.error('Failed to delete zone:', error);
    } finally {
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  const handleSave = async (payload) => {
    try {
      const response = await zonesApi.update(zone.zone_id, payload);
      const updated = response?.data?.data || response?.data;
      if (onUpdate) {
        onUpdate(zone.zone_id, updated);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update zone:', error);
      throw error;
    }
  };

  const insights = [
    {
      label: t('zones.metrics.plantCount', 'Plants'),
      value: plantCount,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-emerald-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v5m0 8v5" />
        </svg>
      ),
    },
    {
      label: t('zones.metrics.createdAt', 'Created'),
      value: createdAtLabel,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3M5 11h14M5 19h14M5 11v8a2 2 0 002 2h10a2 2 0 002-2v-8"
          />
        </svg>
      ),
    },
  ];

  if (updatedAtLabel) {
    insights.push({
      label: t('zones.metrics.updatedAt', 'Updated'),
      value: updatedAtLabel,
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
          <circle cx="12" cy="12" r="9" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    });
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-5 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-emerald-500 font-semibold">
            {t('zones.zoneLabel', 'Zone')}
          </p>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
            {zone.zone_name || t('zones.unnamedZone', 'Unnamed Zone')}
          </h3>
          {zone.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {zone.description}
            </p>
          )}
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-200 px-3 py-1 rounded-full text-sm font-medium">
          {t('zones.plantCountLabel', '{{count}} plants', { count: plantCount })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {insights.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            {item.icon}
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500">
                {item.label}
              </p>
              <p className="font-medium text-gray-900 dark:text-white">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      {zone.plants?.length ? (
        <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
          <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
            {t('zones.assignedPlants', 'Assigned Plants')}
          </p>
          <div className="flex flex-wrap gap-2">
            {zone.plants.slice(0, 4).map((plant) => (
              <span
                key={plant.plant_id || plant.id}
                className="px-2 py-0.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300"
              >
                {plant.custom_name || plant.name || t('plants.unnamedPlant', 'Unnamed Plant')}
              </span>
            ))}
            {zone.plants.length > 4 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('zones.morePlants', '+{{count}} more', { count: zone.plants.length - 4 })}
              </span>
            )}
          </div>
        </div>
      ) : null}

      {showActions && (
        <div className="flex flex-wrap gap-2 justify-end">
          {onView && (
            <button
              type="button"
              onClick={() => onView(zone)}
              className="px-3 py-1.5 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
            >
              {t('common.viewDetails', 'View Details')}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            {t('common.edit', 'Edit')}
          </button>
          <button
            type="button"
            onClick={() => setIsConfirmingDelete(true)}
            className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            {t('common.delete', 'Delete')}
          </button>
        </div>
      )}

      {isEditing && (
        <EditZoneModal
          zone={zone}
          onClose={() => setIsEditing(false)}
          onSave={handleSave}
        />
      )}

      {isConfirmingDelete && (
        <ConfirmDialog
          title={t('zones.deleteTitle', 'Delete Zone')}
          message={t(
            'zones.deleteMessage',
            'Are you sure you want to delete this zone? This action cannot be undone.'
          )}
          confirmText={isDeleting ? t('common.deleting', 'Deleting...') : t('common.delete', 'Delete')}
          variant="danger"
          onClose={() => setIsConfirmingDelete(false)}
          onConfirm={handleDelete}
          disabled={isDeleting}
        />
      )}
    </motion.div>
  );
}

function EditZoneModal({ zone, onClose, onSave }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    zone_name: zone.zone_name || '',
    description: zone.description || '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.zone_name.trim()) {
      setError(t('zones.nameRequired', 'Zone name is required'));
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSave({
        zone_name: formData.zone_name.trim(),
        description: formData.description.trim(),
      });
    } catch (err) {
      setError(t('errors.updateFailed', 'Failed to update data'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} size="md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('zones.editZone', 'Edit Zone')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('zones.zoneName', 'Zone Name')} *
            </label>
            <input
              type="text"
              value={formData.zone_name}
              onChange={(e) => setFormData({ ...formData, zone_name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-gray-100"
              placeholder={t('zones.zoneNamePlaceholder', 'e.g., Living Room')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('zones.description', 'Description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-gray-100"
              placeholder={t('zones.descriptionPlaceholder', 'Optional description')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
