import Cookies from 'js-cookie';

export const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    // Try cookies first
    let token = Cookies.get('token');
    
    // Fallback to localStorage
    if (!token) {
      token = localStorage.getItem('auth_token');
    }
    
    // Return token or null (not "null" string)
    return token || null;
  }
  return null;
};