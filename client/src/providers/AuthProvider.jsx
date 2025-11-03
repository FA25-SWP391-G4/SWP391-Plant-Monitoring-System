'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useRenderDebug, useOperationTiming } from '@/utils/renderDebug';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // 🚀 RENDER DEBUG - Track AuthProvider performance
  const renderDebug = useRenderDebug('AuthProvider', {
    hasUser: !!user,
    hasToken: !!token,
    loading,
    userEmail: user?.email
  });
  
  const { startTiming, endTiming } = useOperationTiming('AuthProvider');

  // Check if the user is authenticated on mount and after navigation
  useEffect(() => {
    const checkAuth = async () => {
      const authCheckStart = startTiming('auth-check');
      console.log('\n=== AUTH PROVIDER CHECK START ===');
      console.log('[AUTH PROVIDER] Checking authentication status...');
      
      try {
        console.log('[AUTH PROVIDER] Making request to /auth/me...');
        
        // Get token from client-readable cookies (declare at function scope)
        const cookieToken = Cookies.get('token_client') || Cookies.get('token');
        
        // First, try using httpOnly cookies (most secure approach)
        // The backend middleware will check cookies automatically with credentials: 'include'
        let response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/me`, {
          credentials: 'include', // This sends httpOnly cookies automatically
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('[AUTH PROVIDER] Auth check response (httpOnly cookies):', {
          status: response.status,
          statusText: response.statusText
        });

        // If httpOnly cookie auth fails, try with Authorization header from client cookies
        if (!response.ok) {
          console.log('[AUTH PROVIDER] HttpOnly cookie auth failed, trying client cookies...');
          
          // Debug cookie situation
          console.log('[AUTH PROVIDER] Cookie debugging:');
          console.log('  - document.cookie raw:', document.cookie);
          console.log('  - All js-cookie cookies:', Cookies.get());
          
          console.log('[AUTH PROVIDER] Token from cookies (token_client):', Cookies.get('token_client') ? `${Cookies.get('token_client').substring(0, 20)}...` : 'MISSING');
          console.log('[AUTH PROVIDER] Token from cookies (token):', Cookies.get('token') ? `${Cookies.get('token').substring(0, 20)}...` : 'MISSING');
          console.log('[AUTH PROVIDER] Final token used:', cookieToken ? `${cookieToken.substring(0, 20)}...` : 'MISSING');
          
          if (cookieToken) {
            console.log('[AUTH PROVIDER] Trying with Authorization header...');
            response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/me`, {
              credentials: 'include',
              headers: {
                'Authorization': `Bearer ${cookieToken}`,
                'Content-Type': 'application/json'
              }
            });
            
            console.log('[AUTH PROVIDER] Auth check response (Authorization header):', {
              status: response.status,
              statusText: response.statusText
            });
          }
        }

        // Final check - if still not authenticated, user is not logged in
        if (response.ok) {
          const data = await response.json();
          console.log('[AUTH PROVIDER] ✅ Authentication successful');
          console.log('[AUTH PROVIDER] User data received:', data.user);
          
          // Store the token that was successfully used for authentication
          const successfulToken = cookieToken || null; // Use cookieToken if it exists
          setToken(successfulToken);
          setUser(data.user);
        } else {
          console.log('[AUTH PROVIDER] ❌ All authentication methods failed:', response.status, response.statusText);
          
          const errorData = await response.json().catch(() => ({}));
          console.log('[AUTH PROVIDER] Error response:', errorData);
          
          // Clear state and cookies if authentication failed
          setToken(null);
          setUser(null);
          Cookies.remove('token_client');
          Cookies.remove('token');
          
          if (response.status === 401) {
            console.log('[AUTH PROVIDER] Token expired or invalid, clearing auth state');
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // Clear token and user on error
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
        endTiming('auth-check');
      }
    };
    
    checkAuth();
  }, [startTiming, endTiming]);

  const login = (t, u) => { 
    const loginStart = startTiming('login-process');
    console.log('[AUTH PROVIDER] Login called with:');
    console.log('  - Token length:', t?.length || 0);
    console.log('  - User:', u?.email || 'no email');
    
    // Store token in cookie for later use in API requests
    const cookieOptions = {
      expires: 7, // 7 days to match backend
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/', // Ensure path matches
      domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost' // Explicit domain for localhost
    };
    
    console.log('[AUTH PROVIDER] Setting cookie with options:', cookieOptions);
    Cookies.set('token_client', t, cookieOptions);
    
    // Verify cookie was set
    const verifyToken = Cookies.get('token_client');
    console.log('[AUTH PROVIDER] Cookie verification:', verifyToken ? 'SUCCESS' : 'FAILED');
    if (verifyToken) {
      console.log('[AUTH PROVIDER] Stored token preview:', verifyToken.substring(0, 20) + '...');
    }
    
    // Update local state
    setToken(t); 
    setUser(u); 
    
    console.log('[AUTH PROVIDER] Login completed - state updated');
    endTiming('login-process');
  };

  const logout = async () => { 
    const logoutStart = startTiming('logout-process');
    console.log('[AUTH PROVIDER] Logout initiated');
    
    try {
      const cookieToken = Cookies.get('token_client') || Cookies.get('token');
      console.log('[AUTH PROVIDER] Calling logout endpoint...');
      
      // Call logout endpoint to clear HTTP-only cookie on server
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: cookieToken ? {
          'Authorization': `Bearer ${cookieToken}`,
          'Content-Type': 'application/json'
        } : {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('[AUTH PROVIDER] Logout response:', response.status);
    } catch (error) {
      console.error('[AUTH PROVIDER] Logout error:', error);
    } finally {
      console.log('[AUTH PROVIDER] Clearing local state and preparing redirect...');
      
      // Clear local state and both cookies regardless of server response
      Cookies.remove('token_client');
      Cookies.remove('token');
      
      // Also clear any other potential auth-related cookies
      Cookies.remove('token_httpOnly');
      
      // Clear local storage items that might contain auth data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('plantsmart_user');
        localStorage.removeItem('sg_user'); // Legacy storage key
        sessionStorage.removeItem('plantsmart_user');
      }
      
      setToken(null); 
      setUser(null); 
      
      console.log('[AUTH PROVIDER] State cleared, adding redirect delay (similar to Google auth fix)...');
      
      // Add a small delay before redirect to ensure all cleanup completes
      // This follows the same pattern as the Google auth callback fix
      setTimeout(() => {
        console.log('[AUTH PROVIDER] Executing delayed redirect to login page...');
        endTiming('logout-process');
        router.push('/login');
      }, 100); // Small delay to let cleanup finish, similar to Google auth pattern
    }
  };

  const value = useMemo(() => ({ user, token, login, logout, loading }), [user, token, loading, logout]);
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}