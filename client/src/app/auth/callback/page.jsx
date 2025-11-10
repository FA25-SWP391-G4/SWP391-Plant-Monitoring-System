'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';
import { safeNavigate, setupChunkErrorHandler, preloadCriticalChunks } from '@/utils/safeNavigation';
import { extractUserFromJWT } from '@/utils/jwtUtils';

// Module-level log to verify file is loaded
console.log('🚀 AUTH CALLBACK MODULE LOADED');

// Setup chunk error handling
setupChunkErrorHandler();
preloadCriticalChunks();

/**
 * Auth callback handler for OAuth flows
 * This page receives the token and redirect path after successful OAuth authentication
 */
export default function AuthCallback() {
  console.log('🎯 AUTH CALLBACK COMPONENT RENDER');
  const router = useRouter();
  const { login } = useAuth();
  const [countdown, setCountdown] = useState(3);
  const [error, setError] = useState('');
  const [redirectPath, setRedirectPath] = useState('/dashboard');
  const hasProcessed = useRef(false); // Prevent double execution in Strict Mode
  
  useEffect(() => {
    // Prevent double execution in React Strict Mode (development only)
    if (hasProcessed.current) {
      console.log('[AUTH CALLBACK] Already processed, skipping duplicate call');
      return;
    }
    
    hasProcessed.current = true;
    
    const processCallback = async () => {
      try {
        console.log('=== AUTH CALLBACK START ===');
        console.log('[AUTH CALLBACK] Processing OAuth callback');
        console.log('[AUTH CALLBACK] Current URL:', window.location.href);
        console.log('[AUTH CALLBACK] Search params:', window.location.search);
        
        // Get URL parameters
        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        const redirect = params.get('redirect') || '/dashboard';
        const error = params.get('error');
        const email = params.get('email');
        
        console.log('[AUTH CALLBACK] Parsed params:', { 
          success,
          redirect, 
          error, 
          email 
        });
        
        if (error) {
          console.error('[AUTH CALLBACK] Error from backend:', error);
          
          // Handle specific error cases
          if (error === 'account_not_linked') {
            setError(`This email (${email}) is already registered with a password. Please log in with your password, or link your Google account in settings.`);
            toast.error('Account not linked to Google');
          } else if (error === 'google_id_mismatch') {
            setError('Google account mismatch. This email is linked to a different Google account.');
            toast.error('Google account mismatch');
          } else if (error === 'account_not_found') {
            setError('No account found. Please register first.');
            toast.error('Account not found');
          } else {
            setError(`Authentication error: ${error}`);
            toast.error(`Login failed: ${error}`);
          }
          return;
        }
        
        if (!success) {
          console.error('[AUTH CALLBACK] No success indicator in URL');
          setError('Invalid callback - no success indicator');
          toast.error('Login failed: Invalid callback');
          return;
        }
        
        console.log('[AUTH CALLBACK] Success callback detected, checking for auth cookies...');
        
        // The backend sets two cookies: 'token' (HttpOnly) and 'token_client' (readable by JS)
        // We'll read the token_client cookie directly
        const getCookie = (name) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop().split(';').shift();
        };
        
        const token = getCookie('token_client');
        
        console.log('[AUTH CALLBACK] Cookie check results:', {
          allCookies: document.cookie,
          tokenFound: !!token,
          tokenPreview: token ? `${token.substring(0, 20)}...` : 'missing'
        });
        
        if (!token) {
          console.error('[AUTH CALLBACK] No auth token found in cookies');
          
          // Fallback: try to retrieve from session endpoint  
          console.log('[AUTH CALLBACK] Attempting session endpoint fallback...');
          try {
            const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';
            const response = await fetch(`${backendUrl}/auth/session-auth`, {
              method: 'GET',
              credentials: 'include'
            });
            
            if (response.ok) {
              const authData = await response.json();
              if (authData.success && authData.token && authData.user) {
                console.log('[AUTH CALLBACK] Session endpoint fallback successful');
                const { token: sessionToken, user } = authData;
                
                // Use session data
                login(sessionToken, user);
                
                // Set redirect path
                let finalRedirectPath = redirect;
                if (user.role === 'Admin' || user.role === 'ADMIN') {
                  finalRedirectPath = '/admin/dashboard';
                }
                setRedirectPath(finalRedirectPath);
                toast.success('Login successful! Redirecting...');
                
                // Start countdown
                const interval = setInterval(() => {
                  setCountdown((prev) => {
                    if (prev <= 1) {
                      clearInterval(interval);
                      safeNavigate(router, finalRedirectPath).catch(() => window.location.href = finalRedirectPath);
                      return 0;
                    }
                    return prev - 1;
                  });
                }, 1000);
                
                return;
              }
            }
          } catch (sessionError) {
            console.error('[AUTH CALLBACK] Session endpoint fallback failed:', sessionError);
          }
          
          setError('Authentication token not found. Please try logging in again.');
          toast.error('Login failed: Token not found');
          return;
        }
        
        // Decode token to get user data (JWT format)
        let user;
        try {
          user = extractUserFromJWT(token);
          if (!user) {
            throw new Error('Failed to extract user data from token');
          }
          
          console.log('[AUTH CALLBACK] Token decoded successfully:', {
            user_id: user.user_id,
            email: user.email,
            role: user.role,
            given_name: user.given_name,
            family_name: user.family_name
          });
        } catch (decodeError) {
          console.error('[AUTH CALLBACK] Failed to decode token:', decodeError);
          setError('Invalid authentication token. Please try logging in again.');
          toast.error('Login failed: Invalid token');
          return;
        }
        
        // Store the token in auth context
        console.log('[AUTH CALLBACK] Storing token in auth context');
        console.log('[AUTH CALLBACK] Token to store:', token.substring(0, 50) + '...');
        console.log('[AUTH CALLBACK] User to store:', user);
        
        login(token, user);
        
        // Verify cookie was set
        const cookieCheck = document.cookie;
        console.log('[AUTH CALLBACK] Cookies after login:', cookieCheck);
        
        console.log('[AUTH CALLBACK] Token stored successfully');
        console.log('[AUTH CALLBACK] Starting redirect countdown to:', redirect);
        
        // Determine redirect path based on user role
        let finalRedirectPath = redirect;
        if (user.role === 'Admin' || user.role === 'ADMIN') {
          console.log('[AUTH CALLBACK] Admin user detected, redirecting to admin dashboard');
          finalRedirectPath = '/admin/dashboard';
        }
        
        // Store redirect path in state for the manual button
        setRedirectPath(finalRedirectPath);
        
        console.log('[AUTH CALLBACK] Final redirect path:', finalRedirectPath);
        
        // Show success toast
        toast.success('Login successful! Redirecting...');
        
        // Start countdown for automatic redirect
        const interval = setInterval(() => {
          setCountdown((prev) => {
            console.log('[AUTH CALLBACK] Countdown:', prev);
            if (prev <= 1) {
              clearInterval(interval);
              console.log('[AUTH CALLBACK] Countdown complete, redirecting to:', finalRedirectPath);
              
              // Use safe navigation to handle potential chunk loading errors
              safeNavigate(router, finalRedirectPath, {
                maxRetries: 3,
                retryDelay: 1000
              }).catch((navError) => {
                console.error('[AUTH CALLBACK] Safe navigation failed:', navError);
                // Fallback to hard navigation
                window.location.href = finalRedirectPath;
              });
              
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        console.log('[AUTH CALLBACK] Countdown timer started');
        
        return () => {
          console.log('[AUTH CALLBACK] Cleanup: clearing countdown interval');
          clearInterval(interval);
        };
      } catch (error) {
        console.error('=== AUTH CALLBACK ERROR ===');
        console.error('[AUTH CALLBACK] Error processing auth callback:', error);
        console.error('[AUTH CALLBACK] Error stack:', error.stack);
        console.error('[AUTH CALLBACK] Error name:', error.name);
        console.error('[AUTH CALLBACK] Error message:', error.message);
        setError('Failed to process authentication response');
        toast.error('Login failed. Please try again.');
      } finally {
        console.log('=== AUTH CALLBACK END ===');
      }
    };
    
    console.log('[AUTH CALLBACK] Component mounted, calling processCallback');
    processCallback();
  }, [login, router]);
  
  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {error ? 'Authentication Failed' : 'Login Successful'}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {error ? (
            <div className="text-center space-y-4">
              <p className="text-destructive">{error}</p>
              <Button 
                onClick={() => safeNavigate(router, '/login').catch(() => window.location.href = '/login')} 
                className="w-full"
              >
                Return to Login
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p>Login successful! Redirecting you in {countdown} seconds...</p>
              </div>
              
              <Button 
                onClick={() => safeNavigate(router, redirectPath).catch(() => window.location.href = redirectPath)} 
                className="w-full"
              >
                Continue to {redirectPath.includes('admin') ? 'Admin Dashboard' : 'Dashboard'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}