'use client';

import { useState } from 'react';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { Button } from '@/components/ui/Button';
import { FaGoogle } from 'react-icons/fa';

/**
 * Enhanced Google Login Button Component
 * Supports both client-side and server-side OAuth flows
 * 
 * @param {Object} props - Component props
 * @param {('popup'|'redirect')} [props.flowType='redirect'] - OAuth flow type: popup or redirect
 * @param {string} [props.variant='outline'] - Button variant from UI system
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} Google login button
 */
export function GoogleLoginButton({ 
  flowType = 'redirect', 
  variant = 'outline',
  className = ''
}) {
  const { initGoogleSignIn, initiateServerSideAuth, isAuthenticating } = useGoogleAuth();
  const [loading, setLoading] = useState(false);
  
  /**
   * Handle button click based on the selected flow type
   */
  const handleGoogleLogin = async () => {
    if (loading || isAuthenticating) return;
    
    setLoading(true);
    
    try {
      if (flowType === 'popup') {
        // Client-side popup flow (less secure, but works without backend changes)
        initGoogleSignIn();
      } else {
        // Server-side redirect flow (more secure with state parameter)
        initiateServerSideAuth();
      }
    } catch (error) {
      console.error('Google login error:', error);
    } finally {
      // For popup flow, we can reset loading immediately
      // For redirect flow, page will refresh so no need to reset
      if (flowType === 'popup') {
        setLoading(false);
      }
    }
  };
  
  return (
    <Button
      variant={variant}
      className={`w-full flex items-center justify-center gap-2 ${className}`}
      onClick={handleGoogleLogin}
      disabled={loading || isAuthenticating}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
      ) : (
        <FaGoogle className="w-4 h-4" />
      )}
      <span>Continue with Google</span>
    </Button>
  );
}

export default GoogleLoginButton;