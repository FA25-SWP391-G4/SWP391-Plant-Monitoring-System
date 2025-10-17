import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { FiPlus, FiEdit2, FiTrash2, FiFileText } from 'react-icons/fi';

/**
 * NotesList component displays and manages notes for a plant
 */
const NotesList = ({ plantId, notes = [], onAddNote, onEditNote, onDeleteNote }) => {
  const { t } = useTranslation();
  
  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <Card className="mb-6">
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">{t('plants.notes', 'Notes')}</h3>
          
          <Button 
            size="sm" 
            onClick={() => onAddNote && onAddNote(plantId)}
          >
            <FiPlus className="mr-1" />
            {t('plants.addNote', 'Add Note')}
          </Button>
        </div>
        
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <FiFileText className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 mb-1">
              {t('plants.noNotes', 'No notes yet')}
            </p>
            <p className="text-sm text-gray-400">
              {t('plants.addNotesForPlant', 'Add notes about your plant care')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      {formatDate(note.timestamp)}
                      {note.author && ` • ${note.author}`}
                    </p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEditNote && onEditNote(note)}
                    >
                      <FiEdit2 className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onDeleteNote && onDeleteNote(note)}
                    >
                      <FiTrash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                </div>
                
                <div className="text-gray-700 whitespace-pre-wrap break-words">
                  {note.content}
                </div>
                
                {note.category && (
                  <div className="mt-3">
                    <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                      note.category === 'care' ? 'bg-green-100 text-green-600' :
                      note.category === 'issue' ? 'bg-red-100 text-red-600' :
                      note.category === 'observation' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {note.category.charAt(0).toUpperCase() + note.category.slice(1)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {notes.length > 5 && (
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-800">
              {t('common.viewAllNotes', 'View all notes')} ({notes.length})
            </button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default NotesList;