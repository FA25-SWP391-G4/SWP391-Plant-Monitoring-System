import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import axios from 'axios';

// Direct API URL - don't rely on the API client which might have issues
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3010';

/**
 * ResetPasswordForm component
 * Handles password reset with token validation
 */
export function ResetPasswordForm({ token }) {
  const { t } = useTranslation();
  const { getAuthClass, presets } = useTheme();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validatePassword = (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push(t('validation.passwordMinLength', 'Password must be at least 8 characters long'));
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push(t('validation.passwordLowercase', 'Password must contain at least one lowercase letter'));
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push(t('validation.passwordUppercase', 'Password must contain at least one uppercase letter'));
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push(t('validation.passwordNumber', 'Password must contain at least one number'));
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError(t('validation.passwordRequired', 'Password is required'));
      return;
    }
    
    if (!confirmPassword.trim()) {
      setError(t('validation.confirmPasswordRequired', 'Please confirm your password'));
      return;
    }
    
    if (password !== confirmPassword) {
      setError(t('validation.passwordMismatch', 'Passwords do not match'));
      return;
    }
    
    // Validate password strength
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      setError(passwordErrors.join('. '));
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      console.log('Sending password reset request with token:', token);
      
      const response = await axios.post(
        `${API_URL}/auth/reset-password?token=${token}`, 
        { 
          password: password.trim(),
          confirmPassword: confirmPassword.trim()
        },
        { 
          timeout: 15000, // 15 second timeout
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Password reset API response:', response.data);
      
      if (response.data.success) {
        setSuccess(true);
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push('/login?message=password-reset-success');
        }, 3000);
      } else {
        setError(response.data.message || t('errors.passwordResetFailed', 'Failed to reset password'));
      }
    } catch (error) {
      console.error('Password reset error:', error);
      
      let errorMessage = t('errors.passwordResetFailed', 'Failed to reset password. Please try again.');
      
      if (error.response) {
        console.error('Error response data:', error.response.data);
        
        if (error.response.status === 400) {
          errorMessage = error.response.data.message || t('errors.invalidRequest', 'Invalid request. Please check your input.');
        } else if (error.response.status === 401) {
          errorMessage = t('errors.tokenExpired', 'Reset token has expired. Please request a new password reset.');
        } else if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        console.error('Error request:', error.request);
        errorMessage = t('errors.networkError', 'Network error. Please check your connection and try again.');
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg border-0 bg-white/90 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('auth.passwordResetSuccess', 'Password Reset Successful!')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('auth.passwordResetSuccessMessage', 'Your password has been successfully reset. You can now login with your new password.')}
            </p>
            <p className="text-sm text-gray-500">
              {t('auth.redirectingToLogin', 'Redirecting to login page...')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-2xl font-bold text-center text-gray-900">
          {t('auth.resetPassword', 'Reset Password')}
        </CardTitle>
        <CardDescription className="text-center text-gray-600">
          {t('auth.enterNewPassword', 'Enter your new password below')}
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              {t('auth.newPassword', 'New Password')}
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.enterNewPassword', 'Enter your new password')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              {t('auth.confirmPassword', 'Confirm Password')}
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('auth.confirmNewPassword', 'Confirm your new password')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <p>{t('auth.passwordRequirements', 'Password requirements:')}</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>{t('auth.passwordReq1', 'At least 8 characters long')}</li>
              <li>{t('auth.passwordReq2', 'At least one uppercase letter')}</li>
              <li>{t('auth.passwordReq3', 'At least one lowercase letter')}</li>
              <li>{t('auth.passwordReq4', 'At least one number')}</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button 
            type="submit" 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('auth.resettingPassword', 'Resetting Password...')}
              </div>
            ) : (
              t('auth.resetPassword', 'Reset Password')
            )}
          </Button>
          
          <div className="text-center">
            <Link 
              href="/login" 
              className="text-sm text-emerald-600 hover:text-emerald-800 transition-colors"
            >
              {t('auth.backToLogin', 'Back to Login')}
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}