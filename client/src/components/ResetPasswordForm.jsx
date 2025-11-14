"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import authApi from '@/api/authApi';

export function ResetPasswordForm({ token }) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!password || !confirmPassword) {
      setError(t('validation.passwordRequired', 'Password is required'));
      return false;
    }
    if (password.length < 8) {
      setError(t('validation.passwordTooShort', 'Password must be at least 8 characters'));
      return false;
    }
    if (password !== confirmPassword) {
      setError(t('validation.passwordsDoNotMatch', 'Passwords do not match'));
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError(t('errors.missingToken', 'Missing reset token. Please use the reset link from your email.'));
      return;
    }
    if (!validate()) return;
    setIsLoading(true);

    try {
      const response = await authApi.resetPassword(token, password, confirmPassword);
      const data = response?.data;
      if (data?.success) {
        setSuccess(true);
      } else {
        setError(data?.error || t('errors.resetFailed', 'Password reset failed. Please try again.'));
      }
    } catch (err) {
      setError(t('errors.networkError', 'Network error. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-center mb-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <span className="text-green-700 text-xl">🔐</span>
          </span>
        </div>
        <CardTitle className="text-center text-2xl">{t('auth.resetPasswordTitle', 'Reset Your Password')}</CardTitle>
        <CardDescription className="text-center">
          {t('auth.resetPasswordDescription', 'Enter a new password to access your account.')}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {success ? (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center mb-2">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <span className="text-green-700 text-xl">✓</span>
              </span>
            </div>
            <h3 className="text-lg font-medium">{t('auth.passwordResetSuccess', 'Password reset successful')}</h3>
            <p className="text-sm text-gray-600">
              {t('auth.passwordResetSuccessMessage', 'You can now log in with your new password.')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('auth.newPassword', 'New Password')}
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('auth.newPasswordPlaceholder', 'Enter new password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('auth.confirmPassword', 'Confirm Password')}
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('auth.confirmPasswordPlaceholder', 'Confirm new password')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t('common.loading', 'Loading...') : t('auth.resetPasswordButton', 'Reset Password')}
              </Button>
            </div>
          </form>
        )}
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-gray-500">
          {success ? (
            <Link href="/login" className="text-blue-600 hover:underline">
              {t('auth.goToLogin', 'Go to Login')}
            </Link>
          ) : (
            <Link href="/login" className="text-blue-600 hover:underline">
              ← {t('auth.goToLogin', 'Go to Login')}
            </Link>
          )}
        </p>
      </CardFooter>
    </Card>
  );
}

export default ResetPasswordForm;