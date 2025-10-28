import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import axiosClient from '@/api/axiosClient';
import Head from 'next/head';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import GoogleLoginButton from '@/components/GoogleLoginButton';
import { toast } from 'sonner';

// API URL for redirect purposes
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/**
 * LoginForm component
 * Based on the PlantSmart design system
 */
export function LoginForm() {
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
    form: '',
    oauth: '' // OAuth error from URL parameters
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
  const searchParams = useSearchParams();

  // Toggle debug info visibility
  const toggleDebugInfo = () => {
    setDebugInfo(prev => ({ ...prev, visible: !prev.visible }));
  };

  // Handle OAuth errors from URL parameters
  useEffect(() => {
    const error = searchParams.get('error');
    const email = searchParams.get('email');
    
    if (error) {
      console.log('[LOGIN FORM] OAuth error detected:', error);
      
      if (error === 'account_not_linked') {
        const message = `This email (${email}) is already registered with a password. Please log in with your password, or link your Google account in settings.`;
        setErrors(prev => ({ ...prev, oauth: message }));
        toast.error('Account not linked to Google');
      } else if (error === 'google_id_mismatch') {
        const message = 'Google account mismatch. This email is linked to a different Google account.';
        setErrors(prev => ({ ...prev, oauth: message }));
        toast.error('Google account mismatch');
      } else if (error === 'account_not_found') {
        const message = 'No account found with this Google email. Please register first.';
        setErrors(prev => ({ ...prev, oauth: message }));
        toast.error('Account not found');
        
        // Optionally redirect to register page
        setTimeout(() => {
          router.push(`/register?email=${encodeURIComponent(email || '')}&google=true`);
        }, 2000);
      } else {
        const message = `Authentication error: ${error}`;
        setErrors(prev => ({ ...prev, oauth: message }));
        toast.error(`Login failed: ${error}`);
      }
    }
  }, [searchParams, router]);

  // Check connection to backend server
  useEffect(() => {
    const checkConnection = async () => {
      try {
        console.log(`[DEBUG] Testing connection to backend: ${API_URL}`);
        const response = await fetch(`${API_URL}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();
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
    
    // Clear previous errors (including OAuth errors)
    setErrors({
      email: '',
      password: '',
      form: '',
      oauth: ''
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
      form: '',
      oauth: '' // Keep oauth cleared during validation
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
  
  // Initialize Google Auth API with the modern Google Identity Services
  useEffect(() => {
    // Check if Google Identity Services script is loaded
    const checkGoogleScriptLoaded = () => {
      // Script is now loaded via GoogleHeadTags component
      if (window.google) {
        initializeGoogleButton();
        return true;
      }
      return false;
    };

    // Initialize the Google Sign In button
    const initializeGoogleButton = () => {
      console.log('Google Identity Services script loaded, initializing button');

      // Make sure the Google object is available
      if (window.google) {
        try {
          // Define the client ID and make sure it's properly loaded          
          if (!clientId) {
            console.error('[GOOGLE AUTH] Client ID is not defined. Please check your environment variables.');
            setErrors({...errors, form: t('errors.googleSignInFailed', 'Failed to show Google sign-in due to missing client ID.')});
            return;
          }
          
          // Initialize Google accounts with explicit popup mode and FedCM support
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false, // Changed to false to always prompt for account selection
            cancel_on_tap_outside: true,
            use_fedcm_for_prompt: true, // Explicitly opt-in to FedCM
            fedcm_provider_url: "https://accounts.google.com", // Specify the provider URL for FedCM
            context: "signin", // Use signin context for login
            itp_support: true, // Add support for Intelligent Tracking Prevention
            prompt_parent_id: "google-signin-wrapper", // Add this to specify where the prompt should appear
            select_by_default: false // Ensure account selection is always shown
          });

          console.log('[GOOGLE AUTH] Google One Tap initialized with FedCM support');

          // Use a custom button that triggers the Google popup manually
          const googleButton = document.getElementById('custom-google-btn');
          if (googleButton) {
            googleButton.onclick = (e) => {
              e.preventDefault();
              console.log('[GOOGLE AUTH] Custom button clicked, showing sign-in');
              setIsGoogleLoading(true);

              // This will trigger the sign-in flow with FedCM
              window.google.accounts.id.prompt((notification) => {
                // FedCM-compatible handling of notification moments
                if (notification.getMomentType() === "skipped") {
                  // Skipped moment (user has not engaged with the prompt or it couldn't be shown)
                  console.log('[GOOGLE AUTH] Sign-in prompt was skipped:', notification.getSkippedReason());
                  setIsGoogleLoading(false);

                  // Handle specific skipped reasons
                  const skippedReason = notification.getSkippedReason();
                  if (skippedReason === "browser_not_supported" ||
                      skippedReason === "third_party_cookies_blocked" ||
                      skippedReason === "browser_not_supported") {
                    setErrors({
                      ...errors,
                      form: t('errors.googleSignInBlocked', 'Google sign-in is not available. This might be due to browser settings or cookie restrictions.')
                    });
                  } else {
                    setErrors({
                      ...errors,
                      form: t('errors.googleSignInFailed', 'Failed to show Google sign-in. Please try again or use email login.')
                    });
                  }
                } else if (notification.getMomentType() === "dismissed") {
                  // Dismissed moment (user actively dismissed the prompt)
                  console.log('[GOOGLE AUTH] User dismissed the sign-in prompt');
                  setIsGoogleLoading(false);
                } else if (notification.getMomentType() === "display") {
                  // Successfully displayed to user
                  console.log('[GOOGLE AUTH] Sign-in prompt displayed to user');
                } else {
                  // Unknown moment type
                  console.log('[GOOGLE AUTH] Unknown prompt moment type:', notification.getMomentType());
                  setIsGoogleLoading(false);
                }
              });
            };
          }

          // Also set up the hidden Google button as fallback
          const hiddenGoogleButton = document.getElementById('google-signin-button');
          if (hiddenGoogleButton) {
            window.google.accounts.id.renderButton(
              hiddenGoogleButton,
              {
                type: 'standard',
                theme: 'outline',
                size: 'large',
                shape: 'rectangular',
                text: 'signin_with',
                logo_alignment: 'center',
                width: '100%'
              }
            );
            // Hide this button as we're using our custom one
            hiddenGoogleButton.style.display = 'none';
          } else {
            console.error('[GOOGLE AUTH] Hidden Google button element not found');
          }
        } catch (error) {
          console.error('[GOOGLE AUTH] Error initializing Google Sign-In:', error);
        }
      }
    };

    // Function to handle the credential response
    const handleCredentialResponse = async (response) => {
      console.log('[GOOGLE AUTH] Google Sign-In response received');

      try {
        setIsGoogleLoading(true);

        if (response.credential) {
          console.log('[GOOGLE AUTH] Google credential token received, redirecting to backend OAuth flow');
          
          // Instead of calling the login API, redirect to backend Google OAuth endpoint
          // The backend will handle the full OAuth flow
          // Store redirect URL before redirecting
          const redirectUrl = localStorage.getItem('redirectAfterLogin') || '/dashboard';
          localStorage.setItem('googleOAuthRedirect', redirectUrl);
          
          // Redirect to backend Google OAuth endpoint
          // The backend will verify the token, create/login user, and redirect back
          window.location.href = `${API_URL}/auth/google/login`;
        }
      } catch (error) {
        console.error('[GOOGLE AUTH] Google authentication error:', error);
        setErrors({
          ...errors,
          form: t('errors.googleLoginFailed', 'Failed to authenticate with Google. Please try again.')
        });
      } finally {
        setIsGoogleLoading(false);
      }
    };

    // Check if Google script is loaded
    if (!checkGoogleScriptLoaded()) {
      // If not loaded yet, set up an interval to check
      const intervalId = setInterval(() => {
        if (checkGoogleScriptLoaded()) {
          clearInterval(intervalId);
        }
      }, 100);
      
      // Clear interval after 5 seconds as a fallback
      setTimeout(() => clearInterval(intervalId), 5000);
    }

    // Cleanup function
    return () => {
      // No explicit cleanup needed for Google Identity Services
    };
  }, [login, router, t, errors]);

  // Use our custom Google auth hook
  const { initGoogleSignIn } = useGoogleAuth();

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

  // Handle Google credentials after successful popup authentication
  // Google credential handling is now done in the useGoogleAuth hook


  return (
    <>
      <Head>
        <meta name="google-signin-client_id" content={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID} />
      </Head>
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
        
          {/* Display OAuth errors from URL parameters */}
          {errors.oauth && (
            <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-red-600 mt-0.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-semibold text-red-900 mb-1">Authentication Error</h4>
                  <p className="text-sm text-red-800">{errors.oauth}</p>
                </div>
              </div>
            </div>
          )}
        
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
            <GoogleLoginButton 
              flowType="redirect" 
              variant="outline"
              className="bg-white"
            />
            
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
