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