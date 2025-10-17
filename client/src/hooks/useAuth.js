import { useContext } from 'react';
import { AuthContext } from '@/providers/AuthProvider';

/**
 * Custom hook to access authentication context
 * @returns {Object} Authentication context values and methods
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}