// useGoogleAuth.js - Custom hook for Google authentication
import { useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';

/**
 * Custom hook for handling Google OAuth authentication
 * 
 * @returns {Object} Methods and state for Google authentication
 */
export function useGoogleAuth() {
  const router = useRouter();
  const { login } = useAuth();
  
  /**
   * Process the Google OAuth token
   * @param {string} token - The OAuth token from Google
   */
  const processGoogleToken = useCallback(async (token) => {
    if (!token) {
      console.error('No Google token provided');
      return false;
    }
    
    try {
      // Dynamic import to ensure proper chunking with webpack
      const { default: authApi } = await import('@/api/authApi');
      
      const result = await authApi.loginWithGoogle(token);
      
      if (result?.data?.token) {
        // Debug logging to verify data
        console.log('Login successful, received token:', !!result.data.token);
        console.log('User data received:', !!result.data.user);
        
        // Ensure we're explicitly passing both parameters
        login(result.data.token, result.data.user);
        
        // Debug log to confirm cookies were set
        console.log('Cookies should be set now:', {
          token: !!document.cookie.includes('token='),
          user: !!document.cookie.includes('user=')
        });
        
        // Add a small delay to ensure cookies are properly set
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Redirect to dashboard or stored redirect path
        const redirectUrl = localStorage.getItem('redirectAfterLogin') || '/dashboard';
        router.push(redirectUrl);
        localStorage.removeItem('redirectAfterLogin');
        
        return true;
      } else {
        throw new Error('Invalid response from authentication server');
      }
    } catch (error) {
      console.error('Google authentication failed:', error);
      return false;
    }
  }, [login, router]);
  
  /**
   * Handle Google OAuth callback from redirect flow
   * @returns {Promise<boolean>} Success status
   */
  const handleGoogleCallback = useCallback(async () => {
    try {
      // Parse the hash fragment from the URL (Google returns token in hash)
      const fragment = window.location.hash.substring(1);
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      
      if (accessToken) {
        return await processGoogleToken(accessToken);
      } else {
        // Check for error
        const error = params.get('error');
        if (error) {
          console.error('Google OAuth error:', error);
          return false;
        }
      }
    } catch (error) {
      console.error('Error processing OAuth callback:', error);
      return false;
    }
    
    return false;
  }, [processGoogleToken]);
  
  /**
   * Initialize Google Sign-In
   */
  const initGoogleSignIn = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    // Calculate popup dimensions
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    // Force account selection with prompt parameter
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(window.location.origin)}&scope=email%20profile&prompt=select_account`;
    
    // Open the OAuth window
    window.open(
      authUrl,
      'googleAuth',
      `width=${width},height=${height},left=${left},top=${top},resizable,scrollbars=yes,status=1`
    );
  }, []);
  
  return {
    processGoogleToken,
    handleGoogleCallback,
    initGoogleSignIn
  };
}