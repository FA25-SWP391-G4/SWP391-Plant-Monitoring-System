import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FiDroplet, FiFileText, FiCamera, FiShare2, FiAlertCircle } from 'react-icons/fi';

/**
 * PlantActions component provides quick action buttons for common plant tasks
 */
const PlantActions = ({ plantId, onWater, onAddNote, onAddPhoto, onShare, onReportIssue }) => {
  const { t } = useTranslation();
  
  const actions = [
    {
      icon: <FiDroplet className="h-5 w-5" />,
      label: t('actions.water', 'Water'),
      onClick: () => onWater && onWater(plantId),
      color: 'bg-blue-100 text-blue-600 hover:bg-blue-200'
    },
    {
      icon: <FiFileText className="h-5 w-5" />,
      label: t('actions.addNote', 'Add Note'),
      onClick: () => onAddNote && onAddNote(plantId),
      color: 'bg-purple-100 text-purple-600 hover:bg-purple-200'
    },
    {
      icon: <FiCamera className="h-5 w-5" />,
      label: t('actions.addPhoto', 'Add Photo'),
      onClick: () => onAddPhoto && onAddPhoto(plantId),
      color: 'bg-green-100 text-green-600 hover:bg-green-200'
    },
    {
      icon: <FiShare2 className="h-5 w-5" />,
      label: t('actions.share', 'Share'),
      onClick: () => onShare && onShare(plantId),
      color: 'bg-amber-100 text-amber-600 hover:bg-amber-200'
    },
    {
      icon: <FiAlertCircle className="h-5 w-5" />,
      label: t('actions.reportIssue', 'Report Issue'),
      onClick: () => onReportIssue && onReportIssue(plantId),
      color: 'bg-red-100 text-red-600 hover:bg-red-200'
    }
  ];

  return (
    <Card className="mb-6">
      <div className="p-5">
        <h3 className="text-lg font-medium mb-4">{t('plants.quickActions', 'Quick Actions')}</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              className={`flex flex-col items-center justify-center h-24 p-2 rounded-lg ${action.color} btn-transition`}
              onClick={action.onClick}
            >
              <div className="mb-2">{action.icon}</div>
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </Card>
  );
};

export default PlantActions;