// useGoogleAuth.js - Enhanced custom hook for Google authentication
import { useCallback, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { lazyRetry } from '@/utils/lazyRetry';
/**
 * Custom hook for handling Google OAuth authentication with improved security
 * 
 * @returns {Object} Methods and state for Google authentication
 */
export function useGoogleAuth() {
  const router = useRouter();
  const { login } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
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
      setIsAuthenticating(true);
      
      // Dynamic import with retry logic to handle chunk loading errors
      const { default: authApi } = await lazyRetry(() => import('@/api/authApi'));
      
      const result = await authApi.loginWithGoogle(token);
      
      // Check if this is a new user that needs to complete registration
      if (result?.data?.isNewUser && result?.data?.data) {
        console.log('New Google user, redirecting to registration with prefilled data');
        
        // Store the Google profile data for the registration page
        localStorage.setItem('googleProfileData', JSON.stringify(result.data.data));
        
        // Redirect to the registration page
        router.push('/register?source=google');
        return true;
      }
      // Existing user flow
      else if (result?.data?.token) {
        login(result.data.token, result.data.user);
        
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
      toast.error('Google sign-in failed. Please try again.');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
  }, [login, router]);
  
  /**
   * Initiate server-side Google authentication with CSRF protection
   * Uses the backend's enhanced OAuth flow with state parameter
   */
  const initiateServerSideAuth = useCallback(() => {
    // Save current path for redirect after login if needed
    if (window.location.pathname !== '/login' && 
        window.location.pathname !== '/register') {
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
    }
    
    // Get the backend endpoint that starts the OAuth flow
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    // Use the updated Google OAuth flow endpoint that matches Google's expected redirect_uri
    const authUrl = `${apiUrl}/auth/google/login`;
    
    // Redirect to backend which will handle the OAuth flow
    window.location.href = authUrl;
  }, []);

  /**
   * Handle Google OAuth callback from client-side flow
   * Used for the popup flow method
   * @returns {Promise<boolean>} Success status
   */
  const handleGoogleCallback = useCallback(async () => {
    try {
      setIsAuthenticating(true);
      
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
          toast.error(`Sign-in error: ${error}`);
          return false;
        }
      }
    } catch (error) {
      console.error('Error processing OAuth callback:', error);
      toast.error('Failed to complete sign-in process');
      return false;
    } finally {
      setIsAuthenticating(false);
    }
    
    return false;
  }, [processGoogleToken]);
  
  /**
   * Initialize Google Sign-In popup
   * Client-side flow using a popup window
   */
  const initGoogleSignIn = useCallback(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('Google Client ID not configured');
      toast.error('Google sign-in is not properly configured');
      return;
    }
    
    // Calculate popup dimensions
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    // Store current path for redirect after login if needed
    if (window.location.pathname !== '/login' && 
        window.location.pathname !== '/register') {
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
    }
    
    // Force account selection with prompt parameter
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(window.location.origin)}&scope=email%20profile&prompt=select_account`;
    
    // Open the OAuth window
    try {
      window.open(
        authUrl,
        'googleAuth',
        `width=${width},height=${height},left=${left},top=${top},resizable,scrollbars=yes,status=1`
      );
    } catch (error) {
      console.error('Failed to open popup:', error);
      toast.error('Failed to open sign-in window. Please check your popup blocker settings.');
    }
  }, []);
  
  return {
    processGoogleToken,
    handleGoogleCallback,
    initGoogleSignIn,
    initiateServerSideAuth,
    isAuthenticating
  };
}