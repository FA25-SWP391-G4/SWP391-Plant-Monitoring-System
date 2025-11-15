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

  useEffect(() => {
  console.log('[auth] current user:', user);
}, [user]);

  useEffect(() => {
    console.log('[AUTH PROVIDER] Initializing auth state...');
    console.log('[AUTH PROVIDER] All cookies:', document.cookie);
    
    // Check for both possible token cookie names
    const tokenFromStandard = Cookies.get('token');
    const tokenFromClient = Cookies.get('token_client');
    const token = tokenFromClient || tokenFromStandard;
    
    const userFromCookie = Cookies.get('user');
    
    console.log('[AUTH PROVIDER] Cookie check results:', {
      standardToken: !!tokenFromStandard,
      clientToken: !!tokenFromClient,
      selectedToken: !!token,
      user: !!userFromCookie
    });
    
    if (token && userFromCookie) { 
      console.log('[AUTH PROVIDER] ✅ Found valid auth cookies, restoring session');
      setToken(token); 
      try { 
        const parsedUser = JSON.parse(userFromCookie);
        console.log('[AUTH PROVIDER] Parsed user:', parsedUser);
        setUser(parsedUser); 
      } catch (e) {
        console.error('[AUTH PROVIDER] Failed to parse user data from cookie:', e);
      } 
    } else {
      console.log('[AUTH PROVIDER] ❌ No valid auth cookies found');
    }
    setLoading(false);
  }, []);

  const login = (t, u) => {
    console.log('[AUTH PROVIDER] Login called with:', {
      token: t ? `${t.substring(0, 20)}...` : 'missing',
      user: u
    });
    
    // Set cookies with appropriate security settings
    const cookieOptions = {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: 7 // 7 days
    };
    
    console.log('[AUTH PROVIDER] Setting cookies with options:', cookieOptions);
    
    // Set both token names for compatibility
    Cookies.set('token', t, cookieOptions);
    Cookies.set('token_client', t, cookieOptions);
    Cookies.set('user', JSON.stringify(u), cookieOptions);
    
    console.log('[AUTH PROVIDER] ✅ Cookies set successfully');
    console.log('[AUTH PROVIDER] Final cookie state:', document.cookie);
    
    setToken(t); 
    setUser(u); 
    
    console.log('[AUTH PROVIDER] Login completed - state updated');
  };

  const logout = async () => { 
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
        router.push('/login');
      }, 100); // Small delay to let cleanup finish, similar to Google auth pattern
    }
  };

  const value = useMemo(() => ({ user, token, login, logout, loading }), [user, token, loading, logout]);
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}