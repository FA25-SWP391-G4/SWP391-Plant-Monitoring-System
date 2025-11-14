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
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = { 
      secure: isProduction, 
      sameSite: 'strict',
      expires: 7 // 7 days
    };
    
    Cookies.set('token', t, cookieOptions); 
    Cookies.set('user', JSON.stringify(u), cookieOptions); 
    setToken(t); 
    setUser(u); 
  };

  const logout = () => { 
    Cookies.remove('token'); 
    Cookies.remove('user'); 
    setToken(null); 
    setUser(null); 
    router.push('/login');
  };

  const value = useMemo(() => ({ user, token, login, logout, loading }), [user, token, loading, logout]);
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}