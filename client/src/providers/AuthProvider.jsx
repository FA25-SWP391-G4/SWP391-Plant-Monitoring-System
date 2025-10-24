'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

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

  // Check if the user is authenticated on mount and after navigation
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get token from cookies
        const cookieToken = Cookies.get('token');
        
        if (!cookieToken) {
          setToken(null);
          setUser(null);
          setLoading(false);
          return;
        }
        
        // Try to fetch the user profile using the token from cookies in the Authorization header
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/me`, {
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${cookieToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setToken(cookieToken); // Store token for future requests
          setUser(data.user);
        } else {
          // Clear state and cookie if unauthorized
          setToken(null);
          setUser(null);
          Cookies.remove('token');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // Clear token and user on error
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  const login = (t, u) => { 
    // Store token in cookie for later use in API requests
    Cookies.set('token', t, { 
      expires: 1, // 1 day
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax'
    });
    
    // Update local state
    setToken(t); 
    setUser(u); 
  };

  const logout = async () => { 
    try {
      const cookieToken = Cookies.get('token');
      
      // Call logout endpoint to clear HTTP-only cookie on server
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: cookieToken ? {
          'Authorization': `Bearer ${cookieToken}`
        } : {}
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state and cookie regardless of server response
      Cookies.remove('token');
      setToken(null); 
      setUser(null); 
      router.push('/login');
    }
  };

  const value = useMemo(() => ({ user, token, login, logout, loading }), [user, token, loading, logout]);
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}