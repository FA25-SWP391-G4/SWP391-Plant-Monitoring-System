import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import axios from 'axios';

// Direct API URL - don't rely on the API client which might have issues
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';

/**
 * ForgotPasswordForm component
 * Adapted from the SWP391 design system
 */
export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const { getAuthClass, presets } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  
  // Debug info for API URL
  useEffect(() => {
    console.log(`ForgotPasswordForm: API URL is set to ${API_URL}`);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError(t('validation.emailRequired'));
      return;
    }
    
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError(t('validation.invalidEmail'));
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      // Use direct axios call instead of API client to ensure it works
      console.log('Sending password reset request for:', email);
      
      // Make a direct API call with detailed logging and timeout
      const response = await axios.post(
        `${API_URL}/auth/forgot-password`, 
        { email: email.trim() },
        { 
          timeout: 15000, // 15 second timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Password reset API response:', response.data);
      
      // Check if the response indicates success
      if (response.data && response.data.success) {
        console.log('Password reset email sent successfully');
        setEmailSent(true);
      } else {
        // Handle unexpected response format
        console.warn('Unexpected response format:', response.data);
        setError(response.data?.message || t('errors.resetEmailFailed', 'Failed to send reset email. Please try again.'));
      }
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = t('errors.resetEmailFailed', 'Failed to send reset email. Please try again.');
      
      // Handle specific error cases
      if (error.response) {
        // The request was made and the server responded with a status code
        // outside of the 2xx range
        console.error('Error response data:', error.response.data);
        
        const responseData = error.response.data;
        
        if (error.response.status === 404) {
          errorMessage = responseData?.message || t('errors.emailNotFound', 'No account found with this email address.');
        } else if (error.response.status === 503) {
          errorMessage = responseData?.message || t('errors.emailServiceUnavailable', 'Email service is currently unavailable. Please try again later.');
        } else if (error.response.status === 500) {
          if (responseData?.error === 'EMAIL_SERVICE_UNAVAILABLE') {
            errorMessage = t('errors.emailServiceUnavailable', 'Email service is currently unavailable. Please try again later.');
          } else if (responseData?.error === 'EMAIL_CONNECTION_FAILED') {
            errorMessage = t('errors.emailConnectionFailed', 'Email service connection failed. Please try again in a few minutes.');
          } else if (responseData?.error === 'EMAIL_AUTH_FAILED') {
            errorMessage = t('errors.emailAuthFailed', 'Email service authentication failed. Please contact support.');
          } else {
            errorMessage = responseData?.message || t('errors.resetEmailFailed', 'Failed to send reset email. Please try again.');
          }
        } else if (responseData && responseData.message) {
          errorMessage = responseData.message;
        }
        
        setError(errorMessage);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error request:', error.request);
        setError(t('errors.networkError', 'Network error. Please check your connection and try again.'));
      } else {
        // Something happened in setting up the request
        setError(t('errors.genericError', 'An error occurred. Please try again later.'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={getAuthClass('container')}>
      <Card className={getAuthClass('card')}>
        <CardHeader className={getAuthClass('header')}>
          <div className="flex items-center justify-center mb-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              {/* Lock icon representation */}
              <span className="text-green-700 dark:text-green-300 text-xl">🔒</span>
            </span>
          </div>
          <CardTitle className={getAuthClass('title')}>{t('auth.forgotPasswordTitle')}</CardTitle>
          <CardDescription className={getAuthClass('description')}>
            {t('auth.forgotPasswordDescription')}
          </CardDescription>
        </CardHeader>
      
        <CardContent className={getAuthClass('form')}>
          {emailSent ? (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center mb-2">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  {/* Check icon representation */}
                  <span className="text-green-700 dark:text-green-300 text-xl">✓</span>
                </span>
              </div>
              <h3 className="text-lg font-medium">{t('auth.checkYourEmail')}</h3>
              <p className={getAuthClass('helper')}>
                {t('auth.resetLinkSent', { email: email })}
              </p>
              <p className={getAuthClass('helper')}>
                {t('auth.checkSpamFolder')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className={getAuthClass('field')}>
                  <label htmlFor="email" className={getAuthClass('label')}>
                    {t('common.email')}
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={error ? `${presets.authInput} ${getAuthClass('input', 'error')}` : presets.authInput}
                    required
                  />
                  {error && (
                    <p className={getAuthClass('error')}>{error}</p>
                  )}
                </div>
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={presets.authButton}
                >
                  {isLoading ? (
                    <>
                      <span className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      {t('auth.sendingResetEmail', 'Sending...')}
                    </>
                  ) : (
                    t('auth.sendResetEmail', 'Send Reset Email')
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      
        <CardFooter className={getAuthClass('footer')}>
          <p className={getAuthClass('footerText')}>
            <Link href="/login" className={getAuthClass('link')}>
              ← {t('auth.goToLogin')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

export default ForgotPasswordForm;