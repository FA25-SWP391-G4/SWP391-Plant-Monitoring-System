import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import axiosClient from '@/api/axiosClient';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

// API URL for redirect purposes
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * LoginForm component
 * Based on the PlantSmart design system
 */
function LoginForm() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    form: ''
  });
  // New state for debugging information
  const [debugInfo, setDebugInfo] = useState({
    visible: false,
    requestData: null,
    responseData: null,
    error: null
  });

  const { login } = useAuth();
  const router = useRouter();

  // Toggle debug info visibility
  const toggleDebugInfo = () => {
    setDebugInfo(prev => ({ ...prev, visible: !prev.visible }));
  };

  // Check connection to backend server
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log(`[DEBUG] Testing connection to backend: ${API_URL}`);
        // Use axiosClient to respect baseURL and CORS config
        const response = await axiosClient.get('/health');

        if (response.status === 200) {
          const data = response.data;
          console.log(`[DEBUG] Backend server is reachable. Status: ${data.status}`);
        } else {
          console.warn(`[DEBUG] Backend server returned status: ${response.status}`);
        }
      } catch (error) {
        console.error(`[DEBUG] Backend connection test failed:`, error);
      }
    };

    checkConnection();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({
      email: '',
      password: '',
      form: ''
    });
    
    // Reset debug info
    setDebugInfo(prev => ({
      ...prev,
      requestData: null,
      responseData: null,
      error: null
    }));

    // Validate form inputs
    let hasErrors = false;
    const newErrors = {
      email: '',
      password: '',
      form: ''
    };
    
    // Check email
    if (!formData.email.trim()) {
      newErrors.email = t('validation.emailRequired', 'Email is required');
      hasErrors = true;
    } else if (!/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(formData.email.trim())) {
      newErrors.email = t('validation.invalidEmail', 'Please enter a valid email address');
      hasErrors = true;
    }
    
    // Check password
    if (!formData.password) {
      newErrors.password = t('validation.passwordRequired', 'Password is required');
      hasErrors = true;
    }
    
    // If there are validation errors, don't proceed
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);

    try {
      console.log('[DEBUG] Attempting login with:', formData.email);

      // Create request data for debugging
      const requestData = {
        url: `${API_URL}/auth/login`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: {
          email: formData.email.trim(),
          password: '[MASKED]', // Don't log actual password
          rememberMe: formData.rememberMe
        }
      };

      // Store request data for debugging
      setDebugInfo(prev => ({ ...prev, requestData }));

      console.log('[DEBUG] Login request data:', requestData);

      // Make a real API call to the backend using axiosClient
      const response = await axiosClient.post(`/auth/login`, {
        email: formData.email.trim(),
        password: formData.password,
        rememberMe: formData.rememberMe
      });
      
      console.log('[DEBUG] Login successful:', response.data);

      // Store response data for debugging (without sensitive info)
      setDebugInfo(prev => ({ ...prev, responseData: {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      }}));

      // Extract token and user data from response
      const { token, user } = response.data.data;
      
      // Add debugging for user data
      console.log('[DEBUG] User data from auth response:', JSON.stringify(user));

      // Store authentication data in context/local storage
      login(token, user);

      // Redirect to dashboard after successful login
      const redirectUrl = localStorage.getItem('redirectAfterLogin') || '/dashboard';
      router.push(redirectUrl);
      
      // Clean up localStorage
      localStorage.removeItem('redirectAfterLogin');
    } catch (error) {
      console.error('[DEBUG] Login error:', error);

      // Store error data for debugging
      setDebugInfo(prev => ({ ...prev, error: {
        name: error.name,
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        stack: error.stack
      }}));

      // Handle specific error cases
      if (error.response) {
        // The request was made and the server responded with error
        console.error('[DEBUG] Server response error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });

        if (error.response.status === 401) {
          setErrors({...errors, form: t('errors.invalidCredentials', 'Invalid email or password')});
          console.warn('[DEBUG] Authentication failed: Invalid credentials');
        } else if (error.response.status === 429) {
          setErrors({...errors, form: t('errors.tooManyAttempts', 'Too many login attempts. Please try again later.')});
        } else if (error.response.status === 423) {
          setErrors({...errors, form: t('errors.accountLocked', 'Your account has been temporarily locked. Please contact support.')});
        } else if (error.response.data && error.response.data.message) {
          setErrors({...errors, form: error.response.data.message});
        } else {
          setErrors({...errors, form: t('errors.loginFailed', 'Login failed. Please try again.')});
        }
      } else if (error.request) {
        // The request was made but no response received
        console.error('[DEBUG] Network error - no response received:', error.request);
        setErrors({...errors, form: t('errors.networkError', 'Network error. Please check your connection.')});
      } else {
        // Something else happened
        console.error('[DEBUG] Login error (other):', error.message);
        setErrors({...errors, form: t('errors.genericError', 'An error occurred. Please try again later.')});
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Clear the error for this field when user makes changes
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
        form: '' // Also clear any general form errors
      });
    }
    
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Google Sign-In handled via custom hook
  const googleAuth = useGoogleAuth();
  const initGoogleSignIn = googleAuth.initGoogleSignIn;

  // Google login handler - Updated to use our custom hook
  const handleGoogleLogin = () => {
    try {
      setIsGoogleLoading(true);
      
      // Use our custom hook to initialize Google Sign In
      initGoogleSignIn();
      
      // Set a timeout to reset the button state if no callback happens
      setTimeout(() => {
        setIsGoogleLoading(false);
      }, 30000); // 30 seconds timeout
    } catch (error) {
      console.error('Error triggering Google Sign-In:', error);
      setErrors({
        ...errors,
        form: t('errors.googleLoginFailed', 'Failed to initialize Google login. Please try again.')
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <>
      <section aria-labelledby="signin-heading" className="bg-white rounded-2xl shadow-xl border border-emerald-100/70 p-6 sm:p-8">
        <h2 id="signin-heading" className="text-xl font-semibold text-gray-900 mb-6">
          {t('auth.loginTitle', 'Sign in to your account')}
        </h2>
      
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {t('common.email', 'Email address')}
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail h-5 w-5 text-gray-400" aria-hidden="true">
                <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
              </svg>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="email"
              required
              aria-invalid={errors.email ? "true" : "false"}
              placeholder="you@greenspace.com"
              className={`w-full rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-200'} pl-10 pr-3 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors`}
            />
          </div>
          {/* Display field-level errors */}
          {errors.email && (
            <p className="text-sm text-red-600 mt-1">{errors.email}</p>
          )}
        </div>
        
        
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              {t('common.password', 'Password')}
            </label>
            <Link href="/forgot-password" className="text-sm text-emerald-700 hover:text-emerald-800 font-medium">
              {t('auth.forgotPassword', 'Forgot password?')}
            </Link>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock h-5 w-5 text-gray-400" aria-hidden="true">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              autoComplete="current-password"
              required
              aria-invalid={errors.password ? "true" : "false"}
              placeholder="••••••••"
              className={`w-full rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-200'} pl-10 pr-3 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors`}
            />
          </div>
          {errors.password && (
            <p className="text-sm text-red-600 mt-1">{errors.password}</p>
          )}
          
        </div>
        
        <div className="flex items-center justify-between">
          <label htmlFor="remember" className="inline-flex items-center select-none cursor-pointer">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
            />
            <span className="ml-2 text-sm text-gray-700">
              {t('auth.rememberMe', 'Remember me')}
            </span>
          </label>
          <Link href="/register" className="text-sm text-emerald-700 hover:text-emerald-800 font-medium">
            {t('auth.createAccount', 'Create account')}
          </Link>
        </div>
        
          {/* Display form-level errors */}
          {errors.form && (
            <div className="rounded-md bg-red-50 p-3 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{errors.form}</h3>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-md"
          >
            {isLoading ? t('common.loading', 'Loading...') : t('auth.login', 'Sign In')}
          </button>        <div className="flex items-center my-4">
          <div className="flex-1 h-px bg-gray-200" aria-hidden="true"></div>
          <span className="px-3 text-xs uppercase tracking-wider text-gray-500">
            {t('common.or', 'or')}
          </span>
          <div className="flex-1 h-px bg-gray-200" aria-hidden="true"></div>
        </div>
        
        <div className="items-center justify-between">
          {/* Google Sign-In Button */}
          <div className="w-full flex justify-center">
            {/* Custom button for Google sign-in using popup flow */}
            <button 
              type="button" 
              className="w-full inline-flex items-center justify-center gap-2 border border-gray-200 hover:border-emerald-300 text-gray-700 hover:text-emerald-800 rounded-lg py-2.5 transition-colors bg-white"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || !clientId}
              title={!clientId ? 'Google Sign-In is not configured' : undefined}
              id="custom-google-btn"
            >
              <span className="sr-only">Continue with Google</span>
              <span className="text-sm font-medium">
                {isGoogleLoading ? t('common.loading', 'Loading...') : t('auth.continueWithGoogle', 'Google')}
              </span>
            </button>
            
            {/* Google's rendered button (hidden at first, shows when API loads) */}
            <div className="g-signin2" data-onsuccess="onSignIn" style={{display: 'none'}} id="google-signin-button"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Link href="/register" className="w-full px-4 py-3 border-2 border-emerald-600 text-emerald-700 rounded-lg font-semibold hover:bg-emerald-50 transition-colors text-center">
            {t('auth.createAccount', 'Create Account')}
          </Link>
          <Link href="/" className="w-full px-4 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors text-center">
            {t('common.backToSite', 'Back to Site')}
          </Link>
        </div>
        
        <p className="text-center text-xs text-gray-500 mt-2">
          {t('auth.termsNotice', 'By continuing, you agree to our Terms of Service and Privacy Policy.')}
        </p>
      </form>
    </section>
    </>
  );
}

export default LoginForm;
