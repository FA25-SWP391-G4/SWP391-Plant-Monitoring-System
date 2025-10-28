import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import PhoneInput from '@/components/PhoneInput';
import axios from 'axios';

/**
 * RegisterForm component
 * Based on the PlantSmart design system
 */
export function RegisterForm() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    countryCode: "+84",
    password: "",
    confirmPassword: "",
    newsletter: false,
    terms: false,
  });
  
  const [errors, setErrors] = useState({});
  const [registerStatus, setRegisterStatus] = useState(""); // Add status state
  const [debugInfo, setDebugInfo] = useState(null); // Add debug info state
  const statusRef = useRef(null); // Add ref for scrolling to status

  // Scroll to status message when it changes
  useEffect(() => {
    if (registerStatus && statusRef.current) {
      statusRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [registerStatus]);
  
  // Check for Google profile data on mount
  useEffect(() => {
    // First check URL parameters for Google profile data
    const params = new URLSearchParams(window.location.search);
    const source = params.get('source');
    const encodedData = params.get('data');
    
    if (source === 'google' && encodedData) {
      try {
        // Decode the base64 encoded data from URL (using atob for browser compatibility)
        const decodedData = atob(encodedData);
        const profileData = JSON.parse(decodedData);
        console.log('Found Google profile data from URL:', profileData);
        
        // Pre-fill the form with Google data
        setFormData(prevData => ({
          ...prevData,
          firstName: profileData.given_name || '',
          lastName: profileData.family_name || '',
          email: profileData.email || '',
          // Don't pre-fill password fields for security reasons
          googleId: profileData.google_id || '',
          profilePicture: profileData.profile_picture || '',
          // Automatically check the terms for Google registration
          terms: true
        }));
        
        // Store in localStorage temporarily in case page is refreshed
        localStorage.setItem('googleProfileData', JSON.stringify(profileData));
        
        // Clear URL parameters to clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Error parsing Google profile data from URL:', error);
      }
    } else {
      // Fallback to localStorage (in case of page refresh)
      const googleProfileData = localStorage.getItem('googleProfileData');
      
      if (googleProfileData) {
        try {
          const profileData = JSON.parse(googleProfileData);
          console.log('Found Google profile data from localStorage:', profileData);
          
          // Pre-fill the form with Google data
          setFormData(prevData => ({
            ...prevData,
            firstName: profileData.given_name || '',
            lastName: profileData.family_name || '',
            email: profileData.email || '',
            // Don't pre-fill password fields for security reasons
            googleId: profileData.google_id || '',
            profilePicture: profileData.profile_picture || '',
            // Automatically check the terms for Google registration
            terms: true
          }));
        } catch (error) {
          console.error('Error parsing Google profile data:', error);
        }
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors = {};
    
    if (!formData.firstName.trim()) {
      validationErrors.firstName = t('validation.firstNameRequired', 'First name is required');
    }
    
    if (!formData.lastName.trim()) {
      validationErrors.lastName = t('validation.lastNameRequired', 'Last name is required');
    }
    
    if (!formData.email.trim()) {
      validationErrors.email = t('validation.emailRequired', 'Email is required');
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      validationErrors.email = t('validation.invalidEmail', 'Email is invalid');
    }
    
    // Skip password validation for Google registrations
    if (!formData.googleId) {
      if (!formData.password.trim()) {
        validationErrors.password = t('validation.passwordRequired', 'Password is required');
      } else if (formData.password.length < 8) {
        validationErrors.password = t('validation.passwordLength', 'Password must be at least 8 characters');
      }
      
      if (formData.password !== formData.confirmPassword) {
        validationErrors.confirmPassword = t('validation.passwordsDoNotMatch', 'Passwords do not match');
      }
    }
    
    if (!formData.terms) {
      validationErrors.terms = t('validation.termsRequired', 'You must accept the terms and conditions');
    }
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsLoading(true);
    setRegisterStatus("Status: Starting registration process..."); // Update status

    // Create API payload with proper field names for backend
    const apiPayload = {
      email: formData.email,
      password: formData.password || null,
      family_name: formData.lastName,  // Support both naming conventions
      given_name: formData.firstName,
      phone_number: formData.phoneNumber || null,
      country_code: formData.countryCode || '+84',
      newsletter: formData.newsletter
    };
    
    // Add Google data if available
    if (formData.googleId) {
      apiPayload.google_id = formData.googleId;
      apiPayload.profile_picture = formData.profilePicture;
      
      // For Google registrations, password can be null
      if (!formData.password || formData.password.length < 8) {
        // Google users don't need a password initially
        apiPayload.password = null;
      }
    }

    try {
      console.log('Registration data to send:', apiPayload);
      setRegisterStatus("Status: Connecting to API..."); // Update status

      // Use the correct API URL from environment variables
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await axios.post(`${API_URL}/auth/register`, apiPayload, {
        withCredentials: true, // Important for cookies/sessions
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // Log detailed response for debugging
      console.log('Registration API response:', response);
      setDebugInfo({
        status: response.status,
        data: response.data,
        headers: response.headers
      });

      setRegisterStatus(`Success! Redirecting to login page...`); // Update status

      // Store session info in localStorage if provided
      if (response.data?.sessionId) {
        localStorage.setItem('sessionId', response.data.sessionId);
      }

      // Redirect to login after successful registration
      setTimeout(() => {
        window.location.href = '/login?registered=true';
      }, 1500);
    } catch (error) {
      // Detailed error logging
      console.error('Registration error:', error);

      let errorMessage = "Status: Registration failed";
      let errorDetails = null;

      if (error.response) {
        // Handle specific error cases with user-friendly messages
        const status = error.response.status;
        const errorData = error.response.data;
        
        if (status === 409 && errorData?.error?.includes('email')) {
          errorMessage = t('auth.emailAlreadyExists', 'This email address is already registered. Please log in or use a different email.');
        } else if (status === 429) {
          errorMessage = t('auth.tooManyAttempts', 'Too many registration attempts. Please try again later.');
        } else {
          // Generic server error
          errorMessage = `${t('auth.registrationFailed', 'Registration failed')}: ${errorData?.error || t('common.unknownError', 'Unknown error')}`;
        }
        
        errorDetails = {
          status: status,
          data: errorData,
          headers: error.response.headers
        };
        console.error('Server response:', errorDetails);
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = t('auth.noServerResponse', 'No response from server. Please check your connection and try again.');
        errorDetails = {
          request: error.request
        };
        console.error('No response received:', error.request);
      } else {
        // Error in setting up the request
        errorMessage = `${t('auth.requestError', 'Request error')}: ${error.message}`;
        console.error('Request error:', error.message);
      }

      setRegisterStatus(errorMessage);
      setDebugInfo(errorDetails);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: undefined
      });
    }
  };

  return (
    <section aria-labelledby="register-heading" className="bg-white rounded-2xl shadow-xl border border-emerald-100/70 p-6 sm:p-8">
      <h2 id="register-heading" className="text-xl font-semibold text-gray-900 mb-6">
        {t('auth.registerTitle', 'Create your account')}
      </h2>
      
      {/* Add status display area with ref for scrolling */}
      <div ref={statusRef}>
        {registerStatus && (
          <div className={`mb-4 p-3 rounded-lg ${registerStatus.includes('Success') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            <p className="font-medium">{registerStatus}</p>
          </div>
        )}
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.firstName', 'First name')}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user h-5 w-5 text-gray-400" aria-hidden="true">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <input
                id="firstName"
                name="firstName"
                type="text"
                placeholder="John"
                value={formData.firstName}
                onChange={handleInputChange}
                autoComplete="given-name"
                required
                className={`w-full rounded-lg border ${errors.firstName ? 'border-red-300' : 'border-gray-200'} pl-10 pr-3 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors`}
              />
            </div>
            {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
          </div>
          
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
              {t('common.lastName', 'Last name')}
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user h-5 w-5 text-gray-400" aria-hidden="true">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <input
                id="lastName"
                name="lastName"
                type="text"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleInputChange}
                autoComplete="family-name"
                required
                className={`w-full rounded-lg border ${errors.lastName ? 'border-red-300' : 'border-gray-200'} pl-10 pr-3 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors`}
              />
            </div>
            {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
          </div>
        </div>
        
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
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleInputChange}
              autoComplete="email"
              required
              className={`w-full rounded-lg border ${errors.email ? 'border-red-300' : 'border-gray-200'} pl-10 pr-3 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors`}
            />
          </div>
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>
        
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
            {t('common.phoneNumber', 'Phone number')} <span className="text-gray-500 text-xs">({t('common.optional', 'optional')})</span>
          </label>
          <PhoneInput
            value={formData.phoneNumber}
            onChange={(value) => setFormData({ ...formData, phoneNumber: value })}
            countryCode={formData.countryCode}
            onCountryChange={(code) => setFormData({ ...formData, countryCode: code })}
            placeholder="123456789"
            error={errors.phoneNumber}
          />
        </div>
        
        {/* Password fields section - conditional rendering based on Google registration */}
        {formData.googleId ? (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 mr-2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4"></path>
                <path d="M12 8h.01"></path>
              </svg>
              <h3 className="text-sm font-medium text-blue-800">{t('auth.googleAccountLinked', 'Google Account Linked')}</h3>
            </div>
            <p className="text-sm text-blue-700">
              {t('auth.googleAccountInfo', 'You\'re registering with your Google account. You can set a custom password after registration in your profile settings.')}
            </p>
            
            {/* Hidden password fields that will auto-generate secure passwords */}
            <input 
              type="hidden" 
              name="password" 
              value={formData.password || Math.random().toString(36).slice(-10) + Math.random().toString(36).toUpperCase().slice(-2) + "!2"} 
              onChange={handleInputChange} 
            />
            <input 
              type="hidden" 
              name="confirmPassword" 
              value={formData.confirmPassword || formData.password || Math.random().toString(36).slice(-10) + Math.random().toString(36).toUpperCase().slice(-2) + "!2"} 
              onChange={handleInputChange} 
            />
          </div>
        ) : (
          <>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.password', 'Password')}
              </label>
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
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  required
                  className={`w-full rounded-lg border ${errors.password ? 'border-red-300' : 'border-gray-200'} pl-10 pr-3 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors`}
                />
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t('common.confirmPassword', 'Confirm password')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center" aria-hidden="true">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle h-5 w-5 text-gray-400" aria-hidden="true">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <path d="m9 11 3 3L22 4"></path>
                  </svg>
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  required
                  className={`w-full rounded-lg border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-200'} pl-10 pr-3 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors`}
                />
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>
          </>
        )}
        
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              id="newsletter"
              name="newsletter"
              type="checkbox"
              className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
              checked={formData.newsletter}
              onChange={handleInputChange}
            />
            <label htmlFor="newsletter" className="ml-2 block text-sm text-gray-700">
              {t('auth.newsletter', 'Send me plant care tips and product updates')}
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              className={`h-4 w-4 text-emerald-600 border ${errors.terms ? 'border-red-300' : 'border-gray-300'} rounded focus:ring-emerald-500`}
              checked={formData.terms}
              onChange={handleInputChange}
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
              {t('auth.acceptTerms', 'I accept the')} <Link href="/terms" className="text-emerald-600 hover:text-emerald-800">{t('auth.termsOfService', 'Terms of Service')}</Link> {t('common.and', 'and')} <Link href="/privacy" className="text-emerald-600 hover:text-emerald-800">{t('auth.privacyPolicy', 'Privacy Policy')}</Link>
            </label>
          </div>
          {errors.terms && <p className="text-sm text-red-600">{errors.terms}</p>}
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors shadow-md flex justify-center items-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('common.loading', 'Loading...')}
            </>
          ) : t('auth.createAccount', 'Create Account')}
        </button>
        
        <p className="text-center text-xs text-gray-500 mt-2">
          {t('auth.termsNotice', 'By continuing, you agree to our Terms of Service and Privacy Policy.')}
        </p>
      </form>
    </section>
  );
}

export default RegisterForm;
