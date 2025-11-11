import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

/**
 * LogoutConfirmationModal - A modal dialog that confirms user logout
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {function} props.onClose - Function to call when modal should close
 */
export function LogoutConfirmationModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirmLogout = async () => {
    setIsLoading(true);
    
    try {
      // Call the logout function from AuthProvider
      await logout();
      // Modal will close automatically when user state changes
      onClose();
    } catch (error) {
      console.error('Logout error:', error);
      // Still close modal even if there's an error
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} closeOnOverlay={!isLoading}>
      <div className="p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg 
              className="h-6 w-6 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
              />
            </svg>
          </div>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('auth.confirmLogout', 'Confirm Sign Out')}
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {t('auth.logoutMessage', 'Are you sure you want to sign out? You will need to sign in again to access your account.')}
          </p>
          
          {user && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-medium text-sm">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleCancel}
            disabled={isLoading}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleConfirmLogout}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg 
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {t('auth.signingOut', 'Signing Out...')}
              </div>
            ) : (
              t('auth.signOut', 'Sign Out')
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default LogoutConfirmationModal;