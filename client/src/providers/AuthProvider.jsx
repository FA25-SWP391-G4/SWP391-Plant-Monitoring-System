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
    const t = Cookies.get('token');
    const u = Cookies.get('user');
    if (t && u) { 
      setToken(t); 
      try { 
        setUser(JSON.parse(u)); 
      } catch (e) {
        console.error('Failed to parse user data from cookie:', e);
      } 
    }
    setLoading(false);
  }, []);

  const login = (t, u) => { 
    // Set cookies with appropriate security settings
    // Cookies.set('token', t, { secure: true, sameSite: 'strict' }); 
    // Cookies.set('user', JSON.stringify(u), { secure: true, sameSite: 'strict' }); 

    Cookies.set('token', t, {secure : true, sameSite: 'lax' });
    Cookies.set('user', JSON.stringify(u), {secure : true, sameSite: 'lax' });
    setToken(t); 
    setUser(u); 
    
    console.log('[AUTH PROVIDER] Login completed - state updated');
    endTiming('login-process');
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