import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';

/**
 * ForgotPasswordForm component
 * Adapted from the SWP391 design system
 */
export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

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
      // In a real implementation, this would call the password reset API
      console.log('Password reset requested for:', email);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show success message
      setEmailSent(true);
    } catch (error) {
      console.error('Password reset error:', error);
      setError(t('errors.genericError', 'An error occurred. Please try again later.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-center mb-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            {/* Lock icon representation */}
            <span className="text-green-700 text-xl">🔒</span>
          </span>
        </div>
        <CardTitle className="text-center text-2xl">{t('auth.forgotPasswordTitle')}</CardTitle>
        <CardDescription className="text-center">
          {t('auth.forgotPasswordDescription')}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {emailSent ? (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center mb-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                {/* Check icon representation */}
                <span className="text-green-700 text-xl">✓</span>
              </span>
            </div>
            <h3 className="text-lg font-medium">{t('auth.checkYourEmail')}</h3>
            <p className="text-sm text-gray-600">
              {t('auth.resetLinkSent', { email: email })}
            </p>
            <p className="text-sm text-gray-500">
              {t('auth.checkSpamFolder')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('common.email')}
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={error}
                  required
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? t('common.sending') : t('auth.sendResetLink')}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
      
      <CardFooter className="justify-center">
        <p className="text-sm text-gray-500">
          <Link href="/login" className="text-blue-600 hover:underline">
            ← {t('auth.goToLogin')}
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default ForgotPasswordForm;